"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export default function AdminTopbarClock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  return (
    <div className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-xs text-white/45">
      <Clock size={15} />
      <span>
        {now.toLocaleDateString("de-DE", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
        {" · "}
        {now.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}
