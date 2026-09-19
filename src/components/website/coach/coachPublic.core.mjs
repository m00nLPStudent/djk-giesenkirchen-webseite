function sortableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return Number.MAX_SAFE_INTEGER;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : Number.MAX_SAFE_INTEGER;
}

function compareText(left, right) {
  return String(left || "").localeCompare(String(right || ""), "de");
}

export function sortPublicCoachesByPrimaryTeam(coaches = []) {
  return [...(coaches || [])].sort((left, right) => {
    const leftPrimary = left.primaryAssignment || null;
    const rightPrimary = right.primaryAssignment || null;

    return (
      sortableNumber(leftPrimary?.teamSortOrder) -
        sortableNumber(rightPrimary?.teamSortOrder) ||
      sortableNumber(leftPrimary?.sortOrder) -
        sortableNumber(rightPrimary?.sortOrder) ||
      sortableNumber(left.sortOrder) - sortableNumber(right.sortOrder) ||
      compareText(left.displayName, right.displayName) ||
      compareText(left.id, right.id)
    );
  });
}
