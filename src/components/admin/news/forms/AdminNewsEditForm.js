"use client";

import NewsEditorForm from "./NewsEditorForm";

export default function AdminNewsEditForm({ news, teams = [], categories = [] }) {
  return <NewsEditorForm news={news} teams={teams} categories={categories} />;
}
