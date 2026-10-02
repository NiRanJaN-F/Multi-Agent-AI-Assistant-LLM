from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    completed: bool = False

class ItemCreate(ItemBase):
    workspace_id: Optional[int] = None
    status: Optional[str] = "todo"
    assigned_to: Optional[int] = None

class ItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    completed: Optional[bool] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None

class Item(ItemBase):
    id: int
    workspace_id: Optional[int] = None
    status: str = "todo"
    assigned_to: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class WorkspaceCreate(WorkspaceBase):
    pass

class Workspace(WorkspaceBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True