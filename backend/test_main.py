import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db

# Use a separate SQLite file just for testing
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function", autouse=True)
def setup_and_teardown_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)


def test_signup_success():
    response = client.post("/signup", json={"email": "test1@example.com", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_signup_duplicate_email_fails():
    client.post("/signup", json={"email": "test2@example.com", "password": "password123"})
    response = client.post("/signup", json={"email": "test2@example.com", "password": "password123"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


def test_login_success():
    client.post("/signup", json={"email": "test3@example.com", "password": "password123"})
    response = client.post("/login", json={"email": "test3@example.com", "password": "password123"})
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password_fails():
    client.post("/signup", json={"email": "test4@example.com", "password": "password123"})
    response = client.post("/login", json={"email": "test4@example.com", "password": "wrongpassword"})
    assert response.status_code == 401


def test_get_languages():
    response = client.get("/languages")
    assert response.status_code == 200
    data = response.json()
    assert "pairs" in data
    assert len(data["pairs"]) > 0


def test_translate_requires_authentication():
    response = client.post("/translate", json={"text": "Hello", "source_lang": "en", "target_lang": "fr"})
    assert response.status_code == 401


def test_translate_with_valid_token():
    signup_response = client.post("/signup", json={"email": "test5@example.com", "password": "password123"})
    token = signup_response.json()["access_token"]

    response = client.post(
        "/translate",
        json={"text": "Good morning", "source_lang": "en", "target_lang": "fr"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert "translated_text" in response.json()


def test_admin_stats_requires_admin():
    signup_response = client.post("/signup", json={"email": "test6@example.com", "password": "password123"})
    token = signup_response.json()["access_token"]

    response = client.get("/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403