import React, { useState, useEffect } from "react";
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
  onRunningChange: (isRunning: boolean) => void;  // NEW
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
  onRunningChange,  // NEW
}) => {
  const [algorithm, setAlgorithm] = useState<"bfs" | "dfs" | "kruskal" | "dijkstra">("bfs");
  const [startNodeId, setStartNodeId] = useState<number | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [totalSteps, setTotalSteps] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("Idle");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);  // NEW
  
  const requiresWeighted = (algorithm === "kruskal" || algorithm === "dijkstra");
  const isWeighted = graphType === "weighted" || graphType.includes("weighted");
  const requiresStartNode = (algorithm === "dijkstra" || algorithm === "bfs" || algorithm === "dfs");
  const hasNegativeWeights = edges.some(e => e.weight != null && e.weight < 0);

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    if (nodes.length > 0 && (startNodeId === null || !nodes.find(n => n.id === startNodeId))) {
      setStartNodeId(nodes[0].id);
    }
  }, [nodes, startNodeId]);

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
      setIsRunning(true);  // NEW
      onRunningChange(true);  // NEW

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
        start_node_id: startNodeId ?? nodes[0]?.id ?? null,
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
      setIsRunning(false);  // NEW
      onRunningChange(false);  // NEW
    } finally {
      setIsLoading(false);
    }
  };

  // NEW
  const handleFinish = () => {
    setIsRunning(false);
    onRunningChange(false);
    resetHighlights();
    setRunId(null);
    setTotalSteps(0);
    setCurrentStep(null);
    setStatus("Idle");
    setError(null);
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

  const disableRun = isLoading || nodes.length === 0 || 
                     (requiresWeighted && !isWeighted) ||
                     (algorithm === "dijkstra" && hasNegativeWeights);
  const disableNav = !runId || totalSteps === 0 || isLoading;

  return (
    <div className="algo-section">
      <h3 className="algo-panel-title">Step-by-step visualization</h3>
      <p className="algo-panel-description">
      {algorithm === "kruskal" && !isWeighted
      ? "Kruskal's algorithm requires a weighted graph."
      : algorithm === "dijkstra" && !isWeighted
      ? "Dijkstra's algorithm requires a weighted graph with only positive weights."
      : algorithm === "dijkstra" && hasNegativeWeights  // NEW
      ? "Dijkstra's algorithm does not work with negative edge weights."  // NEW
      : "Choose an algorithm and hit Run to display its steps on your created graph."
      }
      </p>

      {/* Algorithm selector */}
      <div className="algo-panel-selector-row">
        <span>Algorithm:</span>
        <select
          className="algo-panel-select"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as "bfs" | "dfs" | "kruskal" | "dijkstra")}
          disabled={isRunning}  // NEW
        >
          <option value="bfs">BFS</option>
          <option value="dfs">DFS</option>
          <option value="kruskal">Kruskal's algorithm</option>
          <option value="dijkstra">Dijkstra's algorithm</option>
        </select>
      </div>

      {/* Start node selector */}
      {requiresStartNode && nodes.length > 0 && (
        <div className="algo-panel-selector-row">
          <span>Start Node:</span>
          <select
            className="algo-panel-select"
            value={startNodeId ?? ""}
            onChange={(e) => setStartNodeId(Number(e.target.value))}
            disabled={isRunning}  // NEW
          >
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                Node {node.id}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="algo-panel-button-row">
        <button
          type="button"
          onClick={isRunning ? handleFinish : handleRunClick}  // MODIFIED
          disabled={!isRunning && disableRun}  // MODIFIED
          className="algo-panel-run-button"
        >
          {isLoading ? "Running..." : isRunning ? "Finish" : `Run ${algorithm.toUpperCase()}`}  {/* MODIFIED */}
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