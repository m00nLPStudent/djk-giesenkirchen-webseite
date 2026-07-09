"use client";

import AdminPanel from "@/components/admin/common/AdminPanel";
import PasswordForm from "../forms/PasswordForm";

export default function ProfileSecurityCard({
  loading,
  statusMessage,
  onChangePassword,
  onSendReset,
}) {
  return (
    <AdminPanel className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
          Sicherheit
        </p>
        <h2 className="mt-2 text-xl font-black text-white">Passwort</h2>
        <p className="mt-2 text-sm text-white/60">
          Passwort direkt aendern oder alternativ Reset per E-Mail ausloesen.
        </p>
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
