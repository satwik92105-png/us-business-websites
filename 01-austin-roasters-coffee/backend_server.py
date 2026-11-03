# -*- coding: utf-8 -*-
"""
Flat Track Roasters - Production Python Backend Server
FastAPI + SQLite REST API powering Tier 2 & Tier 3 Customer & Owner Portals.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import datetime
import uvicorn

app = FastAPI(title="Flat Track Coffee Roasters API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "flattrack.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
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
        party_size INTEGER,
        booking_date TEXT,
        booking_time TEXT,
        status TEXT DEFAULT 'Confirmed',
        created_at TEXT
    )
    """)
    conn.commit()
    conn.close()

init_db()

class OrderItem(BaseModel):
    name: str
    price: float
    qty: int

class OrderCreate(BaseModel):
    id: str
    customer_name: str
    items: List[OrderItem]
    total: float
    pickup_time: str

class BookingCreate(BaseModel):
    id: str
    guest_name: str
    guest_phone: str
    party_size: int
    booking_date: str
    booking_time: str

@app.get("/api/menu")
def get_menu():
    return [
        {"id": 1, "name": "Dogspeed Espresso Double", "category": "espresso", "price": 4.50, "in_stock": True},
        {"id": 2, "name": "24-Hour Nitro Cold Brew", "category": "cold", "price": 5.50, "in_stock": True},
        {"id": 3, "name": "Ethiopian Pour-Over", "category": "pourover", "price": 5.75, "in_stock": True},
        {"id": 4, "name": "Breakfast Taco Trio", "category": "food", "price": 10.50, "in_stock": True},
        {"id": 5, "name": "Dogspeed Blend (12oz Bag)", "category": "beans", "price": 18.00, "in_stock": True},
        {"id": 6, "name": "Oat Milk Honey Cortado", "category": "espresso", "price": 5.00, "in_stock": True}
    ]

@app.post("/api/orders")
def create_order(order: OrderCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    items_str = ", ".join([f"{item.qty}x {item.name}" for item in order.items])
    created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO orders (id, customer_name, items, total, pickup_time, status, created_at) VALUES (?, ?, ?, ?, ?, 'New', ?)",
        (order.id, order.customer_name, items_str, order.total, order.pickup_time, created_at)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "order_id": order.id}

@app.get("/api/orders")
def list_orders():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, customer_name, items, total, pickup_time, status, created_at FROM orders ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {"id": r[0], "customer_name": r[1], "items": r[2], "total": r[3], "pickup_time": r[4], "status": r[5], "created_at": r[6]}
        for r in rows
    ]

@app.patch("/api/orders/{order_id}")
def update_order_status(order_id: str, status: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))
    conn.commit()
    conn.close()
    return {"status": "updated", "order_id": order_id, "new_status": status}

@app.post("/api/bookings")
def create_booking(booking: BookingCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO bookings (id, guest_name, guest_phone, party_size, booking_date, booking_time, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', ?)",
        (booking.id, booking.guest_name, booking.guest_phone, booking.party_size, booking.booking_date, booking.booking_time, created_at)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "booking_id": booking.id}

@app.get("/api/bookings")
def list_bookings():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, guest_name, guest_phone, party_size, booking_date, booking_time, status, created_at FROM bookings ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {"id": r[0], "guest_name": r[1], "guest_phone": r[2], "party_size": r[3], "booking_date": r[4], "booking_time": r[5], "status": r[6], "created_at": r[7]}
        for r in rows
    ]

if __name__ == "__main__":
    print("Starting Flat Track Backend API on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)
