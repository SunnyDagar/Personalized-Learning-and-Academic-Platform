import unittest
import time
from api_bootstrap import generate_token, verify_token

class TestApiBootstrapAuth(unittest.TestCase):
    
    def test_valid_token(self):
        token = generate_token("user123", "student")
        payload = verify_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["sub"], "user123")

    def test_expired_token(self):
        token = generate_token("user123", "student", expiration_seconds=-1)
        payload = verify_token(token)
        self.assertIsNone(payload)

    def test_tampered_signature(self):
        token = generate_token("user123", "student")
        parts = token.split('.')
        tampered_token = parts[0] + ".tamperedpayload." + parts[2]
        payload = verify_token(tampered_token)
        self.assertIsNone(payload, "Tampered token signature must be rejected, not just falsy")

    def test_missing_header(self):
        payload = verify_token("")
        self.assertIsNone(payload)

if __name__ == "__main__":
    unittest.main()
