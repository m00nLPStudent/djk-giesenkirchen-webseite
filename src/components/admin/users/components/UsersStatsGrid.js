import UsersStatCard from "./UsersStatCard";

export default function UsersStatsGrid({ stats }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UsersStatCard label="Benutzer gesamt" value={stats?.totalUsers || 0} />
      <UsersStatCard label="Aktive Benutzer" value={stats?.activeUsers || 0} />
      <UsersStatCard
        label="Inaktive Benutzer"
        value={stats?.inactiveUsers || 0}
      />
      <UsersStatCard label="Rollen gesamt" value={stats?.totalRoles || 0} />
    </section>
  );
}
