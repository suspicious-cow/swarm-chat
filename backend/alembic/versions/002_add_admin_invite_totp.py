"""Add server admin, invite codes, and TOTP fields

Revision ID: 002_add_admin_invite_totp
Revises: 001_add_accounts
Create Date: 2026-02-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "002_add_admin_invite_totp"
down_revision = "001_add_accounts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to accounts
    op.add_column("accounts", sa.Column("is_server_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("accounts", sa.Column("totp_secret", sa.String(32), nullable=True))

    # Create invite_codes table
    op.create_table(
        "invite_codes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(20), unique=True, nullable=False, index=True),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("use_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Update account_id FK on users to add ondelete="SET NULL"
    op.drop_constraint("users_account_id_fkey", "users", type_="foreignkey")
    op.create_foreign_key(
        "users_account_id_fkey", "users", "accounts",
        ["account_id"], ["id"], ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("users_account_id_fkey", "users", type_="foreignkey")
    op.create_foreign_key(
        "users_account_id_fkey", "users", "accounts",
        ["account_id"], ["id"],
    )
    op.drop_table("invite_codes")
    op.drop_column("accounts", "totp_secret")
    op.drop_column("accounts", "is_server_admin")
