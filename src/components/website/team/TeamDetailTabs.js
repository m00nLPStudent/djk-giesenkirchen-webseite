"use client";

import { useState } from "react";
import TeamTrainingInfo from "./TeamTrainingInfo";
import TeamCompetitionSection from "./TeamCompetitionSection";
import TeamCoachSection from "./TeamCoachSection";
import TeamPlayerSection from "./TeamPlayerSection";
import TeamContact from "./TeamContact";

const TEAM_DETAIL_TABS = [
  { id: "training", label: "Training" },
  { id: "players", label: "Kader" },
  { id: "staff", label: "Trainer" },
  { id: "competition", label: "Spielbetrieb" },
  { id: "contact", label: "Kontakt" },
];

function TeamTabsNavigation({ activeTab, onChange }) {
  return (
    <div className="sticky top-4 z-10 rounded-[2rem] border border-white/10 bg-[#17171d]/95 p-3 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TEAM_DETAIL_TABS.map((tab) => {
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

export default function TeamDetailTabs({ team, coaches = [], players = [], teamSlug }) {
  const [activeTab, setActiveTab] = useState("training");

  return (
    <section className="space-y-6">
      <TeamTabsNavigation activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "training" && <TeamTrainingInfo team={team} />}

      {activeTab === "players" && (
        <TeamPlayerSection players={players} teamSlug={teamSlug} />
      )}

      {activeTab === "staff" && <TeamCoachSection coaches={coaches} />}

      {activeTab === "competition" && <TeamCompetitionSection team={team} />}

      {activeTab === "contact" && <TeamContact team={team} />}
    </section>
  );
}
