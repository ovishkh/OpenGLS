# Contributing to OpenGLS

Thank you for your interest in contributing to **OpenGLS** — a browser-native OpenGL simulator for Computer Graphics students!

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone git@github.com:YOUR_USERNAME/OpenGLS.git
   cd OpenGLS
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Branch Naming

- **Features**: `feature/description-of-feature`
- **Bugfixes**: `fix/description-of-bug`
- **Documentation**: `docs/description`

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: resolve bug
docs: update documentation
refactor: restructure code without changing behavior
test: add or update tests
chore: dependency updates, config changes
```

### Code Style

- Use **TypeScript** for all new code
- Follow **Tailwind CSS** for styling (no inline CSS where possible)
- Keep components **under 150 lines**
- Add comments for non-obvious logic
- Use `useCallback` and `useMemo` for expensive operations

### Testing

```bash
npm test
npm test -- --watch  # Watch mode
npm test -- --coverage  # Coverage report
```

All tests must pass before submitting a PR.

## Building & Deployment

```bash
npm run build
npm start        # Production server
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes and commit with clear messages
3. Push to your fork
4. Open a Pull Request with:
   - Clear title describing your changes
   - Description of what was changed and why
   - Screenshots (if UI changes)
   - Link to related issues

5. Ensure CI checks pass (build, tests, linting)
6. Request review from maintainers

## Architecture & Key Concepts

### Component Structure

```
components/
├── Simulator.tsx              ← Main orchestrator
├── CodeEditor.tsx             ← Editor with highlighting
├── CanvasOutput.tsx           ← Canvas renderer
├── ui/
│   ├── TitleBar.tsx
│   ├── TabBar.tsx
│   ├── StatusBar.tsx
│   └── StepTable.tsx
└── algorithms/                ← Algorithm implementations
```

### Algorithm Implementation

All algorithms are in `lib/algorithms.ts`:

- `bresenhamLine(x1, y1, x2, y2): Point[]`
- `ddaLine(x1, y1, x2, y2): Point[]`
- `midpointCircle(cx, cy, r): Point[]`
- `bresenhamCircle(cx, cy, r): Point[]`

**Do not modify algorithm logic** — they are thoroughly tested.

### Parser & Color Handling

The parser (`lib/parser.ts`) extracts:

- C++/OpenGL code structure
- `glColor3f(r, g, b)` color updates
- Draw function calls with coordinates
- Returns `ParseResult` with draws and errors

## Code Organization

### State Management

All state is managed in `Simulator.tsx`:

- `code` — current editor text
- `draws` — parsed draw calls with colors
- `algorithm` — selected algorithm
- `gridEnabled` — grid visibility
- `stepTableOpen` — collapsible panel state

### Keyboard Shortcuts

Add new shortcuts in `Simulator.tsx` `useEffect`:

- `Cmd+Enter` / `Ctrl+Enter` → Force run
- `Ctrl+\`` → Toggle step table
- `Cmd+G` / `Ctrl+G` → Toggle grid

## Known Constraints

- ✅ Do NOT add external font CDNs (use system monospace only)
- ✅ Do NOT install charting libraries
- ✅ Do NOT use `localStorage` or `sessionStorage`
- ✅ Keep the existing test suite passing
- ✅ No breaking changes to algorithm interfaces

## Reporting Issues

Found a bug? Open an issue with:

- Clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots or code examples
- Environment (OS, browser)

## Questions?

Feel free to open a discussion or contact the maintainers. We're here to help!

---

Happy coding! 🚀
