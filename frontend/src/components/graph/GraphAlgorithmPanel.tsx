import React, { useState } from "react";
import { GraphType, NodeType, EdgeType } from "../../types/graph";
import "../../styles/algorithm_panel.css";

interface Props {
  graphType: GraphType;
  nodes: NodeType[];
  edges: EdgeType[];
  onHighlightChange: (
    highlightNodes: number[],
    highlightEdges: number[],
    visitedNodes: number[],
    visitedEdges: number[]
  ) => void;
}

interface AlgorithmRunCreated {
  run_id: string;
  algorithm: string;
  total_steps: number;
}

interface StepHighlight {
  step_index: number;
  total_steps: number;
  algorithm: string;
  description?: string;
  highlight_nodes: number[];
  highlight_edges: number[];
  visited_nodes?: number[];
  visited_edges?: number[];
}

const GraphAlgorithmPanel: React.FC<Props> = ({
  graphType,
  nodes,
  edges,
  onHighlightChange,
}) => {
  const [algorithm, setAlgorithm] = useState<"bfs" | "dfs">("bfs");
  const [runId, setRunId] = useState<string | null>(null);
  const [totalSteps, setTotalSteps] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("Idle");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "http://localhost:8000";

  const resetHighlights = () => {
    onHighlightChange([], [], [], []);
  };

  const loadStep = async (runId: string, index: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const resp = await fetch(
        `${API_BASE}/api/algorithms/run/${runId}/step/${index}`
      );
      if (!resp.ok) {
        throw new Error(`Failed to fetch step ${index} (${resp.status})`);
      }
      const step: StepHighlight = await resp.json();

      onHighlightChange(
        step.highlight_nodes || [],
        step.highlight_edges || [],
        step.visited_nodes || [],
        step.visited_edges || []
      );
      setCurrentStep(step.step_index);
      setStatus(
        step.description ||
          `Step ${step.step_index + 1}/${step.total_steps}`
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error while loading step.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunClick = async () => {
    if (nodes.length === 0) {
      setStatus("No nodes in graph.");
      resetHighlights();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      resetHighlights();

      const body = {
        algorithm,
        graph_type: graphType,
        nodes: nodes.map((n) => ({ id: n.id })),
        edges: edges.map((e) => ({
          id: e.id,
          from_node: e.from,
          to_node: e.to,
          weight: e.weight ?? null,
        })),
        start_node_id: nodes[0]?.id ?? null,
        target_node_id: null,
      };

      const resp = await fetch(`${API_BASE}/api/algorithms/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        throw new Error(`Run request failed (${resp.status})`);
      }

      const data: AlgorithmRunCreated = await resp.json();

      setRunId(data.run_id);
      setTotalSteps(data.total_steps);
      setStatus("Run created. Loading first step...");

      if (data.total_steps > 0) {
        await loadStep(data.run_id, 0);
      } else {
        setStatus("Run has no steps.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error while starting algorithm.");
      setStatus("Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (!runId || totalSteps === 0 || currentStep == null) return;
    if (currentStep + 1 >= totalSteps) return;
    await loadStep(runId, currentStep + 1);
  };

  const handlePrev = async () => {
    if (!runId || totalSteps === 0 || currentStep == null) return;
    if (currentStep - 1 < 0) return;
    await loadStep(runId, currentStep - 1);
  };

  const disableRun = isLoading || nodes.length === 0;
  const disableNav = !runId || totalSteps === 0 || isLoading;

  return (
    <div className="algo-section">
      <h3 className="algo-panel-title">Demo: BFS / DFS playback</h3>
      <p className="algo-panel-description">
        This panel calls the backend fake BFS/DFS and highlights nodes/edges.
      </p>

      {/* Algorithm selector */}
      <div className="algo-panel-selector-row">
        <span>Algorithm:</span>
        <select
          className="algo-panel-select"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as "bfs" | "dfs")}
        >
          <option value="bfs">Fake BFS</option>
          <option value="dfs">Fake DFS</option>
        </select>
      </div>

      <div className="algo-panel-button-row">
        <button
          type="button"
          onClick={handleRunClick}
          disabled={disableRun}
          className="algo-panel-run-button"
        >
          {isLoading ? "Running..." : `Run ${algorithm.toUpperCase()}`}
        </button>

        <button
          type="button"
          onClick={handlePrev}
          disabled={disableNav || currentStep === null || currentStep <= 0}
          className="algo-panel-nav-button"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={
            disableNav ||
            currentStep === null ||
            currentStep + 1 >= totalSteps
          }
          className="algo-panel-nav-button"
        >
          Next
        </button>
      </div>

      <div className="algo-panel-steps">
        Steps: {totalSteps > 0 ? `${(currentStep ?? 0) + 1}/${totalSteps}` : "—"}
      </div>
      <div className="algo-panel-status">Status: {status}</div>

      {error && <div className="algo-panel-error">{error}</div>}
    </div>
  );
};

export default GraphAlgorithmPanel;
