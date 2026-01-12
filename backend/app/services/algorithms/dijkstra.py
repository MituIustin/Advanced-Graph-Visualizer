from typing import Dict, List, Optional
import heapq

from app.schemas.algorithm import (
    AlgorithmRunRequest,
    StepHighlight,
)

def fake_dijkstra(req: AlgorithmRunRequest) -> List[StepHighlight]:
    nodes = [n.id for n in req.nodes]
    edges = req.edges

    if not nodes:
        return []

    start = req.start_node_id or nodes[0]

    # Build adjacency list with weights
    adj: Dict[int, List[tuple[int, int, int]]] = {n: [] for n in nodes}
    for e in edges:
        adj[e.from_node].append((e.to_node, e.weight, e.id))
        if req.graph_type == "undirected":
            adj[e.to_node].append((e.from_node, e.weight, e.id))

    # Initialize distances and parent tracking
    dist: Dict[int, float] = {n: float('inf') for n in nodes}
    dist[start] = 0
    parent_edge: Dict[int, Optional[int]] = {n: None for n in nodes}

    visited_nodes: set[int] = set()
    visited_edges: set[int] = set()
    steps: List[StepHighlight] = []
    step_index = 0

    # Priority queue: (distance, node_id)
    pq = [(0, start)]

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

    push_step(
        f"Start Dijkstra's algorithm from node {start}. Initialize distance to 0.",
        [start],
        []
    )

    while pq:
        current_dist, u = heapq.heappop(pq)

        # Skip if already visited
        if u in visited_nodes:
            continue

        visited_nodes.add(u)
        
        # Add the edge that led us here to visited_edges
        if parent_edge[u] is not None:
            visited_edges.add(parent_edge[u])
        
        push_step(
            f"Visit node {u} with shortest distance {current_dist}",
            [u],
            [parent_edge[u]] if parent_edge[u] is not None else []
        )

        # Check all neighbors
        for v, weight, edge_id in adj.get(u, []):
            if v not in visited_nodes:
                new_dist = dist[u] + weight

                if new_dist < dist[v]:
                    # Found a shorter path
                    old_dist = dist[v] if dist[v] != float('inf') else None
                    dist[v] = new_dist
                    parent_edge[v] = edge_id
                    heapq.heappush(pq, (new_dist, v))
                    
                    if old_dist is None:
                        push_step(
                            f"Discover node {v} with distance {new_dist} via {u} → {v} (weight {weight})",
                            [u, v],
                            [edge_id]
                        )
                    else:
                        push_step(
                            f"Update distance to node {v}: {old_dist} → {new_dist} via {u} → {v}",
                            [u, v],
                            [edge_id]
                        )

    # Final step showing all shortest paths
    reachable = [n for n in nodes if dist[n] != float('inf')]
    unreachable = [n for n in nodes if dist[n] == float('inf')]
    
    summary = f"Dijkstra's complete! Shortest paths found to {len(reachable)}/{len(nodes)} nodes."
    if unreachable:
        summary += f" Unreachable: {unreachable}"
    
    push_step(
        summary,
        reachable,
        list(visited_edges)
    )

    total = len(steps)
    for i, s in enumerate(steps):
        s.step_index = i
        s.total_steps = total

    return steps