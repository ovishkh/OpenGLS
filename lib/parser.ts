/**
 * lib/parser.ts
 * Parse raw C++/OpenGL code and extract draw calls with colors and coordinates.
 * Pure function — no side effects, fully testable.
 */

import { bresenhamLine, ddaLine, midpointCircle, bresenhamCircle, Point, DrawCall } from "./algorithms";

export interface ParseResult {
  draws: DrawCall[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse C++/OpenGL code and extract draw calls.
 *
 * Supported draw functions:
 *   - bresenhams(x1, y1, x2, y2) / bresenham(...)
 *   - dda(x1, y1, x2, y2)
 *   - drawLine(...)
 *   - circle(cx, cy, r) / midpointCircle(...) / drawCircle(...)
 *   - bresenhamCircle(cx, cy, r)
 *
 * Supported color:
 *   - glColor3f(r, g, b) — floats 0.0–1.0
 *
 * Default color: [1, 1, 1] (white) if no glColor3f encountered.
 */
export function parseCode(code: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const draws: DrawCall[] = [];

  if (!code || code.trim().length === 0) {
    errors.push("No code provided.");
    return { draws, errors, warnings };
  }

  // Extract code between display() { ... } or use the entire code
  const displayMatch = code.match(/void\s+display\s*\(\s*\)\s*\{([\s\S]*?)\}/);
  const body = displayMatch ? displayMatch[1] : code;

  // Process line-by-line state machine (color is maintained across lines)
  let currentColor: [number, number, number] = [1, 1, 1];
  let drawCount = 0;
  const lines = body.split("\n");

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith("//")) continue;

    // Parse glColor3f — updates current color for all subsequent draws
    const colorMatch = line.match(/glColor3f\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
    if (colorMatch) {
      currentColor = [+colorMatch[1], +colorMatch[2], +colorMatch[3]];
    }

    // Parse Bresenham line: bresenhams(x1, y1, x2, y2) or bresenham(...)
    const bLineMatch = line.match(/bresenhams?\s*\(\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*\)/i);
    if (bLineMatch) {
      const [, x1Str, y1Str, x2Str, y2Str] = bLineMatch;
      const [x1, y1, x2, y2] = [x1Str, y1Str, x2Str, y2Str].map(Number);
      const pts = bresenhamLine(x1, y1, x2, y2);
      draws.push({
        type: "line",
        color: [...currentColor] as [number, number, number],
        points: pts,
        label: `bresenhams(${x1},${y1},${x2},${y2})`,
      });
      drawCount++;
      continue;
    }

    // Parse DDA line: dda(x1, y1, x2, y2)
    const ddaMatch = line.match(/\bdda\s*\(\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*\)/i);
    if (ddaMatch) {
      const [, x1Str, y1Str, x2Str, y2Str] = ddaMatch;
      const [x1, y1, x2, y2] = [x1Str, y1Str, x2Str, y2Str].map(Number);
      const pts = ddaLine(x1, y1, x2, y2);
      draws.push({
        type: "line",
        color: [...currentColor] as [number, number, number],
        points: pts,
        label: `dda(${x1},${y1},${x2},${y2})`,
      });
      drawCount++;
      continue;
    }

    // Parse drawLine (generic alias)
    const drawLineMatch = line.match(/drawLine\s*\(\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*\)/i);
    if (drawLineMatch) {
      const [, x1Str, y1Str, x2Str, y2Str] = drawLineMatch;
      const [x1, y1, x2, y2] = [x1Str, y1Str, x2Str, y2Str].map(Number);
      const pts = bresenhamLine(x1, y1, x2, y2); // default to Bresenham
      draws.push({
        type: "line",
        color: [...currentColor] as [number, number, number],
        points: pts,
        label: `drawLine(${x1},${y1},${x2},${y2})`,
      });
      drawCount++;
      continue;
    }

    // Parse circles: circle(...) / midpointCircle(...) / drawCircle(...)
    const circleMatch = line.match(/(?:circle|midpointCircle|drawCircle)\s*\(\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*\)/i);
    if (circleMatch) {
      const [, cxStr, cyStr, rStr] = circleMatch;
      const [cx, cy, r] = [cxStr, cyStr, rStr].map(Number);
      const pts = midpointCircle(cx, cy, r);
      draws.push({
        type: "circle",
        color: [...currentColor] as [number, number, number],
        points: pts,
        label: `midpointCircle(${cx},${cy},${r})`,
      });
      drawCount++;
      continue;
    }

    // Parse Bresenham circle
    const bcMatch = line.match(/bresenhamCircle\s*\(\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*,\s*(-?[\d]+)\s*\)/i);
    if (bcMatch) {
      const [, cxStr, cyStr, rStr] = bcMatch;
      const [cx, cy, r] = [cxStr, cyStr, rStr].map(Number);
      const pts = bresenhamCircle(cx, cy, r);
      draws.push({
        type: "circle",
        color: [...currentColor] as [number, number, number],
        points: pts,
        label: `bresenhamCircle(${cx},${cy},${r})`,
      });
      drawCount++;
      continue;
    }
  }

  // Validate results
  if (drawCount === 0) {
    errors.push("No drawable calls found. Use bresenhams(), dda(), circle(), etc.");
  }

  // Total pixel count warning if over threshold
  const totalPixels = draws.reduce((sum, d) => sum + d.points.length, 0);
  if (totalPixels > 10000) {
    warnings.push(`${totalPixels} pixels to render — performance may degrade.`);
  }

  return { draws, errors, warnings };
}

/**
 * Syntax highlight C++ code for display in editor.
 * Returns HTML string with <span class="tok-*"> tokens.
 * Token classes: tok-comment, tok-preproc, tok-string, tok-gl, tok-kw, tok-fn, tok-num, tok-op
 */
export function highlightCpp(code: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = code.split("\n");
  return lines
    .map((raw) => {
      let line = esc(raw);

      // Comments (first, so they don't get tokenized further)
      line = line.replace(/(\/\/.*)/g, `<span class="tok-comment">$1</span>`);

      // Preprocessor directives
      line = line.replace(/^(\s*#\w+(?:\s+&lt;[^&]*&gt;|[^\n]*)?)/, `<span class="tok-preproc">$1</span>`);

      // String literals
      line = line.replace(/"([^"]*)"/g, `"<span class="tok-string">$1</span>"`);

      // OpenGL / GLUT functions (must be before keywords to avoid conflicts)
      line = line.replace(
        /\b(glColor3f|glVertex2f|glBegin|glEnd|glClear|glClearColor|glOrtho|glFlush|glPointSize|GL_POINTS|GL_COLOR_BUFFER_BIT|glutInit|glutInitWindowSize|glutInitWindowPosition|glutCreateWindow|glutDisplayFunc|glutMainLoop)\b/g,
        `<span class="tok-gl">$1</span>`
      );

      // C++ keywords
      line = line.replace(
        /\b(void|int|float|double|char|if|else|for|while|return|bool|const|auto|nullptr|true|false|struct|class|include|define|ifdef|endif|using|namespace|std|switch|case|default|break|continue)\b/g,
        `<span class="tok-kw">$1</span>`
      );

      // User-defined draw functions
      line = line.replace(
        /\b(bresenhams?|dda|midpointCircle|bresenhamCircle|circle|display|drawLine|main)\b/g,
        `<span class="tok-fn">$1</span>`
      );

      // Numbers (integer and float)
      line = line.replace(/(?<![a-zA-Z_])(-?\d+\.?\d*)/g, `<span class="tok-num">$1</span>`);

      return line;
    })
    .join("\n");
}
