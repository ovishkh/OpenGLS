/**
 * components/ui/TabBar.tsx
 * Tab strip with algorithm selector, grid toggle, run button, and theme dropdown.
 */

"use client";

import { useState } from "react";

export interface TabBarProps {
  filename?: string;
  algorithm?: string;
  gridEnabled?: boolean;
  onAlgorithmChange?: (algo: string) => void;
  onGridToggle?: () => void;
  theme?: "light" | "dark";
  onRun?: () => void;
  isRunning?: boolean;
  onThemeChange?: (theme: "light" | "dark") => void;
}

const algorithmOptions = [
  { value: "bresenham", label: "Bresenham's Line" },
  { value: "dda", label: "DDA Line" },
  { value: "midpoint", label: "Midpoint Circle" },
  { value: "bCircle", label: "Bresenham's Circle" },
];

export default function TabBar({
  filename = "display.cpp",
  algorithm = "bresenham",
  gridEnabled = true,
  onAlgorithmChange,
  onGridToggle,
  theme = "dark",
  onRun,
  isRunning = false,
  onThemeChange,
}: TabBarProps) {
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  
  const isDark = theme === "dark";
  const bgColor = isDark ? "#252526" : "#f5f5f5";
  const textColor = isDark ? "#d4d4d4" : "#333333";
  const textMuted = isDark ? "#858585" : "#666666";
  const borderColor = isDark ? "#1e1e1e" : "#dddddd";
  const activeTabBg = isDark ? "#1e1e1e" : "#ffffff";
  const selectBg = isDark ? "#3c3c3c" : "#eeeeee";
  const selectBorder = isDark ? "#555" : "#cccccc";
  const hoverBg = isDark ? "#2d2d2d" : "#e8e8e8";
  const dropdownBg = isDark ? "#3c3c3c" : "#ffffff";
  const dropdownBorder = isDark ? "#555" : "#ccc";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "35px",
        backgroundColor: bgColor,
        borderBottom: `1px solid ${borderColor}`,
        paddingLeft: "8px",
        gap: "8px",
        fontFamily: "'Consolas', 'Courier New', monospace",
        fontSize: "12px",
        color: textColor,
      }}
    >
      {/* Tab with Run button */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: activeTabBg,
            borderBottom: "2px solid #0078d4",
            borderRadius: "0 0 0 0",
            cursor: "default",
          }}
        >
          {filename}
        </div>

        {/* Run++ button (moved from status bar) */}
        <button
          onClick={onRun}
          disabled={isRunning}
          style={{
            padding: "4px 10px",
            backgroundColor: isRunning ? "rgba(0, 120, 212, 0.3)" : "#0078d4",
            color: "#ffffff",
            border: "none",
            borderRadius: "2px",
            fontFamily: "'Consolas', 'Courier New', monospace",
            fontSize: "12px",
            cursor: isRunning ? "not-allowed" : "pointer",
            outline: "none",
            transition: "all 200ms",
            opacity: isRunning ? 0.7 : 1,
            fontWeight: "500",
          }}
          title="Run simulation (Cmd+Enter)"
        >
          {isRunning ? "⟳ Running..." : "▶ Run++"}
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Algorithm selector */}
      <select
        value={algorithm}
        onChange={(e) => onAlgorithmChange?.(e.target.value)}
        style={{
          padding: "4px 8px",
          backgroundColor: selectBg,
          color: textColor,
          border: `1px solid ${selectBorder}`,
          borderRadius: "2px",
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontSize: "12px",
          cursor: "pointer",
          outline: "none",
        }}
      >
        {algorithmOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Grid toggle button */}
      <button
        onClick={onGridToggle}
        style={{
          padding: "4px 8px",
          backgroundColor: gridEnabled ? "#0078d4" : selectBg,
          color: gridEnabled ? "#ffffff" : textColor,
          border: `1px solid ${gridEnabled ? "#0078d4" : selectBorder}`,
          borderRadius: "2px",
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontSize: "12px",
          cursor: "pointer",
          transition: "all 200ms ease",
          outline: "none",
        }}
        onMouseEnter={(e) => {
          if (!gridEnabled) e.currentTarget.style.backgroundColor = isDark ? "#454545" : "#e0e0e0";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = gridEnabled ? "#0078d4" : selectBg;
        }}
      >
        ☰ grid
      </button>

      {/* Theme dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
          style={{
            padding: "4px 10px",
            backgroundColor: selectBg,
            color: textColor,
            border: `1px solid ${selectBorder}`,
            borderRadius: "2px",
            fontFamily: "'Consolas', 'Courier New', monospace",
            fontSize: "12px",
            cursor: "pointer",
            outline: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginRight: "8px",
            transition: "all 200ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? "#454545" : "#e0e0e0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = selectBg;
          }}
        >
          {theme === "light" ? "☀️" : "🌙"}
          <span>{theme === "light" ? "Light" : "Dark"}</span>
          <span style={{ fontSize: "10px" }}>▼</span>
        </button>

        {themeDropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              backgroundColor: dropdownBg,
              border: `1px solid ${dropdownBorder}`,
              borderRadius: "2px",
              boxShadow: isDark ? "0 4px 8px rgba(0,0,0,0.4)" : "0 4px 8px rgba(0,0,0,0.1)",
              zIndex: 1000,
              minWidth: "140px",
              overflow: "hidden",
            }}
          >
            {[
              { label: "Light", icon: "☀️", value: "light" },
              { label: "Dark", icon: "🌙", value: "dark" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onThemeChange?.(opt.value as "light" | "dark");
                  setThemeDropdownOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: theme === opt.value ? (isDark ? "#0078d4" : "#0070c0") : "transparent",
                  color: theme === opt.value ? "#ffffff" : textColor,
                  border: "none",
                  borderRadius: 0,
                  fontFamily: "'Consolas', 'Courier New', monospace",
                  fontSize: "12px",
                  cursor: "pointer",
                  outline: "none",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 100ms",
                }}
                onMouseEnter={(e) => {
                  if (theme !== opt.value) {
                    e.currentTarget.style.backgroundColor = isDark ? "#2d2d2d" : "#f0f0f0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme !== opt.value) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
