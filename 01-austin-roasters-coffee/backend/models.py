from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime
from datetime import datetime
from database import Base

class MenuItemModel(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    category = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    badge = Column(String(50), nullable=True)
    in_stock = Column(Boolean, default=True)
    image = Column(String(500), nullable=True)
    customizable = Column(Boolean, default=False)

class OrderModel(Base):
    __tablename__ = "orders"

    id = Column(String(50), primary_key=True, index=True)
    customer_name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=False)
    items_json = Column(Text, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    status = Column(String(50), default="New Order")
    order_time = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

class ReservationModel(Base):
    __tablename__ = "reservations"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=False)
    phone = Column(String(50), nullable=False)
    party_size = Column(Integer, default=2)
    date = Column(String(50), nullable=False)
    time = Column(String(50), nullable=False)
    status = Column(String(50), default="Confirmed")
    notes = Column(Text, nullable=True)

class InquiryModel(Base):
    __tablename__ = "inquiries"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=False)
    subject = Column(String(200), default="General Inquiry")
    message = Column(Text, nullable=False)
    date = Column(String(50), nullable=False)

class SubscriberModel(Base):
    __tablename__ = "subscribers"

    id = Column(String(50), primary_key=True, index=True)
    roast = Column(String(100), nullable=False)
    grind = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    monthly_price = Column(Float, nullable=False)
    customer_name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=False)
    created = Column(DateTime, default=datetime.utcnow)

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(50), default="admin")
