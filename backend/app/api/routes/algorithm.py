from fastapi import APIRouter, HTTPException
from app.schemas.algorithm import (
  AlgorithmRunRequest,
  StepHighlight,
  AlgorithmRunCreated,
  AlgorithmRunInfo,
)
from app.services.algorithm_runner import (
  create_algorithm_run,
  get_step,
  get_run_total_steps,
)

router = APIRouter(prefix="/api/algorithms", tags=["algorithms"])

@router.post("/run", response_model=AlgorithmRunCreated)
def start_algorithm_run(payload: AlgorithmRunRequest):
    """
        Creates a "run" object, and actually runs it based on the payload.
    """
    run_id = create_algorithm_run(payload)
    total = get_run_total_steps(run_id)

    return AlgorithmRunCreated(
        run_id=run_id,
        algorithm=payload.algorithm,
        total_steps=total,
    )


@router.get("/run/{run_id}", response_model=AlgorithmRunInfo)
def get_algorithm_run_info(run_id: str):
    """
        Get basic info about a run:
            - run id
            - algorithm's name
            - total steps
            - graph's type
    """
    try:
        total = get_run_total_steps(run_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Run not found")

    """
        Currently hardcoded. Maybe we will actually implemet 
    this if we really need it.
    """
    return AlgorithmRunInfo(
        run_id=run_id,
        algorithm="bfs",
        total_steps=total,
        graph_type="undirected",
    ) 


@router.get("/run/{run_id}/step/{step_index}", response_model=StepHighlight)
def get_algorithm_step(run_id: str, step_index: int):
    """
        Returns a specific step. Used in the frontend to know
    the nodes and the edges that needs to be highlighted.
    """
    try:
        step = get_step(run_id, step_index)
    except KeyError:
        raise HTTPException(status_code=404, detail="Run not found")
    except IndexError:
        raise HTTPException(status_code=404, detail="Step not found")

    return step
