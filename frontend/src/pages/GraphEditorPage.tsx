// src/pages/GraphEditorPage.tsx
import React, { useState } from "react";
import GraphCanvas from "../components/graph/GraphCanvas";
import GraphSidebar from "../components/graph/GraphSidebar";
import GraphAlgorithmPanel from "../components/graph/GraphAlgorithmPanel";
import { GraphType, NodeType, EdgeType } from "../types/graph";
import { InputMethod } from "../types/ui";

export default function GraphEditorPage() {
  const [graphType, setGraphType] = useState<GraphType>("undirected");
  const [inputMethod, setInputMethod] = useState<InputMethod>("text");

  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);

  const [highlightNodes, setHighlightNodes] = useState<number[]>([]);
  const [highlightEdges, setHighlightEdges] = useState<number[]>([]);
  const [visitedNodes, setVisitedNodes] = useState<number[]>([]);
  const [visitedEdges, setVisitedEdges] = useState<number[]>([]);

  const resetAlgorithmState = () => {
    setHighlightNodes([]);
    setHighlightEdges([]);
    setVisitedNodes([]);
    setVisitedEdges([]);
  };

  const handleGraphChangeFromText = (
    newNodes: NodeType[],
    newEdges: EdgeType[]
  ) => {
    setNodes(newNodes);
    setEdges(newEdges);
    resetAlgorithmState();
  };

  const layoutNodesInCircle = (ids: number[]): NodeType[] => {
    const n = ids.length;
    if (n === 0) return [];
    const width = 900;
    const height = 600;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.35;

    return ids.map((id, index) => {
      const angle = (2 * Math.PI * index) / n;
      return {
        id,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
  };

  const handleGenerateRandom = () => {
    const minNodes = 4;
    const maxNodes = 10;
    const numNodes =
      Math.floor(Math.random() * (maxNodes - minNodes + 1)) + minNodes;

    const ids = Array.from({ length: numNodes }, (_, i) => i + 1);
    const newNodes = layoutNodesInCircle(ids);

    const newEdges: EdgeType[] = [];
    let edgeId = 1;

    if (graphType === "undirected" || graphType === "weighted") {
      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          if (Math.random() < 0.3) {
            const from = ids[i];
            const to = ids[j];
            const weight =
              graphType === "weighted"
                ? Math.floor(Math.random() * 9) + 1
                : undefined;

            newEdges.push({
              id: edgeId++,
              from,
              to,
              weight,
            });
          }
        }
      }
    } else {
      // directed
      for (let i = 0; i < numNodes; i++) {
        for (let j = 0; j < numNodes; j++) {
          if (i === j) continue;
          if (Math.random() < 0.2) {
            const from = ids[i];
            const to = ids[j];
            newEdges.push({
              id: edgeId++,
              from,
              to,
            });
          }
        }
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
    resetAlgorithmState();
  };

  const handleExportGraph = () => {
    if (nodes.length === 0) {
      alert("No graph to export.");
      return;
    }

    const lines: string[] = [];

    // first line: graph type
    lines.push(graphType);

    // empty line
    lines.push("");

    // nodes
    nodes
      .map((n) => n.id)
      .sort((a, b) => a - b)
      .forEach((id) => {
        lines.push(String(id));
      });

    // empty line
    lines.push("");

    // edges
    edges.forEach((e) => {
      if (graphType === "weighted" && e.weight != null) {
        lines.push(`${e.from} ${e.to} ${e.weight}`);
      } else {
        lines.push(`${e.from} ${e.to}`);
      }
    });

    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "graph_export.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportGraph = (
    importedGraphType: GraphType,
    importedNodes: NodeType[],
    importedEdges: EdgeType[]
  ) => {
    setGraphType(importedGraphType);
    setNodes(importedNodes);
    setEdges(importedEdges);
    resetAlgorithmState();
  };

  const handleGraphChangeFromCanvas = (
    newNodes: NodeType[],
    newEdges: EdgeType[]
  ) => {
    setNodes(newNodes);
    setEdges(newEdges);
    
    resetAlgorithmState();
  };

  return (
    <div className="page">
      <nav className="navbar">
        <div>Advanced Graph Visualizer</div>
        <button onClick={() => alert("Account page (coming soon)")}>
          Account
        </button>
      </nav>

      <div className="layout">
        {/* LEFT – sidebar (text/file/random + export/import) */}
        <div className="panel panel-left">
          <GraphSidebar
            graphType={graphType}
            inputMethod={inputMethod}
            nodes={nodes}
            edges={edges}
            onInputMethodChange={setInputMethod}
            onGraphChangeFromText={handleGraphChangeFromText}
            onGenerateRandom={handleGenerateRandom}
            onExportGraph={handleExportGraph}
            onImportGraph={handleImportGraph}
          />
        </div>

        {/* CENTER – graph type + canvas */}
        <div className="panel panel-center">
          <div className="graph-canvas-wrapper">
            <div className="graph-type-bar">
              <button
                onClick={() => setGraphType("undirected")}
                className={
                  graphType === "undirected"
                    ? "graph-type-button active"
                    : "graph-type-button"
                }
              >
                Undirected
              </button>
              <button
                onClick={() => setGraphType("directed")}
                className={
                  graphType === "directed"
                    ? "graph-type-button active"
                    : "graph-type-button"
                }
              >
                Directed
              </button>
              <button
                onClick={() => setGraphType("weighted")}
                className={
                  graphType === "weighted"
                    ? "graph-type-button active"
                    : "graph-type-button"
                }
              >
                Weighted
              </button>
            </div>

            <GraphCanvas
              nodes={nodes}
              edges={edges}
              graphType={graphType}
              onGraphChange={handleGraphChangeFromCanvas}
              highlightNodes={highlightNodes}
              highlightEdges={highlightEdges}
              visitedNodes={visitedNodes}
              visitedEdges={visitedEdges}
            />

            <div className="canvas-instructions">
              <div>
                <span>Left click</span> to create or drag nodes.
              </div>
              <div>
                <span>Double click</span> on two nodes to add an edge.
              </div>
              <div>
                <span>Right click</span> on nodes/edges to delete them.
              </div>
              <div>
                <span>Double click</span> on a weight (weighted graph) to edit
                it.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT – algorithms panel */}
        <div className="panel panel-right">
          <h2>Algorithms</h2>
          <p>
            Run graph algorithms and visualize their steps by highlighting nodes
            and edges.
          </p>

          <GraphAlgorithmPanel
            graphType={graphType}
            nodes={nodes}
            edges={edges}
            onHighlightChange={(hNodes, hEdges, vNodes, vEdges) => {
              setHighlightNodes(hNodes);
              setHighlightEdges(hEdges);
              setVisitedNodes(vNodes);
              setVisitedEdges(vEdges);
            }}
          />
        </div>
      </div>
    </div>
  );
}
