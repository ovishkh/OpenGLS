# OpenGLS — Browser OpenGL Simulator

> **Project name:** `OpenGLS`  
> **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · HTML5 Canvas · Vercel

---

## 🎯 Project Overview

You are building **OpenGLS** — a browser-native OpenGL simulator for Computer Graphics students. The user pastes their C++/OpenGL lab code (from university courses like CSE422) directly into a VS Code–style editor, and the right panel renders the exact graphical output as if it were running on a Windows machine with GLUT/OpenGL — no compilation, no drivers, no OS dependency.

The product vision is: **"Write OpenGL C++ on the left. See pixels on the right. Instantly."**

---

## 🗂 Existing Project Structure

The project already has a working prototype. Here is the current file structure:

```
cg-simulator/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── Simulator.jsx          ← main component, needs full redesign
├── __tests__/
│   └── algorithms.test.js     ← 30+ tests, keep intact
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
└── README.md
```

The algorithms (`bresenhamLine`, `ddaLine`, `midpointCircle`, `bresenhamCircle`) and the code parser (`parseCode`) are already implemented and tested. **Do not rewrite the algorithm logic.** Only redesign the UI/UX and project structure.

---

## 🎨 Design Vision — VS Code Style, "Vibe Coding" Aesthetic

The UI must feel like **VS Code** but stripped to its absolute minimum — no sidebar, no extensions panel, no settings icon. Just the editor and the output. Think of it like a focused vibe coding tool (similar to Cursor, Zed, or a CodePen-style playground — but for OpenGL).

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Title bar — macOS-style traffic lights · "OpenGLS" centered    │
├─────────────────────────────────────────────────────────────────┤
│  Tab bar — "bresenhams_line.cpp" tab · algo selector · grid btn │
├───────────────────────────┬─────────────────────────────────────┤
│                           │                                     │
│   CODE EDITOR (left 60%)  │   CANVAS OUTPUT (right 40%)        │
│                           │                                     │
│   • Line numbers          │   • HTML5 Canvas                   │
│   • Syntax highlighting   │   • Pixel grid (toggleable)        │
│   • Native textarea       │   • XY axes with labels            │
│   • Auto-run on type      │   • Status dot (green = running)   │
│     (400ms debounce)      │   • Pixel count in header          │
│                           │                                     │
├───────────────────────────┤                                     │
│  Blue VS Code status bar  │                                     │
│  ⎇ main · C++ · UTF-8    │                                     │
├───────────────────────────┴─────────────────────────────────────┤
│  Bottom panel (collapsible) — Step Table / Decision Log         │
└─────────────────────────────────────────────────────────────────┘
```

### Color Palette (strict — do not deviate)

| Token            | Hex                                 |
| ---------------- | ----------------------------------- |
| Background       | `#1e1e1e`                           |
| Sidebar / panels | `#252526`                           |
| Title bar        | `#323233`                           |
| Active tab       | `#1e1e1e` with `#0078d4` top border |
| Inactive tab     | `#2d2d2d`                           |
| Status bar       | `#007acc`                           |
| Text primary     | `#d4d4d4`                           |
| Text muted       | `#858585`                           |
| Accent blue      | `#0078d4`                           |
| Error            | `#f48771`                           |
| Success dot      | `#28c840`                           |

### Syntax Highlighting Colors (match VS Code Dark+)

```
keywords (void, int, float, if, else, for, return)  → #569CD6
GL functions (glColor3f, glBegin, glFlush, etc.)    → #4EC9B0
user functions (bresenhams, dda, circle, display)   → #DCDCAA
numbers                                              → #B5CEA8
strings                                             → #CE9178
comments (//)                                       → #6A9955
operators                                           → #d4d4d4
```

### Typography

- **Editor + UI:** `'Consolas', 'Courier New', monospace` — 13px, line-height 20px
- **No Google Fonts.** System monospace stack only. This is intentional — it should feel like an IDE, not a marketing site.

---

## 🔧 Features to Implement (in priority order)

### 1. Rename & Rebrand to OpenGLS

- Set `<title>OpenGLS — Browser OpenGL Simulator</title>` in `layout.tsx`
- Show `OpenGLS` in the title bar (centered, muted)
- Update `README.md` with the new name and vision
- Add a subtle `OpenGLS` wordmark to the title bar (small, monospaced, with a dim `[` `]` bracket motif)

### 2. Refactor `Simulator.jsx` → `Simulator.tsx` (TypeScript)

Convert the component to TypeScript with proper types:

```typescript
interface DrawCall {
  pts: Point[];
  color: [number, number, number];
}

interface Point {
  x: number;
  y: number;
}

interface ParseResult {
  draws: DrawCall[];
  errors: string[];
}
```

### 3. Split into smaller components

Break `Simulator.tsx` into these focused files under `components/`:

