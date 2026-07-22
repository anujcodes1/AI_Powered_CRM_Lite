import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base
from app.api.deps import get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User

# In-memory SQLite DB for fast isolated testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    """Create clean database tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Provide a transactional DB session for tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def user_a(db_session):
    """Create User A and return user instance and auth headers."""
    hashed_pwd = get_password_hash("UserAPassword123!")
    user = User(email="usera@example.com", hashed_password=hashed_pwd, full_name="User A")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}
    return {"user": user, "headers": headers, "token": token}


@pytest.fixture
def user_b(db_session):
    """Create User B for multi-tenant isolation testing."""
    hashed_pwd = get_password_hash("UserBPassword123!")
    user = User(email="userb@example.com", hashed_password=hashed_pwd, full_name="User B")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}
    return {"user": user, "headers": headers, "token": token}
