"use client";

import NewsEditorForm from "./NewsEditorForm";

export default function AdminNewsEditForm({ news, initialMedia = null, teams = [], categories = [] }) {
  return <NewsEditorForm news={news} initialMedia={initialMedia} teams={teams} categories={categories} />;
}
