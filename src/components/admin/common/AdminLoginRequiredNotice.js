import Link from "next/link";

export default function AdminLoginRequiredNotice({
  message = "Fuer diese Daten ist eine Anmeldung erforderlich.",
}) {
  return (
    <div className="rounded-2xl border border-amber-300/35 bg-amber-500/10 p-5 text-amber-50">
      <p className="text-sm font-semibold">{message}</p>
      <Link
        href="/admin/login"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-amber-300 px-4 text-sm font-black text-[#1a1503] transition hover:bg-amber-200"
      >
        Zum Login
      </Link>
    </div>
  );
}
