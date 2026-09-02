import os
from email.utils import parseaddr
from datetime import datetime, timedelta, timezone
from urllib import error, request
import json
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.hash import bcrypt
from pydantic import BaseModel, Field

from services import (
    create_password_reset_token,
    get_profile_by_user_id,
    get_password_reset_token,
    get_user_by_email,
    get_user_by_id,
    mark_password_reset_token_used,
    update_user
)


load_dotenv()


router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", "30")
)
PASSWORD_RESET_URL = os.getenv(
    "PASSWORD_RESET_URL",
    "http://localhost:3000/reset-password"
)
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Trackflow <no-reply@trackflow.local>")


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3)


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


def create_access_token(user_id: str):
    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "exp": expiration
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=ALGORITHM
    )


def create_password_reset_jwt(user_id: str, token_id: str, expiration: datetime):
    payload = {
        "sub": user_id,
        "jti": token_id,
        "purpose": "password_reset",
        "exp": expiration
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=ALGORITHM
    )


def reset_link(token: str):
    return f"{PASSWORD_RESET_URL}?token={token}"


def send_password_reset_email(email: str, link: str):
    if not RESEND_API_KEY:
        print(f"Password reset link for {email}: {link}")
        return

    _, from_email = parseaddr(RESEND_FROM_EMAIL)
    if not from_email:
        raise HTTPException(
            status_code=500,
            detail="RESEND_FROM_EMAIL no es válido"
        )

    payload = {
        "from": RESEND_FROM_EMAIL,
        "to": [email],
        "subject": "Restablece tu contraseña de Trackflow",
        "html": (
            "<p>Recibimos una solicitud para restablecer tu contraseña.</p>"
            f"<p><a href=\"{link}\">Restablecer contraseña</a></p>"
            "<p>Este enlace expira pronto. Si no solicitaste este cambio, puedes ignorar este email.</p>"
        ),
        "text": (
            "Recibimos una solicitud para restablecer tu contraseña.\n\n"
            f"Abre este enlace para continuar: {link}\n\n"
            "Este enlace expira pronto. Si no solicitaste este cambio, puedes ignorar este email."
        )
    }

    resend_request = request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Trackflow/1.0"
        },
        method="POST"
    )

    try:
        with request.urlopen(resend_request, timeout=10) as response:
            if response.status >= 400:
                raise HTTPException(
                    status_code=502,
                    detail="No fue posible enviar el email de restablecimiento"
                )
    except error.HTTPError as exc:
        provider_detail = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(
            status_code=502,
            detail=f"Resend rechazó el email: {provider_detail}"
        ) from exc
    except error.URLError as exc:
        raise HTTPException(
            status_code=502,
            detail="No fue posible enviar el email de restablecimiento"
        ) from exc


def decode_password_reset_token(token: str):
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            status_code=400,
            detail="Token inválido o expirado"
        )

    if payload.get("purpose") != "password_reset":
        raise HTTPException(
            status_code=400,
            detail="Token inválido o expirado"
        )

    token_id = payload.get("jti")
    user_id = payload.get("sub")

    if not token_id or not user_id:
        raise HTTPException(
            status_code=400,
            detail="Token inválido o expirado"
        )

    reset_token = get_password_reset_token(token_id)

    if (
        not reset_token
        or reset_token.get("user_id") != user_id
        or reset_token.get("used_at") is not None
    ):
        raise HTTPException(
            status_code=400,
            detail="Token inválido o expirado"
        )

    expires_at = datetime.fromisoformat(reset_token["expires_at"])
    if expires_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400,
            detail="Token inválido o expirado"
        )

    return reset_token


def get_current_user(
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        user = get_user_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Usuario no válido"
            )

        return user

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )


@router.post("/login")
def login(
    form: OAuth2PasswordRequestForm = Depends()
):
    # Swagger llama "username" al campo.
    # Nosotros usamos ese campo para enviar el email.

    user = get_user_by_email(form.username)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos"
        )

    if not bcrypt.verify(
        form.password,
        user["hashed_password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos"
        )

    token = create_access_token(
        user["id"]
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    email = data.email.strip().lower()
    user = get_user_by_email(email)

    if user:
        token_id = str(uuid4())
        expiration = datetime.now(timezone.utc) + timedelta(
            minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
        )
        token = create_password_reset_jwt(
            user["id"],
            token_id,
            expiration
        )

        create_password_reset_token({
            "id": token_id,
            "user_id": user["id"],
            "expires_at": expiration.isoformat(),
            "used_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        try:
            send_password_reset_email(
                user["email"],
                reset_link(token)
            )
        except HTTPException as exc:
            print(f"Password reset email failed for {user['email']}: {exc.detail}")

    return {
        "message": "Si esa dirección está registrada, recibirás un enlace en breve."
    }


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    reset_token = decode_password_reset_token(data.token)
    user = get_user_by_id(reset_token["user_id"])

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Token inválido o expirado"
        )

    update_user(
        user["id"],
        {"hashed_password": bcrypt.hash(data.new_password)}
    )
    mark_password_reset_token_used(
        reset_token["id"],
        datetime.now(timezone.utc).isoformat()
    )

    return {
        "message": "Contraseña actualizada."
    }


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    if not bcrypt.verify(
        data.current_password,
        current_user["hashed_password"]
    ):
        raise HTTPException(
            status_code=400,
            detail="La contraseña actual es incorrecta"
        )

    update_user(
        current_user["id"],
        {"hashed_password": bcrypt.hash(data.new_password)}
    )

    return {
        "message": "Contraseña actualizada."
    }


@router.get("/me")
def get_me(
    current_user: dict = Depends(get_current_user)
):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "role": current_user["role"],
        "profile": get_profile_by_user_id(
            current_user["id"]
        )
    }
