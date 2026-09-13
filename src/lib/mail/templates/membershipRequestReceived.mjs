import { resolveMembershipResponsibility } from "../../membership/membershipResponsibility.core.mjs";
import { normalizeMailHeader } from "../mail.core.mjs";
import { renderClubMailLayout } from "./clubMailLayout.mjs";

export const MEMBERSHIP_CONFIRMATION_SUBJECT = "Deine Mitgliedsanfrage beim DJK/VfL Giesenkirchen";

export function buildMembershipRequestReceivedMail(request = {}, { siteUrl = null } = {}) {
  const firstName = normalizeMailHeader(request.first_name);
  const lastName = normalizeMailHeader(request.last_name);
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Sportfreundin oder Sportfreund";
  const requestLabel = resolveMembershipResponsibility(request.request_type)?.requestLabel || "Mitgliedsanfrage";
  const text = [
    `Hallo ${displayName},`,
    "",
    "vielen Dank für deine Anfrage beim DJK/VfL Giesenkirchen.",
    `Deine Anfrage „${requestLabel}“ ist erfolgreich bei uns eingegangen und wird von den zuständigen Ansprechpartnern geprüft.`,
    "Wir melden uns bei dir, sobald deine Anfrage bearbeitet wurde.",
    "",
    "Sportliche Grüße",
    "DJK/VfL Giesenkirchen",
  ].join("\n");
  const html = renderClubMailLayout({
    title: "Deine Mitgliedsanfrage ist eingegangen",
    paragraphs: [
      `Hallo ${displayName},`,
      "vielen Dank für deine Anfrage beim DJK/VfL Giesenkirchen.",
      `Deine Anfrage „${requestLabel}“ ist erfolgreich bei uns eingegangen und wird von den zuständigen Ansprechpartnern geprüft.`,
      "Wir melden uns bei dir, sobald deine Anfrage bearbeitet wurde.",
    ],
    siteUrl,
  });
  return { subject: MEMBERSHIP_CONFIRMATION_SUBJECT, text, html };
}
