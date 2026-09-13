const normalizeNamePart = (value) =>
  typeof value === "string" ? value.trim() : "";

export function formatPublicPlayerName(firstName, lastName) {
  const normalizedFirstName = normalizeNamePart(firstName);
  const normalizedLastName = normalizeNamePart(lastName);
  const surnameInitial = normalizedLastName ? `${normalizedLastName[0]}.` : "";

  return [normalizedFirstName, surnameInitial].filter(Boolean).join(" ");
}
