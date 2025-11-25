import { GraphType, NodeType, EdgeType } from "../types/graph";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

export const layoutNodesInCircle = (ids: number[]): NodeType[] => {
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

export const generateRandomGraph = (
  graphType: GraphType
): { nodes: NodeType[]; edges: EdgeType[] } => {
  const minNodes = 4;
  const maxNodes = 10;
  const n =
    Math.floor(Math.random() * (maxNodes - minNodes + 1)) + minNodes;

  const ids = Array.from({ length: n }, (_, i) => i + 1);
  const nodes = layoutNodesInCircle(ids);

  const edges: EdgeType[] = [];
  let edgeId = 1;

  if (graphType === "directed") {
    const prob = 0.25;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        if (Math.random() < prob) {
          edges.push({
            id: edgeId++,
            from: ids[i],
            to: ids[j],
          });
        }
      }
    }
  } else {
    // undirected / weighted
    const prob = 0.35;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.random() < prob) {
          const from = ids[i];
          const to = ids[j];
          const edge: EdgeType = {
            id: edgeId++,
            from,
            to,
          };
          if (graphType === "weighted") {
            edge.weight = 1 + Math.floor(Math.random() * 9); // 1..9
          }
          edges.push(edge);
        }
      }
    }
  }

  if (edges.length === 0 && n > 1) {
    const from = ids[0];
    const to = ids[1];
    const edge: EdgeType = { id: edgeId++, from, to };
    if (graphType === "weighted") {
      edge.weight = 1 + Math.floor(Math.random() * 9);
    }
    edges.push(edge);
  }

  return { nodes, edges };
};

export const parseExportFormat = (text: string): {
  graphType: GraphType;
  nodes: NodeType[];
  edges: EdgeType[];
} => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    throw new Error("File is empty.");
  }

  const first = lines[0].toLowerCase();
  if (first !== "undirected" && first !== "directed" && first !== "weighted") {
    throw new Error(
      'Invalid graph type on first line. Expected "undirected", "directed" or "weighted".'
    );
  }
  const importedType = first as GraphType;

  const idSet = new Set<number>();
  const edges: EdgeType[] = [];
  let edgeId = 1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/\s+/);

    if (parts.length === 1) {
      const id = Number(parts[0]);
      if (Number.isNaN(id)) {
        throw new Error(`Invalid node id on line: "${line}"`);
      }
      idSet.add(id);
    } else if (parts.length >= 2) {
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      if (Number.isNaN(a) || Number.isNaN(b)) {
        throw new Error(
          `Invalid edge endpoints (must be numbers) on line: "${line}"`
        );
      }
      idSet.add(a);
      idSet.add(b);

      let weight: number | undefined = undefined;
      if (importedType === "weighted" && parts[2] !== undefined) {
        const w = Number(parts[2]);
        if (Number.isNaN(w)) {
          throw new Error(`Invalid weight on line: "${line}"`);
        }
        weight = w;
      }

      edges.push({ id: edgeId++, from: a, to: b, weight });
    }
  }

  const ids = Array.from(idSet).sort((a, b) => a - b);
  const nodes = layoutNodesInCircle(ids);

  return { graphType: importedType, nodes, edges };
};