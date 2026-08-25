"use client";

import { useState } from "react";
import AdminRichTextEditor from "@/components/admin/richtext/AdminRichTextEditor";
import AdminMediaPickerDialog from "@/components/admin/media-library/AdminMediaPickerDialog";
import { createCentralMediaImageHtml } from "../helpers/newsInlineMedia.core.mjs";

export default function NewsInlineMediaEditor({ inlineMedia, ...editorProps }) {
  const [open, setOpen] = useState(false);
  const [editor, setEditor] = useState(null);

  function insert(item) {
    const html = createCentralMediaImageHtml(item);
    if (html) editor?.insertContent(html);
  }

  return <>
    <AdminRichTextEditor {...editorProps} onEditorReady={setEditor} onOpenMediaPicker={() => setOpen(true)} />
    <AdminMediaPickerDialog open={open} onClose={() => setOpen(false)} onSelect={insert} loadAction={inlineMedia.loadAction} uploadAction={inlineMedia.uploadAction} mediaKind="image" defaultPurpose="news" />
  </>;
}
