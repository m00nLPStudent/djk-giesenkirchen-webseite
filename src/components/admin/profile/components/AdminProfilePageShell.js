"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import {
  getReadableErrorMessage,
  logAdminDebugError,
} from "@/lib/admin-auth/adminDiagnostics";
import { assignOwnProfileAvatarAction, loadOwnProfileAvatarAction, loadOwnProfileMediaAction, updateOwnDashboardProfileAction, uploadOwnProfileMediaAction } from "@/app/admin/profile/actions";
import AdminMediaPicker from "@/components/admin/media-library/AdminMediaPicker";
import ProfileSummaryCard from "./ProfileSummaryCard";
import ProfileRolesCard from "./ProfileRolesCard";
import ProfileSecurityCard from "./ProfileSecurityCard";
import ProfileForm from "../forms/ProfileForm";
import {
  changeOwnPassword,
  getOwnAdminProfileData,
  sendOwnPasswordResetEmail,
} from "../services/profile.service";

export default function AdminProfilePageShell() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextData = await getOwnAdminProfileData();
        if (!active) return;
        const avatarResult = await loadOwnProfileAvatarAction();
        if (!active) return;
        setData(nextData);
        setAvatar(avatarResult?.item || null);
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

  async function handleSaveProfile(input) {
    setProfileMessage("");
    setSavingProfile(true);

    const result = await updateOwnDashboardProfileAction(input);
    setSavingProfile(false);

    if (!result?.ok) {
      setProfileMessage(result?.error || "Speichern fehlgeschlagen.");
      return result;
    }

    setProfileMessage(result.message || "Profil gespeichert.");
    await refreshData();
    return result;
  }

  async function handleAvatarChange(item) {
    setProfileMessage("");
    setSavingProfile(true);
    const result = await assignOwnProfileAvatarAction(item?.id || null);
    setSavingProfile(false);
    if (!result?.ok) { setProfileMessage(result?.error || "Profilbild konnte nicht gespeichert werden."); return; }
    setAvatar(result.item || null);
    setProfileMessage(result.message || "Profilbild wurde gespeichert.");
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
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Profil"
        title="Mein Admin-Profil"
        description="Persönliche Dashboarddaten, Profilbild und Zugangsdaten verwalten."
      />

      {error ? (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      {!data ? null : (
        <>
          <ProfileSummaryCard profileData={data} avatar={avatar} />

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.18)] md:p-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
                Persönliches Dashboardprofil
              </p>
              <h2 className="mt-2 text-xl font-black text-white">Profildaten</h2>
              <p className="mt-2 text-sm text-white/60">
                Offizieller Name und Login-E-Mail können nur in der Superadmin-Benutzerverwaltung geändert werden.
              </p>

              <div className="mt-5">
                <ProfileForm
                  fullName={data.fullName}
                  email={data.email}
                  initialNickname={data.nickname}
                  initialPhone={data.phone}
                  loading={savingProfile}
                  onSubmit={handleSaveProfile}
                  statusMessage={profileMessage}
                />
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-white/45">Dashboard-Profilbild</p>
                  <AdminMediaPicker value={avatar} onChange={handleAvatarChange} loadAction={loadOwnProfileMediaAction} uploadAction={uploadOwnProfileMediaAction} usageContext="profile" defaultPurpose="profile" entityLabel="Profilbild" />
                </div>
              </div>
            </div>
            <ProfileRolesCard profileData={data} />
          </div>

          <ProfileSecurityCard loading={savingSecurity} statusMessage={securityMessage} lastLoginAt={data.lastLoginAt} onChangePassword={handleChangePassword} onSendReset={handleSendReset} />
        </>
      )}
    </div>
  );
}
