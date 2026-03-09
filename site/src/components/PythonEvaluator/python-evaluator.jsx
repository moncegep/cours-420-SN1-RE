import { useState, useRef, useCallback, useEffect, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   0. FONTS
   ═══════════════════════════════════════════════════════════════════════════ */
const FontLoader = () => (
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
);
const FONT = "'DM Sans', system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', monospace";

/* ═══════════════════════════════════════════════════════════════════════════
   1. THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = {
  bg: "#0c0e14", surface: "#13161f", surface2: "#1a1e2a", surface3: "#222738",
  border: "#2a2f42", borderHover: "#3d4463",
  accent: "#6c8eef", accentDim: "#4a6abf", accentSoft: "rgba(108,142,239,0.1)", accentGlow: "rgba(108,142,239,0.25)",
  text: "#c8cdd8", textDim: "#5f6680", textBright: "#eef0f6",
  error: "#ef6b6b", errorSoft: "rgba(239,107,107,0.1)",
  warning: "#e8b84d", warningSoft: "rgba(232,184,77,0.1)",
  success: "#5ae0a0", successSoft: "rgba(90,224,160,0.1)",
  pink: "#d97bba", cyan: "#5ec4d4", orange: "#e09050", purple: "#a07be6",
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. LEVEL REGISTRY — visual identity per abstraction level
   ═══════════════════════════════════════════════════════════════════════════

   Level 1 — Intention:  WHAT the program does (domain language, no code terms)
   Level 2 — Action:     HOW (logical steps: traversals, checks, calculations)
   Level 3 — Spec:       DETAILS (inputs, outputs, rules, validations, constraints)
   Level 4 — Instruction: CODE (actual Python mapped to each spec)
   ═══════════════════════════════════════════════════════════════════════════ */
const LEVELS = {
  1: {
    key: "intentions", name: "Intention", icon: "🎯",
    color: "#e8b84d", colorDim: "#b8942e", bg: "#2b2518", bgSoft: "rgba(232,184,77,0.08)",
    shape: "pill", nodeH: 72, nodeW: 300,
    hint: "Que fait le programme? (langage du domaine)",
    drillHint: "Double-clic pour voir les actions",
  },
  2: {
    key: "actions", name: "Action", icon: "⚡",
    color: "#6c8eef", colorDim: "#4a6abf", bg: "#1a2033", bgSoft: "rgba(108,142,239,0.08)",
    shape: "rect", nodeH: 66, nodeW: 280,
    hint: "Quelles actions logiques? (parcours, calculs, vérifications)",
    drillHint: "Double-clic pour voir les spécifications",
  },
  3: {
    key: "specifications", name: "Spécification", icon: "📋",
    color: "#a07be6", colorDim: "#7e5cbf", bg: "#221a33", bgSoft: "rgba(160,123,230,0.08)",
    shape: "detailed", nodeH: 70, nodeW: 280,
    hint: "Entrées, sorties, règles, contraintes, transformations",
    drillHint: "Double-clic pour voir le code",
  },
  4: {
    key: "instructions", name: "Instruction", icon: "💻",
    color: "#5ec4d4", colorDim: "#3a9eab", bg: "#182528", bgSoft: "rgba(94,196,212,0.08)",
    shape: "code", nodeH: 58, nodeW: 300,
    hint: "Code Python correspondant",
    drillHint: null,
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. LLM
   ═══════════════════════════════════════════════════════════════════════════ */
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

async function callLLM(system, user) {
  const res = await fetch(API_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 4096, system, messages: [{ role: "user", content: user }] }),
  });
  const data = await res.json();
  return (data.content || []).map((b) => b.text || "").join("");
}

