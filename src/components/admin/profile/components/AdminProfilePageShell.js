"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import {
  getReadableErrorMessage,
  logAdminDebugError,
} from "@/lib/admin-auth/adminDiagnostics";
import { revalidateAdminProfileAction } from "@/app/admin/profile/actions";
import ProfileSummaryCard from "./ProfileSummaryCard";
import ProfileRolesCard from "./ProfileRolesCard";
import ProfilePermissionsCard from "./ProfilePermissionsCard";
import ProfileSecurityCard from "./ProfileSecurityCard";
import ProfileForm from "../forms/ProfileForm";
import {
  changeOwnPassword,
  getOwnAdminProfileData,
  sendOwnPasswordResetEmail,
  updateOwnProfileFullName,
} from "../services/profile.service";

export default function AdminProfilePageShell() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextData = await getOwnAdminProfileData();
        if (!active) return;
        setData(nextData);
      } catch (loadError) {
        if (!active) return;
        logAdminDebugError("admin-profile", loadError);
        setError(
          `Profil konnte nicht geladen werden: ${getReadableErrorMessage(
            loadError,
            "Unbekannter Fehler",
          )}`,
        );
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function refreshData() {
    const nextData = await getOwnAdminProfileData();
    setData(nextData);
  }

  async function handleSaveProfile(fullName) {
    setProfileMessage("");
    setSavingProfile(true);

    const result = await updateOwnProfileFullName(fullName);
    setSavingProfile(false);

    if (!result?.ok) {
      const suffix = result?.needsRlsUpdatePolicy
        ? " RLS-UPDATE-Policy fuer eigenes Profil ist vermutlich noetig."
        : "";
      setProfileMessage(
        `${result?.message || "Speichern fehlgeschlagen."}${suffix}`,
      );
      return;
    }

    setProfileMessage(result.message || "Profil gespeichert.");
    await revalidateAdminProfileAction();
    await refreshData();
  }

  async function handleChangePassword(newPassword) {
    setSecurityMessage("");
    setSavingSecurity(true);

    const result = await changeOwnPassword(newPassword);
    setSavingSecurity(false);
    setSecurityMessage(result.message || "Unbekannte Rueckmeldung.");

    return result;
  }

  async function handleSendReset() {
    setSecurityMessage("");
    setSavingSecurity(true);

    const result = await sendOwnPasswordResetEmail();
    setSavingSecurity(false);
    setSecurityMessage(result.message || "Unbekannte Rueckmeldung.");
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Profil"
        title="Mein Admin-Profil"
        description="Persoenliche Profildaten verwalten, Rollen und Rechte einsehen und Zugangsdaten aktualisieren."
      />

      {error ? (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      {!data ? null : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <ProfileSummaryCard profileData={data} />
            <ProfileRolesCard profileData={data} />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <ProfilePermissionsCard profileData={data} />
            <ProfileSecurityCard
              loading={savingSecurity}
              statusMessage={securityMessage}
              onChangePassword={handleChangePassword}
              onSendReset={handleSendReset}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.18)] md:p-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
                Profil bearbeiten
              </p>
              <h2 className="mt-2 text-xl font-black text-white">Name</h2>
              <p className="mt-2 text-sm text-white/60">
                E-Mail, Rollen und Aktivstatus bleiben vorerst read only.
              </p>

              <div className="mt-5">
                <ProfileForm
                  initialFullName={data.fullName}
                  email={data.email}
                  loading={savingProfile}
                  onSubmit={handleSaveProfile}
                  statusMessage={profileMessage}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
