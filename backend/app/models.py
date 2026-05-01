import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


USERNAME_PATTERN = re.compile(r"^[a-z0-9_]{3,24}$")


class SignupRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    username: str = Field(..., min_length=3, max_length=24)
    password: str = Field(..., min_length=8, max_length=128)
    avatar_url: str | None = Field(default=None, max_length=2_000_000)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned_value = value.strip()
        if "@" not in cleaned_value or cleaned_value.startswith("@") or cleaned_value.endswith("@"):
            raise ValueError("Enter a valid email address.")
        local_part, _, domain = cleaned_value.partition("@")
        if "." not in domain or not local_part:
            raise ValueError("Enter a valid email address.")
        return cleaned_value.casefold()

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        cleaned_value = value.strip().casefold()
        if not USERNAME_PATTERN.fullmatch(cleaned_value):
            raise ValueError("Username must be 3-24 chars using lowercase letters, numbers, or underscores.")
        return cleaned_value

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, value: str | None) -> str | None:
        if value is None:
            return None

        cleaned_value = value.strip()
        if not cleaned_value:
            return None

        if cleaned_value.startswith(("http://", "https://")):
            return cleaned_value

        if cleaned_value.startswith("data:image/") and ";base64," in cleaned_value:
            return cleaned_value

        raise ValueError("Avatar must be an http/https URL or a picked image.")
        return cleaned_value


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned_value = value.strip()
        if "@" not in cleaned_value or cleaned_value.startswith("@") or cleaned_value.endswith("@"):
            raise ValueError("Enter a valid email address.")
        return cleaned_value.casefold()


class PublicUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    email: str
    username: str
    avatar_url: str | None = None
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: PublicUser


class ChatInboundMessage(BaseModel):
    receiver_id: int = Field(..., ge=1)
    message: str = Field(..., min_length=1, max_length=1000)
    client_message_id: str | None = Field(default=None, max_length=128)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        cleaned_value = value.strip()
        if not cleaned_value:
            raise ValueError("Message cannot be blank.")
        return cleaned_value


class ChatOutboundMessage(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    sender_id: int
    receiver_id: int
    message: str
    created_at: datetime | None = None
    delivered_at: datetime | None = None
    read_at: datetime | None = None


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    username: str
    avatar_url: str | None = None
    created_at: datetime


class UserSearchResult(UserSummary):
    relationship: str
    request_id: int | None = None


class FriendRequestCreate(BaseModel):
    receiver_id: int = Field(..., ge=1)


class FriendRequestSummary(BaseModel):
    request_id: int
    direction: str
    status: str
    created_at: datetime
    user: UserSummary


class ContactsResponse(BaseModel):
    friends: list[UserSummary]
    incoming_requests: list[FriendRequestSummary]
    outgoing_requests: list[FriendRequestSummary]
    discoverable_users: list[UserSummary]
