"""studio_templates: sample data the studio builder starts from

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-21
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "studio_templates",
        sa.Column("slug", sa.String(80), primary_key=True),
        sa.Column("draft", postgresql.JSONB(), nullable=False),
        sa.Column("account", postgresql.JSONB(), server_default="{}", nullable=False),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.execute("alter table studio_templates enable row level security")


def downgrade() -> None:
    op.drop_table("studio_templates")
