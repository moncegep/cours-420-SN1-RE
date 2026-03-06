import { useRef, useEffect } from "react";
import { CELL, MARIO_OFFSET, ACTION_INFO } from "./constants";
import { Block, Mario } from "./BlockAndMario";

// ── Level Grid (SVG) ────────────────────────────────────────
export function LevelGrid({ heights, surfaces, rows, marioCol, marioAction, marioSpeed, traceUpTo }) {
  const cols = heights.length;
  const svgW = cols * CELL + 20;
  const svgH = (rows + 2) * CELL;

  const marioH = heights[marioCol] || 1;
  const marioX = marioCol * CELL + CELL / 2 + 10;
  const marioY = svgH - marioH * CELL - MARIO_OFFSET;

  const visited = new Set();
  if (traceUpTo) {
    for (let i = 0; i < traceUpTo.length; i++) visited.add(traceUpTo[i].col);
  }

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{
        maxWidth: svgW,
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
        borderRadius: 12,
        display: "block",
      }}
    >
      {/* Stars */}
      {Array.from({ length: 20 }, (_, i) => (
        <circle
          key={`star-${i}`}
          cx={(i * 137 + 41) % svgW}
          cy={(i * 89 + 17) % (svgH * 0.4)}
          r={i % 3 === 0 ? 1.5 : 1}
          fill="white"
          opacity={0.3 + (i % 4) * 0.15}
        />
      ))}

      {/* Ground line */}
      <rect x={10} y={svgH - CELL + 8} width={cols * CELL} height={4} rx={2} fill="#2d5016" opacity={0.5} />

      {/* Blocks */}
      {heights.map((h, col) =>
        Array.from({ length: h }, (_, row) => {
          const x = col * CELL + 10;
          const y = svgH - (row + 1) * CELL;
          const isTop = row === h - 1;
          const type = isTop ? (surfaces[col] || "#") : "#";
          return <Block key={`${col}-${row}`} type={type} x={x} y={y} isTop={isTop} />;
        })
      )}

      {/* Column numbers */}
      {heights.map((_, col) => (
        <text
          key={`col-${col}`}
          x={col * CELL + CELL / 2 + 10}
          y={svgH - 4}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize={9}
          fontFamily="monospace"
        >
          {col}
        </text>
      ))}

      {/* Mario */}
      {marioCol >= 0 && (
        <Mario
          x={marioX}
          y={marioAction?.includes("trou") ? svgH - 10 : marioY}
          state={marioAction}
          speed={marioSpeed}
        />
      )}

      {/* Flag at end */}
      <g transform={`translate(${(cols - 1) * CELL + CELL / 2 + 10}, ${svgH - heights[cols - 1] * CELL - CELL - 10})`}>
        <line x1={0} y1={0} x2={0} y2={-30} stroke="#DDD" strokeWidth={2} />
        <polygon points="0,-30 18,-24 0,-18" fill="#e74c3c" opacity={0.8} />
      </g>
    </svg>
  );
}

// ── Trace Panel ─────────────────────────────────────────────
export function TracePanel({ trace, currentStep }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && currentStep >= 0) {
      const el = ref.current.children[currentStep];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentStep]);

  return (
    <div
      ref={ref}
      style={{
        maxHeight: 280,
        overflowY: "auto",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 13,
        lineHeight: "22px",
      }}
    >
      {trace.map((step, i) => {
        const info = ACTION_INFO[step.action] || { icon: "?", label: step.action, color: "#999" };
        const active = i === currentStep;
        const past = i < currentStep;
        return (
          <div
            key={i}
            style={{
              padding: "3px 8px",
              borderRadius: 4,
              background: active ? "rgba(255,255,255,0.08)" : "transparent",
              opacity: past ? 0.5 : 1,
              borderLeft: active ? `3px solid ${info.color}` : "3px solid transparent",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span style={{ color: "#666", width: 28, flexShrink: 0 }}>{i}</span>
            <span style={{ width: 36, flexShrink: 0, color: "#888" }}>C{step.col}</span>
            <span style={{ width: 36, flexShrink: 0, color: "#888" }}>
              {step.h > 0 ? `H${step.h}` : "--"}
            </span>
            <span style={{ color: info.color, fontWeight: active ? 700 : 400 }}>
              {info.icon} {info.label}
            </span>
            {step.speed > 1 && (
              <span style={{ color: "#F472B6", fontSize: 11 }}>×{step.speed}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Summary ─────────────────────────────────────────────────
export function Summary({ heights, surfaces, trace, success, resolvedCount }) {
  const distinct = new Set(heights).size;
  const ups = trace.filter((t) => t.action.includes("monte") || t.action.includes("super")).length;
  const downs = trace.filter((t) => t.action.includes("descend")).length;
  const sprints = trace.filter((t) => t.action.includes("sprint")).length;
  const tramps = surfaces.filter((s) => s === "^").length;
  const accels = surfaces.filter((s) => s === ">").length;
  const decels = surfaces.filter((s) => s === "<").length;
  const holes = heights.filter((h) => h === 0).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: 14 }}>
      <div style={{ gridColumn: "1 / -1", fontWeight: 700, fontSize: 16, marginBottom: 4, color: success ? "#34D399" : "#EF4444" }}>
        {success ? "Mario a réussi !" : "Mario a échoué"}
      </div>
      <Stat label="Colonnes" value={heights.length} />
      <Stat label="Hauteurs distinctes" value={distinct} />
      <Stat label="Montées" value={ups} color="#FBBF24" />
      <Stat label="Descentes" value={downs} color="#34D399" />
      <Stat label="Sprints" value={sprints} color="#F472B6" />
      <Stat label="Trous" value={holes} color={holes > 0 ? "#EF4444" : undefined} />
      {tramps > 0 && <Stat label="Trampolines [^]" value={tramps} color="#22D3EE" />}
      {accels > 0 && <Stat label="Accélérateurs [>]" value={accels} color="#F472B6" />}
      {decels > 0 && <Stat label="Décélérateurs [<]" value={decels} color="#60A5FA" />}
      {resolvedCount > 0 && <Stat label="[?] résolus" value={resolvedCount} color="#FBBF24" />}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
      <span style={{ color: "#999" }}>{label}</span>
      <span style={{ fontWeight: 600, fontFamily: "monospace", color: color || "#E2E8F0" }}>{value}</span>
    </div>
  );
}