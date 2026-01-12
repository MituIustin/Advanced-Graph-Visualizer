from typing import Dict, List, Optional
import heapq
import math

from app.schemas.algorithm import (
    AlgorithmRunRequest,
    StepHighlight,
)

def fake_astar(req: AlgorithmRunRequest) -> List[StepHighlight]:
    nodes = [n.id for n in req.nodes]
    edges = req.edges

    if not nodes:
        return []

    start = req.start_node_id or nodes[0]
    target = req.target_node_id
    
    if target is None:
        # If no target specified, use the last node
        target = nodes[-1]

    # Build adjacency list with weights
    adj: Dict[int, List[tuple[int, int, int]]] = {n: [] for n in nodes}
    for e in edges:
        adj[e.from_node].append((e.to_node, e.weight, e.id))
        if req.graph_type == "undirected":
            adj[e.to_node].append((e.from_node, e.weight, e.id))

    # Get node positions for heuristic (Euclidean distance)
    node_positions: Dict[int, tuple[float, float]] = {}
    for n in req.nodes:
        # Assuming nodes have x and y attributes
        node_positions[n.id] = (getattr(n, 'x', 0), getattr(n, 'y', 0))

    def heuristic(node_id: int) -> float:
        """Euclidean distance to target"""
        x1, y1 = node_positions.get(node_id, (0, 0))
        x2, y2 = node_positions.get(target, (0, 0))
        return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

    # Initialize distances and costs
    g_score: Dict[int, float] = {n: float('inf') for n in nodes}  # Actual cost from start
    f_score: Dict[int, float] = {n: float('inf') for n in nodes}  # g + heuristic
    g_score[start] = 0
    f_score[start] = heuristic(start)
    
    parent_edge: Dict[int, Optional[int]] = {n: None for n in nodes}

    visited_nodes: set[int] = set()
    visited_edges: set[int] = set()
    steps: List[StepHighlight] = []
    step_index = 0

    # Priority queue: (f_score, g_score, node_id)
    pq = [(f_score[start], g_score[start], start)]

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
        f"Start A* algorithm from node {start} to node {target}. h({start}) = {heuristic(start):.1f}",
        [start, target],
        []
    )

    found_path = False

    while pq:
        current_f, current_g, u = heapq.heappop(pq)

        # Skip if already visited
        if u in visited_nodes:
            continue

        visited_nodes.add(u)
        
        # Add the edge that led us here
        if parent_edge[u] is not None:
            visited_edges.add(parent_edge[u])
        
        push_step(
            f"Visit node {u}: g={current_g:.1f}, h={heuristic(u):.1f}, f={current_f:.1f}",
            [u],
            [parent_edge[u]] if parent_edge[u] is not None else []
        )

        # Check if we reached the target
        if u == target:
            found_path = True
            # Reconstruct path
            path_nodes = []
            path_edges = []
            current = target
            while current != start:
                path_nodes.append(current)
                if parent_edge[current] is not None:
                    path_edges.append(parent_edge[current])
                # Find parent node
                found_parent = False
                for node_id, edge_id in parent_edge.items():
                    if node_id == current and edge_id is not None:
                        # Find which node this edge came from
                        for e in edges:
                            if e.id == edge_id:
                                if e.to_node == current:
                                    current = e.from_node
                                else:
                                    current = e.to_node
                                found_parent = True
                                break
                        if found_parent:
                            break
                if not found_parent:
                    break
            
            path_nodes.append(start)
            path_nodes.reverse()
            path_edges.reverse()
            
            push_step(
                f"✓ Path found! Total cost: {g_score[target]:.1f}",
                path_nodes,
                path_edges
            )
            break

        # Check all neighbors
        for v, weight, edge_id in adj.get(u, []):
            if v not in visited_nodes:
                tentative_g = g_score[u] + weight

                if tentative_g < g_score[v]:
                    # Found a better path
                    old_g = g_score[v] if g_score[v] != float('inf') else None
                    g_score[v] = tentative_g
                    f_score[v] = tentative_g + heuristic(v)
                    parent_edge[v] = edge_id
                    heapq.heappush(pq, (f_score[v], g_score[v], v))
                    
                    if old_g is None:
                        push_step(
                            f"Discover node {v}: g={tentative_g:.1f}, h={heuristic(v):.1f}, f={f_score[v]:.1f} via {u} → {v}",
                            [u, v],
                            [edge_id]
                        )
                    else:
                        push_step(
                            f"Update node {v}: g={old_g:.1f}→{tentative_g:.1f}, f={f_score[v]:.1f} via {u} → {v}",
                            [u, v],
                            [edge_id]
                        )

    if not found_path:
        push_step(
            f"✗ No path from node {start} to node {target}",
            [start, target],
            []
        )

    total = len(steps)
    for i, s in enumerate(steps):
        s.step_index = i
        s.total_steps = total

    return steps