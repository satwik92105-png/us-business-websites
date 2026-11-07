import json
import random
import os
from typing import Optional, Union, List
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import MenuItemModel, OrderModel, ReservationModel, InquiryModel, SubscriberModel, UserModel
from schemas import (
    MenuItemCreate, StockUpdateRequest, MenuItemResponse, OrderCreate, ReservationCreate,
    InquiryCreate, SubscriberCreate, LoginRequest, TokenResponse
)
from auth import hash_password, verify_password, create_access_token, require_admin

# Ensure all tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Flat Track Coffee Roasters — REST API",
    description="Production API for Customer Ordering, Subscriptions, and Isolated Owner POS",
    version="3.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def startup_populate():
    db = next(get_db())
    try:
        # Create default owner if not exists
        admin = db.query(UserModel).filter(UserModel.email == "admin@flattrackcoffee.com").first()
        if not admin:
            admin = UserModel(
                email="admin@flattrackcoffee.com",
                hashed_password=hash_password("roastmaster123"),
                role="admin"
            )
            db.add(admin)
            db.commit()

        # Seed initial menu if empty
        if db.query(MenuItemModel).count() == 0:
            seed_items = [
                ("Dogspeed Espresso Double", "espresso", 4.50, "Double-pulled Dogspeed blend. Rich dark cacao, candied citrus, dense persistent crema.", "Roaster's Pick", "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", True),
                ("Flat Track Classic Cortado", "espresso", 5.00, "Equal parts double espresso and silky steamed milk. Balanced, intensely aromatic.", "Local Favorite", "https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80", True),
                ("Bourbon Smoked Vanilla Latte", "specialty", 6.75, "House-made Madagascar vanilla syrup infused with oak barrel smoke and espresso.", "Seasonal Release", "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80", True),
                ("Single-Origin Ethiopian Pour-Over", "pourover", 6.50, "Yirgacheffe natural process. Vibrant bergamot, ripe blackberry, and honeysuckle finish.", "Micro-Lot", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80", False),
                ("East Austin Flash Brew Iced", "cold", 5.50, "Brewed hot directly over ice to preserve volatile aromatics. Crisp citrus brightness.", "Summer Essential", "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80", True),
                ("Artisan Butter Croissant", "bakery", 4.50, "Baked fresh daily by Swedish Hill. 48 laminated butter layers, golden flaky crust.", "Fresh Daily", "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80", False),
                ("Dogspeed Blend Whole Bean (12oz)", "beans", 19.50, "Our flagship medium-dark roast. Tasting notes of dark chocolate, toasted pecan, and dried fig.", "Signature Beans", "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80", False)
            ]
            for name, cat, pr, desc, bg, img, cust in seed_items:
                db.add(MenuItemModel(name=name, category=cat, price=pr, description=desc, badge=bg, image=img, customizable=cust, in_stock=True))
            db.commit()
        else:
            db.query(MenuItemModel).update({MenuItemModel.in_stock: True})
            db.commit()
    finally:
        db.close()

# Run seed on startup
@app.on_event("startup")
def on_startup():
    startup_populate()

# Also run immediately for serverless warm starts
try:
    startup_populate()
except Exception:
    pass

# --- HEALTH & AUTH ---

@app.get("/")
@app.get("/api")
def root_status():
    return {"status": "ok", "service": "Flat Track Coffee Roasters API", "version": "3.1.0"}

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Flat Track Coffee Roasters API", "version": "3.1.0"}

@app.post("/auth/login")
@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid owner email or password")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}

@app.post("/auth/register")
@app.post("/api/auth/register")
def register_customer(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == req.email).first()
    if user:
        token = create_access_token({"sub": user.email, "role": user.role})
        return {"access_token": token, "token_type": "bearer", "role": user.role, "user": {"email": user.email, "points": 100}}
    new_user = UserModel(email=req.email, hashed_password=hash_password(req.password), role="customer")
    db.add(new_user)
    db.commit()
    token = create_access_token({"sub": new_user.email, "role": "customer"})
    return {"access_token": token, "token_type": "bearer", "role": "customer", "user": {"email": new_user.email, "points": 100}}

@app.post("/auth/google")
@app.post("/api/auth/google")
def google_oauth(data: dict, db: Session = Depends(get_db)):
    email = data.get("email", "customer@gmail.com")
    name = data.get("name", "Google Customer")
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        user = UserModel(email=email, hashed_password=hash_password("google_oauth_auth_token"), role="customer")
        db.add(user)
        db.commit()
    token = create_access_token({"sub": email, "role": "customer"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": email, "name": name, "points": 150}
    }

# --- PUBLIC MENU ENDPOINTS ---
@app.get("/menu")
@app.get("/api/menu")
def get_menu(db: Session = Depends(get_db)):
    items = db.query(MenuItemModel).all()
    return [
        {
            "id": i.id, "name": i.name, "category": i.category,
            "price": i.price, "description": i.description,
            "badge": i.badge, "inStock": i.in_stock, "in_stock": i.in_stock,
            "image": i.image, "customizable": i.customizable
        }
        for i in items
    ]

# --- PROTECTED ADMIN MENU MUTATIONS ---
@app.post("/menu", dependencies=[Depends(require_admin)])
@app.post("/api/menu", dependencies=[Depends(require_admin)])
def create_menu_item(req: MenuItemCreate, db: Session = Depends(get_db)):
    val = req.inStock if req.inStock is not None else req.in_stock
    in_st = val if val is not None else True
    item = MenuItemModel(
        name=req.name, category=req.category, price=req.price,
        description=req.description or "", badge=req.badge or "",
        in_stock=in_st, image=req.image or "", customizable=bool(req.customizable)
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "id": item.id, "name": item.name, "category": item.category,
        "price": item.price, "description": item.description,
        "badge": item.badge, "inStock": item.in_stock, "in_stock": item.in_stock,
        "image": item.image, "customizable": item.customizable
    }

@app.put("/menu/{item_id}", dependencies=[Depends(require_admin)])
@app.put("/api/menu/{item_id}", dependencies=[Depends(require_admin)])
def update_menu_item(item_id: int, req: MenuItemCreate, db: Session = Depends(get_db)):
    item = db.query(MenuItemModel).filter(MenuItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.name = req.name
    item.category = req.category
    item.price = req.price
    item.description = req.description or ""
    item.badge = req.badge or ""
    item.image = req.image or item.image
    val = req.inStock if req.inStock is not None else req.in_stock
    if val is not None:
        item.in_stock = val
    item.customizable = bool(req.customizable)
    db.commit()
    db.refresh(item)
    return {
        "id": item.id, "name": item.name, "category": item.category,
        "price": item.price, "description": item.description,
        "badge": item.badge, "inStock": item.in_stock, "in_stock": item.in_stock,
        "image": item.image, "customizable": item.customizable
    }

@app.put("/menu", dependencies=[Depends(require_admin)])
@app.put("/api/menu", dependencies=[Depends(require_admin)])
def update_menu_item_body(req: MenuItemCreate, db: Session = Depends(get_db)):
    item_id = getattr(req, "id", None)
    if item_id:
        return update_menu_item(int(item_id), req, db)
    return create_menu_item(req, db)

@app.delete("/menu/{item_id}", dependencies=[Depends(require_admin)])
@app.delete("/api/menu/{item_id}", dependencies=[Depends(require_admin)])
def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MenuItemModel).filter(MenuItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"deleted": True, "id": item_id}

@app.patch("/menu/{item_id}/stock", dependencies=[Depends(require_admin)])
@app.patch("/api/menu/{item_id}/stock", dependencies=[Depends(require_admin)])
@app.post("/menu/{item_id}/stock", dependencies=[Depends(require_admin)])
@app.post("/api/menu/{item_id}/stock", dependencies=[Depends(require_admin)])
def toggle_stock(item_id: int, req: Optional[StockUpdateRequest] = None, in_stock: Optional[bool] = None, db: Session = Depends(get_db)):
    item = db.query(MenuItemModel).filter(MenuItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    new_val = not item.in_stock
    if req is not None:
        if req.inStock is not None:
            new_val = req.inStock
        elif req.in_stock is not None:
            new_val = req.in_stock
    if in_stock is not None:
        new_val = in_stock
    item.in_stock = new_val
    db.commit()
    db.refresh(item)
    return {"id": item.id, "inStock": item.in_stock, "in_stock": item.in_stock}

# --- ORDERS ---
@app.get("/orders")
@app.get("/api/orders")
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(OrderModel).order_by(OrderModel.order_time.desc()).all()
    res = []
    for o in orders:
        is_paid = (o.status == "Paid Online" or "Paid" in (o.status or ""))
        res.append({
            "id": o.id,
            "customerName": o.customer_name,
            "phone": o.phone,
            "customerPhone": o.phone,
            "items": json.loads(o.items_json) if o.items_json else [],
            "subtotal": o.subtotal,
            "tax": o.tax,
            "total": o.total,
            "status": o.status,
            "paidOnline": is_paid,
            "paymentStatus": "Paid Online (Stripe)" if is_paid else "Pay at Counter",
            "orderTime": o.order_time.isoformat() if o.order_time else "",
            "pickupEstimate": "10-12 mins",
            "notes": o.notes or ""
        })
    return res

@app.get("/orders/{order_id}")
@app.get("/api/orders/{order_id}")
def get_single_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order reference not found")
    is_paid = (order.status == "Paid Online" or "Paid" in (order.status or ""))
    return {
        "id": order.id,
        "customerName": order.customer_name,
        "phone": order.phone,
        "customerPhone": order.phone,
        "items": json.loads(order.items_json) if order.items_json else [],
        "subtotal": order.subtotal,
        "tax": order.tax,
        "total": order.total,
        "status": order.status,
        "paidOnline": is_paid,
        "paymentStatus": "Paid Online (Stripe)" if is_paid else "Pay at Counter",
        "orderTime": order.order_time.isoformat() if order.order_time else "",
        "notes": order.notes or ""
    }

@app.post("/orders")
@app.post("/api/orders")
def place_order(req: OrderCreate, db: Session = Depends(get_db)):
    order_id = f"FT-{random.randint(1000, 9999)}"
    subtotal = round(req.subtotal, 2)
    tax = round(subtotal * 0.0825, 2)
    total = round(subtotal + tax, 2)

    is_paid = bool(req.paidOnline or getattr(req, "paidOnline", False))
    status_str = "Paid Online" if is_paid else "New Order"
    payment_status = "Paid Online (Stripe)" if is_paid else "Pay at Counter"

    order = OrderModel(
        id=order_id,
        customer_name=req.customerName,
        phone=req.phone or "(512) 540-6033",
        items_json=json.dumps([i.dict() for i in req.items]),
        subtotal=subtotal,
        tax=tax,
        total=total,
        status=status_str,
        notes=req.notes or ""
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {
        "id": order.id,
        "customerName": order.customer_name,
        "phone": order.phone,
        "customerPhone": order.phone,
        "items": [i.dict() for i in req.items],
        "subtotal": order.subtotal,
        "tax": order.tax,
        "total": order.total,
        "status": order.status,
        "paidOnline": is_paid,
        "paymentStatus": payment_status,
        "orderTime": order.order_time.isoformat() if order.order_time else "",
        "pickupEstimate": "10-12 mins",
        "notes": order.notes,
        "qrCode": f"FLATTRACK-{order.id}-VERIFIED"
    }

@app.patch("/orders/{order_id}/status")
@app.patch("/api/orders/{order_id}/status")
def update_order_status(order_id: str, new_status: str, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = new_status
    db.commit()
    return {"id": order.id, "status": order.status}

# --- CHECKOUT (STRIPE PREPAID TEST INTEGRATION) ---
@app.post("/checkout/create-session")
@app.post("/api/checkout/create-session")
def create_checkout_session(data: dict):
    order_id = f"FT-{random.randint(1000, 9999)}"
    return {
        "sessionId": f"cs_test_{random.randint(100000, 999999)}",
        "orderId": order_id,
        "status": "paid_online",
        "paymentStatus": "paid",
        "qrCode": f"FLATTRACK-{order_id}-PREPAID"
    }

# --- RESERVATIONS ---
@app.get("/reservations")
@app.get("/api/reservations")
def get_reservations(db: Session = Depends(get_db)):
    res_list = db.query(ReservationModel).all()
    return [
        {
            "id": r.id, "name": r.name, "email": r.email, "phone": r.phone,
            "partySize": r.party_size, "party_size": r.party_size,
            "date": r.date, "res_date": r.date,
            "time": r.time, "res_time": r.time,
            "status": r.status, "notes": r.notes
        }
        for r in res_list
    ]

@app.post("/reservations")
@app.post("/api/reservations")
def create_reservation(req: ReservationCreate, db: Session = Depends(get_db)):
    res_id = f"RES-{random.randint(100, 999)}"
    party = req.partySize if req.partySize is not None else (req.party_size if req.party_size is not None else 2)
    r_date = req.date or req.res_date or "Today"
    r_time = req.time or req.res_time or "12:00 PM"
    res = ReservationModel(
        id=res_id, name=req.name, email=req.email, phone=req.phone,
        party_size=party, date=r_date, time=r_time,
        notes=req.notes or "", status="Confirmed"
    )
    db.add(res)
    db.commit()
    return {
        "id": res.id,
        "name": res.name,
        "email": res.email,
        "phone": res.phone,
        "partySize": res.party_size,
        "party_size": res.party_size,
        "date": res.date,
        "res_date": res.date,
        "time": res.time,
        "res_time": res.time,
        "status": res.status,
        "notes": res.notes
    }

@app.patch("/api/reservations/{res_id}/status")
def update_reservation_status(res_id: str, new_status: str, db: Session = Depends(get_db)):
    res = db.query(ReservationModel).filter(ReservationModel.id == res_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
    res.status = new_status
    db.commit()
    return {"id": res.id, "status": res.status}

# --- INQUIRIES & MESSAGES ---
@app.get("/messages")
@app.get("/api/messages")
@app.get("/api/inquiries")
def get_inquiries(db: Session = Depends(get_db)):
    items = db.query(InquiryModel).all()
    return [
        {
            "id": i.id, "name": i.name, "email": i.email,
            "subject": i.subject, "message": i.message, "date": i.date
        }
        for i in items
    ]

@app.post("/messages")
@app.post("/api/messages")
@app.post("/api/inquiries")
def create_inquiry(req: InquiryCreate, db: Session = Depends(get_db)):
    inq = InquiryModel(
        id=f"INQ-{random.randint(1000, 9999)}",
        name=req.name, email=req.email,
        subject=req.subject, message=req.message,
        date="Today"
    )
    db.add(inq)
    db.commit()
    return {"id": inq.id, "saved": True}

# --- SUBSCRIBERS & CATERING ---
@app.get("/subscriptions")
@app.get("/api/subscriptions")
@app.get("/api/subscribers")
def get_subscriptions(db: Session = Depends(get_db)):
    subs = db.query(SubscriberModel).all()
    return [
        {
            "id": s.id, "roast": s.roast, "grind": s.grind,
            "frequency": s.frequency, "monthlyPrice": s.monthly_price,
            "customerName": s.customer_name, "email": s.email
        }
        for s in subs
    ]

@app.post("/subscriptions")
@app.post("/api/subscriptions")
@app.post("/api/subscribers")
def create_subscriber(req: SubscriberCreate, db: Session = Depends(get_db)):
    sub = SubscriberModel(
        id=f"SUB-{random.randint(1000, 9999)}",
        roast=req.roast, grind=req.grind, frequency=req.frequency,
        monthly_price=req.monthlyPrice, customer_name=req.customerName,
        email=req.email
    )
    db.add(sub)
    db.commit()
    return {"id": sub.id, "active": True}

@app.post("/catering")
@app.post("/api/catering")
def create_catering(data: dict):
    return {"id": f"CAT-{random.randint(100, 999)}", "status": "Inquiry Received", "confirmed": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
