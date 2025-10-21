export default function Node({ label, x, y, onDelete }) {
  return (
    <g>
      <circle cx={x} cy={y} r={30} fill="#60a5fa" stroke="black" strokeWidth={2} />
      <text x={x} y={y + 5} textAnchor="middle" fill="white" fontSize="18px" fontWeight="bold">
        {label}
      </text>
      <text
        x={x + 25}
        y={y - 25}
        fill="red"
        fontSize="14px"
        fontWeight="bold"
        style={{ cursor: "pointer" }}
        onClick={() => onDelete(label)}
      >
        ✕
      </text>
    </g>
  );
}
