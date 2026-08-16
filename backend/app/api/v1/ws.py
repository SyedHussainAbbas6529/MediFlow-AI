import json
import asyncio
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws/notifications")
async def websocket_notifications_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send welcome handshake
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "message": "Connected to MediFlow AI Real-Time Event Stream"
        }))
        while True:
            data = await websocket.receive_text()
            # Echo or heartbeat
            await websocket.send_text(json.dumps({"type": "pong", "payload": data}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
