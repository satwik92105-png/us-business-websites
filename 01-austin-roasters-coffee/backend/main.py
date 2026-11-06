import json
import random
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import MenuItemModel, OrderModel, ReservationModel, InquiryModel, SubscriberModel, UserModel
from schemas import (
    MenuItemCreate, MenuItemResponse, OrderCreate, ReservationCreate,
    InquiryCreate, SubscriberCreate, LoginRequest, TokenResponse
)
from auth import hash_password, verify_password, create_access_token, require_admin

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Flat Track Coffee Roasters — REST API",
    description="Production API for Customer Ordering, Subscriptions, and Isolated Owner POS",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed initial admin and menu on startup
@app.on_event("startup")
def startup_populate():
    db = next(get_db())
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

# --- HEALTH & AUTH ---
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Flat Track Coffee Roasters API", "version": "3.0.0"}

@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid owner email or password")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}

# --- PUBLIC MENU ENDPOINTS ---
@app.get("/api/menu")
def get_menu(db: Session = Depends(get_db)):
    items = db.query(MenuItemModel).all()
    return [
        {
            "id": i.id, "name": i.name, "category": i.category,
            "price": i.price, "description": i.description,
            "badge": i.badge, "inStock": i.in_stock,
            "image": i.image, "customizable": i.customizable
        }
        for i in items
    ]

# --- PROTECTED ADMIN MENU MUTATIONS ---
@app.post("/api/menu", dependencies=[Depends(require_admin)])
def create_menu_item(req: MenuItemCreate, db: Session = Depends(get_db)):
    item = MenuItemModel(
        name=req.name, category=req.category, price=req.price,
        description=req.description, badge=req.badge,
        in_stock=req.in_stock, image=req.image, customizable=req.customizable
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.put("/api/menu/{item_id}", dependencies=[Depends(require_admin)])
def update_menu_item(item_id: int, req: MenuItemCreate, db: Session = Depends(get_db)):
    item = db.query(MenuItemModel).filter(MenuItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.name = req.name
    item.category = req.category
    item.price = req.price
    item.description = req.description
    item.badge = req.badge
    item.image = req.image
    item.in_stock = req.in_stock
    item.customizable = req.customizable
    db.commit()
    return item

@app.delete("/api/menu/{item_id}", dependencies=[Depends(require_admin)])
def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MenuItemModel).filter(MenuItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"deleted": True, "id": item_id}

@app.patch("/api/menu/{item_id}/stock", dependencies=[Depends(require_admin)])
def toggle_stock(item_id: int, in_stock: bool, db: Session = Depends(get_db)):
    item = db.query(MenuItemModel).filter(MenuItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.in_stock = in_stock
    db.commit()
    return {"id": item.id, "inStock": item.in_stock}

# --- ORDERS ---
@app.post("/api/orders")
def place_order(req: OrderCreate, db: Session = Depends(get_db)):
    order_id = f"FT-{random.randint(1000, 9999)}"
    subtotal = round(req.subtotal, 2)
    tax = round(subtotal * 0.0825, 2)
    total = round(subtotal + tax, 2)

    order = OrderModel(
        id=order_id,
        customer_name=req.customerName,
        phone=req.phone,
        items_json=json.dumps([i.dict() for i in req.items]),
        subtotal=subtotal,
        tax=tax,
        total=total,
        status="New Order",
        notes=req.notes or ""
    )
    db.add(order)
    db.commit()
    return {
        "id": order.id, "customerName": order.customer_name,
        "phone": order.phone, "subtotal": order.subtotal,
        "tax": order.tax, "total": order.total, "status": order.status
    }

@app.get("/api/orders", dependencies=[Depends(require_admin)])
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(OrderModel).order_by(OrderModel.order_time.desc()).all()
    return [
        {
            "id": o.id, "customerName": o.customer_name, "phone": o.phone,
            "items": json.loads(o.items_json), "subtotal": o.subtotal,
            "tax": o.tax, "total": o.total, "status": o.status,
            "orderTime": o.order_time.isoformat(), "notes": o.notes
        }
        for o in orders
    ]

@app.patch("/api/orders/{order_id}/status", dependencies=[Depends(require_admin)])
def update_order_status(order_id: str, new_status: str, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = new_status
    db.commit()
    return {"id": order.id, "status": order.status}

# --- RESERVATIONS ---
@app.post("/api/reservations")
def create_reservation(req: ReservationCreate, db: Session = Depends(get_db)):
    res_id = f"RES-{random.randint(100, 999)}"
    res = ReservationModel(
        id=res_id, name=req.name, email=req.email, phone=req.phone,
        party_size=req.partySize, date=req.date, time=req.time,
        notes=req.notes or "", status="Confirmed"
    )
    db.add(res)
    db.commit()
    return {"id": res.id, "status": res.status}

# --- INQUIRIES & SUBSCRIBERS ---
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
