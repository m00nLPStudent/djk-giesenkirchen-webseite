"use client";

import NewsEditorForm from "./NewsEditorForm";

export default function AdminNewsForm({ teams = [], categories = [] }) {
  return <NewsEditorForm teams={teams} categories={categories} />;
}
