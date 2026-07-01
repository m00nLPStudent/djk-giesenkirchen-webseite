"use client";

import NewsEditorForm from "./NewsEditorForm";

export default function AdminNewsForm({ teams = [] }) {
  return <NewsEditorForm teams={teams} />;
}
