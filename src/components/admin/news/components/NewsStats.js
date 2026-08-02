import { AdminMetric, AdminModuleSummary } from "@/components/admin/design-system";

export default function NewsStats({
  total = 0,
  published = 0,
  planned = 0,
  drafts = 0,
}) {
  return (
    <AdminModuleSummary><AdminMetric label="Gesamt" value={total} /><AdminMetric label="Entwürfe" value={drafts} /><AdminMetric label="Veröffentlicht" value={published} /><AdminMetric label="Geplant" value={planned} /></AdminModuleSummary>
  );
}