function extractJSON(raw) {
  const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const clean = m ? m[1].trim() : raw.trim();
  try { return JSON.parse(clean); } catch {}
  const m2 = clean.match(/[\[{][\s\S]*[\]}]/);
  if (m2) try { return JSON.parse(m2[0]); } catch {}
  throw new Error("Impossible de parser la réponse JSON.");
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. PROMPTS
   ═══════════════════════════════════════════════════════════════════════════ */
const SYS_ANALYZE = `Tu es un assistant pédagogique Python pour étudiants au CÉGEP. Analyse le code Python et détecte les erreurs.
Réponds UNIQUEMENT en JSON: [{"line":<n>,"severity":"error"|"warning","message":"<français, tutoiement>"}]
Si aucune erreur: []`;

const SYS_EXECUTE = `Tu es un interpréteur Python pédagogique. Simule l'exécution du code Python.
Réponds UNIQUEMENT en JSON: {"output":"<sortie>","error":"<erreur ou null>","steps":[{"line":<n>,"description":"<français>"}]}`;

const SYS_ABSTRACT = `Tu es un assistant pédagogique Python pour étudiants au CÉGEP.
Analyse le code et produis une abstraction à 4 NIVEAUX hiérarchiques.

NIVEAU 1 — INTENTION: Décris ce que le programme fait globalement, dans un langage accessible au domaine, SANS mentionner variables, conditions, boucles, fonctions ou mécanismes de programmation. Parle comme si tu décrivais le programme à quelqu'un qui ne connaît pas la programmation.
Exemple: "Recueillir les résultats d'un étudiant", "Déterminer sa réussite"

NIVEAU 2 — ACTION: Pour chaque intention, décris les grandes actions logiques effectuées. Tu peux mentionner parcours, vérifications, calculs, initialisations, appels, etc., mais sans trop de détails techniques.
Exemple: "Calculer la somme des notes", "Vérifier si la moyenne dépasse le seuil"

NIVEAU 3 — SPÉCIFICATION: Pour chaque action, précise les entrées, sorties, transformations, règles, validations, calculs, contraintes et appels externes pertinents. Inclus les lignes de code correspondantes.
Exemple: "Entrée: liste de nombres → Sortie: moyenne (float). Additionner tous les éléments puis diviser par le nombre total."

NIVEAU 4 — INSTRUCTION: Pour chaque spécification, associe le code Python correspondant avec les numéros de lignes exacts.
Exemple: "total += note  (accumulation dans la boucle)"

STRUCTURE JSON À RETOURNER (pas de backticks, pas de markdown):
{
  "intentions": {
    "blocks": [
      {"id":"i1","label":"<description domaine>"}
    ],
    "edges": [{"from":"i1","to":"i2"}]
  },
  "actions": {
    "<intention_id>": {
      "blocks": [
        {"id":"a1","label":"<action logique>"}
      ],
      "edges": [{"from":"a1","to":"a2"}]
    }
  },
  "specifications": {
    "<action_id>": {
      "blocks": [
        {"id":"s1","label":"<spécification détaillée>","lines":[<début>,<fin>]}
      ],
      "edges": [{"from":"s1","to":"s2"}]
    }
  },
  "instructions": {
    "<spec_id>": {
      "blocks": [
        {"id":"c1","label":"<description de l'instruction>","lines":[<début>,<fin>],"code":"<code exact>"}
      ],
      "edges": [{"from":"c1","to":"c2"}]
    }
  }
}

RÈGLES:
- Chaque niveau a un start (premier bloc) et la structure doit être connexe
- Les edges avec label "Vrai"/"Faux" sont permis aux niveaux 2-4 pour les conditions
- Les IDs doivent être uniques globalement (utilise i1,i2... a1,a2... s1,s2... c1,c2...)
- Les "lines" sont obligatoires aux niveaux 3 et 4, optionnels au niveau 2
- Français, tutoiement, descriptions claires et concises
- Assure-toi que CHAQUE bloc d'un niveau a des enfants au niveau suivant
- Le niveau 1 ne doit contenir AUCUN terme de programmation`;

const SYS_QUERY = `Tu es un assistant pédagogique Python pour étudiants au CÉGEP.
L'étudiant te pose une question sur un bloc de son code à un certain niveau d'abstraction.
Réponds clairement, en français avec tutoiement.
Ne donne jamais la solution directement — guide avec des indices et des questions socratiques.`;

/* ═══════════════════════════════════════════════════════════════════════════
   5. DATA MODEL (documentation)

   FourLevelAbstraction {
     intentions:     { blocks: Block[], edges: Edge[] }
     actions:        { [intentionId]: { blocks: Block[], edges: Edge[] } }
     specifications: { [actionId]:    { blocks: Block[], edges: Edge[] } }
     instructions:   { [specId]:      { blocks: Block[], edges: Edge[] } }
   }

   Block { id, label, lines?:[start,end], code? }
   Edge  { from, to, label? }

   Navigation path: [level, parentId?]
   e.g. [1] → [2, "i1"] → [3, "a2"] → [4, "s3"]
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   6. LAYOUT ENGINE
   ═══════════════════════════════════════════════════════════════════════════ */
const GAP_X = 70;
const GAP_Y = 44;

function computeLayout(blocks, edges, levelDef) {
  if (!blocks?.length) return { flowNodes: {}, flowEdges: [], canvasW: 400, canvasH: 200 };
  const W = levelDef.nodeW, H = levelDef.nodeH;

  const blockMap = {};
  blocks.forEach((b) => { blockMap[b.id] = b; });

  const adj = {}, inDeg = {};
  blocks.forEach((b) => { adj[b.id] = []; inDeg[b.id] = 0; });
  edges.forEach((e) => {
    if (adj[e.from] && blockMap[e.to]) {
      adj[e.from].push(e.to);
      inDeg[e.to] = (inDeg[e.to] || 0) + 1;
    }
  });

  const queue = blocks.filter((b) => (inDeg[b.id] || 0) === 0).map((b) => b.id);
  const sorted = [], visited = new Set();
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id); sorted.push(id);
    (adj[id] || []).forEach((nid) => { inDeg[nid]--; if (inDeg[nid] <= 0 && !visited.has(nid)) queue.push(nid); });
  }
  blocks.forEach((b) => { if (!visited.has(b.id)) sorted.push(b.id); });

  const layer = {};
  sorted.forEach((id) => {
    const parents = edges.filter((e) => e.to === id && blockMap[e.from]);
    layer[id] = parents.length === 0 ? 0 : Math.max(...parents.map((e) => (layer[e.from] || 0) + 1));
  });

  const layers = {};
  sorted.forEach((id) => { const l = layer[id] || 0; if (!layers[l]) layers[l] = []; layers[l].push(id); });

  let maxLW = 0;
  Object.values(layers).forEach((ids) => { maxLW = Math.max(maxLW, ids.length); });
  const totalW = maxLW * (W + GAP_X);

  const flowNodes = {};
  let currentY = 30;
  Object.keys(layers).sort((a, b) => a - b).forEach((l) => {
    const ids = layers[l];
    const lw = ids.length * (W + GAP_X) - GAP_X;
    const ox = (totalW - lw) / 2 + 40;
    ids.forEach((id, i) => {
      const block = blockMap[id];
      if (!block) return;
      flowNodes[id] = { id, block, x: ox + i * (W + GAP_X), y: currentY, w: W, h: H };
    });
    currentY += H + GAP_Y;
  });

  const flowEdges = edges.map((e) => {
    const fn = flowNodes[e.from], tn = flowNodes[e.to];
    if (!fn || !tn) return null;
    return { ...e, x1: fn.x + fn.w / 2, y1: fn.y + fn.h, x2: tn.x + tn.w / 2, y2: tn.y };
  }).filter(Boolean);

  return { flowNodes, flowEdges, canvasW: totalW + 120, canvasH: currentY + 60 };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. FLOW CANVAS
   ═══════════════════════════════════════════════════════════════════════════ */
