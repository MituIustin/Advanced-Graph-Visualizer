from typing import Dict, List
from collections import deque

from app.schemas.algorithm import (
  AlgorithmRunRequest,
  StepHighlight,
)

def fake_bfs(req: AlgorithmRunRequest) -> List[StepHighlight]:
    nodes = [n.id for n in req.nodes]
    edges = req.edges

    if not nodes:
        return []

    # we will need to receive this from the frontend
    start = req.start_node_id or nodes[0]

    # adjacency list
    adj: Dict[int, List[tuple[int, int]]] = {n: [] for n in nodes}
    for e in edges:
        adj[e.from_node].append((e.to_node, e.id))
        if req.graph_type == "undirected":
            adj[e.to_node].append((e.from_node, e.id))

    visited_nodes: set[int] = set()
    visited_edges: set[int] = set()
    q = deque([start])
    visited_nodes.add(start)

    steps: List[StepHighlight] = []
    step_index = 0

    # first step: highlight start
    steps.append(
        StepHighlight(
            step_index=step_index,
            total_steps=0,
            algorithm=req.algorithm,
            description=f"Start BFS at node {start}",
            highlight_nodes=[start],
            highlight_edges=[],
            visited_nodes=sorted(visited_nodes),
            visited_edges=sorted(visited_edges),
        )
    )
    step_index += 1

    while q:
        u = q.popleft()

        # step: visit u
        steps.append(
            StepHighlight(
                step_index=step_index,
                total_steps=0,
                algorithm=req.algorithm,
                description=f"Visit node {u}",
                highlight_nodes=[u],
                highlight_edges=[],
                visited_nodes=sorted(visited_nodes),
                visited_edges=sorted(visited_edges),
            )
        )
        step_index += 1

        for v, edge_id in adj.get(u, []):
            if v not in visited_nodes:
                visited_nodes.add(v)
                visited_edges.add(edge_id)
                q.append(v)

                steps.append(
                    StepHighlight(
                        step_index=step_index,
                        total_steps=0,
                        algorithm=req.algorithm,
                        description=f"Discovered node {v} from {u}",
                        highlight_nodes=[u, v],
                        highlight_edges=[edge_id],
                        visited_nodes=sorted(visited_nodes),
                        visited_edges=sorted(visited_edges),
                    )
                )
                step_index += 1

    total = len(steps)
    for i, s in enumerate(steps):
        s.step_index = i
        s.total_steps = total

    return steps