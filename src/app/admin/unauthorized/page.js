import Link from "next/link";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPanel from "@/components/admin/common/AdminPanel";

function getReasonText(reason) {
  switch (reason) {
    case "inactive-user":
      return "Dieser Admin-Zugang ist deaktiviert.";
    case "missing-admin-profile":
      return "Fuer diesen Account existiert kein freigegebenes Admin-Profil.";
    default:
      return "Fuer diesen Bereich fehlen Berechtigungen.";
  }
}

export default async function AdminUnauthorizedPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const reason = resolvedSearchParams?.reason || "";
  const permission = resolvedSearchParams?.permission || "";

  return (
    <AdminLayout
      title="Kein Zugriff"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminPanel className="p-7 md:p-8">
        <p className="text-[0.7rem] font-black uppercase tracking-[0.3em] text-red-300">
          Unauthorized
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Kein Zugriff</h2>
        <p className="mt-3 text-sm text-white/60">{getReasonText(reason)}</p>
        {reason === "missing-permission" && permission && (
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300/90">
            Fehlende Permission: {permission}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/login"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700"
          >
            Zur Login-Seite
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-5 text-sm font-black text-white/80 transition hover:bg-white/[0.08] hover:text-white"
          >
            Zur öffentlichen Website
          </Link>
        </div>
      </AdminPanel>
    </AdminLayout>
  );
}
