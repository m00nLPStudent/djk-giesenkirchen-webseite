"use client";

import { useEffect, useMemo } from "react";
import { Extension } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  Bold,
  Eraser,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Underline as UnderlineIcon,
  Unlink2,
} from "lucide-react";
import { sanitizeRichTextHtml, toEditableHtml } from "@/lib/richtext/sanitize";

const FONT_SIZE_OPTIONS = [14, 16, 18, 20, 24, 28, 32];

const TOOLBAR_BUTTON_CLASS =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white/70 transition hover:border-red-500/40 hover:bg-white/10 hover:text-white";

const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => {
              const size = element.style.fontSize || "";
              return FONT_SIZE_OPTIONS.map((value) => `${value}px`).includes(
                size,
              )
                ? size
                : null;
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

function ToolbarButton({ icon: Icon, label, title, onClick, active = false }) {
  return (
    <button
      type="button"
      title={title || label}
      onClick={onClick}
      className={`${TOOLBAR_BUTTON_CLASS} ${
        active
          ? "border-red-500/70 bg-red-600/15 text-white shadow-[0_0_0_1px_rgba(220,38,38,0.18)]"
          : ""
      }`}
    >
      {Icon ? <Icon size={16} /> : label}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function ToolbarGroup({ children, className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-2xl border border-white/8 bg-black/20 p-1 ${className}`}
    >
      {children}
    </div>
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
  const safeValue = useMemo(() => toEditableHtml(value || ""), [value]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
      }),
      Underline,
      TextStyle,
      FontSize,
    ],
    content: safeValue || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "richtext-editor ProseMirror min-h-[220px] px-8 py-7 text-[16px] leading-8 text-white/90 outline-none",
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor: tiptapEditor }) => {
      const nextValue = sanitizeRichTextHtml(tiptapEditor.getHTML() || "");
      onChange?.(nextValue);
    },
  });

  useEffect(() => {
    if (!editor) return;

    const current = sanitizeRichTextHtml(editor.getHTML() || "");
    if (current !== safeValue) {
      editor.commands.setContent(safeValue || "<p></p>", false);
    }
  }, [editor, safeValue]);

  function applyBlock(tagName) {
    if (!editor) return;

    if (tagName === "p") {
      editor.chain().focus().setParagraph().run();
      return;
    }

    const level = tagName === "h2" ? 2 : 3;
    editor.chain().focus().toggleHeading({ level }).run();
  }

  function insertLink() {
    if (!editor) return;

    const currentHref = editor.getAttributes("link")?.href || "https://";
    const href = window.prompt(
      "Link eingeben (nur http, https oder mailto):",
      currentHref,
    );

    if (!href) return;

    const trimmed = href.trim();
    if (!trimmed) return;

    let normalized = trimmed;
    if (!/^(https?:\/\/|mailto:)/i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: normalized })
      .run();
  }

  function removeLink() {
    if (!editor) return;

    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  }

  function clearFormatting() {
    if (!editor) return;

    editor.chain().focus().unsetAllMarks().unsetLink().clearNodes().run();
  }

  function getCurrentTextSize() {
    const current = editor?.getAttributes("textStyle")?.fontSize;
    return typeof current === "string" && current ? current : "16px";
  }

  function updateTextSize(nextSize) {
    if (!editor) return;

    if (!nextSize || nextSize === "16px") {
      editor.chain().focus().unsetMark("textStyle").run();
      return;
    }

    editor.chain().focus().setMark("textStyle", { fontSize: nextSize }).run();
  }

  function getCurrentBlockType() {
    if (editor?.isActive("heading", { level: 2 })) return "h2";
    if (editor?.isActive("heading", { level: 3 })) return "h3";
    return "p";
  }

  return (
    <div>
      {label && (
        <label className="mb-3 block text-sm font-bold text-white/80">
          {label}
          {required ? " *" : ""}
        </label>
      )}

      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#13131a] shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
        <div className="border-b border-white/8 bg-[#171922] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarGroup>
              <select
                value={getCurrentBlockType()}
                onChange={(event) => applyBlock(event.target.value)}
                className="h-9 rounded-xl border border-transparent bg-transparent px-3 text-sm font-semibold text-white/80 outline-none"
              >
                <option value="p">Absatz</option>
                <option value="h2">Überschrift 2</option>
                <option value="h3">Überschrift 3</option>
              </select>
            </ToolbarGroup>

            <ToolbarGroup>
              <select
                value={getCurrentTextSize()}
                onChange={(event) => updateTextSize(event.target.value)}
                className="h-9 rounded-xl border border-transparent bg-transparent px-3 text-sm font-semibold text-white/80 outline-none"
              >
                {FONT_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={`${size}px`}>
                    {size}px
                  </option>
                ))}
              </select>
            </ToolbarGroup>

            <ToolbarGroup>
              <ToolbarButton
                icon={Pilcrow}
                label="Absatz"
                active={editor?.isActive("paragraph")}
                onClick={() => applyBlock("p")}
              />
              <ToolbarButton
                icon={Heading2}
                label="Überschrift 2"
                active={editor?.isActive("heading", { level: 2 })}
                onClick={() => applyBlock("h2")}
              />
              <ToolbarButton
                icon={Heading3}
                label="Überschrift 3"
                active={editor?.isActive("heading", { level: 3 })}
                onClick={() => applyBlock("h3")}
              />
            </ToolbarGroup>

            <ToolbarGroup>
              <ToolbarButton
                icon={Bold}
                label="Fett"
                active={editor?.isActive("bold")}
                onClick={() => editor?.chain().focus().toggleBold().run()}
              />
              <ToolbarButton
                icon={Italic}
                label="Kursiv"
                active={editor?.isActive("italic")}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
              />
              <ToolbarButton
                icon={UnderlineIcon}
                label="Unterstreichen"
                active={editor?.isActive("underline")}
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
              />
            </ToolbarGroup>

            <ToolbarGroup>
              <ToolbarButton
                icon={List}
                label="Aufzählung"
                active={editor?.isActive("bulletList")}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              />
              <ToolbarButton
                icon={ListOrdered}
                label="Nummerierte Liste"
                active={editor?.isActive("orderedList")}
                onClick={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
              />
            </ToolbarGroup>

            <ToolbarGroup>
              <ToolbarButton
                icon={Link2}
                label="Link einfügen"
                active={editor?.isActive("link")}
                onClick={insertLink}
              />
              <ToolbarButton
                icon={Unlink2}
                label="Link entfernen"
                onClick={removeLink}
              />
              <ToolbarButton
                icon={Eraser}
                label="Format entfernen"
                onClick={clearFormatting}
              />
            </ToolbarGroup>
          </div>
        </div>

        <div className="relative bg-[#0f1116]" style={{ minHeight }}>
          <EditorContent editor={editor} />
          {editor?.isEmpty && placeholder && (
            <div className="pointer-events-none absolute top-0 left-0 px-8 py-7 text-base text-white/30">
              {placeholder}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
