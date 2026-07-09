"use server";

import { revalidatePath } from "next/cache";

export async function revalidateAdminProfileAction() {
  revalidatePath("/admin/profile");
  revalidatePath("/admin");
  return { ok: true };
}
