/**
 * components/CanvasOutput.tsx
 * Renders draw calls on an HTML5 canvas with grid, axes, and pixel-perfect output.
 * 
 * Coordinate system:
 *   - Origin (0,0) at center of canvas
 *   - Y-axis flipped: positive Y goes UP (OpenGL convention)
 *   - Cell size: 9px (1 unit = 9 pixels)
 *   - Canvas: 540x540
 */

"use client";

import { useRef, useEffect, useMemo } from "react";
import { DrawCall } from "@/lib/algorithms";

const CANVAS_SIZE = 540;
const CELL_SIZE = 9;

export interface CanvasOutputProps {
  draws: DrawCall[];
  gridEnabled?: boolean;
  theme?: "light" | "dark";
}

export default function CanvasOutput({
  draws,
  gridEnabled = true,
  theme = "dark",
}: CanvasOutputProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render canvas when draws or gridEnabled changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Theme colors
    const isDark = theme === "dark";
    const bgColor = isDark ? "#1e1e1e" : "#ffffff";
    const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
    const gridMajorColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const axesColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)";
    const labelColor = isDark ? "#858585" : "#666666";

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    // Draw grid (if enabled)
    if (gridEnabled) {
      // Minor grid lines (every 9px)
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
      }

      // Major grid lines (every 45px = 5 cells)
      ctx.strokeStyle = gridMajorColor;
      ctx.lineWidth = 1;
      for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE * 5) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
      }
    }

    // Draw axes
    ctx.strokeStyle = axesColor;
    ctx.lineWidth = 1;

    // X-axis (horizontal line through center)
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(CANVAS_SIZE, cy);
    ctx.stroke();

    // Y-axis (vertical line through center)
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, CANVAS_SIZE);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = labelColor;
    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // "x" label (right edge)
    ctx.fillText("x", CANVAS_SIZE - 16, cy + 4);

    // "y" label (top edge)
    ctx.fillText("y", cx + 4, 4);

    // "0" label (at origin)
    ctx.fillText("0", cx - 8, cy + 4);

    // Draw all points from draws
    draws.forEach((draw) => {
      const [r, g, b] = draw.color;
      ctx.fillStyle = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;

      draw.points.forEach((pt) => {
        const screenX = cx + pt.x * CELL_SIZE;
        const screenY = cy - pt.y * CELL_SIZE;
        ctx.fillRect(screenX, screenY, CELL_SIZE - 1, CELL_SIZE - 1);
      });
    });
  }, [draws, gridEnabled, theme]);

  // Compute legend (draw calls and pixel counts by color)
  const legend = useMemo(() => {
    const colorMap = new Map<string, { color: [number, number, number]; count: number }>();
    draws.forEach((draw) => {
      const key = draw.color.join(",");
      if (!colorMap.has(key)) {
        colorMap.set(key, { color: draw.color, count: 0 });
      }
      const item = colorMap.get(key)!;
      item.count += draw.points.length;
    });
    return Array.from(colorMap.entries()).map(([_, item]) => item);
  }, [draws]);

  const totalPixels = draws.reduce((sum, d) => sum + d.points.length, 0);

  const FONT_FAMILY = "'Consolas', 'Courier New', monospace";
  const isDark = theme === "dark";
  const bgColor = isDark ? "#1e1e1e" : "#ffffff";
  const bgAlt = isDark ? "#252526" : "#f5f5f5";
  const textColor = isDark ? "#d4d4d4" : "#333333";
  const textMuted = isDark ? "#858585" : "#666666";
  const borderColor = isDark ? "#1e1e1e" : "#dddddd";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* Header: status dot, pixel count, draw count */}
      <div
        style={{
          height: "28px",
          backgroundColor: bgAlt,
          display: "flex",
          alignItems: "center",
          paddingLeft: "12px",
          paddingRight: "12px",
          gap: "12px",
          borderBottom: `1px solid ${borderColor}`,
          fontSize: "12px",
        }}
      >
        {/* Status dot */}
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: draws.length > 0 ? "#28c840" : "#555",
            flexShrink: 0,
          }}
        />

        {/* Stats */}
        <span style={{ color: textMuted }}>
          {totalPixels} pixels · {draws.length} draw call{draws.length !== 1 ? "s" : ""}
        </span>

        <div style={{ flex: 1 }} />

        {/* Run hint */}
        <span style={{ color: textMuted, fontSize: "11px" }}>
          Click Run++ to simulate
        </span>
      </div>

      {/* Canvas */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "auto",
          padding: "12px",
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            border: `1px solid ${borderColor}`,
            imageRendering: "pixelated",
          }}
        />
      </div>

      {/* Color legend (if we have draws) */}
      {draws.length > 0 && (
        <div
          style={{
            height: "32px",
            backgroundColor: bgAlt,
            display: "flex",
            alignItems: "center",
            paddingLeft: "12px",
            paddingRight: "12px",
            gap: "16px",
            borderTop: `1px solid ${borderColor}`,
            fontSize: "11px",
            overflow: "auto",
          }}
        >
          {legend.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: `rgb(${Math.round(item.color[0] * 255)}, ${Math.round(item.color[1] * 255)}, ${Math.round(item.color[2] * 255)})`,
                }}
              />
              <span style={{ color: textMuted }}>
                draw{idx + 1} · {item.count}px
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
