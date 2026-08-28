import EmailChangeConfirmationForm from "@/components/auth/EmailChangeConfirmationForm";
import { inspectAdminEmailChange } from "@/lib/admin-auth/adminEmailChange.service";

export const metadata = { title: "Neue Login-E-Mail-Adresse bestätigen" };

export default async function ConfirmEmailChangePage({ searchParams }) {
  const query = await searchParams;
  const token = typeof query?.token === "string" ? query.token : "";
  const inspection = await inspectAdminEmailChange(token);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_28%),#101014] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-red-400">Benutzerkonto</p>
          <h1 className="mt-3 text-3xl font-black">Neue E-Mail-Adresse bestätigen</h1>
          <div className="mt-6">
            {inspection.status === "valid" ? <EmailChangeConfirmationForm token={token} /> : null}
            {inspection.status === "expired" ? (
              <p className="rounded-2xl border border-amber-300/35 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                Dieser Bestätigungslink ist abgelaufen. Die Login-E-Mail-Adresse wurde nicht geändert.
              </p>
            ) : null}
            {inspection.status === "invalid" ? (
              <p className="rounded-2xl border border-white/15 bg-black/20 px-4 py-4 text-sm text-white/70">
                Dieser Bestätigungslink ist ungültig oder nicht mehr verfügbar.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
