import { isEmpty, isNullOrUndefined } from "@protolabo/zenjs"
import React, { useMemo, useState, useRef, useCallback } from "react";
import {
  Trash2, Plus, Play, RotateCcw, GripVertical, Eye, EyeOff,
  ChevronRight, ArrowDownUp, ArrowDownAZ, XCircle, Grid3X3,
  List, Layers, Package, Table2, Minus, RotateCw,
  ArrowLeftCircle,
} from "lucide-react";
import "./styles.css";


const C = {
  bg: "#141627", surface: "#1e2038", surfaceAlt: "#252845",
  border: "#333660", accent: "#7c6cf0",
  accentGlow: "rgba(124,108,240,0.30)", accentSoft: "rgba(124,108,240,0.13)",
  danger: "#ef4466", dangerSoft: "rgba(239,68,102,0.12)",
  text: "#e2e5f0", textMuted: "#8b90b0", textDim: "#555980",
  code: "#0d1017", codeText: "#c9d1d9", white: "#fff", tagBg: "#2e3158",
  synKey: "#c792ea", synStr: "#c3e88d", synNum: "#f78c6c",
  synFn: "#82aaff", synComment: "#546178", synOp: "#89ddff",
  matrixCell: "#1b1d35", matrixHover: "#2d3060",
};

/* syntax highlighter — single-pass tokenizer */
const KW = new Set([
  "for", "in", "print", "if", "else", "elif", "def", "return", "import", "from", "while", "break", "continue",
  "pass", "True", "False", "None", "and", "or", "not", "is", "del", "lambda", "with", "as", "try", "except",
  "finally", "raise", "class", "yield", "global", "nonlocal", "assert"
]);
const MT = new Set(["append", "insert", "pop", "remove", "extend", "sort", "reverse", "index", "count", "clear", "copy"]);
const BI = new Set(["len", "range", "sorted", "reversed", "print", "enumerate", "zip", "map", "filter", "list", "str", "int", "float"]);

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function hlLine(raw) {
  const safe = esc(raw);
  const RE = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|(\.([a-zA-Z_]\w*))|(\b[a-zA-Z_]\w*\b)|([+\-*/%=<>!]+|[[\](){},;:])/g;
  let r = "", last = 0, m;
  while ((m = RE.exec(safe)) !== null) {
    const [full, comment, str, num, dotM, mName, word, op] = m;
    r += safe.slice(last, m.index);
    if (comment) r += `<span style="color:${C.synComment};font-style:italic">${full}</span>`;
    else if (str) r += `<span style="color:${C.synStr}">${full}</span>`;
    else if (num) r += `<span style="color:${C.synNum}">${full}</span>`;
    else if (dotM) r += MT.has(mName) ? `.<span style="color:${C.synFn}">${esc(mName)}</span>` : full;
    else if (word) r += KW.has(word) ? `<span style="color:${C.synKey}">${word}</span>` : BI.has(word) ? `<span style="color:${C.synFn}">${word}</span>` : word;
    else if (op) r += `<span style="color:${C.synOp}">${full}</span>`;
    else r += full;
    last = m.index + full.length;
  }
  return r + safe.slice(last);
}

function hl(code) { return code.split("\n").map(hlLine).join("\n"); }

