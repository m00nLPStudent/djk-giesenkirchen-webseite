"use client";

import NewsEditorForm from "./NewsEditorForm";

export default function AdminNewsEditForm({ news, teams = [] }) {
  return <NewsEditorForm news={news} teams={teams} />;
}
