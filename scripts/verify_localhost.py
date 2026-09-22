"""
Verification script for SHMS localhost fixes across all 8 pages/endpoints.
"""
import sys
import requests

BASE_URL = "http://localhost:5000/api"

def main():
    print("=" * 60)
    print("SHMS Localhost Comprehensive Verification")
    print("=" * 60)

    # 1. Login
    login_resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"username": "shms@admin", "password": "admin123"},
        timeout=5,
    )
    if not login_resp.ok:
        print(f"[FAIL] Login failed: {login_resp.status_code} {login_resp.text}")
        sys.exit(1)

    data = login_resp.json().get("data", {})
    token = data.get("token")
    if not token:
        print("[FAIL] No token in login response")
        sys.exit(1)
    print("[PASS] 1. Auth: Login successful, received JWT token")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Servers
    servers_resp = requests.get(f"{BASE_URL}/servers", headers=headers, timeout=5)
    if not servers_resp.ok:
        print(f"[FAIL] Servers endpoint failed: {servers_resp.status_code}")
    else:
        servers = servers_resp.json().get("data", [])
        print(f"[PASS] 2. Servers: Fetched {len(servers)} servers")
        for s in servers[:3]:
            print(f"       - {s.get('name')} ({s.get('ip')}) | status: {s.get('status')}")

    # 3. Predictions
    pred_dash_resp = requests.get(f"{BASE_URL}/predictions/dashboard", headers=headers, timeout=5)
    pred_sum_resp = requests.get(f"{BASE_URL}/predictions/summary?server_id=1", headers=headers, timeout=5)
    if pred_dash_resp.ok and pred_sum_resp.ok:
        dash_data = pred_dash_resp.json().get("data", {})
        print(f"[PASS] 3. Predictions: Dashboard & Summary OK | Health score: {dash_data.get('health_score')} | CPU forecast: {dash_data.get('cpu_forecast')}%")
    else:
        print(f"[FAIL] Predictions failed: dashboard={pred_dash_resp.status_code}, summary={pred_sum_resp.status_code}")

    # 4. Alerts
    alert_sum_resp = requests.get(f"{BASE_URL}/alerts/summary", headers=headers, timeout=5)
    alert_live_resp = requests.get(f"{BASE_URL}/alerts/live", headers=headers, timeout=5)
    alert_exp_resp = requests.get(f"{BASE_URL}/alerts/export", headers=headers, timeout=5)
    if alert_sum_resp.ok and alert_live_resp.ok and alert_exp_resp.ok:
        live_alerts = alert_live_resp.json().get("data", [])
        print(f"[PASS] 4. Alerts: Summary, Live ({len(live_alerts)} active), and CSV Export OK")
    else:
        print(f"[FAIL] Alerts failed: sum={alert_sum_resp.status_code}, live={alert_live_resp.status_code}, export={alert_exp_resp.status_code}")

    # 5. Docker
    docker_resp = requests.get(f"{BASE_URL}/docker/containers", headers=headers, timeout=5)
    if docker_resp.ok:
        containers = docker_resp.json().get("data", [])
        print(f"[PASS] 5. Docker: Found {len(containers)} containers")
        for c in containers[:3]:
            print(f"       - {c.get('name')} [{c.get('status')}] {c.get('image')} (ports: {c.get('ports')})")
    else:
        print(f"[FAIL] Docker failed: {docker_resp.status_code}")

    # 6. Grafana
    grafana_resp = requests.get(f"{BASE_URL}/grafana/embed-url", timeout=5)
    if grafana_resp.ok:
        g_data = grafana_resp.json()
        print(f"[PASS] 6. Grafana: Embed URL generated: {g_data.get('dashboard_url')}")
    else:
        print(f"[FAIL] Grafana embed-url failed: {grafana_resp.status_code}")

    # 7. Reports
    reports_resp = requests.get(f"{BASE_URL}/reports", headers=headers, timeout=5)
    if reports_resp.ok:
        reports = reports_resp.json().get("data", [])
        print(f"[PASS] 7. Reports: Found {len(reports)} completed reports in history")
        for r in reports[:2]:
            print(f"       - {r.get('name')} ({r.get('format')}) | status: {r.get('status')}")
    else:
        print(f"[FAIL] Reports failed: {reports_resp.status_code}")

    # 8. System Health
    health_resp = requests.get(f"{BASE_URL}/system/health", timeout=5)
    if health_resp.ok:
        h_data = health_resp.json()
        services = [h_data.get(k) for k in ["database", "prometheus", "grafana", "windows_exporter", "docker"]]
        valid_services = [s for s in services if s and isinstance(s, dict)]
        print(f"[PASS] 8. System Health: Overall status = {h_data.get('overall_status')} | {len(valid_services)}/5 services present at top level")
        for s in valid_services:
            print(f"       - {s.get('name')}: {s.get('status')} (healthy={s.get('healthy')})")
    else:
        print(f"[FAIL] System Health failed: {health_resp.status_code}")

    # 9. Settings
    settings_resp = requests.get(f"{BASE_URL}/settings", headers=headers, timeout=5)
    if settings_resp.ok:
        settings = settings_resp.json().get("data", [])
        print(f"[PASS] 9. Settings: Loaded {len(settings)} configured settings")
    else:
        print(f"[FAIL] Settings failed: {settings_resp.status_code}")

    print("=" * 60)
    print("All checks completed.")
    print("=" * 60)

if __name__ == "__main__":
    main()
