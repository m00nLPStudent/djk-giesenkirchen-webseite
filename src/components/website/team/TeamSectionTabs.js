"use client";

import { useState } from "react";

export default function TeamSectionTabs({ tabs = [], initialTab = "training", label = "Mannschaftsbereiche" }) {
  const initialId = tabs.some((tab) => tab.id === initialTab) ? initialTab : tabs[0]?.id;
  const [activeTab, setActiveTab] = useState(initialId);
  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  if (!active) return null;
  return <section className="min-w-0 space-y-6">
    <div className="sticky top-3 z-10 min-w-0 rounded-[2rem] border border-white/10 bg-[#17171d]/95 p-2 backdrop-blur sm:p-3">
      <div aria-label={label} className="flex min-w-0 flex-wrap gap-2">{tabs.map((tab) => {
        const isActive = active.id === tab.id;
        return <button key={tab.id} type="button" aria-pressed={isActive} aria-controls={`team-section-${tab.id}`} onClick={() => setActiveTab(tab.id)} className={`min-h-11 rounded-full px-4 py-2.5 text-sm font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 sm:px-5 sm:py-3 ${isActive ? "bg-red-600 text-white" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}>{tab.label}</button>;
      })}</div>
    </div>
    <div id={`team-section-${active.id}`}>{active.content}</div>
  </section>;
}
