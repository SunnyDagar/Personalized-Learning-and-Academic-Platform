"""
Foundational API bootstrap + JWT auth — Sanchit Chhabra (Slides 1–5).

A minimal, runnable version of the product's API core: a health endpoint and a
JWT sign/verify helper (HS256), mirroring the production PHP front controller + lib/auth.php.
Runs on the Python standard library only — no dependencies, no secrets.

    python api_bootstrap.py         # serves http://127.0.0.1:8080/health
"""
import hmac, hashlib, base64, json, time
from http.server import BaseHTTPRequestHandler, HTTPServer

SECRET = "dev-only-not-a-real-secret"   # production key lives in .env on the server


def _b64(b): return base64.urlsafe_b64encode(b).decode().rstrip("=")
def _b64d(s): return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def jwt_encode(payload, secret=SECRET):
    head = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    body = _b64(json.dumps(payload).encode())
    sig = _b64(hmac.new(secret.encode(), f"{head}.{body}".encode(), hashlib.sha256).digest())
    return f"{head}.{body}.{sig}"


def jwt_decode(token, secret=SECRET):
    try:
        head, body, sig = token.split(".")
        expect = _b64(hmac.new(secret.encode(), f"{head}.{body}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expect):
            return None
        data = json.loads(_b64d(body))
        if data.get("exp", 1e18) < time.time():
            return None
        return data
    except Exception:
        return None


def generate_token(sub, role, expiration_seconds=3600, secret=SECRET):
    """Issue a signed session token for a user. Thin wrapper over jwt_encode()."""
    now = int(time.time())
    return jwt_encode(
        {"sub": sub, "role": role, "iat": now, "exp": now + expiration_seconds}, secret
    )


def verify_token(token, secret=SECRET):
    """Return the token's payload, or None if it is absent, expired or tampered with."""
    if not token:
        return None
    return jwt_decode(token, secret)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "service": "learnify-core", "active": True}).encode())
        else:
            self.send_response(404); self.end_headers()
    def log_message(self, *a): pass


if __name__ == "__main__":
    # self-test the auth layer
    tok = jwt_encode({"sub": 1, "role": "student", "exp": time.time() + 3600})
    assert jwt_decode(tok)["role"] == "student"
    assert jwt_decode(tok[:-2] + "xx") is None       # tampered signature rejected
    print("JWT sign/verify self-test passed ✓")
    print("Serving health endpoint on http://127.0.0.1:8080/health (Ctrl+C to stop)")
    HTTPServer(("127.0.0.1", 8080), Handler).serve_forever()

# .
