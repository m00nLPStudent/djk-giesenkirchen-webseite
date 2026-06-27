import ProfileDetailsCard from "@/components/website/profile/ProfileDetailsCard";

export default function PlayerProfileStatsGrid({ stats = [] }) {
  return <ProfileDetailsCard title="Spielerdaten" items={stats} />;
}