function FlowCanvas({ children, canvasW, canvasH, viewKey }) {
  const ref = useRef(null);
  const [tf, setTf] = useState({ x: 0, y: 0, s: 1 });
  const panning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const d = e.deltaY > 0 ? 0.92 : 1.08;
    setTf((t) => {
      const ns = Math.max(0.15, Math.min(3, t.s * d));
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return { ...t, s: ns };
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      return { s: ns, x: mx - (mx - t.x) * (ns / t.s), y: my - (my - t.y) * (ns / t.s) };
    });
  }, []);

  const handleDown = useCallback((e) => {
    if (e.target.closest("[data-flow-node]")) return;
    panning.current = true;
    panStart.current = { x: e.clientX - tf.x, y: e.clientY - tf.y };
  }, [tf]);
  const handleMove = useCallback((e) => {
    if (!panning.current) return;
    setTf((t) => ({ ...t, x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }));
  }, []);
  const handleUp = useCallback(() => { panning.current = false; }, []);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const fitView = useCallback(() => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const s = Math.min(r.width / (canvasW + 40), r.height / (canvasH + 40), 1.15);
    setTf({ s, x: (r.width - canvasW * s) / 2, y: Math.max(10, (r.height - canvasH * s) / 2) });
  }, [canvasW, canvasH]);

  useEffect(() => { setTimeout(fitView, 60); }, [fitView, viewKey]);

  return (
    <div ref={ref} onMouseDown={handleDown} onMouseMove={handleMove} onMouseUp={handleUp} onMouseLeave={handleUp}
      style={{ width: "100%", height: "100%", overflow: "hidden", cursor: panning.current ? "grabbing" : "grab", position: "relative", background: T.bg }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <defs>
          <pattern id="dotgrid" width={20 * tf.s} height={20 * tf.s} x={tf.x % (20 * tf.s)} y={tf.y % (20 * tf.s)} patternUnits="userSpaceOnUse">
            <circle cx={1} cy={1} r={0.6} fill={T.border} opacity={0.3} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${tf.x}px,${tf.y}px) scale(${tf.s})`, transformOrigin: "0 0" }}>{children}</div>
      <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 3, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3 }}>
        {[
          { l: "−", fn: () => setTf((t) => ({ ...t, s: Math.max(0.15, t.s * 0.85) })) },
          { l: "⊡", fn: fitView },
          { l: "+", fn: () => setTf((t) => ({ ...t, s: Math.min(3, t.s * 1.15) })) },
        ].map((b) => (
          <button key={b.l} onClick={b.fn} style={{ width: 28, height: 28, border: "none", borderRadius: 6, background: "transparent", color: T.textDim, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO }}>{b.l}</button>
        ))}
        <span style={{ color: T.textDim, fontSize: 9.5, padding: "0 6px", alignSelf: "center", fontFamily: MONO }}>{Math.round(tf.s * 100)}%</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. FLOW EDGE
   ═══════════════════════════════════════════════════════════════════════════ */
function FlowEdge({ edge, highlighted, levelColor }) {
  const { x1, y1, x2, y2, label } = edge;
  const midY = (y1 + y2) / 2;
  const dy = Math.abs(y2 - y1);
  const d = `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.4}, ${x2} ${y2 - dy * 0.4}, ${x2} ${y2}`;
  const isT = label === "Vrai", isF = label === "Faux";
  const c = isT ? T.success : isF ? T.error : highlighted ? levelColor : T.textDim;
  return (
    <g>
      {highlighted && <path d={d} fill="none" stroke={`${levelColor}40`} strokeWidth={6} />}
      <path d={d} fill="none" stroke={c} strokeWidth={highlighted ? 2.2 : 1.4} strokeDasharray={isF ? "6,4" : "none"} opacity={highlighted ? 1 : 0.45} />
      <polygon points={`${x2},${y2} ${x2 - 4.5},${y2 - 9} ${x2 + 4.5},${y2 - 9}`} fill={c} opacity={highlighted ? 1 : 0.45} />
      {label && (
        <g>
          <rect x={(x1 + x2) / 2 - 20} y={midY - 10} width={40} height={18} rx={9}
            fill={isT ? T.successSoft : isF ? T.errorSoft : T.surface2} stroke={isT ? T.success : isF ? T.error : T.border} strokeWidth={1} />
          <text x={(x1 + x2) / 2} y={midY + 2} textAnchor="middle" fontSize={9.5} fontWeight={600}
            fill={isT ? T.success : isF ? T.error : T.textDim} fontFamily={FONT}>{label}</text>
        </g>
      )}
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. FLOW NODE — shape varies by level
   ═══════════════════════════════════════════════════════════════════════════ */
function FlowNode({ node, selected, onSelect, onDrill, levelDef, canDrill }) {
  const { block, x, y, w, h } = node;
  const [hovered, setHovered] = useState(false);
  const lc = levelDef.color;
  const stroke = selected ? T.accent : hovered ? lc : `${lc}66`;
  const sw = selected ? 2.5 : hovered ? 2 : 1.4;

  const renderShape = () => {
    switch (levelDef.shape) {
      case "pill":
        return <rect x={0} y={0} width={w} height={h} rx={h / 2} fill={levelDef.bg} stroke={stroke} strokeWidth={sw} />;
      case "detailed":
        return (
          <g>
            <rect x={0} y={0} width={w} height={h} rx={10} fill={levelDef.bg} stroke={stroke} strokeWidth={sw} />
            <line x1={0} y1={h - 18} x2={w} y2={h - 18} stroke={stroke} strokeWidth={0.7} opacity={0.4} />
          </g>
        );
      case "code":
        return (
          <g>
            <rect x={0} y={0} width={w} height={h} rx={6} fill={levelDef.bg} stroke={stroke} strokeWidth={sw} />
            <rect x={0} y={0} width={6} height={h} rx={3} fill={lc} opacity={0.4} />
          </g>
        );
      default:
        return <rect x={0} y={0} width={w} height={h} rx={10} fill={levelDef.bg} stroke={stroke} strokeWidth={sw} />;
    }
  };

  const hasLines = block.lines && block.lines[0];

  return (
    <g data-flow-node="true" transform={`translate(${x},${y})`}
      onClick={(e) => { e.stopPropagation(); onSelect(block); }}
      onDoubleClick={(e) => { e.stopPropagation(); if (canDrill) onDrill(block.id); }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ cursor: canDrill ? "pointer" : "default" }}>

      {(selected || hovered) && (
        <rect x={-4} y={-4} width={w + 8} height={h + 8} rx={levelDef.shape === "pill" ? h / 2 + 4 : 14}
          fill="none" stroke={selected ? T.accentGlow : `${lc}22`} strokeWidth={selected ? 5 : 3} />
      )}

      {renderShape()}

      {/* Handles */}
      <circle cx={w / 2} cy={0} r={3} fill={T.surface2} stroke={lc} strokeWidth={1.3} />
      <circle cx={w / 2} cy={h} r={3} fill={T.surface2} stroke={lc} strokeWidth={1.3} />

      {/* Icon */}
      <text x={18} y={levelDef.shape === "code" ? h / 2 + 1 : (hasLines ? h / 2 - 4 : h / 2 + 1)} textAnchor="middle" dominantBaseline="central" fontSize={14} fill={lc}>{levelDef.icon}</text>

      {/* Label */}
      <text x={36} y={hasLines && levelDef.shape !== "code" ? h / 2 - 10 : h / 2 - (canDrill ? 6 : 0)} dominantBaseline="central"
        fontSize={levelDef.shape === "code" ? 11.5 : 12} fontWeight={600} fill={T.textBright}
        fontFamily={levelDef.shape === "code" ? MONO : FONT}>
        {block.label && block.label.length > 34 ? block.label.slice(0, 33) + "…" : block.label}
      </text>

      {/* Lines or code */}
      {hasLines && levelDef.shape !== "code" && (
        <text x={36} y={h / 2 + 6} dominantBaseline="central" fontSize={10} fill={T.textDim} fontFamily={MONO}>
          L.{block.lines[0]}–{block.lines[1]}
        </text>
      )}
      {levelDef.shape === "detailed" && hasLines && (
        <text x={10} y={h - 5} fontSize={9} fill={T.textDim} fontFamily={MONO}>
          lignes {block.lines[0]}–{block.lines[1]}
        </text>
      )}
      {levelDef.shape === "code" && block.code && (
        <text x={36} y={h / 2 + 12} dominantBaseline="central" fontSize={9.5} fill={T.textDim} fontFamily={MONO}>
          L.{block.lines?.[0] || "?"}: {block.code.length > 32 ? block.code.slice(0, 31) + "…" : block.code}
        </text>
      )}

      {/* Drill-down hint */}
      {canDrill && (
        <text x={36} y={hasLines ? h / 2 + 20 : h / 2 + 10} fontSize={9} fill={lc} fontFamily={FONT} fontWeight={500} opacity={hovered ? 1 : 0.5}>
          ⤵ {levelDef.drillHint}
        </text>
      )}

      {/* Level badge */}
      <g transform={`translate(${w - 6},-6)`}>
        <rect x={-18} y={0} width={22} height={15} rx={7} fill={lc} opacity={0.18} />
        <text x={-7} y={10.5} textAnchor="middle" fontSize={8} fontWeight={700} fill={lc} fontFamily={FONT}>N{Object.values(LEVELS).findIndex(l => l.key === levelDef.key) + 1}</text>
      </g>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   10. FLOW DIAGRAM
   ═══════════════════════════════════════════════════════════════════════════ */
function FlowDiagram({ blocks, edges, selectedBlock, onSelectBlock, onHighlight, onDrill, level, viewKey }) {
  const levelDef = LEVELS[level];
  const canDrill = level < 4;
  const nextLevelKey = level < 4 ? LEVELS[level + 1].key : null;

  const layout = useMemo(() => computeLayout(blocks, edges, levelDef), [blocks, edges, levelDef]);
  const { flowNodes, flowEdges, canvasW, canvasH } = layout;

  const handleSelect = (block) => {
    onSelectBlock(block);
    if (block.lines) {
      const hl = [];
      for (let i = block.lines[0]; i <= block.lines[1]; i++) hl.push(i);
      onHighlight(hl);
    } else {
      onHighlight([]);
    }
  };

  return (
    <FlowCanvas canvasW={canvasW} canvasH={canvasH} viewKey={viewKey}>
      <svg width={canvasW} height={canvasH} style={{ overflow: "visible" }}>
        {flowEdges.map((e, i) => (
          <FlowEdge key={i} edge={e} levelColor={levelDef.color}
            highlighted={selectedBlock && (e.from === selectedBlock.id || e.to === selectedBlock.id)} />
        ))}
        {Object.values(flowNodes).map((n) => (
          <FlowNode key={n.id} node={n} levelDef={levelDef} canDrill={canDrill}
            selected={selectedBlock?.id === n.id}
            onSelect={handleSelect}
            onDrill={onDrill} />
        ))}
      </svg>
    </FlowCanvas>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   11. CODE EDITOR
   ═══════════════════════════════════════════════════════════════════════════ */
function CodeEditor({ code, setCode, highlightedLines, errorLines }) {
  const taRef = useRef(null), gRef = useRef(null);
  const lines = code.split("\n");
  const sync = () => { if (gRef.current && taRef.current) gRef.current.scrollTop = taRef.current.scrollTop; };
  return (
    <div style={{ display: "flex", height: "100%", fontFamily: MONO, fontSize: 13 }}>
      <div ref={gRef} style={{ width: 46, minWidth: 46, background: T.bg, color: T.textDim, textAlign: "right", padding: "12px 0", lineHeight: "1.7", overflow: "hidden", userSelect: "none", borderRight: `1px solid ${T.border}` }}>
        {lines.map((_, i) => {
          const ln = i + 1, isErr = (errorLines || []).includes(ln), isHl = (highlightedLines || []).includes(ln);
          return <div key={i} style={{ paddingRight: 8, color: isErr ? T.error : isHl ? T.accent : T.textDim, fontWeight: isErr || isHl ? 700 : 400, background: isErr ? T.errorSoft : isHl ? T.accentSoft : "transparent", borderRadius: 2 }}>{ln}</div>;
        })}
      </div>
      <textarea ref={taRef} value={code} onChange={(e) => setCode(e.target.value)} onScroll={sync} spellCheck={false}
        style={{ flex: 1, background: T.surface, color: T.textBright, border: "none", outline: "none", resize: "none", padding: "12px 16px", lineHeight: "1.7", fontFamily: "inherit", fontSize: "inherit", tabSize: 4 }}
        placeholder="# Colle ton code Python ici..." />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   12. ERROR PANEL
   ═══════════════════════════════════════════════════════════════════════════ */
function ErrorPanel({ errors, onClickLine }) {
  if (!errors.length) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>✓</div>
      <div style={{ color: T.success, fontWeight: 600 }}>Aucune erreur détectée</div>
    </div>
  );
  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: "4px 4px 8px" }}>{errors.length} PROBLÈME{errors.length > 1 ? "S" : ""}</div>
      {errors.map((e, i) => (
        <div key={i} onClick={() => onClickLine(e.line)} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", background: e.severity === "error" ? T.errorSoft : T.warningSoft, borderLeft: `3px solid ${e.severity === "error" ? T.error : T.warning}`, borderRadius: 8, cursor: "pointer" }}>
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, minWidth: 36, color: e.severity === "error" ? T.error : T.warning, background: e.severity === "error" ? "rgba(239,107,107,0.2)" : "rgba(232,184,77,0.2)", padding: "3px 6px", borderRadius: 4, textAlign: "center" }}>L.{e.line}</span>
          <span style={{ color: T.text, fontSize: 12.5, lineHeight: 1.55 }}>{e.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   13. EXECUTION PANEL
   ═══════════════════════════════════════════════════════════════════════════ */
function ExecutionPanel({ code, onHighlight }) {
  const [lineFrom, setLineFrom] = useState(""); const [lineTo, setLineTo] = useState("");
  const [testInputs, setTestInputs] = useState(""); const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true); setResult(null);
    try {
      const lines = code.split("\n");
      const from = parseInt(lineFrom) || 1, to = parseInt(lineTo) || lines.length;
      const hl = []; for (let i = from; i <= to; i++) hl.push(i); onHighlight(hl);
      const inputs = testInputs.trim() ? testInputs.split("\n").map((v) => v.trim()) : [];
      const msg = `Code:\n\`\`\`python\n${code}\n\`\`\`\nExécuter lignes ${from}–${to}.\n${from > 1 ? `Contexte:\n\`\`\`python\n${lines.slice(0, from - 1).join("\n")}\n\`\`\`` : ""}\nÀ exécuter:\n\`\`\`python\n${lines.slice(from - 1, to).join("\n")}\n\`\`\`\n${inputs.length ? `input(): ${JSON.stringify(inputs)}` : "Pas de valeurs."}`;
      setResult(extractJSON(await callLLM(SYS_EXECUTE, msg)));
    } catch (err) { setResult({ output: "", error: err.message, steps: [] }); }
    setLoading(false);
  };
  const iS = { background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textBright, padding: "8px 12px", fontSize: 13, fontFamily: MONO, outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ color: T.textDim, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>LIGNES</label>
        <input type="number" placeholder="Début" value={lineFrom} onChange={(e) => setLineFrom(e.target.value)} style={{ ...iS, width: 80 }} />
        <span style={{ color: T.textDim }}>à</span>
        <input type="number" placeholder="Fin" value={lineTo} onChange={(e) => setLineTo(e.target.value)} style={{ ...iS, width: 80 }} />
        <div style={{ flex: 1 }} />
        <button onClick={run} disabled={loading || !code.trim()} style={{ background: loading ? T.surface2 : `linear-gradient(135deg, ${T.success}, ${T.cyan})`, color: T.bg, border: "none", borderRadius: 8, padding: "9px 22px", fontWeight: 700, fontSize: 13, cursor: loading ? "wait" : "pointer", fontFamily: FONT, opacity: !code.trim() ? 0.4 : 1 }}>{loading ? "⏳ ..." : "▶ Exécuter"}</button>
      </div>
      <div>
        <label style={{ color: T.textDim, fontSize: 11, fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 6 }}>VALEURS DE TEST</label>
        <textarea value={testInputs} onChange={(e) => setTestInputs(e.target.value)} placeholder={"Alice\n25\noui"} rows={3} style={{ ...iS, width: "100%", resize: "vertical", lineHeight: 1.6 }} />
      </div>
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {result.error && <div style={{ background: T.errorSoft, border: `1px solid rgba(239,107,107,0.3)`, borderRadius: 10, padding: 14 }}><div style={{ color: T.error, fontWeight: 700, fontSize: 11, letterSpacing: 1, marginBottom: 6 }}>ERREUR</div><pre style={{ color: T.text, fontSize: 12.5, margin: 0, whiteSpace: "pre-wrap", fontFamily: MONO }}>{result.error}</pre></div>}
          {result.output && <div style={{ background: T.surface2, borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}><div style={{ color: T.success, fontWeight: 700, fontSize: 11, letterSpacing: 1, marginBottom: 6 }}>SORTIE</div><pre style={{ color: T.textBright, fontSize: 12.5, margin: 0, whiteSpace: "pre-wrap", fontFamily: MONO, lineHeight: 1.6 }}>{result.output}</pre></div>}
          {result.steps?.length > 0 && <div style={{ background: T.surface2, borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}><div style={{ color: T.cyan, fontWeight: 700, fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>TRACE</div>{result.steps.map((s, i) => <div key={i} style={{ display: "flex", gap: 10, marginBottom: 5, fontSize: 12.5 }}><span style={{ color: T.textDim, fontFamily: MONO, minWidth: 32, fontWeight: 600 }}>L.{s.line}</span><span style={{ color: T.text, lineHeight: 1.5 }}>{s.description}</span></div>)}</div>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   14. NODE INSPECTOR
   ═══════════════════════════════════════════════════════════════════════════ */
function NodeInspector({ block, code, level, onClose }) {
  const [query, setQuery] = useState(""); const [intent, setIntent] = useState("");
  const [chat, setChat] = useState([]); const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const lDef = LEVELS[level];
  const blockCode = block.lines ? code.split("\n").slice(block.lines[0] - 1, block.lines[1]).join("\n") : null;

  useEffect(() => { setChat([]); setQuery(""); setIntent(""); }, [block.id]);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chat]);

  const send = async () => {
    if (!query.trim() && !intent.trim()) return;
    setLoading(true);
    const uTxt = query.trim() || `[Intention] ${intent}`;
    let msg = `Code complet:\n\`\`\`python\n${code}\n\`\`\`\n\nNiveau d'abstraction: ${lDef.name}\nBloc: "${block.label}"`;
    if (blockCode) msg += `\n(lignes ${block.lines[0]}–${block.lines[1]}):\n\`\`\`python\n${blockCode}\n\`\`\``;
    if (query.trim()) msg += `\n\nQuestion: ${query}`;
    if (intent.trim()) msg += `\n\nIntention de l'étudiant: ${intent}\nCompare avec ce que le code fait.`;
    try {
      const answer = await callLLM(SYS_QUERY, msg);
      setChat((c) => [...c, { role: "user", text: uTxt }, { role: "assistant", text: answer }]);
      setQuery(""); setIntent("");
    } catch (err) { setChat((c) => [...c, { role: "system", text: err.message }]); }
    setLoading(false);
  };

  const iS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textBright, padding: "9px 12px", fontSize: 12.5, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: FONT };

  return (
    <div style={{ width: 340, display: "flex", flexDirection: "column", background: T.surface2, borderLeft: `1px solid ${T.border}` }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, background: lDef.bg, border: `1.5px solid ${lDef.color}` }}>{lDef.icon}</span>
          <div>
            <div style={{ color: T.textBright, fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{block.label?.length > 30 ? block.label.slice(0, 29) + "…" : block.label}</div>
            <div style={{ color: lDef.color, fontSize: 10, fontWeight: 600, fontFamily: MONO }}>
              {lDef.name}{block.lines ? ` · L.${block.lines[0]}–${block.lines[1]}` : ""}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, fontSize: 20, cursor: "pointer", padding: 4, lineHeight: 1 }}>×</button>
      </div>

      {/* Code preview (levels 3-4) */}
      {blockCode && (
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, maxHeight: 140, overflow: "auto", background: T.bg }}>
          <pre style={{ color: T.textBright, fontSize: 11.5, margin: 0, whiteSpace: "pre-wrap", fontFamily: MONO, lineHeight: 1.65 }}>
            {blockCode.split("\n").map((line, i) => (
              <div key={i}><span style={{ color: T.textDim, display: "inline-block", width: 28, textAlign: "right", marginRight: 10, userSelect: "none" }}>{block.lines[0] + i}</span>{line}</div>
            ))}
          </pre>
        </div>
      )}

      {/* Chat */}
      <div ref={chatRef} style={{ flex: 1, overflow: "auto", padding: "10px 14px" }}>
        {chat.length === 0 && (
          <div style={{ color: T.textDim, fontSize: 12, textAlign: "center", marginTop: 24, lineHeight: 1.7 }}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>💬</div>
            Pose une question sur ce bloc<br />ou décris ton intention
          </div>
        )}
        {chat.map((m, i) => (
          <div key={i} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 10, background: m.role === "user" ? T.accentSoft : m.role === "system" ? T.errorSoft : T.bg, border: `1px solid ${m.role === "system" ? "rgba(239,107,107,0.3)" : T.border}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: m.role === "user" ? T.accent : m.role === "system" ? T.error : T.cyan, letterSpacing: 1, marginBottom: 5 }}>
              {m.role === "user" ? "TOI" : m.role === "system" ? "ERREUR" : "ASSISTANT"}
            </div>
            <div style={{ color: T.text, fontSize: 12, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{ color: T.textDim, fontSize: 12, padding: 10, textAlign: "center" }}>⏳ Réflexion...</div>}
      </div>

      {/* Input */}
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Question sur ce bloc..."
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()} style={iS} />
        <div style={{ display: "flex", gap: 8 }}>
          <input value={intent} onChange={(e) => setIntent(e.target.value)} placeholder="Ton intention..."
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            style={{ ...iS, flex: 1, borderColor: `${T.pink}44`, fontSize: 11.5 }} />
          <button onClick={send} disabled={loading || (!query.trim() && !intent.trim())} style={{
            background: loading ? T.surface : T.accent, color: "#fff", border: "none", borderRadius: 8,
            padding: "0 18px", fontWeight: 700, fontSize: 12, cursor: loading ? "wait" : "pointer",
            fontFamily: FONT, opacity: !query.trim() && !intent.trim() ? 0.4 : 1, whiteSpace: "nowrap",
          }}>{loading ? "..." : "Envoyer"}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   15. BREADCRUMB + LEVEL INDICATOR
   ═══════════════════════════════════════════════════════════════════════════ */
function LevelSteps({ currentLevel }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4].map((lv) => {
        const ld = LEVELS[lv];
        const active = lv === currentLevel;
        const past = lv < currentLevel;
        return (
          <div key={lv} style={{ display: "flex", alignItems: "center" }}>
            {lv > 1 && <div style={{ width: 16, height: 1.5, background: past || active ? ld.color : T.border, marginRight: 2, opacity: past ? 0.6 : active ? 1 : 0.3 }} />}
            <div style={{
              width: active ? "auto" : 22, height: 22, borderRadius: active ? 11 : 11,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: active ? "0 10px" : 0,
              background: active ? ld.bgSoft : "transparent",
              border: `1.5px solid ${active ? ld.color : past ? `${ld.color}66` : T.border}`,
              transition: "all .2s",
            }}>
              <span style={{ fontSize: active ? 11 : 10, fontWeight: 700, color: active ? ld.color : past ? ld.color : T.textDim, fontFamily: FONT }}>
                {active ? `${ld.icon} ${ld.name}` : lv}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Breadcrumb({ path, onNavigate }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {path.map((item, i) => {
        const isLast = i === path.length - 1;
        const ld = LEVELS[item.level];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && <span style={{ color: T.textDim, margin: "0 6px", fontSize: 10 }}>›</span>}
            <button onClick={() => !isLast && onNavigate(i)} style={{
              background: isLast ? ld.bgSoft : "transparent",
              border: isLast ? `1px solid ${ld.color}33` : "1px solid transparent",
              borderRadius: 6, padding: "3px 8px",
              color: isLast ? ld.color : T.textDim,
              fontSize: 11, fontWeight: isLast ? 700 : 500,
              cursor: isLast ? "default" : "pointer", fontFamily: FONT,
            }}
              onMouseEnter={(e) => { if (!isLast) e.target.style.color = ld.color; }}
              onMouseLeave={(e) => { if (!isLast) e.target.style.color = T.textDim; }}>
              {ld.icon} {item.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   16. ABSTRACTION PANEL — 4-level navigation
   ═══════════════════════════════════════════════════════════════════════════ */
function AbstractionPanel({ code, onHighlight }) {
  const [data, setData] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Navigation state: [{level, parentId, label}]
  const [navStack, setNavStack] = useState([{ level: 1, parentId: null, label: "Programme" }]);
  const currentNav = navStack[navStack.length - 1];

  const generate = async () => {
    setLoading(true); setData(null); setSelectedBlock(null); setError(null);
    setNavStack([{ level: 1, parentId: null, label: "Programme" }]);
    try {
      const raw = await callLLM(SYS_ABSTRACT, `Code Python:\n\`\`\`python\n${code}\n\`\`\``);
      const parsed = extractJSON(raw);
      if (!parsed.intentions) throw new Error("Format inattendu — 'intentions' manquant.");
      setData(parsed);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  // Resolve current blocks/edges from data + navigation
  const { currentBlocks, currentEdges } = useMemo(() => {
    if (!data) return { currentBlocks: [], currentEdges: [] };
    const lv = currentNav.level;
    const pid = currentNav.parentId;

    if (lv === 1) {
      return { currentBlocks: data.intentions?.blocks || [], currentEdges: data.intentions?.edges || [] };
    }
    const levelKey = LEVELS[lv].key; // "actions", "specifications", "instructions"
    const sub = data[levelKey]?.[pid];
    return { currentBlocks: sub?.blocks || [], currentEdges: sub?.edges || [] };
  }, [data, currentNav]);

  const handleDrill = (blockId) => {
    if (currentNav.level >= 4) return;
    const nextLevel = currentNav.level + 1;
    const nextKey = LEVELS[nextLevel].key;
    // Check if children exist
    if (!data?.[nextKey]?.[blockId]) return;

    const block = currentBlocks.find((b) => b.id === blockId);
    setNavStack((s) => [...s, {
      level: nextLevel,
      parentId: blockId,
      label: block?.label?.length > 25 ? block.label.slice(0, 24) + "…" : block?.label || blockId,
    }]);
    setSelectedBlock(null);
    onHighlight([]);
  };

  const handleBreadcrumb = (index) => {
    setNavStack((s) => s.slice(0, index + 1));
    setSelectedBlock(null);
    onHighlight([]);
  };

  const canDrillCheck = (blockId) => {
    if (currentNav.level >= 4) return false;
    const nextKey = LEVELS[currentNav.level + 1].key;
    return !!data?.[nextKey]?.[blockId];
  };

  const viewKey = navStack.map((n) => `${n.level}-${n.parentId}`).join("/");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 14, background: T.surface, flexWrap: "wrap" }}>
        <button onClick={generate} disabled={loading || !code.trim()} style={{
          background: loading ? T.surface2 : `linear-gradient(135deg, ${T.purple}, ${T.accentDim})`,
          color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 12.5,
          cursor: loading ? "wait" : "pointer", fontFamily: FONT, opacity: !code.trim() ? 0.4 : 1,
        }}>{loading ? "⏳ Analyse..." : "🧩 Abstraire"}</button>

        {data && <LevelSteps currentLevel={currentNav.level} />}
        {data && navStack.length > 1 && <Breadcrumb path={navStack} onNavigate={handleBreadcrumb} />}
        {error && <span style={{ color: T.error, fontSize: 11 }}>{error}</span>}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {currentBlocks.length > 0 ? (
          <>
            <div style={{ flex: 1, position: "relative" }}>
              <FlowDiagram
                blocks={currentBlocks} edges={currentEdges}
                selectedBlock={selectedBlock} onSelectBlock={setSelectedBlock}
                onHighlight={onHighlight}
                onDrill={(id) => canDrillCheck(id) && handleDrill(id)}
                level={currentNav.level} viewKey={viewKey}
              />

              {/* Level info overlay */}
              <div style={{
                position: "absolute", top: 12, left: 12, background: `${T.surface}ee`,
                border: `1px solid ${LEVELS[currentNav.level].color}33`,
                borderRadius: 10, padding: "12px 16px", backdropFilter: "blur(8px)", maxWidth: 280,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{LEVELS[currentNav.level].icon}</span>
                  <div>
                    <div style={{ color: LEVELS[currentNav.level].color, fontSize: 13, fontWeight: 700 }}>
                      Niveau {currentNav.level} — {LEVELS[currentNav.level].name}
                    </div>
                    <div style={{ color: T.textDim, fontSize: 10, lineHeight: 1.4 }}>{LEVELS[currentNav.level].hint}</div>
                  </div>
                </div>
                {currentNav.level > 1 && (
                  <button onClick={() => handleBreadcrumb(navStack.length - 2)} style={{
                    background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 6,
                    color: T.textDim, padding: "4px 12px", fontSize: 11, cursor: "pointer",
                    fontFamily: FONT, fontWeight: 600, marginTop: 4, width: "100%",
                  }}
                    onMouseEnter={(e) => { e.target.style.color = T.accent; e.target.style.borderColor = T.accent; }}
                    onMouseLeave={(e) => { e.target.style.color = T.textDim; e.target.style.borderColor = T.border; }}>
                    ← Remonter au niveau {currentNav.level - 1}
                  </button>
                )}
                {currentNav.level < 4 && (
                  <div style={{ color: T.textDim, fontSize: 9.5, marginTop: 6, fontStyle: "italic" }}>
                    {LEVELS[currentNav.level].drillHint}
                  </div>
                )}
              </div>

              {/* Blocks count */}
              <div style={{ position: "absolute", bottom: 12, left: 12, color: T.textDim, fontSize: 10, fontFamily: MONO, background: `${T.surface}cc`, padding: "4px 10px", borderRadius: 6 }}>
                {currentBlocks.length} blocs · {currentEdges.length} liens
              </div>
            </div>

            {selectedBlock && (
              <NodeInspector block={selectedBlock} code={code} level={currentNav.level}
                onClose={() => { setSelectedBlock(null); onHighlight([]); }} />
            )}
          </>
        ) : !loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: T.textDim, maxWidth: 400 }}>
              <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.15 }}>🧩</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.textBright, marginBottom: 12 }}>Abstraction à 4 niveaux</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                {[1, 2, 3, 4].map((lv) => {
                  const ld = LEVELS[lv];
                  return (
                    <div key={lv} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16, minWidth: 24, textAlign: "center" }}>{ld.icon}</span>
                      <div>
                        <span style={{ color: ld.color, fontWeight: 700, fontSize: 12 }}>N{lv} — {ld.name}</span>
                        <div style={{ color: T.textDim, fontSize: 11, lineHeight: 1.4 }}>{ld.hint}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ color: T.textDim, fontSize: 11, marginTop: 16 }}>
                Clique sur « Abstraire » pour démarrer l'analyse
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   17. FILE UPLOAD + TAB BAR
   ═══════════════════════════════════════════════════════════════════════════ */
