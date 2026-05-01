from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from pydantic import ValidationError
from sqlalchemy.orm import Session

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .database import SessionLocal, check_database_connection, engine, init_db
from .db_models import Message, User
from .models import ChatInboundMessage, ChatOutboundMessage
from .security import get_user_for_token
from .routes.auth import router as auth_router
from .routes.chat import accepted_friend_ids, are_friends, router as chat_router
from .websocket import manager


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Chat App API", lifespan=lifespan)


def _get_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ALLOW_ORIGINS", "*")
    if raw_origins.strip() == "*":
        return ["*"]

    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


cors_origins = _get_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(chat_router)


def _serialize_message(message: Message) -> ChatOutboundMessage:
    return ChatOutboundMessage(
        id=message.id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        message=message.body,
        created_at=message.created_at,
        delivered_at=message.delivered_at,
        read_at=message.read_at,
    )


def _message_payload(message: ChatOutboundMessage) -> dict[str, object]:
    return message.model_dump(mode="json")


def _message_event_payload(
    message: ChatOutboundMessage,
    *,
    event_type: str = "message",
    client_message_id: str | None = None,
) -> dict[str, object]:
    return {
        "type": event_type,
        "client_message_id": client_message_id,
        "message": _message_payload(message),
    }


def _store_message(
    db: Session,
    sender_id: int,
    receiver_id: int,
    body: str,
    delivered: bool,
) -> Message:
    stored_message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        body=body,
        delivered_at=datetime.now(timezone.utc) if delivered else None,
    )
    db.add(stored_message)
    db.commit()
    db.refresh(stored_message)
    return stored_message


def _deliver_pending_messages(user_id: int) -> list[ChatOutboundMessage]:
    with SessionLocal() as db:
        pending_messages = (
            db.query(Message)
            .filter(Message.receiver_id == user_id, Message.delivered_at.is_(None))
            .order_by(Message.created_at.asc(), Message.id.asc())
            .all()
        )

        delivered_messages: list[ChatOutboundMessage] = []
        delivered_at = datetime.now(timezone.utc)
        for pending_message in pending_messages:
            pending_message.delivered_at = delivered_at
            delivered_messages.append(_serialize_message(pending_message))

        if pending_messages:
            db.commit()

        return delivered_messages


def _get_user(user_id: int) -> User | None:
    with SessionLocal() as db:
        return db.get(User, user_id)


def _get_user_from_token(token: str | None) -> User | None:
    with SessionLocal() as db:
        return get_user_for_token(db, token)


def _get_friend_ids(user_id: int) -> set[int]:
    with SessionLocal() as db:
        return accepted_friend_ids(db, user_id)


async def _broadcast_presence(user_id: int, online: bool) -> None:
    friend_ids = _get_friend_ids(user_id)
    await manager.send_to_many(
        friend_ids,
        {
            "type": "presence",
            "user_id": user_id,
            "online": online,
        },
    )


@app.get("/")
def home() -> dict[str, object]:
    return {
        "message": "Chat server running",
        "status": "ok",
        "database": engine.url.get_backend_name(),
    }


@app.get("/health")
def health() -> dict[str, object]:
    try:
        check_database_connection()
        database_status = "ok"
    except Exception:
        database_status = "error"

    return {
        "status": "ok" if database_status == "ok" else "degraded",
        "active_connections": manager.connection_count,
        "database": database_status,
    }


@app.websocket("/ws/{user_id}")
async def chat(websocket: WebSocket, user_id: int, token: str | None = None) -> None:
    token_user = _get_user_from_token(token)
    if token_user is None or token_user.id != user_id:
        await websocket.close(code=1008, reason="Invalid or expired session.")
        return

    await manager.connect(user_id, websocket)
    friend_ids = _get_friend_ids(user_id)
    for friend_id in manager.connected_user_ids(friend_ids):
        await websocket.send_json(
            {
                "type": "presence",
                "user_id": friend_id,
                "online": True,
            }
        )
    await _broadcast_presence(user_id, True)

    for pending_message in _deliver_pending_messages(user_id):
        await websocket.send_json(_message_event_payload(pending_message))
        await manager.send_to(
            pending_message.sender_id,
            _message_event_payload(pending_message, event_type="message_ack"),
        )

    try:
        while True:
            payload = await websocket.receive_json()

            try:
                message = ChatInboundMessage.model_validate(payload)
            except ValidationError as exc:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": exc.errors()[0]["msg"],
                    }
                )
                continue

            with SessionLocal() as db:
                receiver = db.get(User, message.receiver_id)
                if receiver is None:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": f"User {message.receiver_id} does not exist.",
                        }
                    )
                    continue
                if not are_friends(db, user_id, message.receiver_id):
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": "You can only message accepted friends.",
                        }
                    )
                    continue

                delivered = manager.is_connected(message.receiver_id)
                stored_message = _store_message(
                    db=db,
                    sender_id=user_id,
                    receiver_id=message.receiver_id,
                    body=message.message,
                    delivered=delivered,
                )
                outbound_message = _serialize_message(stored_message)

            await websocket.send_json(
                _message_event_payload(
                    outbound_message,
                    event_type="message_ack",
                    client_message_id=message.client_message_id,
                )
            )

            if delivered:
                await manager.send_to(message.receiver_id, _message_event_payload(outbound_message))

            if not delivered:
                await websocket.send_json(
                    {
                        "type": "system",
                        "message": f"User {message.receiver_id} is offline. Message stored for delivery.",
                    }
                )
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(user_id)
        await _broadcast_presence(user_id, False)
