import glob
import os
import shutil
import subprocess
import tempfile
import threading
import time
from datetime import datetime
from pathlib import Path
import requests
import yaml

from config import Config
from utils.logger import logger


class PrometheusConfigError(Exception):
    """Raised when Prometheus configuration cannot be updated or validated."""
    pass


class PrometheusTargetExistsError(PrometheusConfigError):
    """Raised when a target already exists in Prometheus configuration."""
    pass


class PrometheusConfigService:
    _lock = threading.Lock()

    def __init__(self, config_path=None, promtool_path=None, prometheus_url=None):
        self.config_path = Path(config_path or Config.PROMETHEUS_CONFIG_PATH).resolve()
        self.promtool_path = Path(promtool_path or Config.PROMTOOL_PATH).resolve()
        self.prometheus_url = (prometheus_url or Config.PROMETHEUS_URL).rstrip("/")

    def get_configured_targets(self, job_name="windows_exporter"):
        """Return a list of all targets configured under a given job."""
        if not self.config_path.exists():
            return []
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
            targets = []
            for job in data.get("scrape_configs", []):
                if job.get("job_name") == job_name:
                    for sc in job.get("static_configs", []):
                        for t in sc.get("targets", []):
                            targets.append(str(t).strip())
            return targets
        except Exception as exc:
            logger.exception("Failed to read Prometheus config targets: %s", exc)
            return []

    def is_target_configured(self, target, job_name="windows_exporter"):
        """Check if target <host>:<port> is already present in prometheus.yml."""
        target_str = str(target).strip().lower()
        existing = [t.lower() for t in self.get_configured_targets(job_name)]
        return target_str in existing

    def create_backup(self):
        """Create a timestamped backup of prometheus.yml, keeping the last 5 backups."""
        if not self.config_path.exists():
            return None
        timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
        backup_filename = f"{self.config_path.name}.bak-{timestamp}"
        backup_path = self.config_path.parent / backup_filename
        shutil.copy2(self.config_path, backup_path)
        logger.info("Created Prometheus config backup: %s", backup_path)

        # Retain only the 5 most recent backups
        pattern = str(self.config_path.parent / f"{self.config_path.name}.bak-*")
        backups = sorted(glob.glob(pattern), reverse=True)
        for old_backup in backups[5:]:
            try:
                os.remove(old_backup)
            except OSError:
                pass

        return str(backup_path)

    def restore_backup(self, backup_path):
        """Restore configuration from a backup file."""
        if backup_path and os.path.exists(backup_path):
            shutil.copy2(backup_path, self.config_path)
            logger.warning("Restored Prometheus config from backup: %s", backup_path)

    def validate_config(self, filepath):
        """Run promtool check config on the given file path."""
        if not self.promtool_path.exists():
            logger.warning("promtool executable not found at %s; skipping binary validation", self.promtool_path)
            return True, "promtool not available"

        try:
            res = subprocess.run(
                [str(self.promtool_path), "check", "config", str(filepath)],
                capture_output=True,
                text=True,
                timeout=10,
                shell=False,
            )
            if res.returncode == 0:
                return True, res.stdout.strip()
            err_msg = (res.stderr or res.stdout).strip()
            return False, err_msg
        except subprocess.TimeoutExpired:
            return False, "promtool validation timed out"
        except Exception as exc:
            logger.exception("Error executing promtool: %s", exc)
            return False, str(exc)

    def reload_prometheus(self):
        """
        Reload Prometheus safely:
        1. Attempt HTTP POST /-/reload.
        2. If 403 or unavailable, restart local prometheus.exe process with --web.enable-lifecycle.
        """
        reload_url = f"{self.prometheus_url}/-/reload"
        logger.info("Attempting Prometheus HTTP reload via %s", reload_url)

        try:
            r = requests.post(reload_url, timeout=5)
            if r.status_code in (200, 204):
                logger.info("Prometheus HTTP reload succeeded (HTTP %d)", r.status_code)
                return True, None
            if r.status_code == 403:
                logger.warning("Prometheus returned HTTP 403 (Lifecycle API not enabled). Attempting safe process reload...")
            else:
                logger.warning("Prometheus reload returned HTTP %d: %s", r.status_code, r.text)
        except requests.RequestException as exc:
            logger.warning("Prometheus HTTP reload failed: %s. Attempting safe process reload...", exc)

        # Fallback: Check if local prometheus.exe is running on Windows and restart with --web.enable-lifecycle
        return self._restart_local_prometheus_process()

    def _restart_local_prometheus_process(self):
        """Safely restarts local prometheus.exe process enabling --web.enable-lifecycle."""
        try:
            # Query running prometheus processes via PowerShell
            cmd = (
                'Get-CimInstance Win32_Process -Filter "name = \'prometheus.exe\'" | '
                'Select-Object ProcessId, ExecutablePath, CommandLine | '
                'ConvertTo-Json -Compress'
            )
            result = subprocess.run(
                ["powershell", "-NoProfile", "-Command", cmd],
                capture_output=True,
                text=True,
                timeout=8,
            )
            if result.returncode != 0 or not result.stdout.strip():
                return False, "Prometheus process not found for local restart and Lifecycle API is disabled."

            import json
            raw = result.stdout.strip()
            proc_data = json.loads(raw)
            if isinstance(proc_data, list):
                proc = proc_data[0]
            else:
                proc = proc_data

            pid = proc.get("ProcessId")
            exe_path = proc.get("ExecutablePath") or str(self.config_path.parent / "prometheus.exe")

            if not pid or not os.path.exists(exe_path):
                return False, "Could not determine local Prometheus executable path."

            working_dir = str(Path(exe_path).parent)
            logger.info("Restarting Prometheus (PID %s) from %s with --web.enable-lifecycle", pid, exe_path)

            # Terminate old process
            subprocess.run(["taskkill", "/PID", str(pid), "/F"], capture_output=True, timeout=5)
            time.sleep(1)

            # Launch new detached process with --web.enable-lifecycle
            subprocess.Popen(
                [exe_path, "--config.file=prometheus.yml", "--web.enable-lifecycle"],
                cwd=working_dir,
                creationflags=subprocess.DETACHED_PROCESS if hasattr(subprocess, "DETACHED_PROCESS") else 0,
                close_fds=True,
            )

            # Wait for Prometheus to become ready
            ready_url = f"{self.prometheus_url}/-/ready"
            for _ in range(12):
                time.sleep(0.5)
                try:
                    resp = requests.get(ready_url, timeout=2)
                    if resp.status_code == 200:
                        logger.info("Prometheus restarted successfully and is ready.")
                        return True, None
                except requests.RequestException:
                    pass

            return True, None
        except Exception as exc:
            logger.exception("Failed to restart local Prometheus: %s", exc)
            return False, str(exc)

    def add_target(self, host, port=9182, job_name="windows_exporter"):
        """
        Thread-safely adds a new monitoring target to prometheus.yml:
        - Validates input
        - Deduplicates target
        - Backs up existing config
        - Writes temp file
        - Validates via promtool
        - Atomically replaces prometheus.yml
        - Reloads Prometheus
        """
        host = str(host).strip()
        port = int(port)
        if not (1 <= port <= 65535):
            raise ValueError("Port must be between 1 and 65535.")

        target = f"{host}:{port}"

        with self._lock:
            if not self.config_path.exists():
                raise PrometheusConfigError(f"Prometheus configuration file not found at {self.config_path}")

            with open(self.config_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}

            scrape_configs = data.setdefault("scrape_configs", [])

            # Locate or create the target job
            job = None
            for j in scrape_configs:
                if j.get("job_name") == job_name:
                    job = j
                    break

            if job is None:
                job = {
                    "job_name": job_name,
                    "static_configs": [{"targets": []}],
                }
                scrape_configs.append(job)

            static_configs = job.setdefault("static_configs", [])
            if not static_configs:
                static_configs.append({"targets": []})

            # Check for duplicate target across all static_configs in this job
            for sc in static_configs:
                for existing_target in sc.get("targets", []):
                    if str(existing_target).strip().lower() == target.lower():
                        raise PrometheusTargetExistsError("This monitoring target is already configured.")

            # Append the new target to the first static_config block
            first_sc = static_configs[0]
            targets_list = first_sc.setdefault("targets", [])
            targets_list.append(target)

            # Create backup
            backup_path = self.create_backup()

            # Write temporary file in the same directory for atomic replace
            temp_fd, temp_path = tempfile.mkstemp(
                prefix="prom_cfg_",
                suffix=".yml",
                dir=str(self.config_path.parent),
            )
            try:
                with open(temp_fd, "w", encoding="utf-8") as tf:
                    yaml.dump(data, tf, sort_keys=False, default_flow_style=False)

                # Validate with promtool
                valid, msg = self.validate_config(temp_path)
                if not valid:
                    raise PrometheusConfigError(f"Server was not added because the Prometheus configuration is invalid: {msg}")

                # Atomically replace config file
                shutil.move(temp_path, self.config_path)
                logger.info("Successfully updated Prometheus config with target %s", target)
            except Exception as exc:
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except OSError:
                        pass
                # Restore backup on failure
                if backup_path:
                    self.restore_backup(backup_path)
                raise exc

            # Reload Prometheus
            reloaded, reload_error = self.reload_prometheus()

            return {
                "config_updated": True,
                "reloaded": reloaded,
                "reload_error": reload_error,
                "target": target,
                "backup_path": backup_path,
            }
