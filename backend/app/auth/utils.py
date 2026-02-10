import base64
import json
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from cryptography.fernet import Fernet
from jose import jwt

from config import get_settings

settings = get_settings()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hashed version."""
    try:
        # Bcrypt has a 72-byte limit. We truncate and encode to bytes.
        password_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash of the given password."""
    # Bcrypt has a 72-byte limit. We truncate and encode to bytes.
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if "type" not in to_encode:
        to_encode["type"] = "access"
        
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str):
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.JWTError:
        return None


def _get_fernet():
    # Derive a 32-byte base64 key from settings.SECRET_KEY
    key_bytes = settings.SECRET_KEY.encode()
    if len(key_bytes) < 32:
        key_bytes = key_bytes.ljust(32, b"0")
    else:
        key_bytes = key_bytes[:32]
    
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


def encrypt_data(data: dict) -> str:
    """Encrypt a dictionary into an opaque string."""
    f = _get_fernet()
    json_data = json.dumps(data).encode()
    return f.encrypt(json_data).decode()


def decrypt_data(token: str) -> Optional[dict]:
    """Decrypt an opaque string back into a dictionary."""
    f = _get_fernet()
    try:
        decrypted = f.decrypt(token.encode()).decode()
        return json.loads(decrypted)
    except Exception:
        return None