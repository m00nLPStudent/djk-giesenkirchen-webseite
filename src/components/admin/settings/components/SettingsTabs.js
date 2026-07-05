import TabNavigation from "@/components/admin/ui/TabNavigation";

export default function SettingsTabs({ tabs, activeTab, onChange }) {
  return (
    <TabNavigation tabs={tabs} activeTab={activeTab} onChange={onChange} />
  );
}
