export function getBoardMemberName(member = {}) {
  return `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Vorstandsmitglied";
}

export function getBoardMemberSummary(members = []) {
  return {
    total: members.length,
    active: members.filter((member) => member.is_active !== false).length,
    inactive: members.filter((member) => member.is_active === false).length,
  };
}

export function filterBoardMembers(members = [], { search = "", status = "all" } = {}) {
  const query = String(search).trim().toLocaleLowerCase("de-DE");
  return members.filter((member) => {
    if (status === "active" && member.is_active === false) return false;
    if (status === "inactive" && member.is_active !== false) return false;
    if (!query) return true;
    return [getBoardMemberName(member), member.role_de, member.email, member.phone]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("de-DE").includes(query));
  });
}
