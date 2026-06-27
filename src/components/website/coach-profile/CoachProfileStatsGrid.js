import ProfileDetailsCard from "@/components/website/profile/ProfileDetailsCard";

export default function CoachProfileStatsGrid({ stats = [] }) {
  return <ProfileDetailsCard title="Trainerdaten" items={stats} />;
}
