from typing import Dict, List, Optional

from app.schemas.algorithm import (
    AlgorithmRunRequest,
    StepHighlight,
)

def fake_bellman_ford(req: AlgorithmRunRequest) -> List[StepHighlight]:
    nodes = [n.id for n in req.nodes]
    edges = req.edges

    if not nodes:
        return []

    start = req.start_node_id or nodes[0]

    # Initialize distances
    dist: Dict[int, float] = {n: float('inf') for n in nodes}
    dist[start] = 0
    parent_edge: Dict[int, Optional[int]] = {n: None for n in nodes}

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
                visited_nodes=[n for n in nodes if dist[n] != float('inf')],
                visited_edges=sorted(visited_edges),
            )
        )
        step_index += 1

    push_step(
        f"Start Bellman-Ford algorithm from node {start}. Initialize distance to 0.",
        [start],
        []
    )

    # Relax edges |V| - 1 times
    for iteration in range(len(nodes) - 1):
        push_step(
            f"Iteration {iteration + 1}/{len(nodes) - 1}: Relax all edges",
            [],
            []
        )

        updated = False

        for edge in edges:
            u, v = edge.from_node, edge.to_node
            weight = edge.weight

            if dist[u] != float('inf') and dist[u] + weight < dist[v]:
                old_dist = dist[v] if dist[v] != float('inf') else None
                dist[v] = dist[u] + weight
                
                # Update parent edge for shortest path tree
                if parent_edge[v] is not None:
                    visited_edges.discard(parent_edge[v])
                parent_edge[v] = edge.id
                visited_edges.add(edge.id)
                
                updated = True

                if old_dist is None:
                    push_step(
                        f"Discover node {v}: distance = {dist[v]} via {u} → {v} (weight {weight})",
                        [u, v],
                        [edge.id]
                    )
                else:
                    push_step(
                        f"Update distance to node {v}: {old_dist} → {dist[v]} via {u} → {v}",
                        [u, v],
                        [edge.id]
                    )

        if not updated:
            push_step(
                f"No updates in iteration {iteration + 1}. Early termination.",
                [],
                []
            )
            break

    # Check for negative cycles
    push_step(
        "Check for negative cycles...",
        [],
        []
    )

    has_negative_cycle = False
    for edge in edges:
        u, v = edge.from_node, edge.to_node
        weight = edge.weight

        if dist[u] != float('inf') and dist[u] + weight < dist[v]:
            has_negative_cycle = True
            push_step(
                f"⚠ Negative cycle detected! Edge {u} → {v} can still be relaxed.",
                [u, v],
                [edge.id]
            )
            break

    if not has_negative_cycle:
        reachable = [n for n in nodes if dist[n] != float('inf')]
        unreachable = [n for n in nodes if dist[n] == float('inf')]

        summary = f"Bellman-Ford complete! Shortest paths found to {len(reachable)}/{len(nodes)} nodes. No negative cycles."
        if unreachable:
            summary += f" Unreachable: {unreachable}"

        push_step(
            summary,
            reachable,
            list(visited_edges)
        )
    else:
        push_step(
            "⚠ Algorithm terminated: Negative cycle exists. Shortest paths are undefined.",
            [],
            []
        )

    total = len(steps)
    for i, s in enumerate(steps):
        s.step_index = i
        s.total_steps = total

    return steps