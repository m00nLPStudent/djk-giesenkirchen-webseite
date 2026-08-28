"use server";

import { confirmAdminEmailChange } from "@/lib/admin-auth/adminEmailChange.service";

export async function confirmEmailChangeAction(_previousState, formData) {
  const token = String(formData?.get("token") || "");
  const result = await confirmAdminEmailChange(token);
  if (result?.ok) {
    return { status: "completed", message: result.message };
  }
  if (result?.status === "expired") {
    return {
      status: "expired",
      message: "Dieser Bestätigungslink ist abgelaufen. Die Login-E-Mail-Adresse wurde nicht geändert.",
    };
  }
  return {
    status: result?.status === "failed" ? "failed" : "invalid",
    message:
      result?.status === "failed"
        ? "Die E-Mail-Adresse konnte nicht sicher geändert werden. Bitte wende dich an den Verein."
        : "Dieser Bestätigungslink ist ungültig oder nicht mehr verfügbar.",
  };
}
