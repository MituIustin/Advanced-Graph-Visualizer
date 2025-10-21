from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal
from models import Node, Edge
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/nodes")
def get_nodes(db: Session = Depends(get_db)):
    nodes = db.query(Node).all()
    return [{"id": n.id, "label": n.label} for n in nodes]

@app.post("/add_node")
def add_node(label: str, db: Session = Depends(get_db)):
    node = Node(label=label)
    db.add(node)
    db.commit()
    db.refresh(node)
    return {"id": node.id, "label": node.label}

@app.post("/add_edge")
def add_edge(source_id: int, target_id: int, db: Session = Depends(get_db)):
    edge = Edge(source_id=source_id, target_id=target_id)
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return {"id": edge.id, "source_id": edge.source_id, "target_id": edge.target_id}

@app.get("/edges")
def get_edges(db: Session = Depends(get_db)):
    edges = db.query(Edge).all()
    return [{"id": e.id, "source_id": e.source_id, "target_id": e.target_id} for e in edges]

@app.delete("/delete_node/{node_id}")
def delete_node(node_id: int, db: Session = Depends(get_db)):
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        return {"error": "Node not found"}
    db.delete(node)
    db.commit()
    return {"message": f"Node {node_id} deleted"}

@app.delete("/delete_edge/{edge_id}")
def delete_edge(edge_id: int, db: Session = Depends(get_db)):
    edge = db.query(Edge).filter(Edge.id == edge_id).first()
    if not edge:
        return {"error": "Edge not found"}
    db.delete(edge)
    db.commit()
    return {"message": f"Edge {edge_id} deleted"}
