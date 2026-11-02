"""Idempotent bootstrap: create an ADMIN user if that username does not exist.

Usage (from backend/):

    python -m app.scripts.create_admin --username arth_admin --password '...'

Or via env:

    ADMIN_USERNAME=arth_admin ADMIN_PASSWORD='...' python -m app.scripts.create_admin

Docker:

    docker compose exec backend python -m app.scripts.create_admin \\
      --username arth_admin --password '...'
"""

from __future__ import annotations

import argparse
import os
import sys

from sqlalchemy import select

import app.models  # noqa: F401
from app.db.session import SessionLocal
from app.models.enums import UserRole
from app.models.user import User
from app.utils.password import get_password_hash


def create_admin(username: str, password: str, name: str | None = None) -> str:
    session = SessionLocal()
    try:
        existing = session.scalar(select(User).where(User.username == username))
        if existing is not None:
            return f"skipped: user {username!r} already exists (id={existing.id}, role={existing.role})"

        user = User(
            username=username,
            password=get_password_hash(password),
            role=UserRole.ADMIN,
            name=name or username,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return f"created: ADMIN {username!r} (id={user.id})"
    finally:
        session.close()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Create the first ADMIN user (idempotent).")
    parser.add_argument(
        "--username",
        default=os.environ.get("ADMIN_USERNAME", "arth_admin"),
        help="Admin username (default: arth_admin or ADMIN_USERNAME)",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("ADMIN_PASSWORD"),
        help="Admin password (or set ADMIN_PASSWORD)",
    )
    parser.add_argument(
        "--name",
        default=os.environ.get("ADMIN_NAME"),
        help="Display name (optional)",
    )
    args = parser.parse_args(argv)

    if not args.password:
        print("error: password required via --password or ADMIN_PASSWORD", file=sys.stderr)
        return 1

    print(create_admin(args.username, args.password, args.name))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
