import React, { useRef, useState, useEffect } from "react";
import { NodeType, EdgeType, GraphType } from "../../types/graph";
import WeightModal from "./WeightModal";
import "../../styles/graph_canvas.css";

interface GraphCanvasProps {
  nodes: NodeType[];
  edges: EdgeType[];
  graphType: GraphType;
  onGraphChange: (nodes: NodeType[], edges: EdgeType[]) => void;
  highlightNodes?: number[];
  highlightEdges?: number[];
  visitedNodes?: number[];
  visitedEdges?: number[];
}

const NODE_RADIUS = 25;

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  graphType,
  onGraphChange,
  highlightNodes = [],
  highlightEdges = [],
  visitedNodes = [],
  visitedEdges = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedForEdge, setSelectedForEdge] = useState<number | null>(null);

  const [weightModalEdgeId, setWeightModalEdgeId] = useState<number | null>(
    null
  );
  const [weightModalValue, setWeightModalValue] = useState<string>("");

  /*************************************************
   * DRAW
   *************************************************/
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawArrowHead = (x: number, y: number, angle: number) => {
      const arrowLength = 12;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x - arrowLength * Math.cos(angle - Math.PI / 6),
        y - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        x - arrowLength * Math.cos(angle + Math.PI / 6),
        y - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
    };

    const drawWeightLabel = (midX: number, midY: number, weight: number) => {
      const label = String(weight);
      ctx.font = "22px system-ui";
      const paddingX = 8;
      const paddingY = 4;
      const textWidth = ctx.measureText(label).width;
      const boxWidth = textWidth + paddingX * 2;
      const boxHeight = 30;

      const boxX = midX - boxWidth / 2;
      const boxY = midY - boxHeight / 2 - 8;

      ctx.fillStyle = "#020617";
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      ctx.fillStyle = "#e5e7eb";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, boxX + boxWidth / 2, boxY + boxHeight / 2);
    };

    // ===== EDGES =====
    if (graphType === "directed") {
      type PairInfo = {
        aId: number;
        bId: number;
        hasAB: boolean;
        hasBA: boolean;
      };

      const pairMap = new Map<string, PairInfo>();

      edges.forEach((e) => {
        const aId = Math.min(e.from, e.to);
        const bId = Math.max(e.from, e.to);
        const key = `${aId}-${bId}`;

        let info = pairMap.get(key);
        if (!info) {
          info = { aId, bId, hasAB: false, hasBA: false };
        }

        if (e.from === aId && e.to === bId) {
          info.hasAB = true;
        } else if (e.from === bId && e.to === aId) {
          info.hasBA = true;
        }

        pairMap.set(key, info);
      });

      pairMap.forEach((info) => {
        const a = nodes.find((n) => n.id === info.aId);
        const b = nodes.find((n) => n.id === info.bId);
        if (!a || !b) return;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;

        const startX = a.x + ux * NODE_RADIUS;
        const startY = a.y + uy * NODE_RADIUS;
        const endX = b.x - ux * NODE_RADIUS;
        const endY = b.y - uy * NODE_RADIUS;

        const isAnyHighlighted = edges.some(
          (e) =>
            ((e.from === info.aId && e.to === info.bId) ||
              (e.from === info.bId && e.to === info.aId)) &&
            highlightEdges.includes(e.id)
        );
        const isAnyVisited = edges.some(
          (e) =>
            ((e.from === info.aId && e.to === info.bId) ||
              (e.from === info.bId && e.to === info.aId)) &&
            visitedEdges.includes(e.id)
        );

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = isAnyHighlighted
          ? "#f97316"
          : isAnyVisited
          ? "#22c55e"
          : "#3b82f6";
        ctx.lineWidth = isAnyHighlighted ? 4 : isAnyVisited ? 3.5 : 3;
        ctx.stroke();

        const angleAB = Math.atan2(dy, dx);
        const angleBA = angleAB + Math.PI;

        if (info.hasAB) {
          drawArrowHead(endX, endY, angleAB);
        }
        if (info.hasBA) {
          drawArrowHead(startX, startY, angleBA);
        }
      });
    } else {
      // UNDIRECTED / WEIGHTED
      edges.forEach((e) => {
        const a = nodes.find((n) => n.id === e.from);
        const b = nodes.find((n) => n.id === e.to);
        if (!a || !b) return;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;

        const startX = a.x + ux * NODE_RADIUS;
        const startY = a.y + uy * NODE_RADIUS;
        const endX = b.x - ux * NODE_RADIUS;
        const endY = b.y - uy * NODE_RADIUS;

        const isHighlighted = highlightEdges.includes(e.id);
        const isVisited = visitedEdges.includes(e.id);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = isHighlighted
          ? "#f97316"
          : isVisited
          ? "#22c55e"
          : "#3b82f6";
        ctx.lineWidth = isHighlighted ? 4 : isVisited ? 3.5 : 3;
        ctx.stroke();

        if (graphType === "weighted" && e.weight != null) {
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          drawWeightLabel(midX, midY, e.weight);
        }
      });
    }

    // ===== NODES =====
    nodes.forEach((n) => {
      const isHighlightedNode = highlightNodes.includes(n.id);
      const isVisitedNode = visitedNodes.includes(n.id);

      ctx.beginPath();
      ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);

      if (isHighlightedNode) {
        ctx.fillStyle = "#22c55e"; // current step
      } else if (isVisitedNode) {
        ctx.fillStyle = "#1d4ed8"; // visited
      } else if (selectedForEdge === n.id) {
        ctx.fillStyle = "#22c55e"; // selecting for edge
      } else {
        ctx.fillStyle = "#0f172a"; // default
      }

      ctx.fill();
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#e5e7eb";
      ctx.font = "bold 16px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n.id), n.x, n.y);
    });
  };

  useEffect(() => {
    draw();
  }, [
    nodes,
    edges,
    selectedForEdge,
    graphType,
    highlightNodes,
    highlightEdges,
    visitedNodes,
    visitedEdges,
  ]);

  /*************************************************
   * UTILS
   *************************************************/
  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const findNodeAt = (x: number, y: number): NodeType | null =>
    nodes.find((n) => Math.hypot(n.x - x, n.y - y) <= NODE_RADIUS) ?? null;

  const edgeExists = (a: number, b: number) =>
    edges.some((e) =>
      graphType === "directed"
        ? e.from === a && e.to === b
        : (e.from === a && e.to === b) || (e.from === b && e.to === a)
    );

  const addEdge = (a: number, b: number) => {
    if (edgeExists(a, b)) return;
    const newId = edges.length ? Math.max(...edges.map((e) => e.id)) + 1 : 1;
    const newEdge: EdgeType = {
      id: newId,
      from: a,
      to: b,
      weight: graphType === "weighted" ? 1 : undefined,
    };
    const newEdges: EdgeType[] = [...edges, newEdge];
    onGraphChange(nodes, newEdges);
  };

  const findEdgeAt = (x: number, y: number): EdgeType | null => {
    const threshold = 6;

    for (const e of edges) {
      const a = nodes.find((n) => n.id === e.from);
      const b = nodes.find((n) => n.id === e.to);
      if (!a || !b) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;

      const t = ((x - a.x) * dx + (y - a.y) * dy) / lenSq;
      if (t < 0 || t > 1) continue;

      const projX = a.x + t * dx;
      const projY = a.y + t * dy;
      const dist = Math.hypot(x - projX, y - projY);

      if (dist <= threshold) return e;
    }

    return null;
  };

  const findWeightedEdgeLabelAt = (x: number, y: number): EdgeType | null => {
    if (graphType !== "weighted") return null;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.font = "22px system-ui";

    for (const e of edges) {
      const a = nodes.find((n) => n.id === e.from);
      const b = nodes.find((n) => n.id === e.to);
      if (!a || !b) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;

      const startX = a.x + ux * NODE_RADIUS;
      const startY = a.y + uy * NODE_RADIUS;
      const endX = b.x - ux * NODE_RADIUS;
      const endY = b.y - uy * NODE_RADIUS;

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      const weight = e.weight ?? 1;
      const label = String(weight);
      const paddingX = 8;
      const textWidth = ctx.measureText(label).width;
      const boxWidth = textWidth + paddingX * 2;
      const boxHeight = 30;

      const boxX = midX - boxWidth / 2;
      const boxY = midY - boxHeight / 2 - 8;

      if (
        x >= boxX &&
        x <= boxX + boxWidth &&
        y >= boxY &&
        y <= boxY + boxHeight
      ) {
        return e;
      }
    }

    return null;
  };

  /*************************************************
   * MODAL – edit weight
   *************************************************/
  const openWeightModal = (edge: EdgeType) => {
    setWeightModalEdgeId(edge.id);
    setWeightModalValue(String(edge.weight ?? 1));
  };

  const closeWeightModal = () => {
    setWeightModalEdgeId(null);
    setWeightModalValue("");
  };

  const handleWeightSave = () => {
    if (weightModalEdgeId == null) return;
    const trimmed = weightModalValue.trim();
    if (trimmed === "") {
      alert("Weight cannot be empty.");
      return;
    }
    const value = Number(trimmed);
    if (Number.isNaN(value)) {
      alert("Weight must be a number.");
      return;
    }

    const newEdges = edges.map((e) =>
      e.id === weightModalEdgeId ? { ...e, weight: value } : e
    );
    onGraphChange(nodes, newEdges);
    closeWeightModal();
  };

  /*************************************************
   * EVENTS
   *************************************************/
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;

    const { x, y } = getPos(e);
    const node = findNodeAt(x, y);

    if (node) {
      setDragging(node.id);
      setOffset({ x: x - node.x, y: y - node.y });
      return;
    }

    if (graphType === "weighted") {
      const labelEdge = findWeightedEdgeLabelAt(x, y);
      if (labelEdge) return;
    }

    const edge = findEdgeAt(x, y);
    if (edge) return;

    const newId = nodes.length
      ? Math.max(...nodes.map((n) => n.id)) + 1
      : 1;
    const newNodes: NodeType[] = [...nodes, { id: newId, x, y }];
    onGraphChange(newNodes, edges);
    setSelectedForEdge(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging == null) return;

    const { x, y } = getPos(e);
    const newNodes: NodeType[] = nodes.map((n) =>
      n.id === dragging ? { ...n, x: x - offset.x, y: y - offset.y } : n
    );
    onGraphChange(newNodes, edges);
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getPos(e);

    const labelEdge = findWeightedEdgeLabelAt(x, y);
    if (labelEdge && graphType === "weighted") {
      openWeightModal(labelEdge);
      return;
    }

    const edge = findEdgeAt(x, y);
    if (edge && graphType === "weighted") {
      openWeightModal(edge);
      return;
    }

    const node = findNodeAt(x, y);

    if (!node) {
      setSelectedForEdge(null);
      return;
    }

    if (selectedForEdge === null) {
      setSelectedForEdge(node.id);
    } else if (selectedForEdge === node.id) {
      setSelectedForEdge(null);
    } else {
      addEdge(selectedForEdge, node.id);
      setSelectedForEdge(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getPos(e);

    const node = findNodeAt(x, y);
    if (node) {
      const newNodes = nodes.filter((n) => n.id !== node.id);
      const newEdges = edges.filter(
        (ed) => ed.from !== node.id && ed.to !== node.id
      );
      onGraphChange(newNodes, newEdges);
      if (selectedForEdge === node.id) {
        setSelectedForEdge(null);
      }
      return;
    }

    const edge = findEdgeAt(x, y);
    if (edge) {
      const newEdges = edges.filter((ed) => ed.id !== edge.id);
      onGraphChange(nodes, newEdges);
      return;
    }

    setSelectedForEdge(null);
  };

  /*************************************************
   * RENDER
   *************************************************/
  return (
    <div className="graph-canvas-container">
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        className="graph-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />

      {weightModalEdgeId != null && (
        <WeightModal
          value={weightModalValue}
          onChange={setWeightModalValue}
          onCancel={closeWeightModal}
          onSave={handleWeightSave}
        />
      )}
    </div>
  );
};

export default GraphCanvas;
