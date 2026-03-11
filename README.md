# OpenGLS Compiler for CSE422 Computer Graphics

A web-based C++/OpenGL IDE simulator. Write your actual lab code, press **▶ Run** (or `Ctrl+Enter`), and see the graphical output instantly — no Windows, no OpenGL installation needed.

## Features

- **Real code editor** with C++ syntax highlighting (keywords, GL functions, numbers, comments)
- **Compiler terminal** — shows `g++` output, warnings, draw call stats, exit codes
- **Live canvas** — renders Bresenham, DDA, Midpoint Circle, Bresenham Circle
- **Draggable terminal panel** — resize the output pane
- Keyboard shortcut: `Ctrl+Enter` or `F5` to compile & run

## Supported Draw Functions

Write these inside your `display()` function:

```cpp
// Lines
glColor3f(r, g, b);
bresenhams(x1, y1, x2, y2);   // or bresenham()
dda(x1, y1, x2, y2);

// Circles
glColor3f(r, g, b);
circle(cx, cy, r);
midpointCircle(cx, cy, r);
bresenhamCircle(cx, cy, r);
```

## Quick Start

```bash
npm install
npm run dev      # → http://localhost:3000
npm run build    # production build
npm test         # run test suite
```

## Deploy to Vercel

```bash
# Push to GitHub, then:
npx vercel       # or import at vercel.com — zero config
```

## Project Structure

```
opengls/
├── app/
│   ├── layout.tsx       # Root layout + JetBrains Mono font
│   ├── page.tsx         # Entry → renders IDE
│   └── globals.css      # Reset + scrollbar styles
├── components/
│   └── IDE.tsx          # Full IDE: editor, terminal, canvas
├── lib/
│   └── algorithms.ts    # Pure algorithm functions + compiler/parser
├── __tests__/
│   └── algorithms.test.js  # 35+ test cases
└── ...config files
```
