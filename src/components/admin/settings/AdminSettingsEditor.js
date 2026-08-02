"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SettingsTabs from "./components/SettingsTabs";
import { SETTINGS_TABS, getCategoryLabel } from "./helpers/settingsOptions";
import { createClubSettingsForm } from "./helpers/settingsInitialState";
import { createClubSettingsHandlers } from "./helpers/clubSettingsHandlers";
import ClubContactsTab from "./tabs/ClubContactsTab";
import ClubSettingsTab from "./tabs/ClubSettingsTab";
import PagesTab from "./tabs/PagesTab";

export default function AdminSettingsEditor({ initialClubSettings, initialClubContacts = [], initialPages = [], initialTab = "club" }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS.some((tab) => tab.id === initialTab) ? initialTab : "club");
  const [clubSettings, setClubSettings] = useState(initialClubSettings);
  const [clubForm, setClubForm] = useState(() => createClubSettingsForm(initialClubSettings));
  const [clubLoading, setClubLoading] = useState(false);
  const handlers = createClubSettingsHandlers({ router, clubSettings, clubForm, setClubSettings, setClubForm, setClubLoading });

  return <div className="space-y-6"><SettingsTabs tabs={SETTINGS_TABS} activeTab={activeTab} onChange={setActiveTab} />{activeTab === "club" ? <ClubSettingsTab clubForm={clubForm} clubLoading={clubLoading} onSubmit={handlers.handleClubSave} onFieldChange={handlers.updateClubField} /> : null}{activeTab === "contacts" ? <ClubContactsTab contacts={initialClubContacts} getCategoryLabel={getCategoryLabel} /> : null}{activeTab === "pages" ? <PagesTab pages={initialPages} /> : null}</div>;
}
