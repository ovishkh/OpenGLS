"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { compileCppCode, type DrawCall, type LogLine } from "@/lib/algorithms";
import { highlightCpp } from "@/lib/algorithms";

// ── Canvas renderer ────────────────────────────────────────────────────────────
const CELL = 7; // px per logical pixel

function rgbCss(c: [number, number, number]) {
  return `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
}

function renderCanvas(
  canvas: HTMLCanvasElement,
  draws: DrawCall[],
  showGrid: boolean
) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width, H = canvas.height;
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2);

  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, W, H);

  if (showGrid) {
    // Minor grid
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += CELL) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += CELL) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // Major grid every 5
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    for (let x = 0; x < W; x += CELL * 5) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += CELL * 5) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  // Axes
  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

  // Axis ticks + labels
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "9px 'JetBrains Mono', monospace";
  for (let v = -50; v <= 50; v += 10) {
    if (v === 0) continue;
    const px = cx + v * CELL;
    const py = cy - v * CELL;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillText(String(v), px - 6, cy + 12);
    ctx.fillText(String(v), cx + 3, py + 3);
  }
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillText("x", W - 12, cy - 5);
  ctx.fillText("y", cx + 5, 10);
  ctx.fillText("0", cx + 3, cy - 3);

  // Draw pixels
  draws.forEach(({ points, color }) => {
    ctx.fillStyle = rgbCss(color);
    points.forEach(({ x, y }) => {
      ctx.fillRect(cx + x * CELL, cy - y * CELL, CELL - 1, CELL - 1);
    });
  });
}

// ── Log line component ─────────────────────────────────────────────────────────
function LogEntry({ line }: { line: LogLine }) {
  const colors: Record<string, string> = {
    info:    "#d4d4d4",
    step:    "#858585",
    warn:    "#cca700",
    error:   "#f48771",
    success: "#4ec9b0",
  };
  const prefixes: Record<string, string> = {
    info:    "",
    step:    "  ",
    warn:    "",
    error:   "",
    success: "",
  };
  return (
    <div className="log-line" style={{ color: colors[line.kind], lineHeight: "20px", whiteSpace: "pre-wrap" }}>
      {prefixes[line.kind]}{line.text}
    </div>
  );
}

// ── Main IDE ────────────────────────────────────────────────────────────────────
const EMPTY_CODE = `#include <windows.h>
#include <GL/glut.h>

void bresenhams(int x1, int y1, int x2, int y2) {
    int pk, x, y;
    float m = (float)(y2 - y1) / (float)(x2 - x1);

    if (m <= 1 && m >= 0) {
        pk = (2 * (y2 - y1)) - (x2 - x1);
        x = x1; y = y1;
        glBegin(GL_POINTS);
        for (int i = 0; i < (x2 - x1); i++) {
            glVertex2f(x, y);
            if (pk < 0) {
                x = x + 1;
                pk = pk + (2 * (y2 - y1));
            } else {
                x = x + 1; y = y + 1;
                pk = pk + (2 * (y2 - y1)) - (2 * (x2 - x1));
            }
        }
        glEnd();
    }
    // ... (other slope cases)
}

void display() {
    glClearColor(0, 0, 0, 1);
    glOrtho(0, 500, -500, 500, 0, 500);
    glClear(GL_COLOR_BUFFER_BIT);

    glColor3f(1, 0, 0); bresenhams(0, 0, 200, 130);
    glColor3f(0, 1, 0); bresenhams(0, 0, 130, 200);
    glColor3f(0, 0.6, 1); bresenhams(0, 0, 200, 0);
    glColor3f(1, 0.8, 0); bresenhams(0, 0, 200, -130);
    glColor3f(0.8, 0, 1); bresenhams(0, 0, 130, -200);

    glFlush();
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitWindowSize(500, 500);
    glutInitWindowPosition(50, 50);
    glutCreateWindow("Bresenhams Line Drawing Algorithm");
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}`;

const TABS = [
  { name: "main.cpp", icon: "C" },
];

export default function IDE() {
  const [code, setCode] = useState(EMPTY_CODE);
  const [draws, setDraws] = useState<DrawCall[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [compiled, setCompiled] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [panelH, setPanelH] = useState(180); // terminal height
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragY = useRef(0);
  const startH = useRef(0);

  // Sync overlay scroll with textarea
  const syncScroll = () => {
    if (overlayRef.current && taRef.current) {
      overlayRef.current.scrollTop = taRef.current.scrollTop;
      overlayRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  // Run compile
  const compile = useCallback(() => {
    const result = compileCppCode(code);
    setLogs(result.logs);
    setDraws(result.draws);
    setCompiled(result.success);
    setTimeout(() => {
      if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
    }, 50);
  }, [code]);

  // Keyboard shortcut Ctrl+Enter / F5
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === "Enter") || e.key === "F5") {
        e.preventDefault();
        compile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [compile]);

  // Canvas render
  useEffect(() => {
    if (canvasRef.current) renderCanvas(canvasRef.current, draws, showGrid);
  }, [draws, showGrid]);

  // Handle tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      setTimeout(() => { el.selectionStart = el.selectionEnd = start + 4; }, 0);
    }
  };

  // Drag-to-resize terminal panel
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragY.current = e.clientY;
    startH.current = panelH;
    e.preventDefault();
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = dragY.current - e.clientY;
      setPanelH(Math.max(80, Math.min(400, startH.current + delta)));
    };
    const up = () => { dragging.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);

  const codeLines = code.split("\n");
  const highlighted = highlightCpp(code);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#1e1e1e", color: "#d4d4d4", overflow: "hidden",
      fontFamily: "'JetBrains Mono', 'Consolas', monospace", fontSize: 13,
    }}>

      {/* ── Title bar ── */}
      <div style={{
        height: 30, background: "#3c3c3c", display: "flex", alignItems: "center",
        padding: "0 16px", borderBottom: "1px solid #111", flexShrink: 0, position: "relative",
        userSelect: "none",
      }}>
        <div style={{ display: "flex", gap: 6, marginRight: 12 }}>
          {["#ff5f57","#febc2e","#28c840"].map((c,i) => (
            <div key={i} style={{ width:11, height:11, borderRadius:"50%", background:c }}/>
          ))}
        </div>
        <span style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          fontSize: 12, color: "#cccccc", opacity: .65, letterSpacing: ".3px"
        }}>
          CG Compiler — CSE422 Computer Graphics
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#858585", cursor: "pointer" }}>
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)}
              style={{ accentColor: "#0078d4", cursor: "pointer" }} />
            grid
          </label>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        height: 35, background: "#252526", display: "flex", alignItems: "flex-end",
        borderBottom: "1px solid #111", flexShrink: 0,
      }}>
        {/* Activity bar stub */}
        <div style={{
          width: 48, height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 14,
          borderRight: "1px solid #111", flexShrink: 0,
        }}>
          <div style={{ fontSize: 16, color: "#858585", opacity: .7 }} title="Explorer">⬚</div>
        </div>

        {/* File tabs */}
        {TABS.map((tab) => (
          <div key={tab.name} style={{
            height: 34, padding: "0 14px", display: "flex", alignItems: "center", gap: 7,
            background: "#1e1e1e", borderTop: "1px solid #0078d4",
            borderRight: "1px solid #252526", cursor: "default",
            fontSize: 13, color: "#d4d4d4", flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, color: "#7cbce9", fontWeight: 700 }}>{tab.icon}</span>
            <span>{tab.name}</span>
            <span style={{ fontSize: 10, opacity: .3, marginLeft: 4 }}>✕</span>
          </div>
        ))}

        {/* Right side: compile button */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: 12, paddingBottom: 4 }}>
          <button
            onClick={compile}
            title="Compile & Run (Ctrl+Enter)"
            style={{
              background: "#0078d4", border: "none", color: "#fff",
              padding: "3px 14px", borderRadius: 3, fontSize: 12,
              cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
              fontWeight: 500, letterSpacing: ".2px",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#1a8fe8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#0078d4")}
          >
            ▶ Run  <span style={{ opacity: .55, fontSize: 10 }}>Ctrl+Enter</span>
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* ── Left: Code editor ── */}
        <div style={{ width: "50%", display: "flex", flexDirection: "column", borderRight: "1px solid #111", overflow: "hidden", minHeight: 0 }}>

          {/* Editor body */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
            {/* Line numbers */}
            <div style={{
              width: 50, background: "#1e1e1e", color: "#5a5a5a",
              fontSize: 13, lineHeight: "20px", padding: "8px 0",
              textAlign: "right", userSelect: "none", flexShrink: 0,
              borderRight: "1px solid #2a2a2a", overflowY: "hidden",
            }}>
              {codeLines.map((_, i) => (
                <div key={i} style={{ height: 20, paddingRight: 10 }}>{i + 1}</div>
              ))}
            </div>

            {/* Code area */}
            <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
              {/* Highlight overlay */}
              <div
                ref={overlayRef}
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  padding: "8px 0 8px 14px", margin: 0,
                  fontSize: 13, lineHeight: "20px",
                  fontFamily: "inherit", whiteSpace: "pre", overflow: "scroll",
                  pointerEvents: "none", zIndex: 1, color: "#d4d4d4",
                  background: "transparent",
                }}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
              {/* Real textarea */}
              <textarea
                ref={taRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                onScroll={syncScroll}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  padding: "8px 0 8px 14px", margin: 0, width: "100%", height: "100%",
                  fontSize: 13, lineHeight: "20px", fontFamily: "inherit",
                  background: "transparent", color: "transparent",
                  caretColor: "#aeafad", border: "none", outline: "none",
                  resize: "none", whiteSpace: "pre", overflow: "scroll",
                  zIndex: 2, boxSizing: "border-box", tabSize: 4,
                }}
              />
            </div>
          </div>

          {/* ── Terminal / output panel ── */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", height: panelH, minHeight: 0, borderTop: "1px solid #111" }}>
            {/* Drag handle */}
            <div
              onMouseDown={onMouseDown}
              style={{
                height: 5, background: "#2a2a2a", cursor: "ns-resize", flexShrink: 0,
                borderBottom: "1px solid #333",
              }}
            />
            {/* Terminal header */}
            <div style={{
              height: 28, background: "#252526", display: "flex", alignItems: "center",
              padding: "0 12px", gap: 14, borderBottom: "1px solid #111", flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, color: "#858585" }}>TERMINAL</span>
              <span style={{ fontSize: 11, color: "#4d4d4d" }}>|</span>
              <span style={{
                fontSize: 11,
                color: compiled ? "#4ec9b0" : logs.length ? "#f48771" : "#858585",
              }}>
                {compiled ? "✓ Build succeeded" : logs.length ? "✗ Build failed" : "Ready — press ▶ Run"}
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <span
                  onClick={() => { setLogs([]); setDraws([]); setCompiled(false); }}
                  style={{ fontSize: 11, color: "#4d4d4d", cursor: "pointer", userSelect: "none" }}
                  title="Clear"
                >⊗ clear</span>
              </div>
            </div>
            {/* Terminal body */}
            <div
              ref={termRef}
              style={{
                flex: 1, overflow: "auto", padding: "8px 16px",
                background: "#0d0d0d", fontSize: 12.5, lineHeight: "20px",
              }}
            >
              {logs.length === 0 && (
                <div style={{ color: "#555" }}>
                  <span style={{ color: "#4ec9b0" }}>$</span>{" "}
                  <span style={{ color: "#858585" }}>Waiting for compilation… Press </span>
                  <span style={{ color: "#d4d4d4" }}>▶ Run</span>
                  <span style={{ color: "#858585" }}> or </span>
                  <span style={{ color: "#d4d4d4" }}>Ctrl+Enter</span>
                  <span className="cursor-blink" style={{ color: "#aeafad" }}>█</span>
                </div>
              )}
              {logs.map((l, i) => <LogEntry key={i} line={l} />)}
              {logs.length > 0 && (
                <div style={{ color: "#555", marginTop: 4 }}>
                  <span className="cursor-blink" style={{ color: "#aeafad" }}>█</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Status bar ── */}
          <div style={{
            height: 22, background: "#007acc", display: "flex", alignItems: "center",
            padding: "0 12px", gap: 16, fontSize: 11, color: "rgba(255,255,255,.8)", flexShrink: 0,
          }}>
            <span>⎇ main</span>
            <span style={{ marginLeft: "auto" }}>C++</span>
            <span>Ln {codeLines.length}</span>
            <span>UTF-8</span>
          </div>
        </div>

        {/* ── Right: Output canvas ── */}
        <div style={{
          width: "50%", display: "flex", flexDirection: "column",
          background: "#1e1e1e", overflow: "hidden",
        }}>
          {/* Output header */}
          <div style={{
            height: 28, background: "#252526", display: "flex", alignItems: "center",
            padding: "0 14px", gap: 10, borderBottom: "1px solid #111", flexShrink: 0,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: compiled ? "#28c840" : "#555",
              boxShadow: compiled ? "0 0 6px #28c840" : "none",
              transition: "all .3s",
            }} />
            <span style={{ fontSize: 11, color: "#858585" }}>
              {compiled
                ? `${draws.reduce((s,d)=>s+d.points.length,0)} pixels · ${draws.length} draw call${draws.length!==1?"s":""}`
                : "OpenGL Output — run to render"}
            </span>
          </div>

          {/* Canvas area */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", position: "relative",
          }}>
            {/* Not compiled overlay */}
            {!compiled && (
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 12, zIndex: 10, pointerEvents: "none",
              }}>
                <div style={{ fontSize: 32, opacity: .12 }}>⬡</div>
                <span style={{ fontSize: 12, color: "#555", letterSpacing: ".5px" }}>
                  OUTPUT WINDOW
                </span>
                <span style={{ fontSize: 11, color: "#3a3a3a" }}>
                  Press ▶ Run to compile and render
                </span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={520} height={520}
              style={{
                display: "block", imageRendering: "pixelated",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.05)",
                opacity: compiled ? 1 : .25,
                transition: "opacity .4s",
              }}
            />
          </div>

          {/* Legend / draw calls */}
          {draws.length > 0 && (
            <div style={{
              background: "#252526", borderTop: "1px solid #111",
              padding: "6px 14px", display: "flex", flexWrap: "wrap",
              gap: "4px 20px", flexShrink: 0,
            }}>
              {draws.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#858585" }}>
                  <div style={{ width: 9, height: 9, background: rgbCss(d.color), borderRadius: 1, flexShrink: 0 }}/>
                  <span style={{ color: "#6a6a6a" }}>{d.label}</span>
                  <span style={{ color: "#444" }}>· {d.points.length}px</span>
                </div>
              ))}
            </div>
          )}

          {/* Status bar right */}
          <div style={{
            height: 22, background: "#007acc", display: "flex", alignItems: "center",
            padding: "0 12px", gap: 16, fontSize: 11, color: "rgba(255,255,255,.8)", flexShrink: 0,
          }}>
            <span>OpenGL 2.1</span>
            <span style={{ marginLeft: "auto" }}>GLUT 3.7</span>
            <span>500×500</span>
          </div>
        </div>
      </div>

      {/* Token colors injected as a style tag */}
      <style>{`
        .tok-comment { color: #6A9955; font-style: italic; }
        .tok-preproc  { color: #c586c0; }
        .tok-string   { color: #ce9178; }
        .tok-kw       { color: #569cd6; }
        .tok-gl       { color: #4ec9b0; }
        .tok-fn       { color: #dcdcaa; }
        .tok-num      { color: #b5cea8; }
      `}</style>
    </div>
  );
}
