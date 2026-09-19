export function getTeamCoachNameLines(coach = {}) {
  const firstName = String(coach.firstName || coach.first_name || "").trim();
  const lastName = String(coach.lastName || coach.last_name || "").trim();

  if (firstName || lastName) {
    return {
      firstName: firstName || "\u00a0",
      lastName: lastName || "\u00a0",
    };
  }

  const displayName = String(coach.displayName || coach.name || "Trainer").trim();
  const [fallbackFirstName, ...fallbackLastNameParts] = displayName.split(/\s+/);

  return {
    firstName: fallbackFirstName || "Trainer",
    lastName: fallbackLastNameParts.join(" ") || "\u00a0",
  };
}
