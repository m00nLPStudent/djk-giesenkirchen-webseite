"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export default function AdminClock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  return (
    <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70 lg:flex">
      <Clock size={18} />

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
