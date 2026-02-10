"""make the role name enum enforced

Revision ID: d975f7a0652c
Revises: f25426ae9ac3
Create Date: 2026-02-10 21:37:43.774027

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd975f7a0652c'
down_revision: Union[str, Sequence[str], None] = 'f25426ae9ac3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Explicitly create the enum type first
    op.execute("CREATE TYPE userrole AS ENUM ('ADMIN', 'RIFAT_BHAI', 'USER')")
    
    # Then alter the column
    op.alter_column('roles', 'name',
               existing_type=sa.VARCHAR(),
               type_=sa.Enum('ADMIN', 'RIFAT_BHAI', 'USER', name='userrole', create_type=False),
               nullable=False,
               postgresql_using='name::text::userrole')


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('roles', 'name',
               existing_type=sa.Enum('ADMIN', 'RIFAT_BHAI', 'USER', name='userrole'),
               type_=sa.VARCHAR(),
               nullable=True)
    
    # Drop the enum type
    op.execute("DROP TYPE userrole")
    # ### end Alembic commands ###
