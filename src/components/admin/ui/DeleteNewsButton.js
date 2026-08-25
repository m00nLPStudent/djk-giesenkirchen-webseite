"use client";

import AdminRemoveButton from "@/components/admin/delete/AdminRemoveButton";
import { deleteNewsAction } from "@/app/admin/news/actions";

export default function DeleteNewsButton({ id, title = "News" }) {
  return (
    <AdminRemoveButton
      label="News"
      name={title}
      action={() => deleteNewsAction(id)}
      affected={["Beitrag"]}
      preserved={["Mannschaften", "Spieler", "Trainer"]}
      successHref="/admin/news"
    />
  );
}
