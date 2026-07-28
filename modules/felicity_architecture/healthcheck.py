"""
Observability — SLI monitor / uptime SLO — Félicité Domgue (Slides 13–16).

A runnable, secrets-free health monitor: it pings the service health endpoint, records
latency, and computes availability against an SLO. This is the kind of logging/monitoring
that detects failures quickly (the SLIs/SLOs described in observability.md).

    python healthcheck.py                         # runs an offline demo
    python healthcheck.py https://dagarretail.com/api/health   # live check
"""
import sys, json, time, urllib.request

AVAILABILITY_SLO = 0.995   # 99.5% target
LATENCY_SLO_MS = 6000      # p95 target


def probe(url, timeout=10):
    t0 = time.time()
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            ok = 200 <= r.status < 300
            return {"ok": ok, "status": r.status, "ms": round((time.time() - t0) * 1000)}
    except Exception as e:
        return {"ok": False, "status": None, "ms": round((time.time() - t0) * 1000), "error": str(e)[:60]}


def report(samples):
    n = len(samples); up = sum(1 for s in samples if s["ok"])
    avail = up / n if n else 0
    lat = sorted(s["ms"] for s in samples)
    p95 = lat[int(0.95 * (n - 1))] if n else 0
    return {
        "availability": round(avail, 4), "availability_slo_met": avail >= AVAILABILITY_SLO,
        "p95_ms": p95, "latency_slo_met": p95 <= LATENCY_SLO_MS,
        "checks": n, "up": up,
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        samples = [probe(sys.argv[1]) for _ in range(5)]
    else:
        # offline demo (no network): synthetic samples
        samples = [{"ok": True, "status": 200, "ms": ms} for ms in (120, 90, 210, 3500, 140)]
    print("samples:", samples)
    print("SLO report:", json.dumps(report(samples), indent=2))
