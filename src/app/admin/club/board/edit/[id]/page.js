import EditBoardMemberPage from "@/app/admin/department/board/edit/[id]/page";

export default function EditClubBoardMemberPage(props) {
  return <EditBoardMemberPage {...props} requiredOrganizationScope="club" />;
}
