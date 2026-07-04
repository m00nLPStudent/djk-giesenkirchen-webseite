"use client";

import { useEffect, useMemo, useRef } from "react";
import { sanitizeRichTextHtml, toEditableHtml } from "@/lib/richtext/sanitize";

const TOOLBAR_BUTTON_CLASS =
  "rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white/70 transition hover:border-red-500/50 hover:text-white";

function ToolbarButton({ label, title, onClick }) {
  return (
    <button
      type="button"
      title={title || label}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={TOOLBAR_BUTTON_CLASS}
    >
      {label}
    </button>
  );
}

export default function AdminRichTextEditor({
  label,
  value,
  onChange,
  required = false,
  placeholder = "",
  minHeight = 260,
}) {
  const editorRef = useRef(null);

  const safeValue = useMemo(() => toEditableHtml(value || ""), [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentHtml = sanitizeRichTextHtml(editor.innerHTML || "");
    if (currentHtml !== safeValue) {
      editor.innerHTML = safeValue;
    }
  }, [safeValue]);

  function emitChange() {
    const editor = editorRef.current;
    if (!editor) return;

    const nextValue = sanitizeRichTextHtml(editor.innerHTML || "");
    if (editor.innerHTML !== nextValue) {
      editor.innerHTML = nextValue;
    }

    onChange?.(nextValue);
  }

  function runCommand(command, commandValue = null) {
    if (!editorRef.current) return;

    editorRef.current.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  }

  function applyBlock(tagName) {
    runCommand("formatBlock", `<${tagName}>`);
  }

  function insertLink() {
    const href = window.prompt(
      "Link eingeben (nur http, https oder mailto):",
      "https://",
    );

    if (!href) return;

    runCommand("createLink", href.trim());
  }

  return (
    <div>
      {label && (
        <label className="mb-3 block text-sm font-bold text-white/80">
          {label}
          {required ? " *" : ""}
        </label>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#13131a]">
        <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
          <ToolbarButton label="H2" onClick={() => applyBlock("h2")} />
          <ToolbarButton label="H3" onClick={() => applyBlock("h3")} />
          <ToolbarButton
            label="Absatz"
            onClick={() => applyBlock("p")}
            title="Absatz"
          />
          <ToolbarButton
            label="Fett"
            onClick={() => runCommand("bold")}
            title="Fett"
          />
          <ToolbarButton
            label="Kursiv"
            onClick={() => runCommand("italic")}
            title="Kursiv"
          />
          <ToolbarButton
            label="Liste"
            onClick={() => runCommand("insertUnorderedList")}
            title="Aufzaehlung"
          />
          <ToolbarButton
            label="Nummeriert"
            onClick={() => runCommand("insertOrderedList")}
            title="Nummerierte Liste"
          />
          <ToolbarButton label="Link" onClick={insertLink} />
          <ToolbarButton
            label="Format entfernen"
            onClick={() => runCommand("removeFormat")}
          />
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={emitChange}
          onBlur={emitChange}
          className="richtext-editor min-h-[220px] px-4 py-4 text-base leading-7 text-white/85 outline-none"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}
