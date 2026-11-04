# -*- coding: utf-8 -*-
"""
Flat Track Coffee Roasters - Production Python REST API
FastAPI + SQLite backend powering Customer Storefront and Owner POS Terminal.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import datetime
import uvicorn
import os

app = FastAPI(title="Flat Track Coffee Roasters API", version="2.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "flattrack.db"

INITIAL_MENU = [
    (1, "Dogspeed Espresso Double", "espresso", 4.50, "Double-pulled Dogspeed blend. Rich dark cacao, candied citrus, dense persistent crema. The house shot.", 1),
    (2, "24-Hour Nitro Cold Brew", "cold", 5.50, "Steeped cold for a full 24 hours on Cesar Chavez, then nitrogen-charged on draft. Velvety, sweet, zero bitterness.", 1),
    (3, "Ethiopian Yirgacheffe Pour-Over", "cold", 5.75, "Single-origin natural lot, hand-poured to order on V60. Wild blueberry aroma, bergamot finish, jasmine top notes.", 1),
    (4, "Breakfast Taco Trio", "food", 10.50, "Three warm flour tortillas. Farm eggs, smoked chorizo or avocado, cheddar, and house salsa verde.", 1),
    (5, "Oat Milk Honey Cortado", "espresso", 5.00, "Equal parts espresso and steamed oat milk. Finished with a pour of local Texas wildflower honey.", 1),
    (6, "Dogspeed Blend Whole Bean (12oz)", "beans", 18.00, "Freshly roasted small-batch bag from our San Franciscan drum. Sealed to order on East Cesar Chavez.", 1)
]

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        in_stock INTEGER DEFAULT 1
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT,
        items TEXT,
        total REAL,
        pickup_time TEXT,
        status TEXT DEFAULT 'New',
        created_at TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        guest_name TEXT,
        guest_phone TEXT,
        party_size TEXT,
        booking_time TEXT,
        seating TEXT,
        status TEXT DEFAULT 'Confirmed',
        created_at TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        subject TEXT,
        created_at TEXT
    )
    """)
    
    cursor.execute("SELECT COUNT(*) FROM menu")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            "INSERT INTO menu (id, name, category, price, description, in_stock) VALUES (?, ?, ?, ?, ?, ?)",
            INITIAL_MENU
        )
    conn.commit()
    conn.close()

init_db()

# Pydantic Schemas
class MenuItemCreate(BaseModel):
    name: str
    category: str
    price: float
    description: Optional[str] = ""
    in_stock: Optional[bool] = True

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    in_stock: Optional[bool] = None

class OrderCreate(BaseModel):
    id: str
    customer_name: str
    items: str
    total: str
    pickup_time: str

class BookingCreate(BaseModel):
    id: str
    guest_name: str
    guest_phone: str
    party_size: str
    booking_time: str
    seating: str

class MessageCreate(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = ""
    subject: str

# ----------------- MENU CRUD -----------------
@app.get("/api/menu")
def get_menu():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, category, price, description, in_stock FROM menu ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "name": r[1],
            "category": r[2],
            "price": r[3],
            "desc": r[4] or "",
            "inStock": bool(r[5])
        }
        for r in rows
    ]

@app.post("/api/menu")
def add_menu_item(item: MenuItemCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO menu (name, category, price, description, in_stock) VALUES (?, ?, ?, ?, ?)",
        (item.name, item.category, item.price, item.description, 1 if item.in_stock else 0)
    )
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"status": "success", "id": new_id}

@app.put("/api/menu/{item_id}")
def update_menu_item(item_id: int, item: MenuItemUpdate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM menu WHERE id = ?", (item_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")

    fields = []
    values = []
    if item.name is not None:
        fields.append("name = ?"); values.append(item.name)
    if item.category is not None:
        fields.append("category = ?"); values.append(item.category)
    if item.price is not None:
        fields.append("price = ?"); values.append(item.price)
    if item.description is not None:
        fields.append("description = ?"); values.append(item.description)
    if item.in_stock is not None:
        fields.append("in_stock = ?"); values.append(1 if item.in_stock else 0)

    if fields:
        values.append(item_id)
        cursor.execute(f"UPDATE menu SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

    conn.close()
    return {"status": "updated", "id": item_id}

@app.delete("/api/menu/{item_id}")
def delete_menu_item(item_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM menu WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": item_id}

@app.post("/api/menu/{item_id}/toggle-stock")
def toggle_item_stock(item_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT in_stock FROM menu WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")
    new_val = 0 if row[0] == 1 else 1
    cursor.execute("UPDATE menu SET in_stock = ? WHERE id = ?", (new_val, item_id))
    conn.commit()
    conn.close()
    return {"status": "success", "id": item_id, "inStock": bool(new_val)}

# ----------------- ORDERS -----------------
@app.get("/api/orders")
def list_orders():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, customer_name, items, total, pickup_time, status, created_at FROM orders ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {"id": r[0], "customer": r[1], "items": r[2], "total": r[3], "pickup": r[4], "status": r[5], "created": r[6]}
        for r in rows
    ]

@app.post("/api/orders")
def create_order(order: OrderCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO orders (id, customer_name, items, total, pickup_time, status, created_at) VALUES (?, ?, ?, ?, ?, 'New', ?)",
        (order.id, order.customer_name, order.items, order.total, order.pickup_time, created_at)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "order_id": order.id}

@app.patch("/api/orders/{order_id}/status")
def update_order_status(order_id: str, status: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if status == "Done":
        cursor.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    else:
        cursor.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))
    conn.commit()
    conn.close()
    return {"status": "updated", "order_id": order_id, "new_status": status}

# ----------------- BOOKINGS -----------------
@app.get("/api/bookings")
def list_bookings():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, guest_name, guest_phone, party_size, booking_time, seating, status, created_at FROM bookings ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {"id": r[0], "name": r[1], "phone": r[2], "party": r[3], "time": r[4], "seating": r[5], "status": r[6], "created": r[7]}
        for r in rows
    ]

@app.post("/api/bookings")
def create_booking(booking: BookingCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO bookings (id, guest_name, guest_phone, party_size, booking_time, seating, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', ?)",
        (booking.id, booking.guest_name, booking.guest_phone, booking.party_size, booking.booking_time, booking.seating, created_at)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "booking_id": booking.id}

@app.delete("/api/bookings/{booking_id}")
def delete_booking(booking_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM bookings WHERE id = ?", (booking_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "booking_id": booking_id}

# ----------------- MESSAGES -----------------
@app.get("/api/messages")
def list_messages():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, phone, subject, created_at FROM messages ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {"id": r[0], "name": r[1], "email": r[2], "phone": r[3], "subject": r[4], "time": r[5]}
        for r in rows
    ]

@app.post("/api/messages")
def create_message(msg: MessageCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO messages (id, name, email, phone, subject, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (msg.id, msg.name, msg.email, msg.phone, msg.subject, created_at)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "id": msg.id}

@app.delete("/api/messages/{msg_id}")
def delete_message(msg_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE id = ?", (msg_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": msg_id}

if __name__ == "__main__":
    print("Starting Flat Track Roasters Production REST API on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)
