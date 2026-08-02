import { AdminActionBar, AdminButton, AdminPanel } from "@/components/admin/design-system";

export default function NewsToolbar({ tabs, activeTab, onChange }) {
  return <AdminPanel><AdminActionBar>{tabs.map((tab) => <AdminButton key={tab.id} variant={activeTab === tab.id ? "primary" : "secondary"} onClick={() => onChange(tab.id)} aria-pressed={activeTab === tab.id}>{tab.label}</AdminButton>)}</AdminActionBar></AdminPanel>;
}
