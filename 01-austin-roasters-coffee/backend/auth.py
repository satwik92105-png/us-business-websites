import os
import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Security, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import hashlib

SECRET_KEY = os.getenv("SECRET_KEY", "flattrack_super_secret_jwt_key_2026_austin_tx_roasters")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    # Deterministic SHA-256 with salt for zero-dependency reliability
    salt = "flattrack_austin_tx_salt_2026"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def require_admin(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Security(security)):
    # 1. Check Bearer Token
    if credentials and credentials.credentials:
        token = credentials.credentials
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            role = payload.get("role")
            if role == "admin":
                return payload
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Admin privileges required"
            )
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication credentials"
            )

    # 2. Check X-Admin-PIN header or Query Parameter (1234 or roastmaster123)
    pin = request.headers.get("X-Admin-PIN") or request.headers.get("x-admin-pin") or request.query_params.get("pin")
    if pin in ["1234", "roastmaster123"]:
        return {"sub": "admin@flattrackcoffee.com", "role": "admin"}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication credentials or Admin PIN required"
    )
