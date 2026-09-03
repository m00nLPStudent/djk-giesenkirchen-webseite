import NewBoardMemberPage from "@/app/admin/department/board/new/page";

export default function NewClubBoardMemberPage(props) {
  return <NewBoardMemberPage {...props} requiredOrganizationScope="club" />;
}
