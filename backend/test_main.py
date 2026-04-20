import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Set env var to use fallback SQLite for tests
os.environ["DATABASE_URL"] = "sqlite:///test_expenses.db"

from main import app
import main
main.LOCAL_RECEIPT_DIR = "test_receipts"
from database import Base, get_db, Expense, User, Report

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///test_expenses.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_login():
    response = client.post("/api/login", json={"username": "testuser"})
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"
    assert "id" in response.json()
    assert response.json()["first_name"] == "Jane"
    assert response.json()["last_name"] == "Doe"
    assert response.json()["job_title"] == "Job Title"
    assert response.json()["cost_ctr"] == "CC-001"

def test_update_user():
    # Create user first
    client.post("/api/login", json={"username": "testuser"})
    
    response = client.put("/api/users/testuser", json={
        "first_name": "John",
        "last_name": "Smith",
        "job_title": "Senior Manager",
        "cost_ctr": "CC-002"
    })
    assert response.status_code == 200
    assert response.json()["first_name"] == "John"
    assert response.json()["last_name"] == "Smith"
    assert response.json()["job_title"] == "Senior Manager"
    assert response.json()["cost_ctr"] == "CC-002"
    
    # Verify persistence
    resp_login = client.post("/api/login", json={"username": "testuser"})
    assert resp_login.json()["first_name"] == "John"

def test_get_expenses_empty():
    response = client.get("/api/expenses?username=testuser")
    assert response.status_code == 200
    assert response.json() == []

def test_add_expense():
    # Create user first
    client.post("/api/login", json={"username": "testuser"})
    
    response = client.post("/api/expenses", json={
        "title": "Test Expense",
        "amount": 50.0,
        "category": "meals",
        "username": "testuser"
    })
    assert response.status_code == 201
    assert response.json()["title"] == "Test Expense"
    assert response.json()["amount"] == 50.0

def test_get_expenses():
    # Create user and expense
    client.post("/api/login", json={"username": "testuser"})
    client.post("/api/expenses", json={
        "title": "Test Expense",
        "amount": 50.0,
        "category": "meals",
        "username": "testuser"
    })
    
    response = client.get("/api/expenses?username=testuser")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Test Expense"

def test_add_report():
    # Create user and expenses
    client.post("/api/login", json={"username": "testuser"})
    resp1 = client.post("/api/expenses", json={"title": "E1", "amount": 10.0, "category": "meals", "username": "testuser"})
    resp2 = client.post("/api/expenses", json={"title": "E2", "amount": 20.0, "category": "taxi", "username": "testuser"})
    
    e1_id = resp1.json()["id"]
    e2_id = resp2.json()["id"]
    
    response = client.post("/api/reports", json={
        "title": "Test Report",
        "username": "testuser",
        "expense_ids": [e1_id, e2_id]
    })
    assert response.status_code == 201
    assert response.json()["title"] == "Test Report"
    
    # Verify expenses linked
    resp_expenses = client.get("/api/expenses?username=testuser")
    for exp in resp_expenses.json():
        assert exp["report_id"] == response.json()["id"]

@pytest.fixture(autouse=True)
def cleanup_receipts():
    yield
    import shutil
    if os.path.exists("test_receipts"):
        shutil.rmtree("test_receipts")

def test_receipt_upload_download_local():
    # Create user and expense first
    client.post("/api/login", json={"username": "testuser"})
    resp = client.post("/api/expenses", json={
        "title": "Receipt Test",
        "amount": 30.0,
        "category": "lodging",
        "username": "testuser"
    })
    expense_id = resp.json()["id"]
    
    # Upload a receipt
    file_content = b"dummy receipt content"
    response = client.post(
        f"/api/expenses/{expense_id}/receipt",
        files={"file": ("receipt.jpg", file_content, "image/jpeg")}
    )
    assert response.status_code == 200
    assert "receipt_uri" in response.json()
    assert response.json()["receipt_uri"].startswith("local://")
    
    # Get the receipt
    response = client.get(f"/api/expenses/{expense_id}/receipt")
    assert response.status_code == 200
    assert response.content == file_content
    assert response.headers["content-type"] == "image/jpeg"
