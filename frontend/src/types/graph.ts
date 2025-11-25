export type GraphType = "undirected" | "directed" | "weighted";

export type NodeType = {
  id: number;
  x: number;
  y: number;
};

export type EdgeType = {
  id: number;
  from: number;
  to: number;
  weight?: number;
};
