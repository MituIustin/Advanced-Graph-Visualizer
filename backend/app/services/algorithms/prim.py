from typing import Dict, List, Optional
import heapq

from app.schemas.algorithm import (
    AlgorithmRunRequest,
    StepHighlight,
)

def fake_prim(req: AlgorithmRunRequest) -> List[StepHighlight]:
    nodes = [n.id for n in req.nodes]
    edges = req.edges

    if not nodes:
        return []

    start = req.start_node_id or nodes[0]

    # Build adjacency list with weights
    adj: Dict[int, List[tuple[int, int, int]]] = {n: [] for n in nodes}
    for e in edges:
        adj[e.from_node].append((e.to_node, e.weight, e.id))
        # Prim's works on undirected graphs, so add both directions
        if req.graph_type != "directed":
            adj[e.to_node].append((e.from_node, e.weight, e.id))

    mst_nodes: set[int] = set()
    mst_edges: set[int] = set()
    steps: List[StepHighlight] = []
    step_index = 0

    # Priority queue: (weight, from_node, to_node, edge_id)
    pq: List[tuple[int, int, int, int]] = []

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
                visited_nodes=sorted(mst_nodes),
                visited_edges=sorted(mst_edges),
            )
        )
        step_index += 1

    # Start with the start node
    mst_nodes.add(start)
    push_step(
        f"Start Prim's algorithm from node {start}. Add to MST.",
        [start],
        []
    )

    # Add all edges from start node to priority queue
    for neighbor, weight, edge_id in adj.get(start, []):
        heapq.heappush(pq, (weight, start, neighbor, edge_id))
    
    if pq:
        push_step(
            f"Add all edges from node {start} to priority queue.",
            [start],
            []
        )

    total_weight = 0

    while pq and len(mst_nodes) < len(nodes):
        weight, from_node, to_node, edge_id = heapq.heappop(pq)

        # Skip if both nodes already in MST
        if to_node in mst_nodes:
            push_step(
                f"✗ Skip edge {edge_id}: {from_node} ↔ {to_node} (weight: {weight}) - would create cycle",
                [from_node, to_node],
                [edge_id]
            )
            continue

        # Add edge to MST
        mst_nodes.add(to_node)
        mst_edges.add(edge_id)
        total_weight += weight

        push_step(
            f"✓ Add edge {edge_id}: {from_node} ↔ {to_node} (weight: {weight}) to MST",
            [from_node, to_node],
            [edge_id]
        )

        # Add all edges from newly added node to priority queue
        for neighbor, w, eid in adj.get(to_node, []):
            if neighbor not in mst_nodes:
                heapq.heappush(pq, (w, to_node, neighbor, eid))

        if len(mst_nodes) < len(nodes):
            push_step(
                f"Add edges from node {to_node} to priority queue.",
                [to_node],
                []
            )

    # Check if MST is complete
    if len(mst_nodes) == len(nodes):
        push_step(
            f"MST complete! Total weight: {total_weight}",
            [],
            list(mst_edges)
        )
    else:
        unreachable = [n for n in nodes if n not in mst_nodes]
        push_step(
            f"MST incomplete. Unreachable nodes: {unreachable}",
            list(mst_nodes),
            list(mst_edges)
        )

    total = len(steps)
    for i, s in enumerate(steps):
        s.step_index = i
        s.total_steps = total

    return steps