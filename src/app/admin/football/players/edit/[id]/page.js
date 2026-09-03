import EditPlayerPage from "@/app/admin/players/edit/[id]/page";

export default function FootballEditPlayerPage(props) {
  return <EditPlayerPage {...props} requiredDepartmentSlug="fussball" />;
}
