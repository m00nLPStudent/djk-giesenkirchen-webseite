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
  const fullName = `${coach?.first_name ?? ""} ${coach?.last_name ?? ""}`.trim();
  return fullName || coach?.name || "Trainer";
}

export function getTeam(coach) {
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
