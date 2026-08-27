/* eslint-disable @next/next/no-img-element */
import { UserCircle } from "lucide-react";
import { formatStatusLabel } from "../helpers/profile.formatters";

export default function ProfileSummaryCard({ profileData, avatar }) {
  const displayName = profileData?.nickname || profileData?.fullName || "Admin";
  return (
    <section className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.18)] sm:flex-row sm:items-center">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/25">
        {avatar?.previewUrl ? <img src={avatar.previewUrl} alt="Dashboard-Profilbild" className="h-full w-full object-cover" /> : <UserCircle aria-label="Standard-Profilbild" className="h-12 w-12 text-white/45" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">Mein Profil</p>
        <h1 className="mt-1 truncate text-2xl font-black text-white">{displayName}</h1>
        {profileData?.nickname ? <p className="mt-1 text-sm text-white/55">{profileData.fullName}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${profileData?.isActive ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-red-400/30 bg-red-500/10 text-red-200"}`}>{formatStatusLabel(profileData?.isActive)}</span>
          {profileData?.primaryRole ? <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-xs font-bold text-white/75">{profileData.primaryRole.name || profileData.primaryRole.key}</span> : null}
        </div>
      </div>
    </section>
  );
}
