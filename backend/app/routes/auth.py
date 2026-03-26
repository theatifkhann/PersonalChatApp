from typing import Annotated

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends, HTTPException, status

from ..database import get_db
from ..db_models import User
from ..dependencies import get_bearer_token, get_current_user
from ..models import AuthResponse, LoginRequest, PublicUser, SignupRequest
from ..security import create_session, hash_password, revoke_session, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _serialize_user(user: User) -> PublicUser:
    return PublicUser(
        user_id=user.id,
        email=user.email or "",
        username=user.username,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing_email = db.scalar(select(User).where(func.lower(User.email) == payload.email))
    if existing_email is not None:
        raise HTTPException(status_code=409, detail="Email is already registered.")

    existing_username = db.scalar(select(User).where(func.lower(User.username) == payload.username))
    if existing_username is not None:
        raise HTTPException(status_code=409, detail="Username is already taken.")

    user = User(
        email=payload.email,
        username=payload.username,
        avatar_url=payload.avatar_url,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_session(db, user)
    db.refresh(user)
    return AuthResponse(token=token, user=_serialize_user(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_session(db, user)
    db.refresh(user)
    return AuthResponse(token=token, user=_serialize_user(user))


@router.get("/me", response_model=PublicUser)
def me(current_user: User = Depends(get_current_user)) -> PublicUser:
    return _serialize_user(current_user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    token: Annotated[str, Depends(get_bearer_token)],
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    revoke_session(db, token)
