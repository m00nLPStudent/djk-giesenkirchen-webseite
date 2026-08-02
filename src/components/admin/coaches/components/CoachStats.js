import { AdminMetric, AdminModuleSummary } from "@/components/admin/design-system";

export default function CoachStats({ coaches = [] }) {
  const active = coaches.filter((coach) => coach.isActive).length;
  const stats = [["Trainer gesamt", coaches.length], ["Aktiv", active], ["Inaktiv", coaches.length - active]];
  return <AdminModuleSummary>{stats.map(([label, value]) => <AdminMetric key={label} label={label} value={value} />)}</AdminModuleSummary>;
}
