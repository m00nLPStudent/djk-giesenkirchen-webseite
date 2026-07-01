"use client";

import AdminRemoveButton from "@/components/admin/delete/AdminRemoveButton";
import { removeNewsRecord } from "@/components/admin/delete/removeActions";

export default function DeleteNewsButton({ id, title = "News" }) {
  return (
    <AdminRemoveButton
      label="News"
      name={title}
      action={() => removeNewsRecord({ id })}
      affected={["Beitrag"]}
      preserved={["Mannschaften", "Spieler", "Trainer"]}
    />
  );
}
