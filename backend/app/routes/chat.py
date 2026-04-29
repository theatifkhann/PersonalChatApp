from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..db_models import FriendshipRequest, Message, User
from ..models import (
    ChatOutboundMessage,
    ContactsResponse,
    FriendRequestCreate,
    FriendRequestSummary,
    UserSearchResult,
    UserSummary,
)

router = APIRouter(prefix="/chat", tags=["chat"])

PENDING_STATUS = "pending"
ACCEPTED_STATUS = "accepted"


def _serialize_user(user: User) -> UserSummary:
    return UserSummary(
        user_id=user.id,
        username=user.username,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
    )


def _serialize_search_result(
    user: User,
    *,
    relationship: str,
    request_id: int | None = None,
) -> UserSearchResult:
    return UserSearchResult(
        user_id=user.id,
        username=user.username,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        relationship=relationship,
        request_id=request_id,
    )


def _serialize_message(message: Message) -> ChatOutboundMessage:
    return ChatOutboundMessage(
        id=message.id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        message=message.body,
        created_at=message.created_at,
        delivered_at=message.delivered_at,
    )


def _serialize_friend_request(
    friendship_request: FriendshipRequest,
    *,
    direction: str,
    user: User,
) -> FriendRequestSummary:
    return FriendRequestSummary(
        request_id=friendship_request.id,
        direction=direction,
        status=friendship_request.status,
        created_at=friendship_request.created_at,
        user=_serialize_user(user),
    )


def are_friends(db: Session, user_id: int, peer_id: int) -> bool:
    statement = select(FriendshipRequest).where(
        FriendshipRequest.status == ACCEPTED_STATUS,
        or_(
            and_(
                FriendshipRequest.requester_id == user_id,
                FriendshipRequest.receiver_id == peer_id,
            ),
            and_(
                FriendshipRequest.requester_id == peer_id,
                FriendshipRequest.receiver_id == user_id,
            ),
        ),
    )
    return db.scalar(statement) is not None


def _friendship_by_user_id(
    db: Session,
    current_user_id: int,
    user_ids: list[int],
) -> dict[int, FriendshipRequest]:
    if not user_ids:
        return {}

    friendship_requests = db.scalars(
        select(FriendshipRequest).where(
            or_(
                and_(
                    FriendshipRequest.requester_id == current_user_id,
                    FriendshipRequest.receiver_id.in_(user_ids),
                ),
                and_(
                    FriendshipRequest.receiver_id == current_user_id,
                    FriendshipRequest.requester_id.in_(user_ids),
                ),
            )
        )
    ).all()

    return {
        (
            friendship_request.receiver_id
            if friendship_request.requester_id == current_user_id
            else friendship_request.requester_id
        ): friendship_request
        for friendship_request in friendship_requests
    }


def _relationship_for_request(
    friendship_request: FriendshipRequest | None,
    current_user_id: int,
) -> str:
    if friendship_request is None:
        return "discoverable"
    if friendship_request.status == ACCEPTED_STATUS:
        return "friend"
    if friendship_request.status == PENDING_STATUS:
        return (
            "incoming"
            if friendship_request.receiver_id == current_user_id
            else "outgoing"
        )
    return friendship_request.status


def _build_contacts_response(db: Session, current_user: User) -> ContactsResponse:
    friendship_requests = db.scalars(
        select(FriendshipRequest).where(
            or_(
                FriendshipRequest.requester_id == current_user.id,
                FriendshipRequest.receiver_id == current_user.id,
            )
        )
    ).all()
    users = db.scalars(
        select(User).where(User.id != current_user.id).order_by(User.username.asc())
    ).all()
    users_by_id = {user.id: user for user in users}

    friend_ids: set[int] = set()
    incoming_requests: list[FriendRequestSummary] = []
    outgoing_requests: list[FriendRequestSummary] = []
    blocked_ids: set[int] = set()

    for friendship_request in friendship_requests:
        other_user_id = (
            friendship_request.receiver_id
            if friendship_request.requester_id == current_user.id
            else friendship_request.requester_id
        )
        other_user = users_by_id.get(other_user_id)
        if other_user is None:
            continue

        if friendship_request.status == ACCEPTED_STATUS:
            friend_ids.add(other_user_id)
            blocked_ids.add(other_user_id)
            continue

        if friendship_request.status != PENDING_STATUS:
            continue

        blocked_ids.add(other_user_id)
        if friendship_request.receiver_id == current_user.id:
            incoming_requests.append(
                _serialize_friend_request(
                    friendship_request,
                    direction="incoming",
                    user=other_user,
                )
            )
        else:
            outgoing_requests.append(
                _serialize_friend_request(
                    friendship_request,
                    direction="outgoing",
                    user=other_user,
                )
            )

    friends = [_serialize_user(users_by_id[user_id]) for user_id in sorted(friend_ids, key=lambda item: users_by_id[item].username)]
    discoverable_users = [
        _serialize_user(user)
        for user in users
        if user.id not in blocked_ids
    ]

    incoming_requests.sort(key=lambda item: (item.user.username, item.request_id))
    outgoing_requests.sort(key=lambda item: (item.user.username, item.request_id))

    return ContactsResponse(
        friends=friends,
        incoming_requests=incoming_requests,
        outgoing_requests=outgoing_requests,
        discoverable_users=discoverable_users,
    )


