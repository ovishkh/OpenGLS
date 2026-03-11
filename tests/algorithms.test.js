/**
 * CG Compiler Test Suite
 * Tests all algorithms + compiler/parser
 */

const {
  bresenhamLine,
  ddaLine,
  midpointCircle,
  bresenhamCircle,
  compileCppCode,
} = require("../lib/algorithms");

// ── Bresenham Line ────────────────────────────────────────────────────────────
describe("bresenhamLine()", () => {
  test("horizontal line (slope=0)", () => {
    const pts = bresenhamLine(0, 0, 5, 0);
    expect(pts.length).toBe(6);
    pts.forEach((p) => expect(p.y).toBe(0));
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[5]).toEqual({ x: 5, y: 0 });
  });

  test("vertical line (slope=∞)", () => {
    const pts = bresenhamLine(0, 0, 0, 6);
    expect(pts.length).toBe(7);
    pts.forEach((p) => expect(p.x).toBe(0));
  });

  test("45° diagonal (slope=1)", () => {
    const pts = bresenhamLine(0, 0, 5, 5);
    expect(pts.length).toBe(6);
    pts.forEach((p, i) => { expect(p.x).toBe(i); expect(p.y).toBe(i); });
  });

  test("shallow slope 0 < m < 1", () => {
    const pts = bresenhamLine(0, 0, 10, 3);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[pts.length - 1]).toEqual({ x: 10, y: 3 });
    expect(pts.length).toBe(11);
  });

  test("steep slope m > 1", () => {
    const pts = bresenhamLine(0, 0, 3, 10);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[pts.length - 1]).toEqual({ x: 3, y: 10 });
  });

  test("negative slope -1 < m < 0", () => {
    const pts = bresenhamLine(0, 0, 10, -3);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[pts.length - 1]).toEqual({ x: 10, y: -3 });
  });

  test("steep negative slope m < -1", () => {
    const pts = bresenhamLine(0, 0, 3, -10);
    expect(pts[pts.length - 1]).toEqual({ x: 3, y: -10 });
  });

  test("Lab Report line: bresenhams(0,0,200,130)", () => {
    const pts = bresenhamLine(0, 0, 200, 130);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[pts.length - 1]).toEqual({ x: 200, y: 130 });
  });

  test("Lab Report line: bresenhams(0,0,130,200) steep", () => {
    const pts = bresenhamLine(0, 0, 130, 200);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[pts.length - 1]).toEqual({ x: 130, y: 200 });
  });

  test("reverse direction gives same point count", () => {
    const fwd = bresenhamLine(0, 0, 20, 7);
    const bwd = bresenhamLine(20, 7, 0, 0);
    expect(fwd.length).toBe(bwd.length);
    expect(fwd[0]).toEqual(bwd[bwd.length - 1]);
  });

  test("all pixels are connected (max gap = √2)", () => {
    const pts = bresenhamLine(0, 0, 40, 23);
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      expect(Math.sqrt(dx * dx + dy * dy)).toBeLessThanOrEqual(Math.SQRT2 + 0.001);
    }
  });

  test("single point (x1===x2, y1===y2)", () => {
    const pts = bresenhamLine(5, 5, 5, 5);
    expect(pts.length).toBeGreaterThanOrEqual(1);
  });

  test("all points are integers", () => {
    bresenhamLine(-15, 7, 40, -30).forEach((p) => {
      expect(Number.isInteger(p.x)).toBe(true);
      expect(Number.isInteger(p.y)).toBe(true);
    });
  });
});

