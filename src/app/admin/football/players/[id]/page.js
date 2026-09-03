import AdminPlayerDetailPage from "@/app/admin/players/[id]/page";

export default function FootballPlayerDetailPage(props) {
  return <AdminPlayerDetailPage {...props} requiredDepartmentSlug="fussball" />;
}
