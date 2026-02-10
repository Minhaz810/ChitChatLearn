from pydantic import BaseModel


class ConnectionTokenResponse(BaseModel):
    connection_token: str
