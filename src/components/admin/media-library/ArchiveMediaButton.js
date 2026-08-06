"use client";

import { useState } from "react";
import { archiveMediaAction } from "@/app/admin/media/actions";

export default function ArchiveMediaButton({ id, usageCount = 0 }) {
  const [message, setMessage] = useState("");
  async function archive() {
    const result = await archiveMediaAction(id);
    if (!result.ok) setMessage(result.error);
  }
  return <>{<button type="button" disabled={usageCount > 0} title={usageCount ? "Verwendete Medien können nicht archiviert werden." : undefined} onClick={archive} className="text-sm font-bold text-white/55 disabled:cursor-not-allowed disabled:opacity-40">Archivieren</button>}{message ? <p role="alert" className="text-xs text-red-300">{message}</p> : null}</>;
}
