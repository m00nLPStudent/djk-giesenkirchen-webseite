import SettingsToolbar from "./SettingsToolbar";

export default function SettingsTabs({ tabs, activeTab, onChange }) {
  return (
    <SettingsToolbar items={tabs} activeId={activeTab} onChange={onChange} />
  );
}
