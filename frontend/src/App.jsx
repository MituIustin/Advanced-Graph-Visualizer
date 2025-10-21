import { useState, useEffect } from "react";
import Node from "./components/Node";
import Edge from "./components/Edge";
import {
  getNodes,
  addNode,
  deleteNode,
  getEdges,
  addEdge,
  deleteEdge,
} from "./api";

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Generăm poziție random care nu se suprapune
  const generatePosition = (existingNodes) => {
    let x, y, safe;
    do {
      safe = true;
      x = Math.floor(Math.random() * 800) + 50;
      y = Math.floor(Math.random() * 500) + 50;
      for (let n of existingNodes) {
        if (Math.hypot(n.x - x, n.y - y) < 80) { // distanță minimă
          safe = false;
          break;
        }
      }
    } while (!safe);
    return { x, y };
  };

  const loadData = async () => {
    const nodesData = await getNodes();
    const edgesData = await getEdges();

    // Dacă nodurile nu au x/y, generăm poziții random
    const positionedNodes = nodesData.map((n, i) => ({
      ...n,
      x: nodes[i]?.x || Math.floor(Math.random() * 800) + 50,
      y: nodes[i]?.y || Math.floor(Math.random() * 500) + 50,
    }));

    setNodes(positionedNodes);
    setEdges(edgesData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNode = async () => {
    const label = prompt("Label pentru nod:");
    if (!label) return;
    const newNode = await addNode(label);

    // Generăm poziție care nu se suprapune
    const pos = generatePosition(nodes);
    setNodes((prev) => [...prev, { ...newNode, ...pos }]);
  };

  const handleAddEdge = async () => {
    if (nodes.length < 2) {
      alert("Trebuie cel puțin două noduri.");
      return;
    }
    const source = prompt("ID sursă:");
    const target = prompt("ID destinație:");
    if (!source || !target) return;
    await addEdge(source, target);
    loadData();
  };

  const handleDeleteNode = async (id) => {
    await deleteNode(id);
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source_id !== id && e.target_id !== id));
  };

  const handleDeleteEdge = async () => {
    const id = prompt("ID muchie de șters:");
    if (!id) return;
    await deleteEdge(id);
    setEdges((prev) => prev.filter((e) => e.id !== parseInt(id)));
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <svg width={900} height={600} style={{ border: "1px solid #ddd" }}>
        {/* muchii */}
        {edges.map((e) => {
          const from = nodes.find((n) => n.id === e.source_id);
          const to = nodes.find((n) => n.id === e.target_id);
          if (!from || !to) return null;
          return <Edge key={e.id} id={e.id} from={from} to={to} />;
        })}

        {/* noduri */}
        {nodes.map((n) => (
          <Node key={n.id} label={n.label} x={n.x} y={n.y} onDelete={handleDeleteNode} />
        ))}
      </svg>

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleAddNode}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
        >
          Add Node
        </button>
        <button
          onClick={handleAddEdge}
          className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
        >
          Add Edge
        </button>
        <button
          onClick={handleDeleteEdge}
          className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600"
        >
          Delete Edge
        </button>
      </div>
    </div>
  );
}

export default App;
