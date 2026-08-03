"use client";

import { useId } from "react";
import dynamic from "next/dynamic";

const TinyMceEditor = dynamic(() => import("./AdminTinyMceEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-64 items-center justify-center bg-[#0f1116] px-6 text-sm text-white/55">
      Editor wird geladen …
    </div>
  ),
});

export default function AdminRichTextEditor(props) {
  const generatedId = useId().replace(/:/g, "");
  const id = props.id || `admin-richtext-${generatedId}`;
  const helpId = props.helpText ? `${id}-help` : undefined;
  const errorId = props.error ? `${id}-error` : undefined;
  const describedBy = [props["aria-describedby"], helpId, errorId]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="admin-richtext-editor min-w-0">
      {props.label ? (
        <label htmlFor={id} className="mb-3 block text-sm font-bold text-white/80">
          {props.label}{props.required ? " *" : ""}
        </label>
      ) : null}
      <div className={`min-w-0 overflow-hidden rounded-[1.75rem] border bg-[#13131a] shadow-[0_24px_80px_rgba(0,0,0,0.25)] focus-within:ring-2 ${props.error ? "border-red-500 focus-within:ring-red-500/40" : "border-white/10 focus-within:border-red-500 focus-within:ring-red-500/25"}`}>
        <TinyMceEditor {...props} id={id} aria-describedby={describedBy} />
      </div>
      {props.helpText ? <p id={helpId} className="mt-2 text-sm text-white/50">{props.helpText}</p> : null}
      {props.error ? <p id={errorId} role="alert" className="mt-2 text-sm font-semibold text-red-400">{props.error}</p> : null}
    </div>
  );
}