```
components/
├── Simulator.tsx          ← orchestrator, holds state
├── CodeEditor.tsx         ← left panel: line numbers + textarea + highlight overlay
├── CanvasOutput.tsx       ← right panel: canvas renderer
├── TitleBar.tsx           ← macOS-style title bar
├── TabBar.tsx             ← tab strip + algo selector + grid toggle
├── StatusBar.tsx          ← blue VS Code-style bar at bottom of editor
├── StepTable.tsx          ← collapsible bottom panel, decision log
└── algorithms/
    ├── bresenham.ts       ← bresenhamLine() — extracted, typed
    ├── dda.ts             ← ddaLine() — extracted, typed
    ├── circles.ts         ← midpointCircle() + bresenhamCircle()
    └── parser.ts          ← parseAndRun() — extracted, typed
```

### 4. Code Editor Panel (`CodeEditor.tsx`)

The editor must have **three layers** stacked:

```
Layer 3 (z:2) — invisible <textarea>     ← user types here, transparent text, visible caret
Layer 2 (z:1) — syntax highlight <div>  ← colored HTML, pointer-events:none, scrolls in sync
Layer 1 (z:0) — background              ← #1e1e1e
```

Requirements:

- Line numbers column (44px wide, `#858585`, right-aligned)
- Line numbers must scroll in sync with the textarea
- Textarea caret color: `#aeafad`
- Tab key should insert 4 spaces (intercept with `onKeyDown`)
- `Ctrl+/` or `Cmd+/` should toggle line comments (`// `)
- The textarea and highlight overlay must have identical `padding`, `font`, `line-height`, `white-space: pre`
- On scroll, sync `overlayRef.scrollTop = textareaRef.scrollTop`

### 5. Canvas Output Panel (`CanvasOutput.tsx`)

Canvas renderer requirements:

- Canvas size: `540 × 540` pixels
- Cell/pixel size: `9px` (1 grid unit = 9 screen pixels)
- Origin `(0,0)` at center of canvas
- Y-axis is flipped: positive Y goes UP (matches OpenGL convention)
- Background: `#1e1e1e`
- Grid lines: `rgba(255,255,255,0.04)`, every 9px
- Major grid lines: `rgba(255,255,255,0.08)`, every 45px (5 cells)
- Axes: `rgba(255,255,255,0.18)`, 1px
- Axis labels: `x` near right edge, `y` near top, `0` at origin — all `#858585`, 10px
- Each drawn pixel: `fillRect(cx + x*CELL, cy - y*CELL, CELL-1, CELL-1)` — 1px gap between cells
- `imageRendering: pixelated` on the canvas element

**Output panel header** (28px tall, `#252526`):

- Left: status dot (green `#28c840` when draws.length > 0, grey otherwise)
- Center: `{totalPixels} pixels · {drawCount} draw calls`
- Right: `⌘R to run` hint in muted text

**Color legend** (below canvas, `#252526` panel):

- One row of colored squares with labels: `draw1 · 142px`
- Only show when `draws.length > 0`

### 6. Algorithm Selector (in `TabBar.tsx`)

A compact `<select>` dropdown styled to match VS Code's input style:

```
[ Bresenham Line  ▼ ]   [ ☰ grid ]
```

Options:

- `bresenham` → `"Bresenham's Line"`
- `dda` → `"DDA Line"`
- `midpoint` → `"Midpoint Circle"`
- `bCircle` → `"Bresenham's Circle"`

When the algorithm changes, the canvas re-renders immediately.

### 7. Auto-Run with Debounce

```typescript
useEffect(() => {
  const timer = setTimeout(() => runSimulation(), 400);
  return () => clearTimeout(timer);
}, [code, algo]);
```

No explicit "Run" button. The output updates automatically as the user types — like a live preview. The status dot pulses briefly when re-rendering.

### 8. Collapsible Step Table Panel (Bottom)

A bottom panel (`StepTable.tsx`) that slides up from the bottom:

- Toggle with `Ctrl+\`` or a small `⌄ Steps` button in the status bar
- Height: 200px when open
- Shows the decision table for the **first draw call only** (to keep it readable)
- Columns depend on algorithm:
  - Bresenham: `Step | x | y | pk | Decision`
  - DDA: `Step | x | y | rawX | rawY`
  - Circle: `Step | x | y | d | Decision`
- Paginated: 10 rows per page, prev/next buttons
- Colors: step=`#569CD6`, x=`#4EC9B0`, y=`#DCDCAA`, pk/d=`#CE9178`, decision=`#d4d4d4`

### 9. Keyboard Shortcuts

| Shortcut                   | Action                         |
| -------------------------- | ------------------------------ |
| `Ctrl+Enter` / `Cmd+Enter` | Force re-run immediately       |
| `Ctrl+\``                  | Toggle step table panel        |
| `Ctrl+G`                   | Toggle grid                    |
| `Tab` (in editor)          | Insert 4 spaces                |
| `Ctrl+/`                   | Toggle comment on current line |

### 10. Default Code Template

When the app loads, the editor must be pre-filled with this exact code:

```cpp
// Bresenham's Line Drawing Algorithm
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
```

---

