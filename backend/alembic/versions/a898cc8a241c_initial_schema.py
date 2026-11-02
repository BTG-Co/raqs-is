"""initial schema

Revision ID: a898cc8a241c
Revises:
Create Date: 2026-11-02 13:54:37.474685

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a898cc8a241c"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

userrole = sa.Enum("ADMIN", "STAFF", name="userrole")
transactiontype = sa.Enum(
    "SALE", "PURCHASE", "ADJUSTMENT", "RETURN", name="transactiontype"
)


def upgrade() -> None:
    userrole.create(op.get_bind(), checkfirst=True)
    transactiontype.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("password", sa.String(), nullable=False),
        sa.Column("role", userrole, nullable=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "measurements",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("short_name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_measurements_id"), "measurements", ["id"], unique=False)

    op.create_table(
        "products",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("image", sa.String(), nullable=True),
        sa.Column("base_measurement_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["base_measurement_id"], ["measurements.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_products_id"), "products", ["id"], unique=False)

    op.create_table(
        "measurement_conversion",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("base_measurement_id", sa.UUID(), nullable=False),
        sa.Column("converted_measurement_id", sa.UUID(), nullable=False),
        sa.Column("base_measurement_to_converted_amount", sa.Float(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["base_measurement_id"], ["measurements.id"]),
        sa.ForeignKeyConstraint(["converted_measurement_id"], ["measurements.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_measurement_conversion_id"),
        "measurement_conversion",
        ["id"],
        unique=False,
    )

    op.create_table(
        "inventory",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("measurement_id", sa.UUID(), nullable=False),
        sa.Column("current_stock", sa.Float(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["measurement_id"], ["measurements.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_inventory_id"), "inventory", ["id"], unique=False)

    op.create_table(
        "transactions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("inventory_id", sa.UUID(), nullable=False),
        sa.Column("measurement_id", sa.UUID(), nullable=False),
        sa.Column("transaction_type", transactiontype, nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("unit_price", sa.Float(), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.Column("total_price", sa.Float(), nullable=False),
        sa.Column("is_approved", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["inventory_id"], ["inventory.id"]),
        sa.ForeignKeyConstraint(["measurement_id"], ["measurements.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_transactions_id"), "transactions", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_transactions_id"), table_name="transactions")
    op.drop_table("transactions")
    op.drop_index(op.f("ix_inventory_id"), table_name="inventory")
    op.drop_table("inventory")
    op.drop_index(op.f("ix_measurement_conversion_id"), table_name="measurement_conversion")
    op.drop_table("measurement_conversion")
    op.drop_index(op.f("ix_products_id"), table_name="products")
    op.drop_table("products")
    op.drop_index(op.f("ix_measurements_id"), table_name="measurements")
    op.drop_table("measurements")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
    transactiontype.drop(op.get_bind(), checkfirst=True)
    userrole.drop(op.get_bind(), checkfirst=True)
