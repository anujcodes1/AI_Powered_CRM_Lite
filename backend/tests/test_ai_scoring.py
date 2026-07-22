import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base
from app.api.deps import get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.services.ai_scoring import parse_llm_json_response

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class TestAIScoring(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = TestingSessionLocal()

        def override_get_db():
            try:
                yield self.db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

        pwd_a = get_password_hash("PasswordA123!")
        self.user_a = User(email="usera_ai@example.com", hashed_password=pwd_a, full_name="User A")
        self.db.add(self.user_a)
        self.db.commit()

        self.headers_a = {"Authorization": f"Bearer {create_access_token(self.user_a.id)}"}

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)
        app.dependency_overrides.clear()

    def test_parse_llm_json_response_valid(self):
        raw = '{"score": 85, "reason": "High interaction recency and active proposal stage."}'
        parsed = parse_llm_json_response(raw)
        self.assertEqual(parsed["score"], 85)
        self.assertIn("High interaction", parsed["reason"])

    def test_parse_llm_json_response_markdown_wrapper(self):
        raw = '```json\n{\n  "score": 92,\n  "reason": "Strong buying intent noted in call."\n}\n```'
        parsed = parse_llm_json_response(raw)
        self.assertEqual(parsed["score"], 92)

    def test_parse_llm_json_response_malformed_fallback(self):
        raw = 'SOMETHING WENT WRONG AND UNCLOSED JSON {"score": 75, "reason": "Good engagement" but unclosed...'
        parsed = parse_llm_json_response(raw)
        self.assertIsInstance(parsed["score"], int)
        self.assertTrue(0 <= parsed["score"] <= 100)

    def test_lead_scoring_endpoint_with_mocked_llm(self):
        c_res = self.client.post(
            "/contacts",
            json={"name": "AI Score Test Lead", "email": "aiscore@test.com"},
            headers=self.headers_a
        )
        contact_id = c_res.json()["id"]

        with patch("app.routers.contacts.calculate_ai_lead_score") as mock_scoring:
            mock_scoring.return_value = {"score": 88, "reason": "Frequent meeting notes and active proposal."}

            score_res = self.client.post(f"/contacts/{contact_id}/score", headers=self.headers_a)
            self.assertEqual(score_res.status_code, 200)
            data = score_res.json()
            self.assertEqual(data["lead_score"], 88)
            self.assertIn("Frequent meeting notes", data["ai_score_reason"])

    def test_lead_scoring_endpoint_handles_malformed_llm(self):
        c_res = self.client.post(
            "/contacts",
            json={"name": "Malformed LLM Lead", "email": "malformed@test.com"},
            headers=self.headers_a
        )
        contact_id = c_res.json()["id"]

        with patch("app.routers.contacts.calculate_ai_lead_score") as mock_scoring:
            mock_scoring.return_value = {"score": 50, "reason": "Lead score evaluated based on engagement signals."}

            score_res = self.client.post(f"/contacts/{contact_id}/score", headers=self.headers_a)
            self.assertEqual(score_res.status_code, 200)
            data = score_res.json()
            self.assertEqual(data["lead_score"], 50)


if __name__ == "__main__":
    unittest.main()
