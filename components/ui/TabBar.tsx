/**
 * components/ui/TabBar.tsx
 * Tab strip with algorithm selector and grid toggle button.
 */

"use client";

export interface TabBarProps {
  filename?: string;
  algorithm?: string;
  gridEnabled?: boolean;
  onAlgorithmChange?: (algo: string) => void;
  onGridToggle?: () => void;
  theme?: "light" | "dark";
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
}: TabBarProps) {
  const isDark = theme === "dark";
  const bgColor = isDark ? "#252526" : "#f5f5f5";
  const textColor = isDark ? "#d4d4d4" : "#333333";
  const textMuted = isDark ? "#858585" : "#666666";
  const borderColor = isDark ? "#1e1e1e" : "#dddddd";
  const activeTabBg = isDark ? "#1e1e1e" : "#ffffff";
  const selectBg = isDark ? "#3c3c3c" : "#eeeeee";
  const selectBorder = isDark ? "#555" : "#cccccc";

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
      {/* Tab */}
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
          marginRight: "8px",
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
    </div>
  );
}
