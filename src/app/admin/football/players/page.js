import AdminPlayersPage from "@/app/admin/players/page";

export default function FootballPlayersPage(props) {
  return <AdminPlayersPage {...props} requiredDepartmentSlug="fussball" />;
}
