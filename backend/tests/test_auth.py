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


class TestAuth(unittest.TestCase):
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

        # Create test user A
        hashed_pwd = get_password_hash("UserAPassword123!")
        self.user_a = User(email="usera@example.com", hashed_password=hashed_pwd, full_name="User A")
        self.db.add(self.user_a)
        self.db.commit()
        self.db.refresh(self.user_a)
        token = create_access_token(subject=self.user_a.id)
        self.headers_a = {"Authorization": f"Bearer {token}"}

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)
        app.dependency_overrides.clear()

    def test_signup_success(self):
        """Test registering a new user."""
        response = self.client.post(
            "/auth/signup",
            json={"email": "newuser@example.com", "password": "Password123!", "full_name": "New User"}
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "newuser@example.com")

    def test_signup_duplicate_email(self):
        """Test duplicate signup fails with 400 Bad Request."""
        response = self.client.post(
            "/auth/signup",
            json={"email": self.user_a.email, "password": "Password123!", "full_name": "Duplicate"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("already exists", response.json()["detail"])

    def test_login_success(self):
        """Test login with valid credentials."""
        response = self.client.post(
            "/auth/login",
            json={"email": self.user_a.email, "password": "UserAPassword123!"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())

    def test_login_invalid_password(self):
        """Test login rejection with incorrect password."""
        response = self.client.post(
            "/auth/login",
            json={"email": self.user_a.email, "password": "WrongPassword!"}
        )
        self.assertEqual(response.status_code, 401)
        self.assertIn("Incorrect email or password", response.json()["detail"])

    def test_protected_route_without_token(self):
        """Test accessing protected route without token fails with 401."""
        response = self.client.get("/auth/me")
        self.assertEqual(response.status_code, 401)

    def test_protected_route_with_valid_token(self):
        """Test accessing protected route with valid token."""
        response = self.client.get("/auth/me", headers=self.headers_a)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], self.user_a.email)


if __name__ == "__main__":
    unittest.main()
