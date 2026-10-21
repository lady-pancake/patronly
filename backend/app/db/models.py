import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

AVAILABILITY = ("Open", "Waitlist", "Closed")


class Base(DeclarativeBase):
    pass


class Artist(Base):
    """A studio on Patronly: who the artist is, what they make and what it costs."""

    __tablename__ = "artists"
    __table_args__ = (
        CheckConstraint(
            "availability in ('Open', 'Waitlist', 'Closed')", name="artists_availability_check"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Short id used in URLs, e.g. /artists/maren.
    slug: Mapped[str | None] = mapped_column(String(80), unique=True)
    # Order the catalogue was seeded in; browse lists sort by it before likes.
    position: Mapped[int] = mapped_column(Integer, server_default="0")
    display_name: Mapped[str] = mapped_column(String(120))
    studio: Mapped[str] = mapped_column(String(160), server_default="")
    medium: Mapped[str] = mapped_column(String(60), server_default="", index=True)
    city: Mapped[str] = mapped_column(String(120), server_default="")
    price_min: Mapped[int] = mapped_column(Integer, server_default="0")
    price_max: Mapped[int] = mapped_column(Integer, server_default="0")
    commissions: Mapped[int] = mapped_column(Integer, server_default="0")
    likes: Mapped[int] = mapped_column(Integer, server_default="0")
    # Hue and chroma for colour placeholders when a work has no image.
    hue: Mapped[int] = mapped_column(Integer, server_default="60")
    chroma: Mapped[float] = mapped_column(Float, server_default="0.08")
    site: Mapped[str] = mapped_column(String(200), server_default="")
    reply_note: Mapped[str] = mapped_column(String(200), server_default="")
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default="{}")
    quote: Mapped[str] = mapped_column(Text, server_default="")
    # Paragraphs separated by a blank line.
    bio: Mapped[str | None] = mapped_column(Text)
    availability: Mapped[str] = mapped_column(String(10), server_default="Open")
    cover_url: Mapped[str | None] = mapped_column(Text)
    portrait_url: Mapped[str | None] = mapped_column(Text)
    process_url: Mapped[str | None] = mapped_column(Text)
    process_video_url: Mapped[str | None] = mapped_column(Text)
    cover_video_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    works: Mapped[list["Work"]] = relationship(
        back_populates="artist",
        order_by="Work.position",
        cascade="all, delete-orphan",
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="artist",
        order_by="Review.position",
        cascade="all, delete-orphan",
    )


class Work(Base):
    """A finished piece shown on an artist's studio page."""

    __tablename__ = "works"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("artists.id", ondelete="CASCADE"), index=True
    )
    position: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(200))
    material: Mapped[str] = mapped_column(String(200), server_default="")
    image_url: Mapped[str | None] = mapped_column(Text)

    artist: Mapped[Artist] = relationship(back_populates="works")


class Review(Base):
    """A patron's quote about a finished commission."""

    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("artists.id", ondelete="CASCADE"), index=True
    )
    position: Mapped[int] = mapped_column(Integer)
    quote: Mapped[str] = mapped_column(Text)
    author: Mapped[str] = mapped_column(String(200))

    artist: Mapped[Artist] = relationship(back_populates="reviews")


class Guest(Base):
    """One visit through the portfolio password gate: who came and when.

    Nothing else a guest does is stored; favourites and messages stay in their browser tab.
    """

    __tablename__ = "guests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120))
    user_agent: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
