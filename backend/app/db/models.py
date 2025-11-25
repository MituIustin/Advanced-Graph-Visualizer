# from sqlalchemy.orm import DeclarativeBase, relationship, Mapped, mapped_column
# from sqlalchemy import String, Integer, ForeignKey, Boolean, Text


# class User(Base):
#     __tablename__ = "users"

#     id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
#     email: Mapped[str] = mapped_column(String, unique=True, index=True)
#     hashed_password: Mapped[str] = mapped_column(String)

#     graphs: Mapped[list["Graph"]] = relationship("Graph", back_populates="owner")


"""
    Here we will implement all entities from the data base.
"""