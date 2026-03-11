/**
 * components/Simulator.tsx
 * Main orchestrator component. Handles state, on-demand execution, and layout.
 * Integrates all sub-components: TitleBar, TabBar, CodeEditor, CanvasOutput, StepTable.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { parseCode } from "@/lib/parser";
import { DrawCall } from "@/lib/algorithms";

import CodeEditor from "./CodeEditor";
import CanvasOutput from "./CanvasOutput";
import TitleBar from "./ui/TitleBar";
import TabBar from "./ui/TabBar";
import StatusBar from "./ui/StatusBar";
import StepTable from "./ui/StepTable";

// Default code template
const DEFAULT_CODE = `// Bresenham's Line Drawing Algorithm
// CSE422 — Computer Graphics Lab

void display() {
    glClearColor(0, 0, 0, 1);
    glClear(GL_COLOR_BUFFER_BIT);

    glColor3f(1, 0, 0);
    bresenhams(0, 0, 200, 130);

    glColor3f(0, 1, 0);
    bresenhams(0, 0, 130, 200);

    glColor3f(0, 0.6, 1);
    bresenhams(0, 0, 200, 0);

    glColor3f(1, 0.8, 0);
    bresenhams(0, 0, 200, -130);

    glColor3f(0.8, 0, 1);
    bresenhams(0, 0, 130, -200);
}
`;

type ThemeMode = "light" | "dark";

const lightTheme = {
  bg: "#ffffff",
  bgAlt: "#f5f5f5",
  bgAlt2: "#eeeeee",
  text: "#333333",
  textMuted: "#666666",
  border: "#dddddd",
  editor: "#ffffff",
  editorBg: "#fafafa",
  accent: "#0078d4",
  statusBar: "#007acc",
  canvas: "#ffffff",
  grid: "rgba(0,0,0,0.04)",
  gridMajor: "rgba(0,0,0,0.08)",
  axes: "rgba(0,0,0,0.18)",
};

const darkTheme = {
  bg: "#1e1e1e",
  bgAlt: "#252526",
  bgAlt2: "#2d2d2d",
  text: "#d4d4d4",
  textMuted: "#858585",
  border: "#2d2d2d",
  editor: "#1e1e1e",
  editorBg: "#1e1e1e",
  accent: "#0078d4",
  statusBar: "#007acc",
  canvas: "#1e1e1e",
  grid: "rgba(255,255,255,0.04)",
  gridMajor: "rgba(255,255,255,0.08)",
  axes: "rgba(255,255,255,0.18)",
};

export default function Simulator() {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [draws, setDraws] = useState<DrawCall[]>([]);
  const [algorithm, setAlgorithm] = useState<string>("bresenham");
  const [gridEnabled, setGridEnabled] = useState<boolean>(true);
  const [stepTableOpen, setStepTableOpen] = useState<boolean>(false);
  const [cursorLine, setCursorLine] = useState<number>(1);
  const [cursorCol, setCursorCol] = useState<number>(1);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [isRunning, setIsRunning] = useState(false);

  const currentTheme = theme === "light" ? lightTheme : darkTheme;

  const runSimulation = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const result = parseCode(code);
      setDraws(result.draws);
      setIsRunning(false);
    }, 100); // Brief animation feedback
  }, [code]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Enter or Ctrl+Enter: force re-run
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        runSimulation();
      }

      // Ctrl+` or Cmd+`: toggle step table
      if ((e.metaKey || e.ctrlKey) && e.key === "`") {
        e.preventDefault();
        setStepTableOpen((prev) => !prev);
      }

      // Ctrl+G or Cmd+G: toggle grid
      if ((e.metaKey || e.ctrlKey) && e.key === "g") {
        e.preventDefault();
        setGridEnabled((prev) => !prev);
      }

      // Ctrl+L or Cmd+L: toggle light/dark mode
      if ((e.metaKey || e.ctrlKey) && e.key === "l") {
        e.preventDefault();
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runSimulation]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        backgroundColor: currentTheme.bg,
        color: currentTheme.text,
        overflow: "hidden",
      }}
    >
      {/* Title bar with branding and theme toggle */}
      <div
        style={{
          height: "28px",
          backgroundColor: currentTheme.bgAlt2,
          borderBottom: `1px solid ${currentTheme.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "12px",
          paddingRight: "12px",
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontSize: "13px",
          color: currentTheme.textMuted,
          userSelect: "none",
        }}
      >
        {/* Left: traffic lights */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ED6158" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FFC02E" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#5FC038" }} />
        </div>

        {/* Center: branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1, justifyContent: "center" }}>
          <span style={{ letterSpacing: "0.05em" }}>[</span>
          <span style={{ fontWeight: "bold", color: currentTheme.text }}>OpenGLS</span>
          <span style={{ letterSpacing: "0.05em" }}>]</span>
          <span style={{ fontSize: "11px", marginLeft: "8px", color: currentTheme.textMuted }}>
            © <a href="https://ovishekh.com" target="_blank" rel="noopener noreferrer" style={{ color: currentTheme.accent, textDecoration: "none" }}>Ovi Shekh</a>
          </span>
        </div>

        {/* Right: theme toggle */}
        <button
          onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
          style={{
            padding: "4px 8px",
            backgroundColor: "transparent",
            color: currentTheme.textMuted,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: "2px",
            cursor: "pointer",
            fontSize: "12px",
            outline: "none",
            transition: "all 200ms",
          }}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      {/* Tab bar */}
      <TabBar
        filename="display.cpp"
        algorithm={algorithm}
        gridEnabled={gridEnabled}
        onAlgorithmChange={setAlgorithm}
        onGridToggle={() => setGridEnabled((prev) => !prev)}
        theme={theme}
      />

      {/* Main editor + canvas split (60-40) */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* LEFT PANEL: Code editor (60%) */}
        <div
          style={{
            width: "60%",
            display: "flex",
            flexDirection: "column",
            borderRight: `1px solid ${currentTheme.border}`,
            overflow: "hidden",
            backgroundColor: currentTheme.editorBg,
          }}
        >
          <CodeEditor
            code={code}
            onChange={setCode}
            onCursorChange={(line, col) => {
              setCursorLine(line);
              setCursorCol(col);
            }}
            theme={theme}
          />

          {/* Status bar (bottom of left panel) */}
          <StatusBar
            lineCount={code.split("\n").length}
            cursorLine={cursorLine}
            cursorCol={cursorCol}
            language="c++"
            encoding="UTF-8"
            onStepTableToggle={() => setStepTableOpen((prev) => !prev)}
            stepTableOpen={stepTableOpen}
            onRun={runSimulation}
            isRunning={isRunning}
            theme={theme}
          />
        </div>

        {/* RIGHT PANEL: Canvas output (40%) */}
        <div
          style={{
            width: "40%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: currentTheme.bg,
          }}
        >
          <CanvasOutput draws={draws} gridEnabled={gridEnabled} theme={theme} />
        </div>
      </div>

      {/* BOTTOM PANEL: Step table (collapsible) */}
      {stepTableOpen && (
        <StepTable
          draws={draws}
          isOpen={stepTableOpen}
          algorithm={algorithm}
          theme={theme}
        />
      )}
    </div>
  );
}
