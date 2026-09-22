import urllib.request
import urllib.error
import ssl
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE = "https://bandhav-1.tail84beab.ts.net"

print("=" * 65)
print(f"SHMS TAILSCALE FUNNEL DEPLOYMENT VERIFICATION")
print(f"Target: {BASE}")
print("=" * 65)

# 1. GET /login
try:
    req = urllib.request.Request(f"{BASE}/login")
    with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
        print(f"[OK] GET /login -> HTTP {res.status} (SPA HTML served)")
except Exception as exc:
    print(f"[FAIL] GET /login -> {exc}")

# 2. GET /dashboard
try:
    req = urllib.request.Request(f"{BASE}/dashboard")
    with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
        print(f"[OK] GET /dashboard -> HTTP {res.status} (SPA HTML served)")
except Exception as exc:
    print(f"[FAIL] GET /dashboard -> {exc}")

# 3. GET /api/system/health
try:
    req = urllib.request.Request(f"{BASE}/api/system/health")
    with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
        body = json.loads(res.read().decode())
        print(f"[OK] GET /api/system/health -> HTTP {res.status} | Overall Status: {body.get('overall_status')}")
        details = body.get("details", {})
        for svc in ["database", "prometheus", "grafana", "docker", "windows_exporter"]:
            svc_info = details.get(svc, {})
            if isinstance(svc_info, dict):
                print(f"     * {svc}: {svc_info.get('status')} (healthy={svc_info.get('healthy')})")
except Exception as exc:
    print(f"[FAIL] GET /api/system/health -> {exc}")

# 4. POST /api/auth/login
token = None
try:
    payload = json.dumps({"username": "shms@admin", "password": "admin123"}).encode()
    req = urllib.request.Request(
        f"{BASE}/api/auth/login",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
        body = json.loads(res.read().decode())
        token = body.get("data", {}).get("token")
        print(f"[OK] POST /api/auth/login -> HTTP {res.status} | JWT Token Generated: {token[:25]}...")
except Exception as exc:
    print(f"[FAIL] POST /api/auth/login -> {exc}")

# 5. GET /api/dashboard/live or /api/dashboard/kpis with JWT
headers = {"Authorization": f"Bearer {token}"} if token else {}
for ep in ["/api/dashboard/summary", "/api/dashboard/kpis", "/api/live/kpis"]:
    try:
        req = urllib.request.Request(f"{BASE}{ep}", headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
            data = json.loads(res.read().decode())
            print(f"[OK] GET {ep} -> HTTP {res.status} | Success: {data.get('success')}")
            break
    except Exception as exc:
        print(f"[INFO] GET {ep} -> {exc}")

# 6. GET /api/grafana/embed-url
try:
    req = urllib.request.Request(f"{BASE}/api/grafana/embed-url")
    with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
        embed_data = json.loads(res.read().decode())
        print(f"[OK] GET /api/grafana/embed-url -> HTTP {res.status}")
        print(f"     Embed URL: {embed_data.get('dashboard_url')}")
except Exception as exc:
    print(f"[FAIL] GET /api/grafana/embed-url -> {exc}")

print("=" * 65)
print("ALL VERIFICATION CHECKS COMPLETE")
print("=" * 65)
