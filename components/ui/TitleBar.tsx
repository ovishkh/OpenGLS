/**
 * components/ui/TitleBar.tsx
 * macOS-style title bar with traffic lights (visual only) and OpenGLS branding.
 */

"use client";

export interface TitleBarProps {
  title?: string;
}

export default function TitleBar({ title = "OpenGLS" }: TitleBarProps) {
  return (
    <div
      style={{
        height: "28px",
        backgroundColor: "#323233",
        borderBottom: "1px solid #1e1e1e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Consolas', 'Courier New', monospace",
        fontSize: "13px",
        color: "#858585",
        userSelect: "none",
      }}
    >
      {/* Left: traffic lights (visual-only) */}
      <div
        style={{
          position: "absolute",
          left: "12px",
          display: "flex",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "#ED6158",
          }}
        />
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "#FFC02E",
          }}
        />
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "#5FC038",
          }}
        />
      </div>

      {/* Center: branding */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ color: "#858585", letterSpacing: "0.05em" }}>
          [
        </span>
        <span style={{ fontWeight: "bold", color: "#d4d4d4" }}>
          {title}
        </span>
        <span style={{ color: "#858585", letterSpacing: "0.05em" }}>
          ]
        </span>
      </div>
    </div>
  );
}
