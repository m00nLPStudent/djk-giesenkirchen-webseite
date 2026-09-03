import EditCoachPage from "@/app/admin/coaches/edit/[id]/page";

export default function FootballEditCoachPage(props) {
  return <EditCoachPage {...props} requiredDepartmentSlug="fussball" />;
}
