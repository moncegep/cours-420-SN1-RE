// ── Block types ─────────────────────────────────────────────
export const BLOCK = {
  SOLID: "#",
  EMPTY: " ",
  TRAMP: "^",
  ACCEL: ">",
  DECEL: "<",
  RANDOM: "?",
};

export const BLOCK_COLORS = {
  "#": { bg: "#8B4513", border: "#A0522D", top: "#D2691E", label: "" },
  "^": { bg: "#00A86B", border: "#00CC7E", top: "#33FFAA", label: "^" },
  ">": { bg: "#C71585", border: "#E91E9F", top: "#FF69B4", label: "»" },
  "<": { bg: "#4169E1", border: "#5B7FFF", top: "#87CEEB", label: "«" },
  "?": { bg: "#FFD700", border: "#FFA500", top: "#FFEC8B", label: "?" },
};

export const ACTION_INFO = {
  "départ":            { icon: "🏁", label: "Départ",           color: "#60A5FA" },
  "marche":            { icon: "→",  label: "Marche",           color: "#34D399" },
  "marche-sprint":     { icon: "⇒",  label: "Sprint",           color: "#F472B6" },
  "monte":             { icon: "↑",  label: "Monte",            color: "#FBBF24" },
  "monte-sprint":      { icon: "⇑",  label: "Monte sprint",     color: "#F472B6" },
  "super-saut":        { icon: "⬆",  label: "Super-saut",       color: "#22D3EE" },
  "super-saut-sprint": { icon: "⬆",  label: "Super-saut sprint", color: "#22D3EE" },
  "descend":           { icon: "↓",  label: "Descend",          color: "#34D399" },
  "descend-sprint":    { icon: "⇓",  label: "Descend sprint",   color: "#F472B6" },
  "trou":              { icon: "☠",  label: "TROU",             color: "#EF4444" },
  "trou-sprint":       { icon: "☠",  label: "TROU sprint",      color: "#EF4444" },
  "mur":               { icon: "🧱", label: "MUR",              color: "#EF4444" },
};

export const CELL = 36;
export const MARIO_OFFSET = CELL + 4;

export const SAMPLE_LEVEL = `      [#]               [#]
   [#][#][#]   [^]   [#][#][#]
[#][#][#][#][#][#][#][#][#][#][#][>][#][#][#]`;