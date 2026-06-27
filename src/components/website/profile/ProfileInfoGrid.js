import ProfileInfoCard from "./ProfileInfoCard";

export default function ProfileInfoGrid({ stats = [] }) {
  return (
    <div className="grid flex-1 auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((item) => (
        <ProfileInfoCard key={item.label} {...item} />
      ))}
    </div>
  );
}
