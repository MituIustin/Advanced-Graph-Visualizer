import React, { useState } from "react";
import GraphInputPanel from "./GraphInputPanel";
import { GraphType, NodeType, EdgeType } from "../../types/graph";
import { InputMethod, ImportSource } from "../../types/ui";
import { parseExportFormat } from "../../utils/graphHelpers";

interface Props {
  graphType: GraphType;
  inputMethod: InputMethod;
  nodes: NodeType[];
  edges: EdgeType[];
  onInputMethodChange: (method: InputMethod) => void;
  onGraphChangeFromText: (nodes: NodeType[], edges: EdgeType[]) => void;
  onGenerateRandom: () => void;
  onExportGraph: () => void;
  onImportGraph: (
    graphType: GraphType,
    nodes: NodeType[],
    edges: EdgeType[]
  ) => void;
}

const GraphSidebar: React.FC<Props> = ({
  graphType,
  inputMethod,
  nodes,
  edges,
  onInputMethodChange,
  onGraphChangeFromText,
  onGenerateRandom,
  onExportGraph,
  onImportGraph,
}) => {
  const [importSource, setImportSource] = useState<ImportSource>("local");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleLocalFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setImportError(null);
  };

  const handleImportClick = () => {
    if (importSource === "account") {
      alert("Import from account is not implemented yet.");
      return;
    }

    if (!selectedFile) {
      setImportError("Please select a file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const result = parseExportFormat(text);

        onImportGraph(result.graphType, result.nodes, result.edges);
        setImportError(null);
      } catch (err: any) {
        setImportError(err.message ?? "Failed to import graph.");
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read file.");
    };
    reader.readAsText(selectedFile);
  };

  return (
    <>
      <h2 style={{ marginBottom: 20, marginTop:10, fontSize:25 }}>Graph input</h2>

      <div className="input-method-row">
        <label style={{ marginLeft:10, fontSize:18 }}>Mode:</label>
        <select style={{fontSize:18}}
          value={inputMethod}
          onChange={(e) => onInputMethodChange(e.target.value as InputMethod)}
        >
          <option value="text" style={{fontSize:18}}>Text</option>
          <option value="file" style={{fontSize:18}}>File import</option>
          <option value="random" style={{fontSize:18}}>Random graph</option>
        </select>
      </div>

      {inputMethod === "text" && (
        <GraphInputPanel
          graphType={graphType}
          nodes={nodes}
          edges={edges}
          onGraphChange={onGraphChangeFromText}
        />
      )}

      {inputMethod === "file" && (
        <div
          style={{
            fontSize: 13,
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div>
            <h2 style={{ marginBottom: 20, marginTop:10, fontSize:25 }}>Import source</h2>
            <div style={{ marginTop: 4 }}>
              <label style={{ marginRight: 8, fontSize:20 }}>
                <input
                  type="radio"
                  checked={importSource === "local"}
                  onChange={() => setImportSource("local")}
                />{" "}
                Local file
              </label>
              <br></br>
              <label style={{ marginRight: 8, fontSize:20 }}>
                <input
                  type="radio"
                  checked={importSource === "account"}
                  onChange={() => setImportSource("account")}
                />{" "}
                From account (coming soon)
              </label>
            </div>
          </div>

          {importSource === "local" && (
            <>
              <input
                type="file"
                accept=".txt"
                onChange={handleLocalFileChange}
              />
              <div className="panel-left-button-row">
                <button type="button" onClick={handleImportClick}>
                  Import graph
                </button>
              </div>
              {importError && (
                <div className="error" style={{ marginTop: 4 }}>
                  {importError}
                </div>
              )}
            </>
          )}

          {importSource === "account" && (
            <p style={{ color: "#9ca3af", marginTop: 4 }}>
              Importing graphs from your account will be available later.
            </p>
          )}
        </div>
      )}

      {inputMethod === "random" && (
        <div
          style={{
            fontSize: 13,
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#9ca3af", fontSize: 20 }}>
            Generate a random{" "}
            <strong>
              {graphType === "undirected"
                ? "undirected"
                : graphType === "directed"
                ? "directed"
                : "weighted"}
            </strong>{" "}
            graph with a random number of nodes and edges.
          </p>
          <button type="button" onClick={onGenerateRandom}>
            Generate random graph
          </button>
          {nodes.length > 0 && (
            <p style={{ fontSize: 16, color: "#9ca3af", marginTop: 4 }}>
              Current graph: <strong>{nodes.length}</strong> nodes,{" "}
              <strong>{edges.length}</strong> edges.
            </p>
          )}
        </div>
      )}

      <div className="panel-left-export-row">
        <button
          type="button"
          className="export-button"
          onClick={onExportGraph}
        >
          Export Graph
        </button>
      </div>
    </>
  );
};

export default GraphSidebar;
