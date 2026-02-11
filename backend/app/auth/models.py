import enum

from sqlalchemy import (
    Boolean,
    Column,
    Enum,
    ForeignKey,
    Integer,
    String,
    Table,
)
from sqlalchemy.orm import relationship

from database import Base


class UserRole(enum.Enum):
    ADMIN = "admin"
    RIFAT_BHAI = "rifat-bhai"
    USER = "user"


role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id")),
    Column("permission_id", Integer, ForeignKey("permissions.id")),
)


class RolePermission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Enum(UserRole), unique=True, index=True, nullable=False)
    permissions = relationship(
        "RolePermission", secondary=role_permissions, backref="roles"
    )
    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    telegram_chat_id = Column(String, unique=True, nullable=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"))
    role = relationship("Role", back_populates="users")
    
    @property
    def user_role(self) -> UserRole:
        if self.role:
            return self.role.name
        return UserRole.USER

    # Learning progress relationships
    progress = relationship("UserProgress", back_populates="user")
    question_history = relationship("QuestionHistory", back_populates="user")
    quiz_sessions = relationship("QuizSession", back_populates="user")
    telegram_user = relationship("TelegramUser", back_populates="user", uselist=False, lazy="select")