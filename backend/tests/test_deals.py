import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base
from app.api.deps import get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class TestDeals(unittest.TestCase):
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
        self.user_a = User(email="usera_d@example.com", hashed_password=pwd_a, full_name="User A")
        self.db.add(self.user_a)

        pwd_b = get_password_hash("PasswordB123!")
        self.user_b = User(email="userb_d@example.com", hashed_password=pwd_b, full_name="User B")
        self.db.add(self.user_b)
        self.db.commit()

        self.headers_a = {"Authorization": f"Bearer {create_access_token(self.user_a.id)}"}
        self.headers_b = {"Authorization": f"Bearer {create_access_token(self.user_b.id)}"}

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)
        app.dependency_overrides.clear()

    def test_create_and_update_deal(self):
        c_res = self.client.post(
            "/contacts",
            json={"name": "Charlie Deal", "email": "charlie@deals.com"},
            headers=self.headers_a
        )
        contact_id = c_res.json()["id"]

        deal_res = self.client.post(
            "/deals",
            json={"title": "SaaS Subscription", "contact_id": contact_id, "stage": "lead", "value": 15000.0},
            headers=self.headers_a
        )
        self.assertEqual(deal_res.status_code, 201)
        deal_id = deal_res.json()["id"]

        update_res = self.client.put(
            f"/deals/{deal_id}",
            json={"stage": "proposal"},
            headers=self.headers_a
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["stage"], "proposal")

    def test_cross_user_deal_isolation(self):
        c_res = self.client.post(
            "/contacts",
            json={"name": "User A Contact", "email": "contacta@example.com"},
            headers=self.headers_a
        )
        contact_id = c_res.json()["id"]

        deal_res = self.client.post(
            "/deals",
            json={"title": "Secret Deal", "contact_id": contact_id, "stage": "proposal", "value": 100000.0},
            headers=self.headers_a
        )
        deal_id = deal_res.json()["id"]

        self.assertEqual(len(self.client.get("/deals", headers=self.headers_b).json()), 0)
        self.assertEqual(self.client.get(f"/deals/{deal_id}", headers=self.headers_b).status_code, 404)
        self.assertEqual(self.client.put(f"/deals/{deal_id}", json={"stage": "lost"}, headers=self.headers_b).status_code, 404)
        self.assertEqual(self.client.delete(f"/deals/{deal_id}", headers=self.headers_b).status_code, 404)


if __name__ == "__main__":
    unittest.main()
