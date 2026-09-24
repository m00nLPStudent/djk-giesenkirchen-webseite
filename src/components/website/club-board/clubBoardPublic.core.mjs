const text = (value) => String(value || "").trim();

export function selectPublicClubBoard(members = []) {
  return members
    .filter((member) => member?.is_active === true)
    .filter((member) => member.organization_scope === "club" && member.department_id == null)
    .map((member) => ({
      name: text(`${member.first_name || ""} ${member.last_name || ""}`) || "Name nicht hinterlegt",
      role: member.board_roles?.name_de || member.role_de || "Vorstandsmitglied",
      imageMediaAssetId: member.image_media_asset_id || null,
      responsibilities: Array.isArray(member.responsibilities) ? member.responsibilities : [],
      sortOrder: member.sort_order ?? null,
    }))
    .sort((left, right) =>
      (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name, "de"),
    );
}

export function createPublicClubBoardDto(member, mediaUrls = new Map(), placeholder = "") {
  return {
    name: member.name,
    role: member.role,
    imageUrl: (member.imageMediaAssetId && mediaUrls.get(member.imageMediaAssetId)) || placeholder,
    responsibilities: member.responsibilities,
  };
}
