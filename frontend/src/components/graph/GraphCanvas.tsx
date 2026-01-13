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
  isDisabled?: boolean;  // NEW
  selectedAlgorithm?: string;
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
  isDisabled = false,
  selectedAlgorithm = "bfs",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedForEdge, setSelectedForEdge] = useState<number | null>(null);

  const [weightModalEdgeId, setWeightModalEdgeId] = useState<number | null>(
    null
  );
  const [weightModalValue, setWeightModalValue] = useState<string>("");
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });
  /*************************************************
   * DRAW
   *************************************************/
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);  
    ctx.setTransform(
      scaleRef.current,
      0,
      0,
      scaleRef.current,
      offsetRef.current.x,
      offsetRef.current.y
    );

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
      if (graphType === "directed" || graphType === "weighted") {
        type PairInfo = {
          aId: number;
          bId: number;
          hasAB: boolean;
          hasBA: boolean;
          edgeAB?: EdgeType;  // NEW: store the edge for weight display
          edgeBA?: EdgeType;  // NEW: store the edge for weight display
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
            info.edgeAB = e;  // NEW
          } else if (e.from === bId && e.to === aId) {
            info.hasBA = true;
            info.edgeBA = e;  // NEW
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

  const angleAB = Math.atan2(dy, dx);
  const angleBA = angleAB + Math.PI;

  // Check if we need to curve (both directions exist)
  const shouldCurve = info.hasAB && info.hasBA;
  const curveOffset = 40; // How much to curve

  if (info.hasAB) {
    const isHighlighted = info.edgeAB && highlightEdges.includes(info.edgeAB.id);
    const isVisited = info.edgeAB && visitedEdges.includes(info.edgeAB.id);

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    if (shouldCurve) {
      // Draw curved line
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      // Control point perpendicular to the line
      const controlX = midX - uy * curveOffset;
      const controlY = midY + ux * curveOffset;
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    } else {
      // Draw straight line
      ctx.lineTo(endX, endY);
    }

    ctx.strokeStyle = isHighlighted
      ? "#f97316"
      : isVisited
      ? "#22c55e"
      : "#3b82f6";
    ctx.lineWidth = isHighlighted ? 4 : isVisited ? 3.5 : 3;
    ctx.stroke();

    // Draw arrow head at the end
    if (shouldCurve) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const controlX = midX - uy * curveOffset;
      const controlY = midY + ux * curveOffset;
      const tangentAngle = Math.atan2(endY - controlY, endX - controlX);
      
      // NEW: Only draw arrowhead if not Kruskal selected in weighted mode
      if (!(graphType === "weighted" && (selectedAlgorithm === "kruskal" || selectedAlgorithm === "prim"))) {
        drawArrowHead(endX, endY, tangentAngle);
      }
    } else {
      // NEW: Only draw arrowhead if not Kruskal selected in weighted mode
      if (!(graphType === "weighted" && (selectedAlgorithm === "kruskal" || selectedAlgorithm === "prim"))) {
        drawArrowHead(endX, endY, angleAB);
      }
    }
    
    // Draw weight label for weighted graphs
    if (graphType === "weighted" && info.edgeAB) {
      const weight = info.edgeAB.weight ?? 1;
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      if (shouldCurve) {
        // Position label on the curve
        const offsetX = -uy * (curveOffset + 0);
        const offsetY = ux * (curveOffset + 0);
        drawWeightLabel(midX + offsetX, midY + offsetY, weight);
      } else {
        const offsetX = -uy * 15;
        const offsetY = ux * 15;
        drawWeightLabel(midX + offsetX, midY + offsetY, weight);
      }
    }
  }

  if (info.hasBA) {
    const isHighlighted = info.edgeBA && highlightEdges.includes(info.edgeBA.id);
    const isVisited = info.edgeBA && visitedEdges.includes(info.edgeBA.id);

    ctx.beginPath();
    ctx.moveTo(endX, endY);

    if (shouldCurve) {
      // Draw curved line in opposite direction
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      // Control point on opposite side
      const controlX = midX + uy * curveOffset;
      const controlY = midY - ux * curveOffset;
      ctx.quadraticCurveTo(controlX, controlY, startX, startY);
    } else {
      // Draw straight line
      ctx.lineTo(startX, startY);
    }

    ctx.strokeStyle = isHighlighted
      ? "#f97316"
      : isVisited
      ? "#22c55e"
      : "#3b82f6";
    ctx.lineWidth = isHighlighted ? 4 : isVisited ? 3.5 : 3;
    ctx.stroke();

    // Draw arrow head at the end
    if (shouldCurve) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const controlX = midX + uy * curveOffset;
      const controlY = midY - ux * curveOffset;
      const tangentAngle = Math.atan2(startY - controlY, startX - controlX);
      
      // NEW: Only draw arrowhead if not Kruskal selected in weighted mode
      if (!(graphType === "weighted" && (selectedAlgorithm === "kruskal" || selectedAlgorithm === "prim"))) {
        drawArrowHead(startX, startY, tangentAngle);
      }
    } else {
      // NEW: Only draw arrowhead if not Kruskal selected in weighted mode
      if (!(graphType === "weighted" && (selectedAlgorithm === "kruskal" || selectedAlgorithm === "prim"))) {
        drawArrowHead(startX, startY, angleBA);
      }
    }
    
    // Draw weight label for weighted graphs
    if (graphType === "weighted" && info.edgeBA) {
      const weight = info.edgeBA.weight ?? 1;
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      if (shouldCurve) {
        // Position label on the opposite curve
        const offsetX = uy * (curveOffset + 0);
        const offsetY = -ux * (curveOffset + 0);
        drawWeightLabel(midX + offsetX, midY + offsetY, weight);
      } else {
        const offsetX = uy * 15;
        const offsetY = -ux * 15;
        drawWeightLabel(midX + offsetX, midY + offsetY, weight);
      }
    }
  }
});
      } else {
        // UNDIRECTED ONLY
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
    selectedAlgorithm,
  ]);

  /*************************************************
   * UTILS
   *************************************************/
  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const pos = screenToWorld((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    return pos;
  };

  const screenToWorld = (x: number, y: number) => ({
  x: (x - offsetRef.current.x) / scaleRef.current,
  y: (y - offsetRef.current.y) / scaleRef.current,
  });

  const findNodeAt = (x: number, y: number): NodeType | null =>
    nodes.find((n) => Math.hypot(n.x - x, n.y - y) <= NODE_RADIUS) ?? null;

  const edgeExists = (a: number, b: number) =>
    edges.some((e) =>
      graphType === "directed" || graphType === "weighted"
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
  const curveOffset = 40;

  // Build pair map to detect bidirectional edges
  type PairInfo = {
    aId: number;
    bId: number;
    hasAB: boolean;
    hasBA: boolean;
    edgeAB?: EdgeType;
    edgeBA?: EdgeType;
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
      info.edgeAB = e;
    } else if (e.from === bId && e.to === aId) {
      info.hasBA = true;
      info.edgeBA = e;
    }

    pairMap.set(key, info);
  });

  // Helper function to check distance to quadratic Bezier curve
  const distanceToCurve = (
    x: number,
    y: number,
    startX: number,
    startY: number,
    controlX: number,
    controlY: number,
    endX: number,
    endY: number
  ): number => {
    let minDist = Infinity;
    // Sample points along the curve
    for (let t = 0; t <= 1; t += 0.05) {
      const curveX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
      const curveY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;
      const dist = Math.hypot(x - curveX, y - curveY);
      minDist = Math.min(minDist, dist);
    }
    return minDist;
  };

  // Check each pair for clicks
  for (const [, info] of pairMap) {
    const a = nodes.find((n) => n.id === info.aId);
    const b = nodes.find((n) => n.id === info.bId);
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

    const shouldCurve = info.hasAB && info.hasBA;

    // Check edge AB
    if (info.edgeAB) {
      if (shouldCurve) {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const controlX = midX - uy * curveOffset;
        const controlY = midY + ux * curveOffset;
        
        const dist = distanceToCurve(x, y, startX, startY, controlX, controlY, endX, endY);
        if (dist <= threshold) return info.edgeAB;
      } else {
        // Straight line check
        const lenSq = dx * dx + dy * dy;
        if (lenSq !== 0) {
          const t = ((x - startX) * (endX - startX) + (y - startY) * (endY - startY)) / 
                    ((endX - startX) * (endX - startX) + (endY - startY) * (endY - startY));
          if (t >= 0 && t <= 1) {
            const projX = startX + t * (endX - startX);
            const projY = startY + t * (endY - startY);
            const dist = Math.hypot(x - projX, y - projY);
            if (dist <= threshold) return info.edgeAB;
          }
        }
      }
    }

    // Check edge BA
    if (info.edgeBA) {
      if (shouldCurve) {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const controlX = midX + uy * curveOffset;
        const controlY = midY - ux * curveOffset;
        
        const dist = distanceToCurve(x, y, endX, endY, controlX, controlY, startX, startY);
        if (dist <= threshold) return info.edgeBA;
      } else {
        // Straight line check (reverse direction)
        const lenSq = dx * dx + dy * dy;
        if (lenSq !== 0) {
          const t = ((x - endX) * (startX - endX) + (y - endY) * (startY - endY)) / 
                    ((startX - endX) * (startX - endX) + (startY - endY) * (startY - endY));
          if (t >= 0 && t <= 1) {
            const projX = endX + t * (startX - endX);
            const projY = endY + t * (startY - endY);
            const dist = Math.hypot(x - projX, y - projY);
            if (dist <= threshold) return info.edgeBA;
          }
        }
      }
    }
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

  // Build pair map to detect bidirectional edges
  type PairInfo = {
    aId: number;
    bId: number;
    hasAB: boolean;
    hasBA: boolean;
    edgeAB?: EdgeType;
    edgeBA?: EdgeType;
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
      info.edgeAB = e;
    } else if (e.from === bId && e.to === aId) {
      info.hasBA = true;
      info.edgeBA = e;
    }

    pairMap.set(key, info);
  });

  const curveOffset = 20;

  // Check each pair
  for (const [, info] of pairMap) {
    const a = nodes.find((n) => n.id === info.aId);
    const b = nodes.find((n) => n.id === info.bId);
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

    const shouldCurve = info.hasAB && info.hasBA;

    // Check edge AB
    if (info.edgeAB) {
      const weight = info.edgeAB.weight ?? 1;
      const label = String(weight);
      const paddingX = 8;
      const textWidth = ctx.measureText(label).width;
      const boxWidth = textWidth + paddingX * 2;
      const boxHeight = 30;

      let labelX, labelY;
      if (shouldCurve) {
        const offsetX = -uy * (curveOffset + 20);
        const offsetY = ux * (curveOffset + 20);
        labelX = midX + offsetX;
        labelY = midY + offsetY;
      } else {
        const offsetX = -uy * 15;
        const offsetY = ux * 15;
        labelX = midX + offsetX;
        labelY = midY + offsetY;
      }

      const boxX = labelX - boxWidth / 2;
      const boxY = labelY - boxHeight / 2 - 8;

      if (
        x >= boxX &&
        x <= boxX + boxWidth &&
        y >= boxY &&
        y <= boxY + boxHeight
      ) {
        return info.edgeAB;
      }
    }

    // Check edge BA
    if (info.edgeBA) {
      const weight = info.edgeBA.weight ?? 1;
      const label = String(weight);
      const paddingX = 8;
      const textWidth = ctx.measureText(label).width;
      const boxWidth = textWidth + paddingX * 2;
      const boxHeight = 30;

      let labelX, labelY;
      if (shouldCurve) {
        const offsetX = uy * (curveOffset + 20);
        const offsetY = -ux * (curveOffset + 20);
        labelX = midX + offsetX;
        labelY = midY + offsetY;
      } else {
        const offsetX = uy * 15;
        const offsetY = -ux * 15;
        labelX = midX + offsetX;
        labelY = midY + offsetY;
      }

      const boxX = labelX - boxWidth / 2;
      const boxY = labelY - boxHeight / 2 - 8;

      if (
        x >= boxX &&
        x <= boxX + boxWidth &&
        y >= boxY &&
        y <= boxY + boxHeight
      ) {
        return info.edgeBA;
      }
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
  if (e.button === 1) { // middle mouse
    isPanningRef.current = true;
    lastPanPosRef.current = { x: e.clientX, y: e.clientY };
    return;
  } 
  if (isDisabled) return;  

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

  // FIXED: use world coordinates directly
  const pos = getPos(e);
  const newId = nodes.length ? Math.max(...nodes.map((n) => n.id)) + 1 : 1;
  const newNodes: NodeType[] = [...nodes, { id: newId, x: pos.x, y: pos.y }];
  onGraphChange(newNodes, edges);
  setSelectedForEdge(null);
};


 const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; // screen coords
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(scaleRef.current * zoomFactor, 0.2), 5);

    // Compute mouse position in world coordinates **before zoom**
    const worldX = (mouseX - offsetRef.current.x) / scaleRef.current;
    const worldY = (mouseY - offsetRef.current.y) / scaleRef.current;

    scaleRef.current = newScale;

    // Adjust offset so zoom centers on cursor
    offsetRef.current.x = mouseX - worldX * scaleRef.current;
    offsetRef.current.y = mouseY - worldY * scaleRef.current;

    draw();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanningRef.current) {
        const dx = e.clientX - lastPanPosRef.current.x;
        const dy = e.clientY - lastPanPosRef.current.y;

        offsetRef.current.x += dx;
        offsetRef.current.y += dy;

        lastPanPosRef.current = { x: e.clientX, y: e.clientY };
        draw();
        return;
      }
    if (isDisabled) return;

    if (dragging == null) return;  
    

    const { x, y } = getPos(e);
    const newNodes: NodeType[] = nodes.map((n) =>
      n.id === dragging ? { ...n, x: x - offset.x, y: y - offset.y } : n
    );
    onGraphChange(newNodes, edges);
  };

  const handleMouseUp = () => {
    isPanningRef.current = false;
    setDragging(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDisabled) return;
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
    if (isDisabled) return;
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
        className={`graph-canvas${isDisabled ? ' disabled' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
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
