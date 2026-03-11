// lib/algorithms.ts
// Pure CG algorithm implementations — no side effects, fully testable

export interface Point {
  x: number;
  y: number;
}

export interface DrawCall {
  type: "line" | "circle";
  color: [number, number, number]; // RGB 0–1
  points: Point[];
  label: string;
}

export interface CompileResult {
  draws: DrawCall[];
  logs: LogLine[];
  success: boolean;
}

export interface LogLine {
  kind: "info" | "warn" | "error" | "success" | "step";
  text: string;
  ts: number;
}

// ── Bresenham's Line ──────────────────────────────────────────────────────────
export function bresenhamLine(x1: number, y1: number, x2: number, y2: number): Point[] {
  const pts: Point[] = [];
  let dx = Math.abs(x2 - x1);
  let dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let x = x1, y = y1;

  if (dx >= dy) {
    let pk = 2 * dy - dx;
    for (let i = 0; i <= dx; i++) {
      pts.push({ x, y });
      if (pk >= 0) { y += sy; pk += 2 * dy - 2 * dx; } else { pk += 2 * dy; }
      x += sx;
    }
  } else {
    let pk = 2 * dx - dy;
    for (let i = 0; i <= dy; i++) {
      pts.push({ x, y });
      if (pk >= 0) { x += sx; pk += 2 * dx - 2 * dy; } else { pk += 2 * dx; }
      y += sy;
    }
  }
  return pts;
}

// ── DDA Line ─────────────────────────────────────────────────────────────────
export function ddaLine(x1: number, y1: number, x2: number, y2: number): Point[] {
  const pts: Point[] = [];
  const dx = x2 - x1, dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  if (steps === 0) return [{ x: x1, y: y1 }];
  const xInc = dx / steps, yInc = dy / steps;
  let x = x1, y = y1;
  for (let i = 0; i <= steps; i++) {
    pts.push({ x: Math.round(x), y: Math.round(y) });
    x += xInc; y += yInc;
  }
  return pts;
}

// ── Midpoint Circle ───────────────────────────────────────────────────────────
export function midpointCircle(cx: number, cy: number, r: number): Point[] {
  const pts: Point[] = [];
  if (r <= 0) { pts.push({ x: cx, y: cy }); return pts; }
  let x = 0, y = r, d = 1 - r;
  const plot8 = (px: number, py: number) => {
    pts.push(
      { x: cx+px, y: cy+py }, { x: cx-px, y: cy+py },
      { x: cx+px, y: cy-py }, { x: cx-px, y: cy-py },
      { x: cx+py, y: cy+px }, { x: cx-py, y: cy+px },
      { x: cx+py, y: cy-px }, { x: cx-py, y: cy-px },
    );
  };
  while (x <= y) {
    plot8(x, y);
    if (d < 0) d += 2 * x + 3; else { d += 2 * (x - y) + 5; y--; }
    x++;
  }
  return pts;
}

// ── Bresenham Circle ──────────────────────────────────────────────────────────
export function bresenhamCircle(cx: number, cy: number, r: number): Point[] {
  const pts: Point[] = [];
  if (r <= 0) { pts.push({ x: cx, y: cy }); return pts; }
  let x = 0, y = r, pk = 3 - 2 * r;
  const plot8 = (px: number, py: number) => {
    pts.push(
      { x: cx+px, y: cy+py }, { x: cx-px, y: cy+py },
      { x: cx+px, y: cy-py }, { x: cx-px, y: cy-py },
      { x: cx+py, y: cy+px }, { x: cx-py, y: cy+px },
      { x: cx+py, y: cy-px }, { x: cx-py, y: cy-px },
    );
  };
  while (x <= y) {
    plot8(x, y);
    if (pk <= 0) pk += 4 * x + 6; else { pk += 4 * (x - y) + 10; y--; }
    x++;
  }
  return pts;
}

