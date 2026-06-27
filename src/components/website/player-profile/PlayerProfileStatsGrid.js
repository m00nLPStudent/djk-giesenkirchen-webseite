import ProfileInfoGrid from "@/components/website/profile/ProfileInfoGrid";

export default function PlayerProfileStatsGrid({ stats = [] }) {
  return <ProfileInfoGrid stats={stats} />;
}
