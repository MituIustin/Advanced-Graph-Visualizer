import uuid
from typing import Dict, List
from app.schemas.algorithm import (
  AlgorithmRunRequest,
  StepHighlight,
  AlgorithmName,
)

# all algorithms implemented
from app.services.algorithms.bfs import fake_bfs
from app.services.algorithms.dfs import fake_dfs
from app.services.algorithms.kruskal import fake_kruskal
from app.services.algorithms.dijkstra import fake_dijkstra
from app.services.algorithms.prim import fake_prim
from app.services.algorithms.bellmanford import fake_bellman_ford

# possibly we will save this in the actual DB
# key: run_id, value: steps
RUNS: Dict[str, List[StepHighlight]] = {}

def create_algorithm_run(req: AlgorithmRunRequest) -> str:
    if req.algorithm == AlgorithmName.bfs:
        steps = fake_bfs(req)
    elif req.algorithm == AlgorithmName.dfs:
        steps = fake_dfs(req)
    elif req.algorithm == AlgorithmName.kruskal:
        steps = fake_kruskal(req)
    elif req.algorithm == AlgorithmName.dijkstra:
        steps = fake_dijkstra(req)
    elif req.algorithm == AlgorithmName.prim:
        steps = fake_prim(req)
    elif req.algorithm == AlgorithmName.bellmanford:
        steps = fake_bellman_ford(req)        
    else:
        print("ERROR: this algorithm is not implemented.")

    run_id = str(uuid.uuid4())
    RUNS[run_id] = steps
    return run_id


def get_step(run_id: str, step_index: int) -> StepHighlight:
  if run_id not in RUNS:
    raise KeyError("Run not found")

  steps = RUNS[run_id]
  if step_index < 0 or step_index >= len(steps):
    raise IndexError("Step out of range")

  return steps[step_index]


def get_run_total_steps(run_id: str) -> int:
  if run_id not in RUNS:
    raise KeyError("Run not found")

  return len(RUNS[run_id])
