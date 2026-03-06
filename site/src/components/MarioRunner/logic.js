// ── Parser ──────────────────────────────────────────────────
export function parseLevel(text) {
  const lines = text.replace(/\r\n/g, "\n").trimEnd().split("\n");
  if (!lines.length || (lines.length === 1 && !lines[0].trim())) return null;

  const maxLen = Math.max(...lines.map((l) => l.length));
  const cols = Math.floor((maxLen + 2) / 3);
  const rows = lines.length;

  const heights = [];
  const surfaces = [];
  const warnings = [];

  for (let col = 0; col < cols; col++) {
    let height = 0;
    let surface = "";
    let foundTop = false;
    let hasInternalGap = false;

    for (let row = 0; row < rows; row++) {
      const start = col * 3;
      const cell = lines[row].substring(start, start + 3).padEnd(3);
      const ch = cell[1] || " ";
      const isSolid = ch === "#" || ch === "^" || ch === ">" || ch === "<";

      if (isSolid) {
        if (!foundTop) {
          height = rows - row;
          surface = ch;
          foundTop = true;
        }
      } else if (foundTop && cell.trim() === "") {
        hasInternalGap = true;
      }
    }
    if (hasInternalGap) warnings.push(`Colonne ${col} : bloc flottant`);
    heights.push(height);
    surfaces.push(surface);
  }

  return { heights, surfaces, rows, cols, warnings, lines };
}

// ── Resolve [?] ─────────────────────────────────────────────
export function resolveRandom(text) {
  let result = "";
  let count = 0;
  let i = 0;
  while (i < text.length) {
    if (text.substring(i, i + 3) === "[?]") {
      const options = ["[#]", "[ ]", "[^]", "[>]", "[<]"];
      result += options[Math.floor(Math.random() * 5)];
      count++;
      i += 3;
    } else {
      result += text[i];
      i++;
    }
  }
  return { resolved: result, count };
}

// ── Simulator ───────────────────────────────────────────────
export function simulate(heights, surfaces) {
  const n = heights.length;
  if (!n) return { success: false, trace: [] };

  const trace = [];
  let h = heights[0];
  let speed = 1;

  if (h === 0) {
    trace.push({ col: 0, h: 0, action: "trou", speed: 1 });
    return { success: false, trace };
  }

  if (surfaces[0] === ">") speed = 2;
  trace.push({ col: 0, h, action: "départ", speed });

  let col = 0;
  while (true) {
    const next = col + speed;
    if (next >= n) break;

    const hNext = heights[next];
    if (hNext === 0) {
      trace.push({
        col: next,
        h: 0,
        action: speed === 2 ? "trou-sprint" : "trou",
        speed,
      });
      return { success: false, trace };
    }

    const diff = hNext - h;
    const maxJump = surfaces[col] === "^" ? 2 : 1;
    if (diff > maxJump) {
      trace.push({ col: next, h: hNext, action: "mur", speed });
      return { success: false, trace };
    }

    let action;
    if (diff === 2) action = "super-saut";
    else if (diff === 1) action = "monte";
    else if (diff === 0) action = "marche";
    else action = "descend";
    if (speed === 2) action += "-sprint";

    h = hNext;
    col = next;
    if (surfaces[col] === ">") speed = 2;
    else if (surfaces[col] === "<") speed = 1;

    trace.push({ col, h, action, speed });
  }

  return { success: true, trace };
}