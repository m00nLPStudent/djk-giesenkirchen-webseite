"use client";

export default function TabNavigation({ tabs = [], activeTab, onChange }) {
  if (!tabs.length) return null;

  return (
    <div className="sticky top-4 z-10 rounded-[2rem] border border-white/10 bg-[#17171d]/95 p-3 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`shrink-0 rounded-full px-5 py-3 text-sm font-black transition ${
                isActive
                  ? "bg-red-600 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
