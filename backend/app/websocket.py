from __future__ import annotations

from collections.abc import Mapping

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._active_connections: dict[int, WebSocket] = {}

    @property
    def connection_count(self) -> int:
        return len(self._active_connections)

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._active_connections[user_id] = websocket

    def disconnect(self, user_id: int) -> None:
        self._active_connections.pop(user_id, None)

    def is_connected(self, user_id: int) -> bool:
        return user_id in self._active_connections

    def connected_user_ids(self, user_ids: set[int]) -> set[int]:
        return user_ids.intersection(self._active_connections)

    async def send_to(self, user_id: int, payload: Mapping[str, object]) -> bool:
        websocket = self._active_connections.get(user_id)
        if websocket is None:
            return False

        await websocket.send_json(dict(payload))
        return True

    async def send_to_many(self, user_ids: set[int], payload: Mapping[str, object]) -> None:
        for user_id in user_ids:
            await self.send_to(user_id, payload)


manager = ConnectionManager()
