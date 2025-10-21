from sqlalchemy import Column, Integer, String, ForeignKey, Float
from database import Base

class Node(Base):
    __tablename__ = "nodes"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, unique=True, index=True)
    x = Column(Float, default=200) 
    y = Column(Float, default=200)

class Edge(Base):
    __tablename__ = "edges"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("nodes.id"))
    target_id = Column(Integer, ForeignKey("nodes.id"))
