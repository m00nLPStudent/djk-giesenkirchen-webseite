import Link from "next/link";
import AdminCard from "@/components/admin/common/AdminCard";

export default function DashboardStatCard({ label, value, href }) {
  return (
    <Link href={href} className="transition hover:-translate-y-0.5">
      <AdminCard className="h-full p-5 transition hover:border-red-500/50 hover:bg-white/[0.06]">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-white/45">
          {label}
        </p>
        <p className="mt-3 text-4xl font-black text-white">{value}</p>
        <p className="mt-2 text-sm text-red-300">Zum Bereich</p>
      </AdminCard>
    </Link>
  );
}