@router.get("/users", response_model=list[UserSummary])
def list_users(
    exclude_user_id: int | None = Query(default=None, ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserSummary]:
    contacts = _build_contacts_response(db, current_user)
    users = contacts.friends
    if exclude_user_id:
        users = [user for user in users if user.user_id != exclude_user_id]
    return users


@router.get("/users/search", response_model=list[UserSearchResult])
def search_users(
    username: str = Query(..., min_length=1, max_length=24),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserSearchResult]:
    normalized_username = username.strip().casefold()
    if not normalized_username:
        return []

    users = db.scalars(
        select(User)
        .where(
            User.id != current_user.id,
            User.username.ilike(f"%{normalized_username}%"),
        )
        .order_by(User.username.asc())
        .limit(limit)
    ).all()
    friendships_by_user_id = _friendship_by_user_id(
        db,
        current_user.id,
        [user.id for user in users],
    )

    return [
        _serialize_search_result(
            user,
            relationship=_relationship_for_request(
                friendships_by_user_id.get(user.id),
                current_user.id,
            ),
            request_id=friendships_by_user_id.get(user.id).id
            if friendships_by_user_id.get(user.id)
            else None,
        )
        for user in users
    ]


@router.get("/contacts", response_model=ContactsResponse)
def list_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ContactsResponse:
    return _build_contacts_response(db, current_user)


@router.post("/friend-requests", response_model=FriendRequestSummary, status_code=201)
def create_friend_request(
    payload: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FriendRequestSummary:
    if payload.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot add yourself.")

    receiver = db.get(User, payload.receiver_id)
    if receiver is None:
        raise HTTPException(status_code=404, detail="User not found.")

    existing_request = db.scalar(
        select(FriendshipRequest).where(
            or_(
                and_(
                    FriendshipRequest.requester_id == current_user.id,
                    FriendshipRequest.receiver_id == payload.receiver_id,
                ),
                and_(
                    FriendshipRequest.requester_id == payload.receiver_id,
                    FriendshipRequest.receiver_id == current_user.id,
                ),
            )
        )
    )

    if existing_request is not None:
        if existing_request.status == ACCEPTED_STATUS:
            raise HTTPException(status_code=409, detail="You are already friends.")
        if existing_request.receiver_id == current_user.id:
            raise HTTPException(
                status_code=409,
                detail="This user already sent you a friend request. Accept it first.",
            )
        raise HTTPException(status_code=409, detail="Friend request already sent.")

    friendship_request = FriendshipRequest(
        requester_id=current_user.id,
        receiver_id=payload.receiver_id,
        status=PENDING_STATUS,
    )
    db.add(friendship_request)
    db.commit()
    db.refresh(friendship_request)
    return _serialize_friend_request(friendship_request, direction="outgoing", user=receiver)


@router.post("/friend-requests/{request_id}/accept", response_model=FriendRequestSummary)
def accept_friend_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FriendRequestSummary:
    friendship_request = db.get(FriendshipRequest, request_id)
    if friendship_request is None:
        raise HTTPException(status_code=404, detail="Friend request not found.")

    if friendship_request.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="You cannot accept this friend request.")

    if friendship_request.status == ACCEPTED_STATUS:
        raise HTTPException(status_code=409, detail="Friend request already accepted.")

    friendship_request.status = ACCEPTED_STATUS
    friendship_request.responded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(friendship_request)

    requester = db.get(User, friendship_request.requester_id)
    if requester is None:
        raise HTTPException(status_code=404, detail="User not found.")

    return _serialize_friend_request(friendship_request, direction="incoming", user=requester)


@router.get("/messages", response_model=list[ChatOutboundMessage])
def list_messages(
    peer_id: int = Query(..., ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ChatOutboundMessage]:
    user_id = current_user.id
    user = db.get(User, user_id)
    peer = db.get(User, peer_id)
    if user is None or peer is None:
        raise HTTPException(status_code=404, detail="One or more users were not found.")
    if not are_friends(db, user_id, peer_id):
        raise HTTPException(status_code=403, detail="You can only message accepted friends.")

    statement = (
        select(Message)
        .where(
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == peer_id),
                and_(Message.sender_id == peer_id, Message.receiver_id == user_id),
            )
        )
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(limit)
    )

    messages = list(reversed(db.scalars(statement).all()))
    return [_serialize_message(message) for message in messages]