## 📐 Code Parser Requirements (`parser.ts`)

The parser reads raw C++/OpenGL code as a string and returns `DrawCall[]`. It must handle:

### Supported draw functions

```cpp
bresenhams(x1, y1, x2, y2)   // Bresenham's line
bresenham(x1, y1, x2, y2)    // alias
dda(x1, y1, x2, y2)          // DDA line
drawLine(x1, y1, x2, y2)     // generic alias

circle(cx, cy, r)             // circle (midpoint or bresenham based on algo selection)
midpointCircle(cx, cy, r)     // explicit midpoint
drawCircle(cx, cy, r)         // generic alias
```

### Color parsing

```cpp
glColor3f(r, g, b)   // float values 0.0–1.0
```

Color applies to all subsequent draw calls until the next `glColor3f`. Default color is `[1, 1, 1]` (white).

### Coordinates

- All coordinates are integers (signed)
- Support negative values: `bresenhams(0, 0, -200, -130)` ✓
- Support spaces around commas: `bresenhams( 20 , 20 , 380 , 280 )` ✓

### Error handling

- If no draw calls found → return `errors: ["No drawable calls found. Use bresenhams(), dda(), or circle()."]`
- If coordinates result in > 10,000 pixels → return warning but still render
- Never throw — always return a valid `ParseResult`

---

## 🧪 Test Requirements

Keep all existing tests in `__tests__/algorithms.test.js` passing. Additionally add:

### New test file: `__tests__/parser.test.ts`

```typescript
describe("Parser", () => {
  test("parses lab report code with 5 lines");
  test("parses glColor3f before each call");
  test("handles missing color (defaults to white)");
  test("handles bresenhams and bresenham as aliases");
  test("handles negative coordinates");
  test("returns error for empty display body");
  test("handles circle() calls");
  test("handles mixed line and circle calls in same display()");
});
```

### New test file: `__tests__/canvas.test.ts`

```typescript
describe("Canvas coordinate system", () => {
  test("y-axis is flipped (positive y goes up)");
  test("origin is at center of 540x540 canvas");
  test("CELL=9 maps coordinate 1 to screen pixel 9");
  test("pixel at (0,0) renders at center");
  test("pixel at (30,0) renders at cx + 30*9");
});
```

---

## 🚀 Deployment

- Target: **Vercel** (zero config, auto-detected Next.js)
- `vercel.json` already exists — do not modify it
- Ensure `next build` passes with no TypeScript errors
- No environment variables required
- No backend, no API routes — pure static frontend

---

## ✅ Acceptance Criteria

Before considering this done, verify:

- [ ] App loads with the default code pre-filled
- [ ] Typing in the editor updates the canvas within 400ms
- [ ] All 5 lines from the lab report render in correct colors
- [ ] Syntax highlighting matches VS Code Dark+ colors
- [ ] Line numbers scroll in sync with code
- [ ] Step table toggles open/closed with `Ctrl+\``
- [ ] Algorithm dropdown switches between all 4 algorithms
- [ ] Grid toggle works
- [ ] `npm run build` succeeds with zero TS errors
- [ ] `npm test` passes all tests
- [ ] Deployed to Vercel and accessible via public URL
- [ ] Page title is `OpenGLS — Browser OpenGL Simulator`
- [ ] No console errors in browser

---

## 🚫 Constraints (do not violate)

- **Do not add** a sidebar, file explorer, extensions panel, or settings page
- **Do not add** a "Run" button — auto-run only
- **Do not use** Google Fonts or any CDN font — system monospace only
- **Do not use** any charting libraries (Recharts, Chart.js, etc.)
- **Do not use** `localStorage` or `sessionStorage`
- **Do not install** new dependencies beyond what is in `package.json` unless strictly necessary
- **Do not change** the algorithm implementations — they are tested and correct
- **Do not use** inline styles where a Tailwind class exists — prefer Tailwind
- **Keep** the existing test suite intact and passing

---

## 💬 Copilot Instructions

When implementing this:

1. **Start with the file split** — extract algorithms into `components/algorithms/` first, then build components bottom-up (TitleBar → TabBar → StatusBar → CodeEditor → CanvasOutput → StepTable → Simulator)
2. **TypeScript first** — define all interfaces before implementing components
3. **One component per file** — no component should be longer than 150 lines
4. **Comment every non-obvious line** — especially the canvas coordinate math and the textarea/overlay layering trick
5. **Use `useCallback` and `useMemo`** where recalculation is expensive (canvas render, syntax highlight)
6. **Canvas render inside `useEffect`** — triggered by `draws` state change, not inline
7. For the syntax highlighter, use a simple `string.replace()` chain — do **not** install a library like Prism or highlight.js
8. The textarea must be **fully transparent** (`color: transparent`) with `caretColor: '#aeafad'` so only the caret is visible, and the highlight overlay below provides the visible text

---

_Prompt version: 1.0 · Project: OpenGLS · Stack: Next.js 14 + TypeScript + Tailwind + Vercel_