/* helpers */
function fmtL(items) { return `[${items.join(", ")}]`; }
function fmtN(groups) { return groups.length === 0 ? "[]" : `[${groups.map(fmtL).join(", ")}]`; }
function fmtM(grid) { return `[${grid.map(row => fmtL(row)).join(",\n" + " ".repeat(11))}]`; }
function isNum(v) { return /^-?\d+(\.\d+)?$/.test(v.trim()); }
function wrap(raw) {
  const t = raw.trim();
  if (!t) {
    return null;
  }
  if (isNum(t)) {
    return t;
  }

  return `"${t.replace(/^["']|["']$/g, "")}"`;
}
function unq(v) { return v.replace(/^["']|["']$/g, ""); }

function makeGrid(rows, cols, fillValue) {
  const grid = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    const row = [];

    for (let colIndex = 0; colIndex < cols; colIndex++) {
      row.push(fillValue);
    }

    grid.push(row);
  }

  return grid;
}

function resizeGrid(oldGrid, newRows, newCols, fillValue) {
  const result = [];

  const isOldCell = (row, col) => row < oldGrid.length && col < oldGrid[0].length

  for (let rIndex = 0; rIndex < newRows; rIndex++) {
    const row = [];

    for (let cIndex = 0; cIndex < newCols; cIndex++) {
      if (isOldCell(rIndex, cIndex)) {
        row.push(oldGrid[rIndex][cIndex]);
      } else {
        row.push(fillValue);
      }
    }

    result.push(row);
  }

  return result;
}

/* presets */
const P_FLAT = [
  { label: "Fruits", icon: "\u{1F34E}", items: ['"apple"', '"banana"', '"cherry"', '"date"'] },
  { label: "Nombres", icon: "\u{1F522}", items: ["10", "20", "30", "40", "50"] },
  { label: "Mixte", icon: "\u{1F3B2}", items: ['"alpha"', "1", '"beta"', "2", '"gamma"', "3"] },
];
const P_NEST = [
  { label: "Grille 2\u00D73", icon: "\u25A6", groups: [["1", "2", "3"], ["4", "5", "6"]] },
  { label: "Mots", icon: "\u{1F4AC}", groups: [['"chat"', '"chien"'], ['"oiseau"', '"poisson"']] },
];
const P_MAT = [
  { label: "Identit\u00e9 3\u00D73", icon: "\u{1D540}", rows: 3, cols: 3, data: [["1", "0", "0"], ["0", "1", "0"], ["0", "0", "1"]] },
  { label: "Compteur 2\u00D74", icon: "\u{1F522}", rows: 2, cols: 4, data: [["1", "2", "3", "4"], ["5", "6", "7", "8"]] },
  { label: "Notes", icon: "\u{1F4DD}", rows: 3, cols: 2, data: [['"A"', '"B"'], ['"C"', '"D"'], ['"E"', '"F"']] },
];

function CodePanel({ pyLines, ops }) {
  return (
    <div className="code-panel">
      <div className="code-panel-left">
        <div style={lbl}>Code Python équivalent</div>

        <pre className="code-panel-code" style={codeBlk}>
          <code dangerouslySetInnerHTML={{ __html: hl(pyLines.join("\n")) }} />
        </pre>
      </div>

      <div className="code-panel-right">
        <div style={{ ...lbl, marginBottom: 7 }}>
          Journal ({ops.length})
        </div>

        {ops.length === 0 ? (
          <div className="code-panel-empty">
            Aucune opération.
          </div>
        ) : (
          <div className="code-panel-ops">
            {ops.map((op, i) => (
              <div key={`o-${i}`} className="code-panel-op">
                <span className="code-panel-op-index">
                  {i + 1}
                </span>

                <code className="code-panel-op-label">
                  {op.label}
                </code>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FlatList({ flatItems, flatRm, isDragging, dropRef, drag }) {
  const { payload, insertIdx, start, end, onFlatOver, onFlatLeave, onFlatDrop } = drag;

  return (
    <div ref={dropRef} onDragOver={onFlatOver} onDragLeave={onFlatLeave} onDrop={onFlatDrop}
      style={{ flex: 1, background: C.surfaceAlt, borderRadius: 9, padding: "5px 7px", minHeight: 90, border: `1.5px dashed ${isDragging ? C.accent : C.border}`, transition: "border-color .2s", position: "relative", display: "flex", flexDirection: "column" }}>
      {flatItems.length === 0 && !isDragging && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, fontSize: 12, pointerEvents: "none" }}>Glisse des éléments ici</div>}
      {flatItems.map((item, i) => (
        <React.Fragment key={`f-${i}`}>
          <InsLine on={insertIdx === i} />
          <div data-ti draggable onDragStart={start({ origin: "target", index: i, value: item })} onDragEnd={end}
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "space-between", 
              padding: "6px 7px", 
              borderRadius: 8, 
              border: `1px solid ${payload?.origin === "target" && payload.index === i ? "transparent" : C.border}`, 
              background: payload?.origin === "target" && payload.index === i ? "transparent" : C.surface, 
              opacity: payload?.origin === "target" && payload.index === i ? .25 : 1,
              cursor: "grab", 
              marginBottom: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <GripVertical size={12} style={{ opacity: .25 }} />
              <Idx>{i}</Idx>
              <code style={mono}>{item}</code>
            </div>
            <button onClick={() => flatRm(i)} style={xBtn}><Trash2 size={12} /></button>
          </div>
        </React.Fragment>
      ))}
      <InsLine on={insertIdx === flatItems.length} />
    </div>
  );
}

function MultiLevelList({ gridGroups, gridRm, listName, groupRefs, rmGRow, addGRow, drag }) {
  const { payload, insertIdx, insertGroup, start, end, onGroupOver, onGroupLeave, onGroupDrop } = drag;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
      {gridGroups.map((grp, g) => (
        <div key={`g-${g}`} style={{ background: C.surfaceAlt, borderRadius: 9, border: `1.5px dashed ${insertGroup === g ? C.accent : C.border}`, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 9px", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Layers size={11} style={{ color: C.accent }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>{listName}[{g}]</span>
              <span style={{ fontSize: 11, color: C.textDim }}>len={grp.length}</span>
            </div>
            <button onClick={() => rmGRow(g)} style={{ ...xBtn, opacity: gridGroups.length <= 1 ? .3 : 1 }} disabled={gridGroups.length <= 1}><XCircle size={12} /></button>
          </div>
          <div ref={el => (groupRefs.current[g] = el)} onDragOver={onGroupOver(g)} onDragLeave={onGroupLeave(g)} onDrop={onGroupDrop(g)}
            style={{ display: "flex", flexWrap: "wrap", gap: 3, padding: "7px 7px", minHeight: 36, alignItems: "center" }}>
            {grp.length === 0 && insertGroup !== g && <span style={{ fontSize: 11, color: C.textDim, padding: "0 3px" }}>vide</span>}
            {grp.map((item, i) => (
              <React.Fragment key={`gi-${g}-${i}`}>
                <VInsLine on={insertGroup === g && insertIdx === i} />
                <div data-gi draggable onDragStart={start({ origin: "grid", groupIndex: g, index: i, value: item })} onDragEnd={end}
                  style={{ ...chip, padding: "4px 7px", fontSize: 11, gap: 4, opacity: payload?.origin === "grid" && payload.groupIndex === g && payload.index === i ? .3 : 1, cursor: "grab" }}>
                  <code style={{ ...mono, fontSize: 11 }}>{item}</code>
                  <button onClick={() => gridRm(g, i)} style={{ ...xBtn, padding: 1 }}><Trash2 size={10} /></button>
                </div>
              </React.Fragment>
            ))}
            <VInsLine on={insertGroup === g && insertIdx === grp.length} />
          </div>
        </div>
      ))}
      <button onClick={addGRow} style={{ ...btn("ghost"), justifyContent: "center", borderStyle: "dashed" }}><Plus size={12} /> Sous-liste</button>
    </div>
  );
}

function MatrixList({ matData, matRows, matCols, handleMatResize, transposeMatrix, clearMatCell, hoverCell, setHoverCell, drag }) {
  const { payload, start, end, onCellDragOver, onCellDrop } = drag;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
      {/* dimension controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <DimControl label="Lignes" value={matRows} onChange={v => handleMatResize(v, matCols)} />
        <span style={{ color: C.textDim, fontWeight: 700 }}>×</span>
        <DimControl label="Colonnes" value={matCols} onChange={v => handleMatResize(matRows, v)} />
        <div style={{ flex: 1 }} />
        <button onClick={transposeMatrix} style={btn("ghost")} title="Transposer">
          <RotateCw size={12} /> Transposer
        </button>
      </div>

      {/* grid table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 3 }}>
          {/* col headers */}
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              {Array.from({ length: matCols }, (_, c) => (
                <th key={c} style={{ fontSize: 11, fontWeight: 700, color: C.accent, textAlign: "center", padding: "2px 0" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matData.map((row, r) => (
              <tr key={r}>
                {/* row header */}
                <td style={{ fontSize: 11, fontWeight: 700, color: C.accent, textAlign: "center", verticalAlign: "middle", padding: "0 4px" }}>{r}</td>
                {row.map((cell, c) => {
                  const isHover = hoverCell?.r === r && hoverCell?.c === c;
                  const isDragSrc = payload?.origin === "matcell" && payload.r === r && payload.c === c;
                  const isEmpty = cell === "0" || cell === "None" || cell === "";
                  return (
                    <td key={c}
                      draggable={!isEmpty}
                      onDragStart={!isEmpty ? start({ origin: "matcell", r, c, value: cell }) : undefined}
                      onDragEnd={end}
                      onDragOver={onCellDragOver(r, c)}
                      onDragLeave={() => setHoverCell(null)}
                      onDrop={onCellDrop(r, c)}
                      style={{
                        width: 64, height: 44, textAlign: "center", verticalAlign: "middle",
                        borderRadius: 7,
                        background: isHover ? C.accentSoft : isDragSrc ? "transparent" : C.matrixCell,
                        border: `1.5px ${isHover ? "solid" : "dashed"} ${isHover ? C.accent : isDragSrc ? "transparent" : C.border}`,
                        opacity: isDragSrc ? .3 : 1,
                        cursor: isEmpty ? "default" : "grab",
                        transition: "all .12s",
                        position: "relative",
                      }}>
                      <code style={{ fontFamily: "Consolas, 'IBM Plex Mono',monospace", fontSize: 12, color: isEmpty ? C.textDim : C.text }}>
                        {isEmpty ? "\u00B7" : cell}
                      </code>
                      {!isEmpty && (
                        <button onClick={() => clearMatCell(r, c)}
                          style={{ position: "absolute", top: 1, right: 1, background: "transparent", border: "none", color: C.textDim, cursor: "pointer", fontSize: 11, lineHeight: 1, padding: 2, borderRadius: 3, opacity: .6 }}>
                          ×
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 11, color: C.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
        <Table2 size={12} />
        Dimensions : {matRows}×{matCols} — {matRows * matCols} cellules
      </div>
    </div>
  )
}

export default function DraggableListToPython() {
  const listName = "fruits";
  const matName = "matrice";

  const [mode, setMode] = useState("flat");
  const [sourceItems, setSourceItems] = useState(P_FLAT[0].items);

  // flat
  const [flatItems, setFlatItems] = useState([]);
  const [flatOps, setFlatOps] = useState([]);
  // nested
  const [gridGroups, setGridGroups] = useState([[], []]);
  const [gridOps, setGridOps] = useState([]);
  // matrix
  const [matRows, setMatRows] = useState(3);
  const [matCols, setMatCols] = useState(3);
  const [matData, setMatData] = useState(() => makeGrid(3, 3, "0"));
  const [matOps, setMatOps] = useState([]);
  // drag
  const [dragPL, setDragPL] = useState(null);
  const [insertIdx, setInsertIdx] = useState(null);
  const [insertGroup, setInsertGroup] = useState(null);
  const [hoverCell, setHoverCell] = useState(null); // {r, c}
  const [isOverTrash, setIsOverTrash] = useState(false);
  // ui
  const [showFor, setShowFor] = useState(false);
  const [newVal, setNewVal] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showPre, setShowPre] = useState(false);

  const dropRef = useRef(null);
  const groupRefs = useRef([]);

  const curName = mode === "matrix" ? matName : listName;
  const ops = mode === "flat" ? flatOps : mode === "grid" ? gridOps : matOps;
  const setOps = mode === "flat" ? setFlatOps : mode === "grid" ? setGridOps : setMatOps;

  // Python lines
  const pyLines = useMemo(() => {
    const lines = [];
    if (mode === "flat") {
      lines.push(`${listName} = []`);
      ops.forEach(o => o.python.split("\n").forEach(l => lines.push(l)));
      lines.push("", "# Résultat actuel", `# ${listName} \u2192 ${fmtL(flatItems)}`);
    } else if (mode === "grid") {
      lines.push(`${listName} = ${fmtN(gridGroups.map(() => []))}`);
      ops.forEach(o => o.python.split("\n").forEach(l => lines.push(l)));
      lines.push("", "# Résultat actuel", `# ${listName} \u2192 ${fmtN(gridGroups)}`);
    } else {
      lines.push(`${matName} = ${fmtM(makeGrid(matRows, matCols, "0"))}`);
      ops.forEach(o => o.python.split("\n").forEach(l => lines.push(l)));
      lines.push("", "# Résultat actuel");
      matData.forEach((row, r) => {
        lines.push(`# ${matName}[${r}] \u2192 ${fmtL(row)}`);
      });
    }
    return lines;
  }, [mode, ops, flatItems, gridGroups, matData, matRows, matCols]);


  // Drag
  const startDrag = useCallback((pl) => (e) => {
    setDragPL(pl); e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify(pl));
  }, []);

  const endDrag = useCallback(() => {
    setDragPL(null); setInsertIdx(null); setInsertGroup(null); setHoverCell(null); setIsOverTrash(false);
  }, []);

  // Flat list
  const calcIns = useCallback((e, ctr) => {
    const k = Array.from(ctr.querySelectorAll("[data-ti]"));
    if (isEmpty(k)) return 0;
    for (let i = 0; i < k.length; i++) {
      const r = k[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) {
        return i;
      }
    }
    return k.length;
  }, []);

  const onFlatOver = useCallback((e) => {
    e.preventDefault();
    if (dropRef.current) {
      setInsertIdx(calcIns(e, dropRef.current));
    }
  }, [calcIns]);
  const onFlatLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setInsertIdx(null);
    }
  }, []);
  const onFlatDrop = useCallback((e) => {
    e.preventDefault();
    const idx = insertIdx ?? flatItems.length;
    let pl = dragPL;

    if (isNullOrUndefined(pl)) {
      try {
        pl = JSON.parse(e.dataTransfer.getData("text/plain"));
      } catch {
        return;
      }
    }
    if (pl.origin === "source") {
      const n = [...flatItems];
      n.splice(idx, 0, pl.value);
      setFlatItems(n);
      const push = idx === flatItems.length;
      setFlatOps(p => [...p, {
        label: push ? `append(${pl.value})` : `insert(${idx}, ${pl.value})`,
        python: push ? `${listName}.append(${pl.value})` : `${listName}.insert(${idx}, ${pl.value})`
      }]);
    } else if (pl.origin === "target") {
      const f = pl.index;
      if (f === idx || f + 1 === idx) {
        endDrag(); return;
      }
      const a = f < idx ? idx - 1 : idx;
      const n = [...flatItems];
      const [mv] = n.splice(f, 1);
      n.splice(a, 0, mv);
      setFlatItems(n);
      setFlatOps(p => [...p, {
        label: `move ${pl.value} \u2192 idx ${a}`,
        python: `_temp = ${listName}.pop(${f})\n${listName}.insert(${a}, _temp)`
      }]);
    }
    endDrag();
  }, [dragPL, insertIdx, flatItems, endDrag]);
  const flatRm = useCallback((i) => {
    const rm = flatItems[i]; const n = [...flatItems]; n.splice(i, 1); setFlatItems(n);
    setFlatOps(p => [...p, { label: `pop(${i})  # ${rm}`, python: `${listName}.pop(${i})` }]);
  }, [flatItems]);

  // Grid (Multi-dimension list)
  const calcGIns = useCallback((e, ctr) => {
    const k = Array.from(ctr.querySelectorAll("[data-gi]"));
    if (!k.length) return 0;
    for (let i = 0; i < k.length; i++) {
      const r = k[i].getBoundingClientRect();
      if (e.clientX < r.left + r.width / 2) {
        return i;
      }
    }
    return k.length;
  }, []);
  const onGOver = useCallback((g) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setInsertGroup(g);
    const el = groupRefs.current[g];
    if (el) {
      setInsertIdx(calcGIns(e, el));
    }
  }, [calcGIns]);
  const onGLeave = useCallback((g) => (e) => {
    if (!e.currentTarget.contains(e.relatedTarget) && insertGroup === g) {
      setInsertGroup(null);
      setInsertIdx(null);
    }
  }, [insertGroup]);
  const onGDrop = useCallback((g) => (e) => {
    e.preventDefault(); e.stopPropagation();
    const idx = insertIdx ?? gridGroups[g].length;
    let pl = dragPL;

    if (!pl) try {
      pl = JSON.parse(e.dataTransfer.getData("text/plain"));
    } catch {
      return;
    }

    if (pl.origin === "source") {
      const n = gridGroups.map(x => [...x]); n[g].splice(idx, 0, pl.value); setGridGroups(n);
      setGridOps(p => [...p, { label: `[${g}].insert(${idx}, ${pl.value})`, python: `${listName}[${g}].insert(${idx}, ${pl.value})` }]);
    } else if (pl.origin === "grid") {
      const fG = pl.groupIndex, fI = pl.index;
      if (fG === g && (fI === idx || fI + 1 === idx)) { endDrag(); return; }
      const n = gridGroups.map(x => [...x]); const [mv] = n[fG].splice(fI, 1);
      const a = fG === g && fI < idx ? idx - 1 : idx; n[g].splice(a, 0, mv); setGridGroups(n);
      setGridOps(p => [...p, { label: fG === g ? `[${g}]: move \u2192 pos ${a}` : `move: [${fG}] \u2192 [${g}]`, python: `_temp = ${listName}[${fG}].pop(${fI})\n${listName}[${g}].insert(${a}, _temp)` }]);
    }
    endDrag();
  }, [dragPL, insertIdx, gridGroups, endDrag]);
  const gridRm = useCallback((g, i) => {
    const rm = gridGroups[g][i]; const n = gridGroups.map(x => [...x]); n[g].splice(i, 1); setGridGroups(n);
    setGridOps(p => [...p, { label: `[${g}].pop(${i})  # ${rm}`, python: `${listName}[${g}].pop(${i})` }]);
  }, [gridGroups]);

  // Matrix
  const setMatCell = useCallback((r, c, value) => {
    setMatData(prev => {
      const n = prev.map(row => [...row]); n[r][c] = value; return n;
    });
    setMatOps(p => [...p, { label: `[${r}][${c}] = ${value}`, python: `${matName}[${r}][${c}] = ${value}` }]);
  }, []);

  const clearMatCell = useCallback((r, c) => {
    setMatData(prev => {
      const n = prev.map(row => [...row]); n[r][c] = "0"; return n;
    });
    setMatOps(p => [...p, { label: `[${r}][${c}] = 0`, python: `${matName}[${r}][${c}] = 0` }]);
  }, []);

  const onCellDragOver = useCallback((r, c) => (e) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "move";
    setHoverCell({ r, c });
  }, []);

  const onCellDrop = useCallback((r, c) => (e) => {
    e.preventDefault();
    let pl = dragPL; if (!pl) try { pl = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
    if (pl.origin === "source") setMatCell(r, c, pl.value);
    else if (pl.origin === "matcell") {
      const old = matData[pl.r][pl.c];
      setMatData(prev => { const n = prev.map(row => [...row]); n[pl.r][pl.c] = "0"; n[r][c] = old; return n; });
      setMatOps(p => [...p, {
        label: `swap [${pl.r}][${pl.c}] \u2192 [${r}][${c}]`,
        python: `${matName}[${r}][${c}] = ${matName}[${pl.r}][${pl.c}]\n${matName}[${pl.r}][${pl.c}] = 0`,
      }]);
    }
    endDrag();
  }, [dragPL, matData, setMatCell, endDrag]);

  const handleMatResize = useCallback((newR, newC) => {
    const cR = Math.max(1, Math.min(8, newR));
    const cC = Math.max(1, Math.min(8, newC));
    setMatRows(cR); setMatCols(cC);
    setMatData(prev => resizeGrid(prev, cR, cC, "0"));
  }, []);

  const transposeMatrix = useCallback(() => {
    const t = Array.from({ length: matCols }, (_, c) => Array.from({ length: matRows }, (_, r) => matData[r][c]));
    setMatData(t); setMatRows(matCols); setMatCols(matRows);
    setMatOps(p => [...p, { label: "transpose", python: `${matName} = list(map(list, zip(*${matName})))` }]);
  }, [matData, matRows, matCols]);

  // Operations
  const doSort = useCallback(() => {
    if (mode !== "flat" || flatItems.length < 2) return;
    const s = [...flatItems].sort((a, b) => isNum(a) && isNum(b) ? parseFloat(a) - parseFloat(b) : unq(a).localeCompare(unq(b)));
    setFlatItems(s); setFlatOps(p => [...p, { label: "sort()", python: `${listName}.sort()` }]);
  }, [flatItems, mode]);
  const doReverse = useCallback(() => {
    if (mode === "flat") { setFlatItems(p => [...p].reverse()); setFlatOps(p => [...p, { label: "reverse()", python: `${listName}.reverse()` }]); }
    else if (mode === "grid") { setGridGroups(p => [...p].reverse()); setGridOps(p => [...p, { label: "reverse()", python: `${listName}.reverse()` }]); }
    else { setMatData(p => [...p].reverse()); setMatOps(p => [...p, { label: "reverse()", python: `${matName}.reverse()` }]); }
  }, [mode]);
  const doClear = useCallback(() => {
    if (mode === "flat") { setFlatItems([]); setFlatOps(p => [...p, { label: "clear()", python: `${listName}.clear()` }]); }
    else if (mode === "grid") {
      setGridGroups(p => p.map(() => []));
      setGridOps(p => [...p, { label: "clear sous-listes", python: gridGroups.map((_, i) => `${listName}[${i}].clear()`).join("\n") }]);
    } else {
      setMatData(makeGrid(matRows, matCols, "0"));
      setMatOps(p => [...p, { label: "reset \u2192 0", python: `${matName} = ${fmtM(makeGrid(matRows, matCols, "0"))}` }]);
    }
  }, [mode, gridGroups, matRows, matCols]);

  const addGRow = useCallback(() => { setGridGroups(p => [...p, []]); setGridOps(p => [...p, { label: `append([])`, python: `${listName}.append([])` }]); }, []);
  const rmGRow = useCallback((g) => {
    if (gridGroups.length <= 1) return;
    const n = [...gridGroups]; n.splice(g, 1); setGridGroups(n);
    setGridOps(p => [...p, { label: `pop(${g})`, python: `${listName}.pop(${g})` }]);
  }, [gridGroups]);

  /* ── trash ── */
  const onTrashDrop = useCallback((e) => {
    e.preventDefault();
    let pl = dragPL; if (!pl) try { pl = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { endDrag(); return; }
    if (pl.origin === "target") flatRm(pl.index);
    else if (pl.origin === "grid") gridRm(pl.groupIndex, pl.index);
    else if (pl.origin === "matcell") clearMatCell(pl.r, pl.c);
    endDrag();
  }, [dragPL, flatRm, gridRm, clearMatCell, endDrag]);

  /* ── presets ── */
  const applyFlat = useCallback((p) => { setFlatItems([...p.items]); setFlatOps([{ label: `= ${fmtL(p.items)}`, python: `${listName} = ${fmtL(p.items)}` }]); setShowPre(false); }, []);
  const applyNest = useCallback((p) => { setGridGroups(p.groups.map(g => [...g])); setGridOps([{ label: `= ${fmtN(p.groups)}`, python: `${listName} = ${fmtN(p.groups)}` }]); setShowPre(false); }, []);
  const applyMat = useCallback((p) => {
    setMatRows(p.rows); setMatCols(p.cols); setMatData(p.data.map(r => [...r]));
    setMatOps([{ label: `= matrice ${p.rows}\u00D7${p.cols}`, python: `${matName} = ${fmtM(p.data)}` }]);
    setShowPre(false);
  }, []);

  /* ── add / reset ── */
  const addSrc = useCallback(() => { const w = wrap(newVal); if (!w) return; setSourceItems(p => [...p, w]); setNewVal(""); setShowAdd(false); }, [newVal]);
  const reset = useCallback(() => {
    setFlatItems([]); setFlatOps([]); setGridGroups([[], []]); setGridOps([]);
    setMatData(makeGrid(3, 3, "0")); setMatRows(3); setMatCols(3); setMatOps([]);
    setSourceItems(P_FLAT[0].items); setShowFor(false); setShowPre(false); setShowAdd(false); endDrag();
  }, [endDrag]);
  const switchMode = useCallback((m) => { if (m === mode) return; setMode(m); setShowFor(false); endDrag(); }, [mode, endDrag]);

  const isDragging = dragPL !== null;
  const showTrash = isDragging && dragPL?.origin !== "source";

  const FlatDragHandlers = {
    payload: dragPL,
    insertIdx,
    start: startDrag,
    end: endDrag,
    onFlatOver,
    onFlatLeave,
    onFlatDrop,
  };

  const MatrixDragHandlers = {
    payload: dragPL,
    start: startDrag,
    end: endDrag,
    onCellDragOver: onCellDragOver,
    onCellDrop: onCellDrop,
  };
  const GridDragHandlers = {
    payload: dragPL,
    insertIdx,
    insertGroup,
    start: startDrag,
    end: endDrag,
    onGroupOver: onGOver,
    onGroupLeave: onGLeave,
    onGroupDrop: onGDrop,
  };


  return (
    <div className="pylist-visualizer">

      {/* HEADER */}
      <div className="pylist-visualizer__header">
        <div style={{display: "flex", alignItems: "center"}}>
          <a href="/" style={{color: C.white, marginRight: 6}}>
          <ArrowLeftCircle size={24} />
          </a>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".14em", color: C.accent, marginBottom: 1 }}>Visualisation de listes</div>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
          {/* mode */}
          <div style={{ display: "flex", background: C.surface, borderRadius: 7, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {[["flat", List, "Liste"], ["grid", Grid3X3, "Imbriquée"], ["matrix", Table2, "Matrice"]].map(([m, Icon, lb]) => (
              <button key={m} onClick={() => switchMode(m)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", fontSize: 12, fontWeight: 600, background: mode === m ? C.accent : "transparent", border: "none", color: mode === m ? C.white : C.textMuted, cursor: "pointer", borderRadius: mode === m ? 5 : 0, transition: "all .15s" }}>
                <Icon size={12} /> {lb}
              </button>
            ))}
          </div>
          {/* presets */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowPre(!showPre)} style={btn("ghost")}><Package size={12} /> Préremplir</button>
            {showPre && <>
              <div onClick={() => setShowPre(false)} style={{ position: "fixed", inset: 0, zIndex: 19 }} />
              <div style={{ position: "absolute", top: "calc(100% + 3px)", right: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 5, zIndex: 20, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,.45)" }}>
                {(mode === "flat" ? P_FLAT : mode === "grid" ? P_NEST : P_MAT).map((p, i) => (
                  <button key={i} onClick={() => mode === "flat" ? applyFlat(p) : mode === "grid" ? applyNest(p) : applyMat(p)} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "6px 9px", fontSize: 12, background: "transparent", border: "none", color: C.text, cursor: "pointer", borderRadius: 6, textAlign: "left" }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </>}
          </div>
          <button onClick={reset} style={btn("ghost")}><RotateCcw size={12} /> Réinitialiser</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", minHeight: 280 }}>

        {/* SOURCE */}
        <div style={{ borderRight: `1px solid ${C.border}`, padding: 12, paddingLeft: "2vw", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={lbl}>Éléments source</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 1 }}>Glisse vers la cible →</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            {sourceItems.map((item, i) => (
              <div key={`s-${i}`} draggable onDragStart={startDrag({ origin: "source", value: item })} onDragEnd={endDrag}
                style={{ ...chip, cursor: "grab", opacity: dragPL?.origin === "source" && dragPL.value === item ? .35 : 1 }}>
                <GripVertical size={12} style={{ opacity: .3 }} />
                <code style={mono}>{item}</code>
              </div>
            ))}
          </div>
          {showAdd ? (
            <div style={{ display: "flex", gap: 4 }}>
              <input value={newVal} onChange={e => setNewVal(e.target.value)} onKeyDown={e => e.key === "Enter" && addSrc()} placeholder='"kiwi" ou 42' autoFocus
                style={{ flex: 1, background: C.code, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 7px", color: C.text, fontSize: 12, fontFamily: "Consolas, 'IBM Plex Mono',monospace", outline: "none" }} />
              <button onClick={addSrc} style={btn("accent")}><Plus size={12} /></button>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)} style={{ ...btn("ghost"), width: "100%", justifyContent: "center" }}><Plus size={12} /> Ajouter</button>
          )}
        </div>

        {/* TARGET AREA */}
        <div style={{ padding: 12, paddingRight: "2vw", display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={lbl}>{mode === "flat" ? "Liste cible" : mode === "grid" ? "Liste imbriquée" : "Matrice"}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                {mode === "matrix" ? "Glisse dans les cellules ou déplace entre cellules" : mode === "grid" ? "Glisse dans les sous-listes" : "Réordonne ou supprime"}
              </div>
            </div>
            {mode !== "matrix" && (
              <div style={{ fontFamily: "Consolas, 'IBM Plex Mono',monospace", fontSize: 12, color: C.accent, background: C.accentSoft, padding: "2px 8px", borderRadius: 6 }}>
                len = {mode === "flat" ? flatItems.length : gridGroups.reduce((s, g) => s + g.length, 0)}
              </div>
            )}
          </div>

          {mode === "flat" && (
            <FlatList flatItems={flatItems} flatRm={flatRm} isDragging={isDragging} dropRef={dropRef} drag={FlatDragHandlers} />
          )}

          {mode === "grid" && (
            <MultiLevelList gridGroups={gridGroups} gridRm={gridRm} listName={listName} groupRefs={groupRefs} rmGRow={rmGRow} addGRow={addGRow} drag={GridDragHandlers} />
          )}

          {mode === "matrix" && (
            <MatrixList matData={matData} matCols={matCols} matRows={matRows} handleMatResize={handleMatResize} transposeMatrix={transposeMatrix} clearMatCell={clearMatCell} hoverCell={hoverCell} setHoverCell={setHoverCell} drag={MatrixDragHandlers} />
          )}

          {/* trash */}
          <div onDragOver={e => { e.preventDefault(); setIsOverTrash(true); }} onDragLeave={() => setIsOverTrash(false)} onDrop={onTrashDrop}
            style={{ borderRadius: 8, padding: "7px 10px", textAlign: "center", fontSize: 11, fontWeight: 600, color: isOverTrash ? C.danger : C.textDim, background: isOverTrash ? C.dangerSoft : "transparent", border: `1.5px dashed ${isOverTrash ? C.danger : C.border}`, opacity: showTrash ? 1 : 0, maxHeight: showTrash ? 40 : 0, overflow: "hidden", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <Trash2 size={12} /> Dépose pour supprimer
          </div>

          {/* op buttons */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {mode === "flat" && <button onClick={doSort} disabled={flatItems.length < 2} style={opBtn(flatItems.length < 2)}><ArrowDownAZ size={12} /> .sort()</button>}
            {mode !== "matrix" && <button onClick={doReverse} disabled={(mode === "flat" ? flatItems.length : gridGroups.length) < 2} style={opBtn((mode === "flat" ? flatItems.length : gridGroups.length) < 2)}><ArrowDownUp size={12} /> .reverse()</button>}
            {mode === "matrix" && <button onClick={doReverse} disabled={matRows < 2} style={opBtn(matRows < 2)}><ArrowDownUp size={12} /> .reverse()</button>}
            <button onClick={doClear} disabled={(mode === "flat" ? flatItems.length : mode === "grid" ? gridGroups.reduce((s, g) => s + g.length, 0) : matData.flat().some(v => v !== "0") ? false : true) === 0 ? true : false} style={opBtn(false)}><XCircle size={12} /> {mode === "matrix" ? "Reset → 0" : ".clear()"}</button>
          </div>

          {/* state */}
          <div style={{ background: C.code, borderRadius: 8, padding: "7px 10px", fontFamily: "Consolas, 'IBM Plex Mono',monospace", fontSize: 11, color: C.codeText, display: "flex", alignItems: "flex-start", gap: 6, overflowX: "auto" }}>
            <ChevronRight size={12} style={{ color: C.accent, flexShrink: 0, marginTop: 2 }} />
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              <span>{curName}</span>
              <span style={{ color: "#8b949e" }}> = </span>
              <span style={{ color: C.synStr }}>{mode === "flat" ? fmtL(flatItems) : mode === "grid" ? fmtN(gridGroups) : fmtM(matData)}</span>
            </pre>
          </div>
        </div>
      </div>

      {/* CODE + LOG */}
      <CodePanel pyLines={pyLines} ops={ops} />

    </div>
  );
}

// micro-components
function InsLine({ on }) {
  return <div style={{ height: on ? 3 : 0, background: C.accent, borderRadius: 2, margin: on ? "1px 0" : 0, transition: "all .1s", boxShadow: on ? `0 0 8px ${C.accentGlow}` : "none" }} />;
}
function VInsLine({ on }) {
  return <div style={{ width: on ? 3 : 0, alignSelf: "stretch", background: C.accent, borderRadius: 2, margin: on ? "0 1px" : 0, transition: "all .1s", boxShadow: on ? `0 0 8px ${C.accentGlow}` : "none" }} />;
}
function Idx({ children }) {
  return <span style={{ minWidth: 18, height: 18, borderRadius: 5, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: C.accentSoft, color: C.accent, flexShrink: 0 }}>{children}</span>;
}

function DimControl({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
        <button onClick={() => onChange(value - 1)} disabled={value <= 1}
          style={{ background: "transparent", border: "none", color: value <= 1 ? C.textDim : C.textMuted, cursor: value <= 1 ? "not-allowed" : "pointer", padding: "3px 6px", display: "flex" }}>
          <Minus size={12} />
        </button>
        <span style={{ fontFamily: "Consolas, 'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 700, color: C.text, minWidth: 20, textAlign: "center" }}>{value}</span>
        <button onClick={() => onChange(value + 1)} disabled={value >= 8}
          style={{ background: "transparent", border: "none", color: value >= 8 ? C.textDim : C.textMuted, cursor: value >= 8 ? "not-allowed" : "pointer", padding: "3px 6px", display: "flex" }}>
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

// style helpers
const lbl = { fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: ".01em" };
const mono = { fontFamily: "Consolas, 'IBM Plex Mono',monospace", fontSize: 13, color: C.text };
const chip = { display: "flex", alignItems: "center", gap: 6, padding: "6px 9px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, userSelect: "none" };
const codeBlk = { margin: 0, padding: 12, borderRadius: 8, background: C.code, color: C.codeText, fontFamily: "Consolas, 'IBM Plex Mono',monospace", fontSize: 13, lineHeight: 1.65, overflowX: "auto", minHeight: 60 };
const xBtn = { background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: 2, borderRadius: 4, display: "flex", lineHeight: 1 };

function btn(v) {
  const b = { display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .15s", whiteSpace: "nowrap" };
  return v === "accent" ? { ...b, background: C.accent, color: C.white } : { ...b, background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` };
}
function opBtn(dis) {
  return { display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: dis ? "not-allowed" : "pointer", border: `1px solid ${C.border}`, background: C.surface, color: dis ? C.textDim : C.text, opacity: dis ? .5 : 1, transition: "all .15s" };
}
