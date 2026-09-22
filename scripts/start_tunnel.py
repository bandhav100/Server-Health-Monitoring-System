#!/usr/bin/env python3
"""
SHMS Cloudflare Quick Tunnel Auto-Connector
Spawns a Cloudflare Quick Tunnel for Grafana (default port 3001),
extracts the generated *.trycloudflare.com URL, and automatically
registers it with the SHMS Flask backend at /api/tunnel/register.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
import urllib.request
import urllib.error

CLOUDFLARE_URL_REGEX = re.compile(r"https://([a-zA-Z0-9-]+\.trycloudflare\.com)")


def find_cloudflared():
    """Locate cloudflared executable in PATH or standard Windows locations."""
    path_bin = shutil.which("cloudflared") or shutil.which("cloudflared.exe")
    if path_bin:
        return path_bin

    potential_paths = [
        r"C:\Program Files\cloudflared\cloudflared.exe",
        r"C:\Program Files (x86)\cloudflared\cloudflared.exe",
        r"C:\Tools\cloudflared.exe",
        os.path.expanduser(r"~\cloudflared.exe"),
    ]
    for p in potential_paths:
        if os.path.exists(p):
            return p

    return "cloudflared"


def register_tunnel_with_backend(backend_url: str, tunnel_url: str, max_retries: int = 15):
    """Notify SHMS backend about the active Cloudflare Tunnel URL."""
    api_endpoint = f"{backend_url.rstrip('/')}/api/tunnel/register"
    payload = json.dumps({"url": tunnel_url}).encode("utf-8")
    req = urllib.request.Request(
        api_endpoint,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "SHMS-Tunnel-Agent/1.0"},
        method="POST",
    )

    for attempt in range(1, max_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status in (200, 201):
                    print(f"[SHMS Tunnel] Registered tunnel URL with backend: {tunnel_url}")
                    return True
        except Exception as exc:
            if attempt < max_retries:
                time.sleep(2)
            else:
                print(f"[SHMS Tunnel] Warning: Could not register with backend ({exc}). Backend may still be starting.")
    return False


def persist_local_state(tunnel_url: str):
    """Write tunnel URL to backend/tunnel_state.json as guaranteed local fallback."""
    try:
        project_root = Path(__file__).resolve().parent.parent
        backend_dir = project_root / "backend"
        state_file = backend_dir / "tunnel_state.json"
        state_file.write_text(json.dumps({"tunnel_url": tunnel_url}, indent=2), encoding="utf-8")
        print(f"[SHMS Tunnel] Persisted local tunnel state to: {state_file}")
    except Exception as exc:
        print(f"[SHMS Tunnel] Note: Could not write local state file: {exc}")


def main():
    parser = argparse.ArgumentParser(description="Start Cloudflare tunnel for Grafana and register with SHMS.")
    parser.add_argument("--port", type=int, default=3001, help="Local port to tunnel (default: 3001 for Grafana)")
    parser.add_argument("--backend", default="http://localhost:5000", help="SHMS backend base URL")
    args = parser.parse_args()

    bin_path = find_cloudflared()
    cmd = [bin_path, "tunnel", "--url", f"http://localhost:{args.port}"]

    print("=" * 65)
    print("  SHMS Quick Tunnel Launcher (Production Automated)")
    print(f"  Target: http://localhost:{args.port}")
    print(f"  Backend: {args.backend}")
    print("=" * 65)

    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True,
        )
    except FileNotFoundError:
        print(f"[SHMS Tunnel Error] '{bin_path}' executable was not found.")
        print("Please install Cloudflare Tunnel from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/")
        sys.exit(1)

    tunnel_url_found = None

    try:
        for line in iter(process.stdout.readline, ""):
            if not line:
                break
            line_str = line.strip()
            print(f"[cloudflared] {line_str}")

            if not tunnel_url_found:
                match = CLOUDFLARE_URL_REGEX.search(line_str)
                if match:
                    tunnel_url_found = f"https://{match.group(1)}"
                    print("\n" + "#" * 65)
                    print(f"  SUCCESS! ACTIVE TUNNEL URL:")
                    print(f"  --> {tunnel_url_found} <--")
                    print("#" * 65 + "\n")

                    persist_local_state(tunnel_url_found)
                    register_tunnel_with_backend(args.backend, tunnel_url_found)

    except KeyboardInterrupt:
        print("\n[SHMS Tunnel] Stopping Cloudflare tunnel...")
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                process.kill()
        print("[SHMS Tunnel] Stopped.")


if __name__ == "__main__":
    main()
