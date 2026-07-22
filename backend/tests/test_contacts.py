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


class TestContacts(unittest.TestCase):
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

        # Setup User A
        pwd_a = get_password_hash("PasswordA123!")
        self.user_a = User(email="usera_c@example.com", hashed_password=pwd_a, full_name="User A")
        self.db.add(self.user_a)

        # Setup User B
        pwd_b = get_password_hash("PasswordB123!")
        self.user_b = User(email="userb_c@example.com", hashed_password=pwd_b, full_name="User B")
        self.db.add(self.user_b)
        self.db.commit()

        self.headers_a = {"Authorization": f"Bearer {create_access_token(self.user_a.id)}"}
        self.headers_b = {"Authorization": f"Bearer {create_access_token(self.user_b.id)}"}

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)
        app.dependency_overrides.clear()

    def test_create_and_get_contact(self):
        payload = {"name": "Alice Smith", "email": "alice@acme.com", "company": "Acme Corp", "tags": ["VIP"]}
        create_res = self.client.post("/contacts", json=payload, headers=self.headers_a)
        self.assertEqual(create_res.status_code, 201)
        self.assertEqual(create_res.json()["name"], "Alice Smith")

        list_res = self.client.get("/contacts", headers=self.headers_a)
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.json()), 1)

    def test_update_and_delete_contact(self):
        create_res = self.client.post(
            "/contacts",
            json={"name": "Bob Jones", "email": "bob@acme.com"},
            headers=self.headers_a
        )
        contact_id = create_res.json()["id"]

        update_res = self.client.put(
            f"/contacts/{contact_id}",
            json={"company": "Acme Global"},
            headers=self.headers_a
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["company"], "Acme Global")

        del_res = self.client.delete(f"/contacts/{contact_id}", headers=self.headers_a)
        self.assertEqual(del_res.status_code, 204)

        get_res = self.client.get(f"/contacts/{contact_id}", headers=self.headers_a)
        self.assertEqual(get_res.status_code, 404)

    def test_cross_user_contact_isolation(self):
        """CRITICAL: Test that User B CANNOT view, update, or delete User A's contact."""
        create_res = self.client.post(
            "/contacts",
            json={"name": "Confidential Prospect", "email": "secret@corp.com"},
            headers=self.headers_a
        )
        contact_id = create_res.json()["id"]

        user_b_list = self.client.get("/contacts", headers=self.headers_b)
        self.assertEqual(user_b_list.status_code, 200)
        self.assertEqual(len(user_b_list.json()), 0)

        self.assertEqual(self.client.get(f"/contacts/{contact_id}", headers=self.headers_b).status_code, 404)
        self.assertEqual(self.client.put(f"/contacts/{contact_id}", json={"name": "Hacked"}, headers=self.headers_b).status_code, 404)
        self.assertEqual(self.client.delete(f"/contacts/{contact_id}", headers=self.headers_b).status_code, 404)


if __name__ == "__main__":
    unittest.main()
