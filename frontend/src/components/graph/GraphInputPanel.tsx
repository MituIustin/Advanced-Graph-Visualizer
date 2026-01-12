import React, { useState, useEffect } from "react";
import { GraphType, NodeType, EdgeType } from "../../types/graph";
import "../../styles/graph_input_panel.css";

type InputMode = "adjacency-matrix" | "adjacency-list" | "edge-list";

interface Props {
  graphType: GraphType;
  nodes: NodeType[];
  edges: EdgeType[];
  onGraphChange: (nodes: NodeType[], edges: EdgeType[]) => void;
}

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

const GraphInputPanel: React.FC<Props> = ({
  graphType,
  nodes,
  edges,
  onGraphChange,
}) => {
  const [mode, setMode] = useState<InputMode>("adjacency-matrix");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const layoutNodesInCircle = (ids: number[]): NodeType[] => {
    const n = ids.length;
    if (n === 0) return [];
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    const r = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.35;

    return ids.map((id, index) => {
      const angle = (2 * Math.PI * index) / n;
      return {
        id,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
  };

  /*************************************************
   * GRAPH -> TEXT (auto, when visual changes)
   *************************************************/
  const graphToText = (
    mode: InputMode,
    nodes: NodeType[],
    edges: EdgeType[],
    graphType: GraphType
  ): string => {
    if (nodes.length === 0) return "";

    const ids = [...new Set(nodes.map((n) => n.id))].sort((a, b) => a - b);

    if (mode === "edge-list") {
      const lines: string[] = [];

      const hasEdge = new Set<number>();
      edges.forEach((e) => {
        hasEdge.add(e.from);
        hasEdge.add(e.to);
      });

      // isolated nodes -> single number per line
      ids.forEach((id) => {
        if (!hasEdge.has(id)) {
          lines.push(String(id));
        }
      });

      // edges
      edges.forEach((e) => {
        if (graphType === "weighted" && e.weight != null) {
          lines.push(`${e.from} ${e.to} ${e.weight}`);
        } else {
          lines.push(`${e.from} ${e.to}`);
        }
      });

      return lines.join("\n");
    }

    if (mode === "adjacency-list") {
      const neighborsMap = new Map<number, Set<number>>();
      ids.forEach((id) => neighborsMap.set(id, new Set()));

      edges.forEach((e) => {
        const from = e.from;
        const to = e.to;

        if (!neighborsMap.has(from)) neighborsMap.set(from, new Set());
        if (!neighborsMap.has(to)) neighborsMap.set(to, new Set());

        if (graphType === "directed") {
          neighborsMap.get(from)!.add(to);
        } else {
          neighborsMap.get(from)!.add(to);
          neighborsMap.get(to)!.add(from);
        }
      });

      const lines: string[] = [];
      ids.forEach((id) => {
        const neigh = Array.from(neighborsMap.get(id) ?? []).sort(
          (a, b) => a - b
        );
        if (neigh.length === 0) {
          lines.push(`${id}:`);
        } else {
          lines.push(`${id}: ${neigh.join(" ")}`);
        }
      });

      return lines.join("\n");
    }

    // adjacency-matrix
    const index = new Map<number, number>();
    ids.forEach((id, i) => index.set(id, i));

    const n = ids.length;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));

    edges.forEach((e) => {
      const i = index.get(e.from);
      const j = index.get(e.to);
      if (i == null || j == null) return;

      var val = 1;

      if(graphType === "weighted" && e.weight !== undefined){
        val = e.weight;
      }

      if (graphType === "directed") {
        matrix[i][j] = val;
      } else {
        matrix[i][j] = val;
        matrix[j][i] = val;
      }
    });

    return matrix.map((row) => row.join(" ")).join("\n");
  };

  useEffect(() => {
    const newText = graphToText(mode, nodes, edges, graphType);
    setText(newText);
    setError(null);
  }, [mode, nodes, edges, graphType]);

  /*************************************************
   * TEXT -> GRAPH (when click on Apply to graph)
   *************************************************/
  const parseAdjacencyMatrix = (): { nodes: NodeType[]; edges: EdgeType[] } => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      throw new Error("Adjacency matrix is empty.");
    }

    const matrix = lines.map((line) => {
      const parts = line.split(/\s+/);
      const row = parts.map((p) => {
        const v = Number(p);
        if (Number.isNaN(v)) {
          throw new Error("Matrix contains non-numeric values.");
        }
        return v;
      });
      return row;
    });

    const n = matrix.length;
    if (!matrix.every((row) => row.length === n)) {
      throw new Error("Matrix must be square.");
    }

    const ids = Array.from({ length: n }, (_, i) => i + 1);
    const newNodes = layoutNodesInCircle(ids);
    const newEdges: EdgeType[] = [];
    let edgeId = 1;

    if (graphType === "undirected" || graphType === "weighted") {
      // undirected / weighted -> treat matrix as symmetric
      // edge(i,j) exists if matrix[i][j] != 0 OR matrix[j][i] != 0
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const val1 = matrix[i][j];
          const val2 = matrix[j][i];
          const val = val1 !== 0 ? val1 : val2;

          if (val !== 0) {
            newEdges.push({
              id: edgeId++,
              from: ids[i],
              to: ids[j],
              weight: graphType === "weighted" ? val : undefined,
            });
          }
        }
      }
    } else if (graphType === "directed") {
      // directed (unweighted) -> any nonzero becomes a directed edge
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const val = matrix[i][j];
          if (val !== 0) {
            newEdges.push({
              id: edgeId++,
              from: ids[i],
              to: ids[j],
            });
          }
        }
      }
    }

    return { nodes: newNodes, edges: newEdges };
  };

  const parseAdjacencyList = (): { nodes: NodeType[]; edges: EdgeType[] } => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      throw new Error("Adjacency list is empty.");
    }

    const idSet = new Set<number>();
    const edgePairs: Array<{ from: number; to: number }> = [];

    lines.forEach((line) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) {
        throw new Error(`Invalid line (missing ':'): "${line}"`);
      }

      const left = line.slice(0, colonIndex).trim();
      const right = line.slice(colonIndex + 1).trim();

      const fromId = Number(left);
      if (Number.isNaN(fromId)) {
        throw new Error(`Invalid node id before ':': "${left}"`);
      }

      idSet.add(fromId);

      if (right.length === 0) {
        return; // no neighbors
      }

      const parts = right.split(/\s+/);
      parts.forEach((p) => {
        const toId = Number(p);
        if (Number.isNaN(toId)) {
          throw new Error(`Invalid neighbor on line: "${line}"`);
        }
        idSet.add(toId);
        edgePairs.push({ from: fromId, to: toId });
      });
    });

    const ids = Array.from(idSet).sort((a, b) => a - b);
    const newNodes = layoutNodesInCircle(ids);

    const newEdges: EdgeType[] = [];
    let edgeId = 1;

    if (graphType === "directed") {
      edgePairs.forEach(({ from, to }) => {
        newEdges.push({ id: edgeId++, from, to });
      });
    } else {
      const seen = new Set<string>();
      edgePairs.forEach(({ from, to }) => {
        const u = Math.min(from, to);
        const v = Math.max(from, to);
        const key = `${u}-${v}`;
        if (!seen.has(key)) {
          seen.add(key);
          newEdges.push({ id: edgeId++, from: u, to: v });
        }
      });
    }

    return { nodes: newNodes, edges: newEdges };
  };

  const parseEdgeList = (): { nodes: NodeType[]; edges: EdgeType[] } => {
    const idSet = new Set<number>();
    const newEdges: EdgeType[] = [];
    let edgeId = 1;

    text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .forEach((line) => {
        const parts = line.split(/\s+/);

        if (parts.length === 1) {
          // isolated node
          const id = Number(parts[0]);
          if (Number.isNaN(id)) {
            throw new Error(`Invalid node id: "${line}"`);
          }
          idSet.add(id);
          return;
        }

        const a = Number(parts[0]);
        const b = Number(parts[1]);
        if (Number.isNaN(a) || Number.isNaN(b)) {
          throw new Error(
            `Invalid line (node ids must be numbers): "${line}"`
          );
        }

        idSet.add(a);
        idSet.add(b);

        let weight: number | undefined = undefined;
        if (graphType === "weighted" && parts[2] !== undefined) {
          const w = Number(parts[2]);
          if (Number.isNaN(w)) {
            throw new Error(`Invalid weight on line: "${line}"`);
          }
          weight = w;
        }

        newEdges.push({ id: edgeId++, from: a, to: b, weight });
      });

    const ids = Array.from(idSet).sort((a, b) => a - b);
    const newNodes = layoutNodesInCircle(ids);
    return { nodes: newNodes, edges: newEdges };
  };

  const handleApply = () => {
    if (text.trim() === "") {
      setError(null);
      onGraphChange([], []);
      return;
    }

    try {
      let result: { nodes: NodeType[]; edges: EdgeType[] };

      if (mode === "adjacency-matrix") {
        result = parseAdjacencyMatrix();
      } else if (mode === "adjacency-list") {
        result = parseAdjacencyList();
      } else {
        result = parseEdgeList();
      }

      setError(null);
      onGraphChange(result.nodes, result.edges);
    } catch (err: any) {
      setError(err.message ?? "Error while parsing graph.");
    }
  };

  /*************************************************
   * RENDER
   *************************************************/
  return (
    <div className="graph-input-panel">
      <h2 className="graph-input-title">Text input</h2>

      <div className="graph-input-mode-group">
        <label className="graph-input-mode-option">
          <input
            type="radio"
            checked={mode === "adjacency-matrix"}
            onChange={() => setMode("adjacency-matrix")}
          />
          <span>Adjacency matrix</span>
        </label>

        <label className="graph-input-mode-option">
          <input
            type="radio"
            checked={mode === "adjacency-list"}
            onChange={() => setMode("adjacency-list")}
          />
          <span>Adjacency list</span>
        </label>

        <label className="graph-input-mode-option">
          <input
            type="radio"
            checked={mode === "edge-list"}
            onChange={() => setMode("edge-list")}
          />
          <span>Edge list</span>
        </label>
      </div>

      <textarea
        className="graph-input-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder={
          mode === "adjacency-matrix"
            ? "Example matrix:\n0 1 0\n1 0 1\n0 1 0"
            : mode === "adjacency-list"
            ? "Example adjacency list:\n1: 2 3\n2: 4 5\n3:\n4: 7"
            : graphType === "weighted"
            ? "Example edge list (nodes + edges):\n1\n2\n3\n1 2 5\n2 3 2"
            : "Example edge list (nodes + edges):\n1\n2\n3\n1 2\n2 3\n3 1"
        }
      />

      <div className="panel-left-button-row">
        <button
          type="button"
          className="graph-input-apply-button"
          onClick={handleApply}
        >
          Apply to graph
        </button>
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default GraphInputPanel;