// ── DDA Line ─────────────────────────────────────────────────────────────────
describe("ddaLine()", () => {
  test("horizontal line", () => {
    const pts = ddaLine(0, 0, 6, 0);
    expect(pts.length).toBe(7);
    pts.forEach((p) => expect(p.y).toBe(0));
  });

  test("vertical line", () => {
    const pts = ddaLine(0, 0, 0, 6);
    expect(pts.length).toBe(7);
    pts.forEach((p) => expect(p.x).toBe(0));
  });

  test("diagonal", () => {
    const pts = ddaLine(0, 0, 5, 5);
    pts.forEach((p, i) => { expect(p.x).toBe(i); expect(p.y).toBe(i); });
  });

  test("endpoints correct", () => {
    const pts = ddaLine(3, 7, 15, 11);
    expect(pts[0]).toEqual({ x: 3, y: 7 });
    expect(pts[pts.length - 1]).toEqual({ x: 15, y: 11 });
  });

  test("matches bresenham endpoints", () => {
    [[0,0,10,5],[0,0,5,10],[0,0,-10,3]].forEach(([x1,y1,x2,y2]) => {
      const b = bresenhamLine(x1, y1, x2, y2);
      const d = ddaLine(x1, y1, x2, y2);
      expect(b[0]).toEqual(d[0]);
      expect(b[b.length-1]).toEqual(d[d.length-1]);
    });
  });

  test("single point", () => {
    const pts = ddaLine(4, 4, 4, 4);
    expect(pts.length).toBeGreaterThanOrEqual(1);
    expect(pts[0]).toEqual({ x: 4, y: 4 });
  });
});

// ── Midpoint Circle ───────────────────────────────────────────────────────────
describe("midpointCircle()", () => {
  test("radius 5 — all pixels within r±1 of center", () => {
    midpointCircle(0, 0, 5).forEach((p) => {
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      expect(dist).toBeGreaterThanOrEqual(4);
      expect(dist).toBeLessThanOrEqual(6);
    });
  });

  test("8-fold symmetry: for every (x,y) there is (-x,y)", () => {
    const pts = midpointCircle(0, 0, 8);
    const set = new Set(pts.map((p) => `${p.x},${p.y}`));
    pts.forEach((p) => expect(set.has(`${-p.x},${p.y}`)).toBe(true));
  });

  test("8-fold symmetry: for every (x,y) there is (x,-y)", () => {
    const pts = midpointCircle(0, 0, 8);
    const set = new Set(pts.map((p) => `${p.x},${p.y}`));
    pts.forEach((p) => expect(set.has(`${p.x},${-p.y}`)).toBe(true));
  });

  test("larger radius = more points", () => {
    expect(midpointCircle(0,0,10).length).toBeGreaterThan(midpointCircle(0,0,5).length);
  });

  test("non-origin center shifts all points correctly", () => {
    const base = midpointCircle(0, 0, 7);
    const shifted = midpointCircle(10, 20, 7);
    expect(shifted.length).toBe(base.length);
    shifted.forEach((p) => {
      expect(base.find((b) => b.x === p.x - 10 && b.y === p.y - 20)).toBeDefined();
    });
  });

  test("all points are integers", () => {
    midpointCircle(0, 0, 12).forEach((p) => {
      expect(Number.isInteger(p.x)).toBe(true);
      expect(Number.isInteger(p.y)).toBe(true);
    });
  });

  test("radius 1 produces valid points", () => {
    const pts = midpointCircle(0, 0, 1);
    expect(pts.length).toBeGreaterThan(0);
  });
});

// ── Bresenham Circle ──────────────────────────────────────────────────────────
describe("bresenhamCircle()", () => {
  test("all points near actual circle boundary", () => {
    const r = 9;
    bresenhamCircle(0, 0, r).forEach((p) => {
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      expect(dist).toBeGreaterThanOrEqual(r - 1);
      expect(dist).toBeLessThanOrEqual(r + 1);
    });
  });

  test("8-fold symmetry", () => {
    const pts = bresenhamCircle(0, 0, 10);
    const set = new Set(pts.map((p) => `${p.x},${p.y}`));
    pts.forEach((p) => {
      expect(set.has(`${-p.x},${p.y}`)).toBe(true);
      expect(set.has(`${p.x},${-p.y}`)).toBe(true);
    });
  });

  test("all integer coordinates", () => {
    bresenhamCircle(0, 0, 15).forEach((p) => {
      expect(Number.isInteger(p.x)).toBe(true);
      expect(Number.isInteger(p.y)).toBe(true);
    });
  });

  test("comparable point count to midpoint circle", () => {
    const m = midpointCircle(0, 0, 10);
    const b = bresenhamCircle(0, 0, 10);
    expect(Math.abs(m.length - b.length)).toBeLessThanOrEqual(16);
  });
});

