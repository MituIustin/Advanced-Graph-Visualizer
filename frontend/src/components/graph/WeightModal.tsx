import React from "react";
import "../../styles/graph_canvas.css";

interface WeightModalProps {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

const WeightModal: React.FC<WeightModalProps> = ({
  value,
  onChange,
  onCancel,
  onSave,
}) => {
  return (
    <div className="weight-modal-backdrop">
      <div className="weight-modal">
        <div className="weight-modal-title">Edit edge weight</div>
        <div className="weight-modal-text">
          Set the weight for the selected edge.
        </div>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="weight-modal-input"
        />
        <div className="weight-modal-buttons">
          <button
            type="button"
            onClick={onCancel}
            className="weight-modal-button cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="weight-modal-button save"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeightModal;
