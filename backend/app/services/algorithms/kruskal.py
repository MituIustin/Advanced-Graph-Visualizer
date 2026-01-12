from typing import Dict, List

from app.schemas.algorithm import (
    AlgorithmRunRequest,
    StepHighlight,
)

def fake_kruskal(req: AlgorithmRunRequest) -> List[StepHighlight]:
    nodes = [n.id for n in req.nodes]
    edges = req.edges

    if not nodes:
        return []

    # Union-Find data structure
    parent: Dict[int, int] = {n: n for n in nodes}
    rank: Dict[int, int] = {n: 0 for n in nodes}

    def find(x: int) -> int:
        if parent[x] != x:
            parent[x] = find(parent[x])  # path compression
        return parent[x]

    def union(x: int, y: int) -> bool:
        root_x = find(x)
        root_y = find(y)
        
        if root_x == root_y:
            return False  # already in same set, would create cycle
        
        # Union by rank
        if rank[root_x] < rank[root_y]:
            parent[root_x] = root_y
        elif rank[root_x] > rank[root_y]:
            parent[root_y] = root_x
        else:
            parent[root_y] = root_x
            rank[root_x] += 1
        
        return True

    mst_edges: set[int] = set()
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
                visited_nodes=[],  # Not used in Kruskal's
                visited_edges=sorted(mst_edges),
            )
        )
        step_index += 1

    # Sort edges by weight
    sorted_edges = sorted(edges, key=lambda e: e.weight)

    push_step(
        "Start Kruskal's algorithm. Sorted all edges by weight.",
        [],
        []
    )

    for edge in sorted_edges:
        u, v = edge.from_node, edge.to_node
        
        push_step(
            f"Consider edge {edge.id}: {u} ↔ {v} (weight: {edge.weight})",
            [u, v],
            [edge.id]
        )

        if find(u) != find(v):
            # Add edge to MST
            union(u, v)
            mst_edges.add(edge.id)
            
            push_step(
                f"✓ Add edge {edge.id} to MST (connects different components)",
                [u, v],
                [edge.id]
            )
        else:
            push_step(
                f"✗ Skip edge {edge.id} (would create a cycle)",
                [u, v],
                [edge.id]
            )

        # Stop if we have n-1 edges (complete MST)
        if len(mst_edges) == len(nodes) - 1:
            push_step(
                f"MST complete! Total weight: {sum(e.weight for e in edges if e.id in mst_edges)}",
                [],
                list(mst_edges)
            )
            break

    total = len(steps)
    for i, s in enumerate(steps):
        s.step_index = i
        s.total_steps = total

    return steps