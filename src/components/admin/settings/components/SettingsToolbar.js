import { AdminActionBar, AdminButton, AdminPanel } from "@/components/admin/design-system";

export default function SettingsToolbar({ items = [], activeId, onChange }) {
  return (
    <AdminPanel className="p-3">
      <AdminActionBar role="tablist" aria-label="Einstellungsbereiche">
        {items.map((item) => (
          <AdminButton key={item.id} variant={activeId === item.id ? "primary" : "secondary"} onClick={() => onChange(item.id)} role="tab" aria-selected={activeId === item.id}>
            {item.label}
          </AdminButton>
        ))}
      </AdminActionBar>
    </AdminPanel>
  );
}
