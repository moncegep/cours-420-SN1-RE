import { BLOCK_COLORS, CELL } from "./constants";

// Block Component
export function Block({ type, x, y, isTop }) {
  const colors = BLOCK_COLORS[type] || BLOCK_COLORS["#"];
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={CELL - 2} height={CELL - 2}
        x={1} y={1} rx={3}
        fill={colors.bg} stroke={colors.border} strokeWidth={1.5}
      />
      {isTop && (
        <rect
          width={CELL - 4} height={4}
          x={2} y={2} rx={1}
          fill={colors.top} opacity={0.6}
        />
      )}
      {type === "#" && (
        <>
          <line x1={CELL / 2} y1={1} x2={CELL / 2} y2={CELL / 2 - 1} stroke={colors.border} strokeWidth={0.8} />
          <line x1={1} y1={CELL / 2 - 1} x2={CELL - 1} y2={CELL / 2 - 1} stroke={colors.border} strokeWidth={0.8} />
          <line x1={CELL / 4} y1={CELL / 2 - 1} x2={CELL / 4} y2={CELL - 1} stroke={colors.border} strokeWidth={0.8} />
          <line x1={CELL * 3 / 4} y1={CELL / 2 - 1} x2={CELL * 3 / 4} y2={CELL - 1} stroke={colors.border} strokeWidth={0.8} />
        </>
      )}
      {colors.label && (
        <text
          x={CELL / 2} y={CELL / 2 + 1}
          textAnchor="middle" dominantBaseline="middle"
          fill="white"
          fontSize={type === "?" ? 16 : 14}
          fontWeight="bold" fontFamily="monospace"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
        >
          {colors.label}
        </text>
      )}
    </g>
  );
}

// Mario Sprite
export function Mario({ x, y, state, speed }) {
  const jumping = state?.includes("monte") || state?.includes("super") || state === "départ";
  const falling = state?.includes("trou");
  const blocked = state === "mur";
  const sprinting = speed === 2;

  const bodyColor = "#E03030";
  const skinColor = "#FFCC99";
  const overallColor = "#2060CC";

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{
        transition: "transform 0.3s ease",
        filter: blocked ? "hue-rotate(180deg) brightness(0.7)" : falling ? "brightness(0.5)" : "none",
      }}
    >
      {sprinting && (
        <>
          <line x1={-8} y1={-8}  x2={-16} y2={-6}  stroke="#FF69B4" strokeWidth={2} opacity={0.5} />
          <line x1={-8} y1={-14} x2={-18} y2={-14} stroke="#FF69B4" strokeWidth={2} opacity={0.3} />
          <line x1={-8} y1={-20} x2={-14} y2={-22} stroke="#FF69B4" strokeWidth={2} opacity={0.4} />
        </>
      )}
      <rect x={-8} y={-28} width={20} height={6} rx={2} fill={bodyColor} />
      <rect x={-4} y={-32} width={14} height={5} rx={2} fill={bodyColor} />
      <rect x={-6} y={-22} width={16} height={10} rx={3} fill={skinColor} />
      <circle cx={1} cy={-18} r={2} fill="#222" />
      <circle cx={8} cy={-18} r={2} fill="#222" />
      <path d="M -2,-14 Q 4,-11 10,-14" fill="none" stroke="#5C3317" strokeWidth={2} />
      <rect x={-6} y={-12} width={16} height={12} rx={2} fill={bodyColor} />
      <rect x={-4} y={-6}  width={12} height={8}  rx={1} fill={overallColor} />
      <rect x={-4} y={2}   width={5}  height={6}  rx={1} fill={overallColor} />
      <rect x={3}  y={2}   width={5}  height={6}  rx={1} fill={overallColor} />
      <rect x={-5} y={6}   width={7}  height={4}  rx={2} fill="#6B3E26" />
      <rect x={2}  y={6}   width={7}  height={4}  rx={2} fill="#6B3E26" />
      {jumping && (
        <>
          <circle cx={-12} cy={4} r={2}   fill="#FFD700" opacity={0.8} />
          <circle cx={14}  cy={2} r={1.5} fill="#FFD700" opacity={0.6} />
        </>
      )}
      {blocked && (
        <>
          <line x1={-1} y1={-20} x2={3}  y2={-16} stroke="#FF0000" strokeWidth={1.5} />
          <line x1={3}  y1={-20} x2={-1} y2={-16} stroke="#FF0000" strokeWidth={1.5} />
          <line x1={6}  y1={-20} x2={10} y2={-16} stroke="#FF0000" strokeWidth={1.5} />
          <line x1={10} y1={-20} x2={6}  y2={-16} stroke="#FF0000" strokeWidth={1.5} />
        </>
      )}
    </g>
  );
}