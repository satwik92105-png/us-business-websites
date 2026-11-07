import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("--- TESTING EXTENDED BACKEND CAPABILITIES ---")

# 1. Test PIN-based menu create
item_payload = {
    "name": "PIN Verified Pour-Over",
    "category": "pourover",
    "price": 6.25,
    "description": "Created with PIN 1234",
    "inStock": True
}
res = client.post("/api/menu", json=item_payload, headers={"X-Admin-PIN": "1234"})
assert res.status_code == 200, f"Failed create with PIN: {res.status_code} {res.text}"
created_item = res.json()
item_id = created_item["id"]
print("[PASS]: Menu item created with X-Admin-PIN")

# 2. Test PIN-based menu update (both path and body)
update_payload = {
    "name": "PIN Verified Pour-Over Updated",
    "category": "pourover",
    "price": 6.75,
    "description": "Updated price",
    "inStock": False
}
res_put = client.put(f"/api/menu/{item_id}", json=update_payload, headers={"X-Admin-PIN": "1234"})
assert res_put.status_code == 200
assert res_put.json()["price"] == 6.75
print("[PASS]: Menu item updated via PUT /api/menu/{id}")

# 3. Test PIN-based stock toggle
res_stock = client.patch(f"/api/menu/{item_id}/stock", headers={"X-Admin-PIN": "1234"})
assert res_stock.status_code == 200
assert res_stock.json()["inStock"] == True
print("[PASS]: Menu item stock toggled via PATCH /api/menu/{id}/stock")

# 4. Test delete
res_del = client.delete(f"/api/menu/{item_id}", headers={"X-Admin-PIN": "1234"})
assert res_del.status_code == 200
print("[PASS]: Menu item deleted with X-Admin-PIN")

# 5. Test order placement with extra fields
order_payload = {
    "customerName": "Elena Rostova",
    "phone": "(512) 555-8888",
    "email": "elena@example.com",
    "items": [
        {"id": 1, "name": "Dogspeed Espresso Double", "price": 4.50, "qty": 2, "customizations": "Oat Milk"}
    ],
    "subtotal": 9.00,
    "notes": "Fast please",
    "paidOnline": True
}
res_ord = client.post("/api/orders", json=order_payload)
assert res_ord.status_code == 200, f"Order failed: {res_ord.status_code} {res_ord.text}"
ord_data = res_ord.json()
assert ord_data["paidOnline"] == True
assert ord_data["paymentStatus"] == "Paid Online (Stripe)"
print("[PASS]: Order placed with paidOnline=True")

# 6. Test GET /api/orders has the new order
res_all_orders = client.get("/api/orders")
assert res_all_orders.status_code == 200
matching = [o for o in res_all_orders.json() if o["id"] == ord_data["id"]]
assert len(matching) == 1
assert matching[0]["paidOnline"] == True
assert matching[0]["customerPhone"] == "(512) 555-8888"
print("[PASS]: GET /api/orders retrieved order with correct fields")

print("\nALL EXTENDED VERIFICATIONS PASSED 100%!")
