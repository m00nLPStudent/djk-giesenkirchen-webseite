import AdminEmptyState from "@/components/admin/common/AdminEmptyState";

export default function DashboardEmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5">
      <AdminEmptyState text={text} className="text-sm text-white/55" />
    </div>
  );
}