// ── C++ / OpenGL Code Parser & "Compiler" ────────────────────────────────────
export function compileCppCode(code: string): CompileResult {
  const logs: LogLine[] = [];
  const draws: DrawCall[] = [];
  const t = () => Date.now();

  const log = (kind: LogLine["kind"], text: string) => logs.push({ kind, text, ts: t() });

  log("info", "g++ -o program main.cpp -lGL -lGLU -lglut");
  log("step", "Preprocessing...");

  // ── Parse includes ──
  const hasWindows = /\#include\s*<windows\.h>/i.test(code);
  const hasGL = /\#include\s*<GL\/glut\.h>/i.test(code);

  if (!hasGL && !code.includes("bresenhams") && !code.includes("dda") && !code.includes("circle")) {
    log("warn", "warning: no OpenGL includes detected, attempting to parse draw calls anyway");
  }

  // ── Extract glOrtho viewport ──
  const orthoMatch = code.match(/glOrtho\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)/);
  if (orthoMatch) {
    log("step", `glOrtho viewport: [${orthoMatch[1]}, ${orthoMatch[2]}] x [${orthoMatch[3]}, ${orthoMatch[4]}]`);
  }

  log("step", "Compiling display()...");

  // ── Parse display / main body ──
  // Extract code between display() { ... } or just parse entire code
  const displayMatch = code.match(/void\s+display\s*\(\s*\)\s*\{([\s\S]*?)\}/);
  const body = displayMatch ? displayMatch[1] : code;

  // ── Process line by line for state machine (color + draw) ──
  let currentColor: [number, number, number] = [1, 1, 1];
  let drawCount = 0;
  const lines = body.split("\n");
  let parseErrors = 0;

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo].trim();
    if (!line || line.startsWith("//")) continue;

    // glClearColor
    if (/glClearColor/.test(line)) {
      const m = line.match(/glClearColor\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
      if (m) log("step", `glClearColor(${m[1]}, ${m[2]}, ${m[3]}, ...) → background set`);
    }

    // glColor3f — update current color
    const colorMatch = line.match(/glColor3f\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
    if (colorMatch) {
      currentColor = [+colorMatch[1], +colorMatch[2], +colorMatch[3]];
    }

    // bresenhams / bresenham line
    const bLineMatch = line.match(/bresenhams?\s*\(\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*\)/i);
    if (bLineMatch) {
      const [, x1, y1, x2, y2] = bLineMatch.map(Number);
      const dx = x2 - x1, dy = y2 - y1;
      const slope = dx !== 0 ? (dy / dx).toFixed(3) : "∞";
      const pts = bresenhamLine(x1, y1, x2, y2);
      draws.push({ type: "line", color: [...currentColor] as [number, number, number], points: pts, label: `bresenhams(${x1},${y1},${x2},${y2})` });
      log("info", `bresenhams(${x1}, ${y1}, ${x2}, ${y2}) → slope=${slope}, ${pts.length} pixels`);
      drawCount++;
    }

    // dda line
    const ddaMatch = line.match(/\bdda\s*\(\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*\)/i);
    if (ddaMatch) {
      const [, x1, y1, x2, y2] = ddaMatch.map(Number);
      const pts = ddaLine(x1, y1, x2, y2);
      draws.push({ type: "line", color: [...currentColor] as [number, number, number], points: pts, label: `dda(${x1},${y1},${x2},${y2})` });
      log("info", `dda(${x1}, ${y1}, ${x2}, ${y2}) → ${pts.length} pixels (float increments)`);
      drawCount++;
    }

    // midpointCircle / circle
    const circleMatch = line.match(/(?:circle|midpointCircle|drawCircle)\s*\(\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*\)/i);
    if (circleMatch) {
      const [, cx, cy, r] = circleMatch.map(Number);
      const pts = midpointCircle(cx, cy, r);
      draws.push({ type: "circle", color: [...currentColor] as [number, number, number], points: pts, label: `midpointCircle(${cx},${cy},${r})` });
      log("info", `midpointCircle(${cx}, ${cy}, r=${r}) → ${pts.length} pixels`);
      drawCount++;
    }

    // bresenhamCircle
    const bcMatch = line.match(/bresenhamCircle\s*\(\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*\)/i);
    if (bcMatch) {
      const [, cx, cy, r] = bcMatch.map(Number);
      const pts = bresenhamCircle(cx, cy, r);
      draws.push({ type: "circle", color: [...currentColor] as [number, number, number], points: pts, label: `bresenhamCircle(${cx},${cy},${r})` });
      log("info", `bresenhamCircle(${cx}, ${cy}, r=${r}) → ${pts.length} pixels`);
      drawCount++;
    }
  }

  if (parseErrors > 0) {
    log("warn", `${parseErrors} line(s) could not be parsed`);
  }

  if (drawCount === 0) {
    log("error", "error: no drawable function calls found in display()");
    log("error", "  supported: bresenhams(x1,y1,x2,y2)  dda(x1,y1,x2,y2)");
    log("error", "             circle(cx,cy,r)  midpointCircle(cx,cy,r)  bresenhamCircle(cx,cy,r)");
    return { draws: [], logs, success: false };
  }

  const totalPts = draws.reduce((s, d) => s + d.points.length, 0);
  log("success", `Compilation successful — ${drawCount} draw call(s), ${totalPts} pixels`);
  log("info", `Process finished with exit code 0`);

  return { draws, logs, success: true };
}

// ── Syntax highlighting ───────────────────────────────────────────────────────
export function highlightCpp(code: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = code.split("\n");
  return lines
    .map((raw) => {
      let line = esc(raw);

      // Comments (must be first)
      line = line.replace(
        /(\/\/.*)/g,
        `<span class="tok-comment">$1</span>`
      );

      // Preprocessor
      line = line.replace(
        /^(\s*#\w+(?:\s+&lt;[^&]*&gt;|[^\n]*)?)/,
        `<span class="tok-preproc">$1</span>`
      );

      // String literals
      line = line.replace(
        /"([^"]*)"/g,
        `"<span class="tok-string">$1</span>"`
      );

      // GL / GLUT functions
      line = line.replace(
        /\b(glColor3f|glVertex2f|glBegin|glEnd|glClear|glClearColor|glOrtho|glFlush|glPointSize|GL_POINTS|GL_COLOR_BUFFER_BIT|glutInit|glutInitWindowSize|glutInitWindowPosition|glutCreateWindow|glutDisplayFunc|glutMainLoop)\b/g,
        `<span class="tok-gl">$1</span>`
      );

      // Keywords
      line = line.replace(
        /\b(void|int|float|double|char|if|else|for|while|return|bool|const|auto|nullptr|true|false|struct|class|include|define|ifdef|endif|using|namespace|std)\b/g,
        `<span class="tok-kw">$1</span>`
      );

      // User-defined draw functions
      line = line.replace(
        /\b(bresenhams?|dda|midpointCircle|bresenhamCircle|circle|display|main|drawLine)\b/g,
        `<span class="tok-fn">$1</span>`
      );

      // Numbers
      line = line.replace(
        /(?<![a-zA-Z_])(-?\d+\.?\d*)/g,
        `<span class="tok-num">$1</span>`
      );

      return line;
    })
    .join("\n");
}
