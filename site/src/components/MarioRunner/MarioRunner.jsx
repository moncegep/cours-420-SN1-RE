import { ACTION_INFO, SAMPLE_LEVEL } from "./constants";
import { LevelGrid, TracePanel, Summary } from "./LevelPanels";
import { useMarioRunner } from "./useMarioRunner";
import "./styles.css";

export default function MarioRunner() {
  const {
    rawText, setRawText,
    level, result,
    currentStep, playing, speed, setSpeed,
    resolvedCount, error,
    dragOver, setDragOver,
    fileInputRef,
    currentTrace, traceUpTo,
    reset, loadLevel,
    handleFile, handleDrop,
    play, pause, stepForward, stepBack, goToEnd,
  } = useMarioRunner();

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#E2E8F0", fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, background: "linear-gradient(135deg, #E03030, #FF6B6B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px" }}>
            Mario Runner
          </h1>
          <p style={{ color: "#64748B", margin: "6px 0 0", fontSize: 15 }}>
            Téléversez votre niveau et regardez Mario le parcourir
          </p>
        </div>

        
        {/* Upload zone */}
        {!level && (
          <div style={{ maxWidth: 680, margin: "0 auto 24px" }}>
            <div
              className={`drop-zone ${dragOver ? "active" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".txt,.text" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
              <div style={{ fontSize: 40, marginBottom: 8 }}>📂</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Glissez votre fichier niveau.txt ici</div>
              <div style={{ color: "#64748B", fontSize: 13 }}>ou cliquez pour parcourir</div>
            </div>
            <div style={{ textAlign: "center", margin: "16px 0", color: "#475569", fontSize: 13 }}>— ou collez le texte —</div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={"[#][#][#][^][#][#]\n[#][#][#][#][#][#][#][#]"}
              style={{ width: "100%", height: 120, background: "#161b22", border: "1px solid #21262d", borderRadius: 8, color: "#E2E8F0", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, padding: 12, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => loadLevel(rawText)} disabled={!rawText.trim()}>▶ Charger le niveau</button>
              <button className="btn btn-secondary" onClick={() => { setRawText(SAMPLE_LEVEL); loadLevel(SAMPLE_LEVEL); }}>Exemple</button>
            </div>
            {error && (
              <div style={{ marginTop: 12, color: "#EF4444", background: "rgba(239,68,68,0.1)", padding: "10px 14px", borderRadius: 8, fontSize: 14 }}>{error}</div>
            )}
          </div>
        )}

        {/* Level loaded */}
        {level && result && (
          <>
            {/* Controls bar */}
            <div className="panel" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button className="btn btn-secondary btn-small" onClick={stepBack} disabled={currentStep <= 0}>⏮</button>
                {playing
                  ? <button className="btn btn-primary btn-small" onClick={pause}>⏸ Pause</button>
                  : <button className="btn btn-primary btn-small" onClick={play}>▶ {currentStep >= result.trace.length - 1 ? "Rejouer" : "Animer"}</button>
                }
                <button className="btn btn-secondary btn-small" onClick={stepForward} disabled={currentStep >= result.trace.length - 1}>⏭</button>
                <button className="btn btn-secondary btn-small" onClick={goToEnd} disabled={currentStep >= result.trace.length - 1}>Fin</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94A3B8" }}>
                <span>Vitesse :</span>
                <input type="range" min={50} max={800} step={50} value={850 - speed} onChange={(e) => setSpeed(850 - Number(e.target.value))} style={{ width: 100, accentColor: "#E03030" }} />
              </div>
              <button className="btn btn-secondary btn-small" onClick={() => { reset(); setRawText(""); }}>✕ Nouveau niveau</button>
            </div>

            {/* Warnings */}
            {(level.warnings.length > 0 || resolvedCount > 0) && (
              <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap", fontSize: 13 }}>
                {resolvedCount > 0 && (
                  <span style={{ background: "rgba(251,191,36,0.15)", color: "#FBBF24", padding: "4px 10px", borderRadius: 6 }}>
                    🎲 {resolvedCount} bloc{resolvedCount > 1 ? "s" : ""} [?] résolu{resolvedCount > 1 ? "s" : ""}
                  </span>
                )}
                {level.warnings.map((w, i) => (
                  <span key={i} style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", padding: "4px 10px", borderRadius: 6 }}>⚠ {w}</span>
                ))}
              </div>
            )}

            {/* Main grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>
              <div className="panel" style={{ overflow: "auto" }}>
                <LevelGrid
                  heights={level.heights} surfaces={level.surfaces} rows={level.rows}
                  marioCol={currentTrace ? currentTrace.col : -1}
                  marioAction={currentTrace?.action}
                  marioSpeed={currentTrace?.speed || 1}
                  traceUpTo={traceUpTo}
                />
                <div style={{ marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#64748B", overflowX: "auto", whiteSpace: "nowrap", padding: "4px 0" }}>
                  <div>Haut: {level.heights.map((h) => String(h).padStart(2)).join(" ")}</div>
                  {level.surfaces.some((s) => s && s !== "#") && (
                    <div>Type: {level.surfaces.map((s) => (s && s !== "#" ? ` ${s}` : "  ")).join(" ")}</div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {currentTrace && (
                  <div className="panel" style={{ padding: 14 }}>
                    {(() => {
                      const info = ACTION_INFO[currentTrace.action] || {};
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 24 }}>{info.icon}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: info.color, fontSize: 15 }}>{info.label}</div>
                            <div style={{ fontSize: 12, color: "#64748B" }}>
                              Colonne {currentTrace.col} · Hauteur {currentTrace.h}
                              {currentTrace.speed > 1 ? ` · Sprint ×${currentTrace.speed}` : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div className="panel" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1 }}>Simulation</div>
                  <TracePanel trace={result.trace} currentStep={currentStep} />
                </div>
                <div className="panel" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1 }}>Résumé</div>
                  <Summary heights={level.heights} surfaces={level.surfaces} trace={result.trace} success={result.success} resolvedCount={resolvedCount} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Legend */}
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "#475569" }}>
          <span style={{ marginRight: 16 }}><span style={{ color: "#D2691E" }}>■</span> [#] Bloc</span>
          <span style={{ marginRight: 16 }}><span style={{ color: "#33FFAA" }}>■</span> [^] Trampoline</span>
          <span style={{ marginRight: 16 }}><span style={{ color: "#FF69B4" }}>■</span> [&gt;] Accélérer</span>
          <span style={{ marginRight: 16 }}><span style={{ color: "#87CEEB" }}>■</span> [&lt;] Décélérer</span>
          <span><span style={{ color: "#FFD700" }}>■</span> [?] Aléatoire</span>
        </div>
      </div>
    </div>
  );
}