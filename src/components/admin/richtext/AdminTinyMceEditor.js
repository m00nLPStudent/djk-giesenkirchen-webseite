"use client";

import { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/plugins/advlist";
import "tinymce/plugins/anchor";
import "tinymce/plugins/autolink";
import "tinymce/plugins/autoresize";
import "tinymce/plugins/charmap";
import "tinymce/plugins/code";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/help";
import "tinymce/plugins/image";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/table";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/wordcount";
import "tinymce/skins/ui/oxide-dark/skin.css";
import { createTinyMceInit } from "./adminRichTextEditor.config";
import { normalizeEditorValue } from "./adminRichTextEditor.helpers";

export default function AdminTinyMceEditor({
  id,
  name,
  value = "",
  onChange,
  disabled = false,
  readOnly = false,
  required = false,
  placeholder = "",
  minHeight = 260,
  toolbarMode = "full",
  onEditorReady,
  onOpenMediaPicker,
  "aria-describedby": ariaDescribedBy,
}) {
  const [loadError, setLoadError] = useState(false);

  if (loadError) {
    return (
      <div role="alert" className="min-h-64 bg-[#0f1116] p-6 text-sm text-white/70">
        <p className="font-bold text-red-300">Der Texteditor konnte nicht geladen werden.</p>
        <p className="mt-2">Der vorhandene Inhalt bleibt erhalten. Bitte lade die Seite neu, bevor du speicherst.</p>
      </div>
    );
  }

  return (
    <Editor
      id={id}
      textareaName={name}
      licenseKey="gpl"
      value={normalizeEditorValue(value)}
      disabled={disabled}
      readonly={readOnly}
      rollback={false}
      onScriptsLoadError={() => setLoadError(true)}
      onEditorChange={(html) => onChange?.(html)}
      onInit={(_event, instance) => onEditorReady?.(instance)}
      init={createTinyMceInit({
        id,
        minHeight,
        placeholder,
        toolbarMode,
        required,
        ariaDescribedBy,
        onOpenMediaPicker,
      })}
    />
  );
}
