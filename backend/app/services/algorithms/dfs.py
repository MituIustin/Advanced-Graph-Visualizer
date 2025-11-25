from typing import Dict, List

from app.schemas.algorithm import (
  AlgorithmRunRequest,
  StepHighlight,
)

def fake_dfs(req: AlgorithmRunRequest) -> List[StepHighlight]:
    nodes = [n.id for n in req.nodes]
    edges = req.edges

    if not nodes:
        return []

    start = req.start_node_id or nodes[0]

    adj: Dict[int, List[tuple[int, int]]] = {n: [] for n in nodes}
    for e in edges:
        adj[e.from_node].append((e.to_node, e.id))
        if req.graph_type == "undirected":
            adj[e.to_node].append((e.from_node, e.id))

    visited_nodes: set[int] = set()
    visited_edges: set[int] = set()
    steps: List[StepHighlight] = []
    step_index = 0

    def push_step(
        description: str,
        highlight_nodes: List[int],
        highlight_edges: List[int],
    ):
        nonlocal step_index
        steps.append(
            StepHighlight(
                step_index=step_index,
                total_steps=0,
                algorithm=req.algorithm,
                description=description,
                highlight_nodes=highlight_nodes,
                highlight_edges=highlight_edges,
                visited_nodes=sorted(visited_nodes),
                visited_edges=sorted(visited_edges),
            )
        )
        step_index += 1

    def dfs(u: int, parent: int | None = None, via_edge_id: int | None = None):
        visited_nodes.add(u)

        if parent is None:
            push_step(f"Start DFS at node {u}", [u], [])
        else:
            if via_edge_id is not None:
                visited_edges.add(via_edge_id)
                push_step(
                    f"DFS goes from {parent} to {u}",
                    [parent, u],
                    [via_edge_id],
                )
            else:
                push_step(f"Visit node {u}", [u], [])

        for v, edge_id in adj.get(u, []):
            if v not in visited_nodes:
                dfs(v, u, edge_id)

    dfs(start)

    total = len(steps)
    for i, s in enumerate(steps):
        s.step_index = i
        s.total_steps = total

    return steps
