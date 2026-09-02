from tinydb import Query

from database import password_reset_tokens_table, users_table, profiles_table


User = Query()
Profile = Query()
PasswordResetToken = Query()


def get_user_by_id(user_id: str):
    return users_table.get(
        User.id == user_id
    )


def get_user_by_email(email: str):
    return users_table.get(
        User.email == email
    )


def get_all_users():
    return users_table.all()


def create_user(user: dict, profile: dict):
    users_table.insert(user)
    profiles_table.insert(profile)

    return user


def update_user(user_id: str, changes: dict):
    users_table.update(
        changes,
        User.id == user_id
    )

    return get_user_by_id(user_id)


def create_password_reset_token(token: dict):
    password_reset_tokens_table.insert(token)

    return token


def get_password_reset_token(token_id: str):
    return password_reset_tokens_table.get(
        PasswordResetToken.id == token_id
    )


def mark_password_reset_token_used(token_id: str, used_at: str):
    password_reset_tokens_table.update(
        {"used_at": used_at},
        PasswordResetToken.id == token_id
    )

    return get_password_reset_token(token_id)


def delete_user(user_id: str):
    users_table.remove(
        User.id == user_id
    )

    profiles_table.remove(
        Profile.user_id == user_id
    )


def get_profile_by_user_id(user_id: str):
    return profiles_table.get(
        Profile.user_id == user_id
    )


def update_profile(user_id: str, changes: dict):
    profiles_table.update(
        changes,
        Profile.user_id == user_id
    )

    return get_profile_by_user_id(user_id)
