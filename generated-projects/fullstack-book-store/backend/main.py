from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Set

from backend.database import SessionLocal, engine, Base
from backend.models import User, Workspace, Task
from backend.schemas import (
    UserCreate, UserResponse, UserLogin,
    WorkspaceCreate, WorkspaceResponse,
    TaskCreate, TaskUpdate, TaskResponse
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SaaS Task Management App",
    description="Task management app with user authentication, team workspaces, kanban board, and real-time WebSocket updates.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Real-time WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Authentication Endpoints
@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Auth"])
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(email=user.email, username=user.username, password_hash=user.password) # In production hash password
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=UserResponse, tags=["Auth"])
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or user.password_hash != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user


# Team Workspaces Endpoints
@app.post("/api/workspaces", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED, tags=["Workspaces"])
def create_workspace(workspace: WorkspaceCreate, db: Session = Depends(get_db)):
    new_ws = Workspace(name=workspace.name, owner_id=workspace.owner_id)
    db.add(new_ws)
    db.commit()
    db.refresh(new_ws)
    return new_ws

@app.get("/api/workspaces", response_model=List[WorkspaceResponse], tags=["Workspaces"])
def list_workspaces(db: Session = Depends(get_db)):
    return db.query(Workspace).all()


# Kanban Board & Tasks Endpoints
@app.post("/api/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
async def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(
        title=task.title,
        description=task.description,
        status=task.status,
        workspace_id=task.workspace_id,
        assignee_id=task.assignee_id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    await manager.broadcast({"event": "TASK_CREATED", "data": {"id": new_task.id, "title": new_task.title, "status": new_task.status, "workspace_id": new_task.workspace_id}})
    return new_task

@app.get("/api/workspaces/{workspace_id}/tasks", response_model=List[TaskResponse], tags=["Tasks"])
def get_workspace_tasks(workspace_id: int, db: Session = Depends(get_db)):
    return db.query(Task).filter(Task.workspace_id == workspace_id).all()

@app.put("/api/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
async def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    
    await manager.broadcast({"event": "TASK_UPDATED", "data": {"id": db_task.id, "title": db_task.title, "status": db_task.status, "workspace_id": db_task.workspace_id}})
    return db_task

@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Tasks"])
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    ws_id = db_task.workspace_id
    db.delete(db_task)
    db.commit()
    
    await manager.broadcast({"event": "TASK_DELETED", "data": {"id": task_id, "workspace_id": ws_id}})
    return None


# Real-time WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process incoming ws ping/messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Mount static assets if public directory exists
app.mount("/", StaticFiles(directory="public", html=True), name="public")