function FileUpload({ onLoad }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept=".py,.txt" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => onLoad(ev.target.result); r.readAsText(f); }} />
      <button onClick={() => ref.current?.click()} style={{
        background: "none", border: `1px solid ${T.border}`, borderRadius: 8,
        color: T.textDim, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontFamily: FONT, fontWeight: 600,
      }}
        onMouseEnter={(e) => { e.target.style.borderColor = T.accent; e.target.style.color = T.accent; }}
        onMouseLeave={(e) => { e.target.style.borderColor = T.border; e.target.style.color = T.textDim; }}>
        📁 Importer .py
      </button>
    </>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
      {tabs.map((t) => {
        const a = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            padding: "11px 22px", border: "none", cursor: "pointer", fontFamily: FONT,
            fontSize: 12.5, fontWeight: 600, color: a ? T.accent : T.textDim,
            background: a ? T.surface : "transparent",
            borderBottom: `2px solid ${a ? T.accent : "transparent"}`,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   18. MAIN APP
   ═══════════════════════════════════════════════════════════════════════════ */
const SAMPLE = `# Programme de calcul de notes
def calculer_moyenne(notes):
    total = 0
    for note in notes:
        total += note
    moyenne = total / len(notes)
    return moyenne

def afficher_resultat(nom, moyenne):
    if moyenne >= 60:
        mention = "Réussite"
    elif moyenne >= 50:
        mention = "Passage conditionnel"
    else:
        mention = "Échec"
    print(f"{nom}: {moyenne:.1f}% - {mention}")

nom = input("Entrez le nom de l'étudiant: ")
nb = int(input("Combien de notes? "))
notes = []
for i in range(nb):
    n = float(input(f"Note {i+1}: "))
    notes.append(n)

moy = calculer_moyenne(notes)
afficher_resultat(nom, moy)
`;

export default function PyEval() {
  const [code, setCode] = useState(SAMPLE);
  const [tab, setTab] = useState("abstract");
  const [errors, setErrors] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [hlLines, setHlLines] = useState([]);
  const [errLines, setErrLines] = useState([]);

  const analyze = async () => {
    setAnalyzing(true); setErrors([]); setErrLines([]); setTab("errors");
    try {
      const raw = await callLLM(SYS_ANALYZE, `Code Python:\n\`\`\`python\n${code}\n\`\`\``);
      const arr = Array.isArray(extractJSON(raw)) ? extractJSON(raw) : [];
      setErrors(arr); setErrLines(arr.filter((e) => e.severity === "error").map((e) => e.line));
    } catch (err) { setErrors([{ line: 0, severity: "error", message: err.message }]); }
    setAnalyzing(false);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", background: T.bg, color: T.text, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <FontLoader />
      <style>{`*{box-sizing:border-box} ::-webkit-scrollbar{width:6px;height:6px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 50, borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: "linear-gradient(135deg, #3b6fd4, #6c8eef)" }}>🐍</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: T.textBright, fontFamily: FONT, letterSpacing: -0.3 }}>PyÉval</span>
          <span style={{ color: T.textDim, fontSize: 10.5, background: T.surface2, padding: "3px 10px", borderRadius: 20, fontWeight: 500 }}>420-SN1</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <FileUpload onLoad={(t) => { setCode(t); setErrors([]); setErrLines([]); setHlLines([]); }} />
          <button onClick={analyze} disabled={analyzing || !code.trim()} style={{
            background: analyzing ? T.surface2 : `linear-gradient(135deg, ${T.accent}, ${T.accentDim})`,
            color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 700, fontSize: 12.5,
            cursor: analyzing ? "wait" : "pointer", fontFamily: FONT, opacity: !code.trim() ? 0.4 : 1,
          }}>{analyzing ? "⏳ Analyse..." : "🔍 Analyser"}</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: "38%", minWidth: 320, display: "flex", flexDirection: "column", borderRight: `1px solid ${T.border}` }}>
          <div style={{ padding: "9px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface }}>
            <span style={{ color: T.textDim, fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>ÉDITEUR</span>
            <span style={{ color: T.textDim, fontSize: 10, fontFamily: MONO }}>{code.split("\n").length} lignes</span>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <CodeEditor code={code} setCode={setCode} highlightedLines={hlLines} errorLines={errLines} />
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TabBar tabs={[
            { id: "abstract", label: "Abstraction", icon: "🧩" },
            { id: "errors", label: "Erreurs", icon: "🔍" },
            { id: "execute", label: "Exécution", icon: "▶" },
          ]} active={tab} onChange={setTab} />
          <div style={{ flex: 1, overflow: "hidden" }}>
            {tab === "errors" && <div style={{ height: "100%", overflowY: "auto" }}><ErrorPanel errors={errors} onClickLine={(l) => setHlLines([l])} /></div>}
            {tab === "execute" && <ExecutionPanel code={code} onHighlight={setHlLines} />}
            {tab === "abstract" && <AbstractionPanel code={code} onHighlight={setHlLines} />}
          </div>
        </div>
      </div>
    </div>
  );
}
