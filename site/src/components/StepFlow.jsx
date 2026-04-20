import ReactMarkdown from "react-markdown";
import { useState } from "react";
import "./StepFlowStyle.css"

const arrowV = (accent, length = 28) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
    <div
      style={{
        width: 2,
        height: length,
        background: `linear-gradient(to bottom, ${accent}, ${accent}88)`,
      }}
    />
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ display: "block", margin: 0 }}>
      <path d="M8 10L0.5 0.5H15.5L8 10Z" fill={accent} />
    </svg>
  </div>
);

const arrowH = (accent, length = 28) => (
  <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
    <div
      style={{
        height: 2,
        width: length,
        background: `linear-gradient(to right, ${accent}, ${accent}88)`,
      }}
    />
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none" style={{ display: "block" }}>
      <path d="M10 8L0.5 15.5V0.5L10 8Z" fill={accent} />
    </svg>
  </div>
);

function StepBox({ step, index, accent, numbered, compact, isActive, onToggle }) {
  const hasDescription = Boolean(step.description);
  const hasIcon  = Boolean(step.icon);

  return (
    <div
      onClick={hasDescription ? onToggle : undefined}
      role={hasDescription ? "button" : undefined}
      tabIndex={hasDescription ? 0 : undefined}
      onKeyDown={hasDescription ? (e) => e.key === "Enter" && onToggle() : undefined}
      className="stepbox"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: compact ? 10 : 14,
        padding: compact ? "10px 14px" : "14px 18px",
        borderRadius: 10,
        border: `1.5px solid ${isActive ? accent : "#d4d4d8"}`,
        background: isActive ? `${accent}0a` : "#fff",
        cursor: hasDescription ? "pointer" : "default",
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
        boxShadow: isActive ? `0 2px 12px ${accent}18` : "0 1px 3px rgba(0,0,0,0.04)",
        maxWidth: 420,
        width: "100%",
        userSelect: "none",
      }}
    >
      {hasIcon && <div
        style={{
          width: compact ? 28 : 32,
          height: compact ? 28 : 32,
          borderRadius: "50%",
          background: isActive ? accent : `${accent}1a`,
          color: isActive ? "#fff" : accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: compact ? 13 : 14,
          flexShrink: 0,
          transition: "background 0.2s, color 0.2s",
        }}
      >
        {step.icon ? (
          <span style={{ fontSize: compact ? 15 : 17, lineHeight: 1 }}>{step.icon}</span>
        ) : numbered ? (
          index + 1
        ) : (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isActive ? "#fff" : accent,
            }}
          />
        )}
      </div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: compact ? 14 : 15,
            lineHeight: 1.4,
            color: "#1e1e2e",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
            <ReactMarkdown components={{ p: ({ children }) => <div className="md-content">{children}</div> }}>{step.label}</ReactMarkdown>
          {hasDescription && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
              style={{
                transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                opacity: 0.4,
                flexShrink: 0,
              }}
            >
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        {hasDescription && isActive && (
          <div style={{ marginTop: 6, fontSize: compact ? 13 : 14, lineHeight: 1.55, color: "#555" }}>
            {step.description}
          </div>
        )}
      </div>
    </div>
  );
}

export function StepFlow({ steps = [], direction = "vertical", accent = "#5b21b6", compact = false, numbered = false }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const isHorizontal = direction === "horizontal";
  const toggle = (i) => setActiveIndex((prev) => (prev === i ? null : i));

  return (
    <div className="stepflow"
      style={{
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        alignItems: isHorizontal ? "center" : "stretch",
        gap: 0,
        padding: "8px 0",
        overflowX: isHorizontal ? "auto" : undefined,
      }}
    >
      {steps.map((step, i) => (
        <div className="stepflow-content"
          key={i}
          style={{
            flexDirection: isHorizontal ? "row" : "column",
          }}
        >
          <StepBox
            step={step}
            index={i}
            accent={accent}
            numbered={numbered}
            compact={compact}
            isActive={activeIndex === i}
            onToggle={() => toggle(i)}
          />
          {i < steps.length - 1 && (
            <div
            className="stepflow-arrow-wrapper"
              style={{
                padding: isHorizontal ? "0 4px" : "0",
                alignSelf: isHorizontal ? "center" : undefined,
                marginLeft: isHorizontal ? 0 : compact ? 23 : 25,
              }}
            >
              {isHorizontal ? arrowH(accent) : arrowV(accent)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
