from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.auth.utils import decode_token
from app.auth.models import UserRole

security = HTTPBearer()

def get_current_admin(auth: HTTPAuthorizationCredentials = Depends(security)):
    token = auth.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    role = payload.get("role")
    if role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have the permission"
        )
    
    return payload
