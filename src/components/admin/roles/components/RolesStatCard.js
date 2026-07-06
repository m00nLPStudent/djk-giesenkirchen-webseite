import AdminCard from "@/components/admin/common/AdminCard";

export default function RolesStatCard({ label, value }) {
  return (
    <AdminCard className="p-5 md:p-6">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-white/45">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </AdminCard>
  );
}
