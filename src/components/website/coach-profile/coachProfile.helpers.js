import { COUNTRIES } from "@/constants";
import { formatGermanPhoneNumberReadable, getPhoneHref, getWhatsAppUrl } from "@/lib/phone";

export function getCountry(value) {
  if (!value) return null;

  const normalizedValue = String(value).trim().toLowerCase();

  return (
    COUNTRIES.find((country) => {
      return (
        country.iso.toLowerCase() === normalizedValue ||
        country.de.toLowerCase() === normalizedValue ||
        country.en.toLowerCase() === normalizedValue
      );
    }) || null
  );
}

export function getCoachFullName(coach) {
  if (coach?.displayName) return coach.displayName;
  const fullName = `${coach?.first_name ?? ""} ${coach?.last_name ?? ""}`.trim();
  return fullName || coach?.name || "Trainer";
}

export function getTeam(coach) {
  if (coach?.primaryAssignment) {
    return {
      id: coach.primaryAssignment.teamId,
      name_de:
        coach.primaryAssignment.teamNameDe || coach.primaryAssignment.teamNameEn,
      slug: coach.primaryAssignment.teamSlug || null,
    };
  }
  if (Array.isArray(coach?.teams)) return coach.teams[0] || null;
  return coach?.teams || null;
}

export function getCoachContact(coach) {
  return {
    phoneDisplay: formatGermanPhoneNumberReadable(coach?.phone),
    whatsappDisplay: formatGermanPhoneNumberReadable(coach?.whatsapp),
    phoneHref: getPhoneHref(coach?.phone),
    whatsappHref: getWhatsAppUrl(coach?.whatsapp),
  };
}
