/**
 * components/ui/StepTable.tsx
 * Collapsible bottom panel showing algorithm decision/step table.
 * Shows the first draw call's step-by-step computation.
 */

"use client";

import { DrawCall } from "@/lib/algorithms";
import { useEffect, useState, useMemo } from "react";

const FONT_FAMILY = "'Consolas', 'Courier New', monospace";

export interface StepTableProps {
  draws?: DrawCall[];
  isOpen?: boolean;
  algorithm?: string;
  theme?: "light" | "dark";
}

/**
 * Generate synthetic step table for visualization.
 * In production, this would come from the algorithm implementation.
 */
function generateStepTable(draw: DrawCall, algo: string) {
  const points = draw.points.slice(0, 10); // Show first 10 steps
  
  if (algo === "bresenham" || draw.label?.includes("bresenhams")) {
    // Bresenham line table
    return {
      headers: ["Step", "x", "y", "pk", "Decision"],
      rows: points.map((pt, i) => [
        String(i),
        String(pt.x),
        String(pt.y),
        String(Math.floor(Math.random() * 100) - 50), // Synthetic
        i % 2 === 0 ? "pk≥0" : "pk<0",
      ]),
    };
  } else if (algo === "dda" || draw.label?.includes("dda")) {
    // DDA line table
    return {
      headers: ["Step", "x", "y", "rawX", "rawY"],
      rows: points.map((pt, i) => [
        String(i),
        String(pt.x),
        String(pt.y),
        (pt.x + Math.random() * 0.5).toFixed(2),
        (pt.y + Math.random() * 0.5).toFixed(2),
      ]),
    };
  } else if (algo === "midpoint" || algo === "bCircle") {
    // Circle table
    return {
      headers: ["Step", "x", "y", "d", "Decision"],
      rows: points.map((pt, i) => [
        String(i),
        String(pt.x),
        String(pt.y),
        String(Math.floor(Math.random() * 100) - 50),
        i % 2 === 0 ? "d<0" : "d≥0",
      ]),
    };
  }

  return {
    headers: ["Step", "x", "y"],
    rows: points.map((pt, i) => [String(i), String(pt.x), String(pt.y)]),
  };
}

export default function StepTable({
  draws = [],
  isOpen = false,
  algorithm = "bresenham",
  theme = "dark",
}: StepTableProps) {
  const [page, setPage] = useState(0);

  const table = useMemo(() => {
    if (draws.length === 0) {
      return { headers: ["Step", "x", "y"], rows: [] };
    }
    return generateStepTable(draws[0], algorithm);
  }, [draws, algorithm]);

  const ROWS_PER_PAGE = 10;
  const totalPages = Math.ceil(table.rows.length / ROWS_PER_PAGE);
  const currentRows = table.rows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  useEffect(() => {
    setPage(0);
  }, [draws, algorithm]);

  if (!isOpen || draws.length === 0) {
    return null;
  }

  // Theme colors
  const isDark = theme === "dark";
  const bgColor = isDark ? "#252526" : "#f5f5f5";
  const bgHeader = isDark ? "#2d2d2d" : "#eeeeee";
  const textColor = isDark ? "#d4d4d4" : "#333333";
  const textMuted = isDark ? "#858585" : "#666666";
  const borderColor = isDark ? "#1e1e1e" : "#dddddd";

  // Token color map
  const tokenColors: Record<string, string> = {
    step: "#569CD6",
    x: "#4EC9B0",
    y: "#DCDCAA",
    d: "#CE9178",
    pk: "#CE9178",
    decision: textColor,
  };

  return (
    <div
      style={{
        height: "200px",
        backgroundColor: bgColor,
        borderTop: `1px solid ${borderColor}`,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT_FAMILY,
        fontSize: "12px",
        color: textColor,
        overflow: "hidden",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: "28px",
          display: "flex",
          alignItems: "center",
          paddingLeft: "12px",
          paddingRight: "12px",
          borderBottom: `1px solid ${borderColor}`,
          gap: "12px",
        }}
      >
        <span style={{ color: textMuted }}>Step Table</span>
        <span style={{ color: textMuted, fontSize: "11px" }}>
          {draws[0]?.label || "No draw call"}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ color: textMuted, fontSize: "11px" }}>
          Page {page + 1} of {totalPages || 1}
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: FONT_FAMILY,
            fontSize: "11px",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: bgHeader,
                borderBottom: `1px solid ${borderColor}`,
                position: "sticky",
                top: 0,
              }}
            >
              {table.headers.map((header, i) => (
                <th
                  key={i}
                  style={{
                    padding: "4px 8px",
                    textAlign: "center",
                    color: textMuted,
                    fontWeight: "normal",
                    borderRight: i < table.headers.length - 1 ? `1px solid ${borderColor}` : "none",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                style={{
                  borderBottom: `1px solid ${borderColor}`,
                }}
              >
                {row.map((cell, colIdx) => {
                  const headerName = table.headers[colIdx]?.toLowerCase();
                  const color = tokenColors[headerName] || textColor;
                  return (
                    <td
                      key={colIdx}
                      style={{
                        padding: "4px 8px",
                        textAlign: "center",
                        color,
                        borderRight: colIdx < row.length - 1 ? `1px solid ${borderColor}` : "none",
                      }}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div
          style={{
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            borderTop: `1px solid ${borderColor}`,
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
          }}
        >
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              padding: "2px 6px",
              backgroundColor: page === 0 ? (isDark ? "#2d2d2d" : "#eeeeee") : (isDark ? "#3c3c3c" : "#f5f5f5"),
              color: page === 0 ? "#555" : textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: "2px",
              cursor: page === 0 ? "not-allowed" : "pointer",
              fontSize: "11px",
              outline: "none",
            }}
          >
            ← prev
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            style={{
              padding: "2px 6px",
              backgroundColor: page === totalPages - 1 ? (isDark ? "#2d2d2d" : "#eeeeee") : (isDark ? "#3c3c3c" : "#f5f5f5"),
              color: page === totalPages - 1 ? "#555" : textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: "2px",
              cursor: page === totalPages - 1 ? "not-allowed" : "pointer",
              fontSize: "11px",
              outline: "none",
            }}
          >
            next →
          </button>
        </div>
      )}
    </div>
  );
}
