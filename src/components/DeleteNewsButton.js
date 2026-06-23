"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DeleteNewsButton({ id }) {
  const router = useRouter();

  async function deleteNews() {
    const confirmed = confirm("Möchtest du diese News wirklich löschen?");

    if (!confirmed) return;

    const { error } = await supabase.from("news").delete().eq("id", id);

    if (error) {
      alert("Fehler beim Löschen: " + error.message);
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={deleteNews}
      className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-900/20"
    >
      Löschen
    </button>
  );
}