// ── Compiler / Parser ─────────────────────────────────────────────────────────
describe("compileCppCode()", () => {
  test("parses exact Lab Report 3 code", () => {
    const code = `
void display() {
    glClearColor(0, 0, 0, 1);
    glColor3f(1, 0, 0); bresenhams(0, 0, 200, 130);
    glColor3f(0, 1, 0); bresenhams(0, 0, 130, 200);
    glColor3f(0, 0, 1); bresenhams(0, 0, 200, 0);
    glColor3f(1, 1, 0); bresenhams(0, 0, 200, -130);
    glColor3f(1, 0, 1); bresenhams(0, 0, 130, -200);
    glFlush();
}`;
    const res = compileCppCode(code);
    expect(res.success).toBe(true);
    expect(res.draws.length).toBe(5);
    expect(res.draws[0].color).toEqual([1, 0, 0]);
    expect(res.draws[0].points[0]).toEqual({ x: 0, y: 0 });
    expect(res.draws[2].color).toEqual([0, 0, 1]);
    expect(res.draws[4].color).toEqual([1, 0, 1]);
  });

  test("parses DDA calls", () => {
    const code = `
void display() {
    glColor3f(0, 1, 1);
    dda(0, 0, 100, 50);
}`;
    const res = compileCppCode(code);
    expect(res.success).toBe(true);
    expect(res.draws[0].label).toContain("dda");
    expect(res.draws[0].points[0]).toEqual({ x: 0, y: 0 });
  });

  test("parses circle calls", () => {
    const code = `
void display() {
    glColor3f(1, 0, 0);
    circle(0, 0, 50);
    glColor3f(0, 1, 0);
    midpointCircle(10, 20, 30);
}`;
    const res = compileCppCode(code);
    expect(res.success).toBe(true);
    expect(res.draws.length).toBe(2);
    expect(res.draws[0].type).toBe("circle");
  });

  test("returns failure for empty display()", () => {
    const code = `void display() { glClear(GL_COLOR_BUFFER_BIT); }`;
    const res = compileCppCode(code);
    expect(res.success).toBe(false);
    expect(res.draws.length).toBe(0);
  });

  test("returns failure for unrecognized code", () => {
    const res = compileCppCode("printf('hello');");
    expect(res.success).toBe(false);
  });

  test("handles negative coordinates", () => {
    const code = `void display() { glColor3f(1,0,0); bresenhams(0, 0, -50, -30); }`;
    const res = compileCppCode(code);
    expect(res.success).toBe(true);
    const last = res.draws[0].points[res.draws[0].points.length - 1];
    expect(last).toEqual({ x: -50, y: -30 });
  });

  test("color defaults to white when no glColor3f", () => {
    const code = `void display() { bresenhams(0, 0, 50, 50); }`;
    const res = compileCppCode(code);
    expect(res.success).toBe(true);
    expect(res.draws[0].color).toEqual([1, 1, 1]);
  });

  test("logs contain compilation steps", () => {
    const code = `void display() { glColor3f(1,0,0); bresenhams(0,0,100,50); }`;
    const res = compileCppCode(code);
    const texts = res.logs.map((l) => l.text).join("\n");
    expect(texts).toContain("g++");
    expect(texts).toContain("bresenhams");
    expect(texts).toContain("exit code 0");
  });

  test("bresenhamCircle call is parsed", () => {
    const code = `void display() { glColor3f(0,1,1); bresenhamCircle(0, 0, 20); }`;
    const res = compileCppCode(code);
    expect(res.success).toBe(true);
    expect(res.draws[0].type).toBe("circle");
    expect(res.draws[0].label).toContain("bresenhamCircle");
  });

  test("multiple algorithms in one display()", () => {
    const code = `
void display() {
    glColor3f(1,0,0); bresenhams(0,0,80,40);
    glColor3f(0,1,0); dda(-50,-30,50,30);
    glColor3f(0,0,1); circle(0,0,40);
}`;
    const res = compileCppCode(code);
    expect(res.success).toBe(true);
    expect(res.draws.length).toBe(3);
    expect(res.draws[0].type).toBe("line");
    expect(res.draws[2].type).toBe("circle");
  });
});
