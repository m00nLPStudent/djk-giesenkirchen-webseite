import CoachAvatar from "@/components/admin/coaches/components/CoachAvatar";
import { getBoardMemberName } from "../boardUi.helpers";

export default function BoardMemberAvatar({ member, sizeClassName = "h-12 w-12" }) {
  return <CoachAvatar coach={{ ...member, displayName: getBoardMemberName(member) }} sizeClassName={sizeClassName} />;
}
