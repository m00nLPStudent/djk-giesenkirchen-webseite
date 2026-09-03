import AdminTeamDetailPage from "@/app/admin/teams/[id]/page";

export default function FootballTeamDetailPage(props) {
  return <AdminTeamDetailPage {...props} requiredDepartmentSlug="fussball" />;
}
