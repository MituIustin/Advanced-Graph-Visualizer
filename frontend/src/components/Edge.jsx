export default function Edge({ id, from, to }) {
  if (!from || !to) return null;

  return (
    <line
      key={id}
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke="#888"
      strokeWidth={3}
    />
  );
}
