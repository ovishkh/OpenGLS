/**
 * components/ui/StatusBar.tsx
 * VS Code-style status bar with Run++ button.
 */

"use client";

export interface StatusBarProps {
  lineCount?: number;
  cursorLine?: number;
  cursorCol?: number;
  language?: string;
  encoding?: string;
  onStepTableToggle?: () => void;
  stepTableOpen?: boolean;
  onRun?: () => void;
  isRunning?: boolean;
  theme?: "light" | "dark";
}

export default function StatusBar({
  lineCount = 1,
  cursorLine = 1,
  cursorCol = 1,
  language = "c++",
  encoding = "UTF-8",
  onStepTableToggle,
  stepTableOpen = false,
  onRun,
  isRunning = false,
  theme = "dark",
}: StatusBarProps) {
  const isDark = theme === "dark";
  const bgColor = isDark ? "#007acc" : "#0078d4";
  const textColor = "#d4d4d4";
  const borderColor = isDark ? "#0078d4" : "#0070c0";

  return (
    <div
      style={{
        height: "24px",
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        paddingLeft: "8px",
        paddingRight: "8px",
        gap: "16px",
        fontFamily: "'Consolas', 'Courier New', monospace",
        fontSize: "12px",
        color: textColor,
        borderTop: `1px solid ${borderColor}`,
      }}
    >
      {/* Branch / file info */}
      <span>⎇ main</span>

      {/* Language */}
      <span>{language}</span>

      {/* Encoding */}
      <span>{encoding}</span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Ln, Col */}
      <span>
        Ln {cursorLine}, Col {cursorCol}
      </span>

      {/* Run++ button */}
      <button
        onClick={onRun}
        disabled={isRunning}
        style={{
          padding: "2px 8px",
          backgroundColor: isRunning ? "rgba(255,255,255,0.2)" : "transparent",
          color: textColor,
          border: `1px solid ${textColor}`,
          borderRadius: "2px",
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontSize: "12px",
          cursor: isRunning ? "not-allowed" : "pointer",
          outline: "none",
          transition: "all 200ms",
          opacity: isRunning ? 0.7 : 1,
        }}
      >
        {isRunning ? "⟳ Running..." : "▶ Run++"}
      </button>

      {/* Step table toggle */}
      <button
        onClick={onStepTableToggle}
        style={{
          padding: "0 4px",
          backgroundColor: "transparent",
          color: textColor,
          border: "none",
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontSize: "12px",
          cursor: "pointer",
          opacity: stepTableOpen ? 1 : 0.7,
          outline: "none",
        }}
      >
        {stepTableOpen ? "⌄" : "⌃"} Steps
      </button>
    </div>
  );
}
