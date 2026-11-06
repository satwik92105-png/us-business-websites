from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class MenuItemBase(BaseModel):
    name: str
    category: str
    price: float
    description: str
    badge: Optional[str] = None
    in_stock: bool = True
    image: Optional[str] = None
    customizable: bool = False

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemResponse(MenuItemBase):
    id: int
    class Config:
        from_attributes = True

class OrderItem(BaseModel):
    name: str
    qty: int
    price: float
    customizations: Optional[str] = None

class OrderCreate(BaseModel):
    customerName: str
    phone: str
    items: List[OrderItem]
    subtotal: float
    notes: Optional[str] = None

class ReservationCreate(BaseModel):
    name: str
    email: str
    phone: str
    partySize: int
    date: str
    time: str
    notes: Optional[str] = None

class InquiryCreate(BaseModel):
    name: str
    email: str
    subject: Optional[str] = "General Inquiry"
    message: str

class SubscriberCreate(BaseModel):
    roast: str
    grind: str
    frequency: str
    monthlyPrice: float
    customerName: str
    email: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
