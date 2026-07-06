"use server";

import { revalidatePath } from "next/cache";
import { updateAdminProfileStatus } from "@/lib/admin-auth/adminProfiles.repository";

export async function updateAdminUserStatusAction({ userId, isActive }) {
  try {
    if (!userId) {
      return { ok: false, message: "Ungueltige Benutzer-ID." };
    }

    const { error } = await updateAdminProfileStatus(userId, isActive);
    if (error) {
      return { ok: false, message: "Status konnte nicht aktualisiert werden." };
    }

    revalidatePath("/admin/users");
    return { ok: true };
  } catch {
    return { ok: false, message: "Status konnte nicht aktualisiert werden." };
  }
}
