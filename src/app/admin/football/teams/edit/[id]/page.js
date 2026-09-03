import EditTeamPage from "@/app/admin/teams/edit/[id]/page";

export default function FootballEditTeamPage(props) {
  return <EditTeamPage {...props} requiredDepartmentSlug="fussball" />;
}
