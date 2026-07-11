import SetPasswordForm from "@/components/admin/auth/SetPasswordForm";

export default function AdminSetPasswordPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_28%),#101014] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-red-400">
            Admin Auth
          </p>
          <h1 className="mt-3 text-3xl font-black">Passwort setzen</h1>
          <p className="mt-3 text-sm leading-7 text-white/60">
            Lege dein neues Passwort fest, um den Admin-Zugang abzuschliessen.
          </p>

          <div className="mt-6">
            <SetPasswordForm />
          </div>
        </section>
      </div>
    </main>
  );
}
