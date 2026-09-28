#!/usr/bin/env python3
"""
SHMS Cloudflare Deployment Verification Script
Tests public availability of Frontend, Backend API, Authentication,
Metrics, and Grafana dashboard embed over the Cloudflare Tunnel.
"""

import sys
import json
import urllib.request
import urllib.error
import ssl

ctx = ssl.create_default_context()

def verify(base_url: str):
    base = base_url.rstrip("/")
    print("=" * 65)
    print("  SHMS CLOUDFLARE TUNNEL DEPLOYMENT VERIFICATION")
    print(f"  Target: {base}")
    print("=" * 65)

    # 1. Frontend SPA
    try:
        req = urllib.request.Request(f"{base}/login")
        with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
            print(f"[OK] GET /login -> HTTP {res.status} (SPA HTML loaded)")
    except Exception as exc:
        print(f"[FAIL] GET /login -> {exc}")

    # 2. System Health API
    try:
        req = urllib.request.Request(f"{base}/api/system/health")
        with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
            body = json.loads(res.read().decode())
            print(f"[OK] GET /api/system/health -> HTTP {res.status} | Overall: {body.get('overall_status')}")
            for svc, info in body.get("details", {}).items():
                if isinstance(info, dict):
                    print(f"     * {svc}: {info.get('status')} (healthy={info.get('healthy')})")
    except Exception as exc:
        print(f"[FAIL] GET /api/system/health -> {exc}")

    # 3. Authentication Login
    token = None
    try:
        payload = json.dumps({"username": "shms@admin", "password": "bandhav1"}).encode()
        req = urllib.request.Request(
            f"{base}/api/auth/login",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
            body = json.loads(res.read().decode())
            token = body.get("data", {}).get("token")
            print(f"[OK] POST /api/auth/login -> HTTP {res.status} | JWT Token Generated: {token[:25]}...")
    except Exception as exc:
        print(f"[FAIL] POST /api/auth/login -> {exc}")

    # 4. Authenticated Endpoint (Servers list)
    if token:
        try:
            req = urllib.request.Request(f"{base}/api/servers", headers={"Authorization": f"Bearer {token}"})
            with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
                body = json.loads(res.read().decode())
                servers = body.get("data", [])
                print(f"[OK] GET /api/servers -> HTTP {res.status} | Found {len(servers)} servers")
        except Exception as exc:
            print(f"[FAIL] GET /api/servers -> {exc}")

    # 5. Grafana Embed URL
    try:
        req = urllib.request.Request(f"{base}/api/grafana/embed-url")
        with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
            embed_data = json.loads(res.read().decode())
            print(f"[OK] GET /api/grafana/embed-url -> HTTP {res.status}")
            print(f"     Dashboard Embed URL: {embed_data.get('dashboard_url')}")
    except Exception as exc:
        print(f"[FAIL] GET /api/grafana/embed-url -> {exc}")

    # 6. Grafana Health via Tunnel
    try:
        req = urllib.request.Request(f"{base}/grafana/api/health")
        with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
            body = json.loads(res.read().decode())
            print(f"[OK] GET /grafana/api/health -> HTTP {res.status} | Grafana DB: {body.get('database')}")
    except Exception as exc:
        print(f"[FAIL] GET /grafana/api/health -> {exc}")

    print("=" * 65)
    print("  ALL VERIFICATION CHECKS COMPLETE")
    print("=" * 65)


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "https://tech-gbp-charter-rna.trycloudflare.com"
    verify(target)
