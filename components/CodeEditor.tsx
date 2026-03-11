/**
 * components/CodeEditor.tsx
 * Multi-layer code editor with line numbers, textarea, and syntax highlighting overlay.
 * 
 * Architecture:
 *   Layer 3 (z:2) — textarea (transparent, user input)
 *   Layer 2 (z:1) — syntax highlight div (colored HTML, pointer-events:none)
 *   Layer 1 (z:0) — background
 */

"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { highlightCpp } from "@/lib/parser";

const FONT_FAMILY = "'Consolas', 'Courier New', monospace";
const FONT_SIZE = "13px";
const LINE_HEIGHT = "20px";
const CHAR_WIDTH = "7.8px"; // approximate for monospace
const LINE_NUMBER_WIDTH = "44px";

export interface CodeEditorProps {
  code: string;
  onChange?: (code: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  theme?: "light" | "dark";
}

export default function CodeEditor({
  code,
  onChange,
  onCursorChange,
  theme = "dark",
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Computed: syntax-highlighted HTML
  const highlightedHtml = useMemo(() => {
    return highlightCpp(code);
  }, [code]);

  // Sync scroll between textarea and highlight overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Tab key: insert 4 spaces instead
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const newCode = code.substring(0, start) + "    " + code.substring(end);
        onChange?.(newCode);
        // Defer cursor position to next tick
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 4;
        }, 0);
      }

      // Cmd+/ or Ctrl+/: toggle comment on current line
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const lineStart = code.lastIndexOf("\n", start - 1) + 1;
        const curLine = code.substring(lineStart, start + 50).split("\n")[0];
        const lineContent = code.substring(lineStart, code.indexOf("\n", lineStart));
        const trimmed = lineContent.trim();

        let newLine: string;
        if (trimmed.startsWith("//")) {
          // Remove comment
          newLine = lineContent.replace(/^\s*\/\/\s?/, "");
        } else {
          // Add comment
          const leadingSpace = lineContent.match(/^\s*/)?.[0] || "";
          newLine = leadingSpace + "// " + trimmed;
        }

        const lineEnd = lineStart + lineContent.length;
        const newCode = code.substring(0, lineStart) + newLine + code.substring(lineEnd);
        onChange?.(newCode);
      }

      // Cmd+Enter or Ctrl+Enter: handled by parent (Simulator)
    },
    [code, onChange]
  );

  // Track cursor position
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const before = code.substring(0, pos);
    const line = before.split("\n").length;
    const col = before.split("\n").pop()?.length || 0;
    onCursorChange?.(line, col + 1);
  }, [code, onCursorChange]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.addEventListener("click", handleSelectionChange);
    ta.addEventListener("keyup", handleSelectionChange);
    return () => {
      ta.removeEventListener("click", handleSelectionChange);
      ta.removeEventListener("keyup", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // CSS for syntax highlighting tokens (matches VS Code Dark+)
  const tokenStyles = `
    .tok-comment { color: #6A9955; }
    .tok-preproc { color: #569CD6; }
    .tok-string { color: #CE9178; }
    .tok-gl { color: #4EC9B0; }
    .tok-kw { color: #569CD6; }
    .tok-fn { color: #DCDCAA; }
    .tok-num { color: #B5CEA8; }
    .tok-op { color: #d4d4d4; }
  `;

  const isDark = theme === "dark";
  const bgColor = isDark ? "#1e1e1e" : "#ffffff";
  const textColor = isDark ? "#d4d4d4" : "#333333";
  const textMuted = isDark ? "#858585" : "#666666";
  const borderColor = isDark ? "#2d2d2d" : "#dddddd";
  const caretColor = isDark ? "#aeafad" : "#333333";
  const lineNumBg = isDark ? "#1e1e1e" : "#f5f5f5";

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        overflow: "hidden",
      }}
    >
      <style>{tokenStyles}</style>

      {/* Editor area: line numbers + textarea + highlight */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Line numbers column */}
        <div
          style={{
            width: LINE_NUMBER_WIDTH,
            backgroundColor: lineNumBg,
            borderRight: `1px solid ${borderColor}`,
            textAlign: "right",
            paddingRight: "8px",
            paddingTop: "8px",
            overflow: "hidden",
            userSelect: "none",
            color: textMuted,
            fontSize: FONT_SIZE,
            lineHeight: LINE_HEIGHT,
            fontFamily: FONT_FAMILY,
            whiteSpace: "pre",
          }}
        >
          {lineNumbers.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>

        {/* Editor container (sticky scroll group) */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Highlight overlay (Layer 2) */}
          <div
            ref={overlayRef}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              padding: "8px",
              overflow: "auto",
              whiteSpace: "pre",
              wordWrap: "break-word",
              color: "transparent",
              pointerEvents: "none",
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE,
              lineHeight: LINE_HEIGHT,
            }}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />

          {/* Textarea (Layer 3 — topmost, user types here) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onInput={handleSelectionChange}
            onClick={handleSelectionChange}
            spellCheck="false"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              padding: "8px",
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE,
              lineHeight: LINE_HEIGHT,
              color: "transparent",
              backgroundColor: "transparent",
              caretColor: caretColor,
              border: "none",
              resize: "none",
              outline: "none",
              whiteSpace: "pre",
              overflowWrap: "normal",
              overflow: "auto",
              tabSize: 4,
            }}
          />
        </div>
      </div>
    </div>
  );
}
