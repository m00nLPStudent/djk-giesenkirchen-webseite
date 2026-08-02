import { AdminActionBar, AdminButton, AdminPanel } from "@/components/admin/design-system";
import Can from "@/components/admin/auth/Can";

export default function SettingsToolbar({ items = [], activeId, onChange }) {
  return (
    <AdminPanel className="p-3">
      <AdminActionBar role="tablist" aria-label="Einstellungsbereiche">
        {items.map((item) => (
          <Can key={item.id} permission={item.permission} uiOnly><AdminButton href={item.href} variant={activeId === item.id ? "primary" : "secondary"} onClick={item.href ? undefined : () => onChange(item.id)} role={item.href ? undefined : "tab"} aria-selected={item.href ? undefined : activeId === item.id}>
            {item.label}
          </AdminButton></Can>
        ))}
      </AdminActionBar>
    </AdminPanel>
  );
}
