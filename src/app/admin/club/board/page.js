import AdminDepartmentPage from "@/app/admin/department/page";

export default function ClubBoardPage(props) {
  return <AdminDepartmentPage {...props} requiredOrganizationScope="club" />;
}
