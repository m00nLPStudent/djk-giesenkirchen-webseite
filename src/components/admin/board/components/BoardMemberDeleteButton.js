"use client";

import AdminRemoveButton from "@/components/admin/delete/AdminRemoveButton";
import { removeBoardMemberRecord } from "@/components/admin/delete/removeActions";
import { getBoardMemberName } from "../boardUi.helpers";

export default function BoardMemberDeleteButton({ member }) {
  return <AdminRemoveButton label="Vorstandsmitglied" name={getBoardMemberName(member)} action={() => removeBoardMemberRecord(member)} affected={["Vorstandsprofil"]} preserved={["Trainer", "Mannschaften", "News"]} successHref="/admin/department" />;
}
