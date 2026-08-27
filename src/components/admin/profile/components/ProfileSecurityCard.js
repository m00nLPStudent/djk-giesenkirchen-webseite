"use client";

import AdminPanel from "@/components/admin/common/AdminPanel";
import PasswordForm from "../forms/PasswordForm";
import { formatProfileDateTime } from "../helpers/profile.formatters";

export default function ProfileSecurityCard({
  loading,
  statusMessage,
  onChangePassword,
  onSendReset,
  lastLoginAt,
}) {
  return (
    <AdminPanel className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
          Sicherheit
        </p>
        <h2 className="mt-2 text-xl font-black text-white">Passwort</h2>
        <p className="mt-2 text-sm text-white/60">Letzte Anmeldung: <span className="font-bold text-white/80">{formatProfileDateTime(lastLoginAt)}</span></p>
        <p className="mt-1 text-xs text-white/45">Wenn dir dieser Zeitpunkt unbekannt vorkommt, ändere dein Passwort.</p>
      </div>

      <PasswordForm
        loading={loading}
        onSubmit={onChangePassword}
        onResetEmail={onSendReset}
      />

      {statusMessage ? (
        <p className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/75">
          {statusMessage}
        </p>
      ) : null}
    </AdminPanel>
  );
}
