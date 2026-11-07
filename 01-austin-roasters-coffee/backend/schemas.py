from pydantic import BaseModel, EmailStr
from typing import List, Optional, Union
from datetime import datetime

class MenuItemBase(BaseModel):
    id: Optional[Union[int, str]] = None
    name: str
    category: str
    price: float
    description: Optional[str] = ""
    badge: Optional[str] = None
    in_stock: Optional[bool] = None
    inStock: Optional[bool] = None
    image: Optional[str] = None
    customizable: Optional[bool] = False

    class Config:
        extra = "allow"

class MenuItemCreate(MenuItemBase):
    pass

class StockUpdateRequest(BaseModel):
    in_stock: Optional[bool] = None
    inStock: Optional[bool] = None

    class Config:
        extra = "allow"

class MenuItemResponse(MenuItemBase):
    id: int
    class Config:
        from_attributes = True
        extra = "allow"

class OrderItem(BaseModel):
    id: Optional[Union[int, str]] = None
    name: str
    qty: int = 1
    price: float = 0.0
    customizations: Optional[str] = None

    class Config:
        extra = "allow"

class OrderCreate(BaseModel):
    customerName: str
    phone: Optional[str] = "(512) 540-6033"
    email: Optional[str] = None
    items: List[OrderItem] = []
    subtotal: float = 0.0
    notes: Optional[str] = None
    paidOnline: Optional[bool] = False

    class Config:
        extra = "allow"

class ReservationCreate(BaseModel):
    name: str
    email: str
    phone: str
    partySize: Optional[int] = None
    party_size: Optional[int] = None
    date: Optional[str] = None
    res_date: Optional[str] = None
    time: Optional[str] = None
    res_time: Optional[str] = None
    notes: Optional[str] = ""

    class Config:
        extra = "allow"

class InquiryCreate(BaseModel):
    name: str
    email: str
    subject: Optional[str] = "General Inquiry"
    message: str

    class Config:
        extra = "allow"

class SubscriberCreate(BaseModel):
    roast: str
    grind: str
    frequency: str
    monthlyPrice: float
    customerName: str
    email: str

    class Config:
        extra = "allow"

class LoginRequest(BaseModel):
    email: str
    password: str

    class Config:
        extra = "allow"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

    class Config:
        extra = "allow"
