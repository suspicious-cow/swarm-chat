"""Add summary and final_convergence columns to sessions

Revision ID: 003_add_session_results_columns
Revises: 002_add_admin_invite_totp
Create Date: 2026-02-16
"""
from alembic import op
import sqlalchemy as sa

revision = "003_add_session_results_columns"
down_revision = "002_add_admin_invite_totp"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("sessions", sa.Column("summary", sa.Text(), nullable=True))
    op.add_column("sessions", sa.Column("final_convergence", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("sessions", "final_convergence")
    op.drop_column("sessions", "summary")
