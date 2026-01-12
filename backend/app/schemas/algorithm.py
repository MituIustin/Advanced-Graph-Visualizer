from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class GraphType(str, Enum):
    undirected = "undirected"
    directed = "directed"
    weighted = "weighted"

class AlgorithmName(str, Enum):
    bfs = "bfs"
    dfs = "dfs"
    dijkstra = "dijkstra"
    kruskal = "kruskal"
    prim = "prim"
    bellmanford = "bellmanford"

class Node(BaseModel):
    id: int

class Edge(BaseModel):
    id: int
    from_node: int
    to_node: int
    weight: Optional[float] = None

class AlgorithmRunRequest(BaseModel):
    algorithm: AlgorithmName
    graph_type: GraphType
    nodes: List[Node]
    edges: List[Edge]
    start_node_id: Optional[int] = None
    target_node_id: Optional[int] = None
    # + other parameters

class StepHighlight(BaseModel):
    step_index: int
    total_steps: int
    algorithm: AlgorithmName
    description: Optional[str] = None

    # current nodes / edges highlighted
    highlight_nodes: List[int] = []
    highlight_edges: List[int] = []

    # already highlighted nodes / edges
    visited_nodes: List[int] = []
    visited_edges: List[int] = []

class AlgorithmRunCreated(BaseModel):
    run_id: str
    algorithm: AlgorithmName
    total_steps: int

# Maybe we will delete this in the future
class AlgorithmRunInfo(BaseModel):
    run_id: str
    algorithm: AlgorithmName
    total_steps: int
    graph_type: GraphType
