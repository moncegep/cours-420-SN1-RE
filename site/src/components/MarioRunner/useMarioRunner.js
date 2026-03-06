import { useState, useRef, useCallback, useEffect } from "react";
import { parseLevel, resolveRandom, simulate } from "./logic";

export function useMarioRunner() {
  const [rawText, setRawText] = useState("");
  const [level, setLevel] = useState(null);
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(400);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Reset ───────────────────────────────────────────────
  const reset = useCallback(() => {
    setLevel(null);
    setResult(null);
    setCurrentStep(-1);
    setPlaying(false);
    setResolvedCount(0);
    setError("");
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // ── Load level from text ────────────────────────────────
  const loadLevel = useCallback((text) => {
    reset();
    setRawText(text);
    const { resolved, count } = resolveRandom(text);
    setResolvedCount(count);
    const parsed = parseLevel(resolved);
    if (!parsed || parsed.cols === 0) {
      setError("Impossible de lire le niveau. Vérifiez le format ([#], [ ], [^], [>], [<], [?]).");
      return;
    }
    if (parsed.cols < 2) {
      setError("Le niveau doit avoir au moins 2 colonnes.");
      return;
    }
    setLevel(parsed);
    setResult(simulate(parsed.heights, parsed.surfaces));
  }, [reset]);

  // ── File handling ───────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => loadLevel(e.target.result);
    reader.readAsText(file);
  }, [loadLevel]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // ── Animation loop ──────────────────────────────────────
  useEffect(() => {
    if (playing && result) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= result.trace.length - 1) {
            setPlaying(false);
            clearInterval(timerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
      return () => clearInterval(timerRef.current);
    }
  }, [playing, result, speed]);

  // ── Playback controls ──────────────────────────────────
  const play = useCallback(() => {
    if (!result) return;
    if (currentStep >= result.trace.length - 1) setCurrentStep(-1);
    setPlaying(true);
    setCurrentStep(0);
  }, [result, currentStep]);

  const pause = useCallback(() => setPlaying(false), []);

  const stepForward = useCallback(() => {
    if (!result) return;
    setPlaying(false);
    setCurrentStep((p) => Math.min(p + 1, result.trace.length - 1));
  }, [result]);

  const stepBack = useCallback(() => {
    setPlaying(false);
    setCurrentStep((p) => Math.max(p - 1, 0));
  }, []);

  const goToEnd = useCallback(() => {
    if (!result) return;
    setPlaying(false);
    setCurrentStep(result.trace.length - 1);
  }, [result]);

  // ── Derived values ─────────────────────────────────────
  const currentTrace = result?.trace[currentStep];
  const traceUpTo = result ? result.trace.slice(0, currentStep + 1) : [];

  return {
    // State
    rawText, setRawText,
    level, result,
    currentStep, playing, speed, setSpeed,
    resolvedCount, error,
    dragOver, setDragOver,
    fileInputRef,

    // Derived
    currentTrace, traceUpTo,

    // Actions
    reset, loadLevel,
    handleFile, handleDrop,
    play, pause, stepForward, stepBack, goToEnd,
  };
}