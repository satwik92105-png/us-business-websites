from fastapi.testclient import TestClient
from main import app, startup_populate

# Ensure database is seeded for tests
startup_populate()

client = TestClient(app)

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_public_can_read_menu():
    res = client.get("/api/menu")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) > 0

def test_unauthenticated_cannot_create_menu_item():
    payload = {
        "name": "Malicious Fake Espresso",
        "category": "espresso",
        "price": 0.01,
        "description": "Unauthorized injection attempt",
        "in_stock": True,
        "customizable": False
    }
    # Attempt mutation with NO auth headers
    res = client.post("/api/menu", json=payload)
    # Must reject with 401 or 403
    assert res.status_code in [401, 403]

def test_unauthenticated_cannot_delete_menu_item():
    res = client.delete("/api/menu/1")
    assert res.status_code in [401, 403]

def test_unauthenticated_cannot_toggle_stock():
    res = client.patch("/api/menu/1/stock?in_stock=false")
    assert res.status_code in [401, 403]

def test_admin_login_and_authenticated_mutation():
    # 1. Login with owner credentials
    login_res = client.post("/api/auth/login", json={
        "email": "admin@flattrackcoffee.com",
        "password": "roastmaster123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Add product as authenticated admin
    create_res = client.post("/api/menu", json={
        "name": "Austin Cold Brew Nitro Float",
        "category": "cold",
        "price": 7.50,
        "description": "Nitro cold brew with vanilla bean gelato",
        "badge": "Staff Favorite",
        "in_stock": True,
        "customizable": False
    }, headers=headers)
    assert create_res.status_code == 200
    new_item = create_res.json()
    new_id = new_item["id"]

    # 3. Clean up (delete item as admin)
    del_res = client.delete(f"/api/menu/{new_id}", headers=headers)
    assert del_res.status_code == 200
