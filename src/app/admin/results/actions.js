"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { loadMediaAssetForPicker, loadMediaLibrary, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { isEligibleResultLogo } from "@/components/admin/results/results.core.mjs";
import { removeResult, saveResult, toggleResultPublished } from "@/components/admin/results/results.service";
import { revalidatePublicContent } from "@/lib/revalidation/publicContentRevalidation";

const denied = (auth) => ({ ok: false, error: auth.message || "Berechtigung fehlt." });
async function authorize(permission) { return assertAdminActionPermission({ requiredPermission: permission }); }
const refresh = () => {
  revalidatePath("/admin/results");
  revalidatePublicContent("results");
};

export async function saveResultAction(input) { const auth = await authorize(input?.id ? "results.edit" : "results.create"); if (!auth.ok) return denied(auth); const result = await saveResult(input, auth); if (result.ok) refresh(); return result; }
export async function toggleResultPublishedAction(id) { const auth = await authorize("results.publish"); if (!auth.ok) return denied(auth); const result = await toggleResultPublished(id, auth); if (result.ok) refresh(); return result; }
export async function deleteResultAction(id) { const auth = await authorize("results.delete"); if (!auth.ok) return denied(auth); const result = await removeResult(id, auth); if (result.ok) refresh(); return result; }

export async function loadResultMediaPickerAction(filters = {}) {
  const auth = await authorize("results.create");
  const editAuth = auth.ok ? auth : await authorize("results.edit");
  if (!editAuth.ok) return { ok: false, error: "Berechtigung fehlt.", items: [], total: 0 };
  const result = await loadMediaLibrary({ ...filters, kind: "image", visibility: "public", purpose: "result", archived: "active" });
  if (result.error) return { ok: false, error: "Medien konnten nicht geladen werden.", items: [], total: 0 };
  return { ok: true, items: (result.data || []).map((item) => ({ ...item, selectable: isEligibleResultLogo(item), selectionHint: isEligibleResultLogo(item) ? "Als Gegnerlogo geeignet." : "Nur öffentliche Resultatbilder sind zulässig." })), total: result.count || 0 };
}

export async function uploadResultMediaAction(formData) {
  const auth = await authorize("results.create");
  const editAuth = auth.ok ? auth : await authorize("results.edit");
  if (!editAuth.ok) return denied(editAuth);
  const file = formData.get("file");
  const uploaded = await uploadMediaAsset(file, { displayName: formData.get("displayName"), altText: formData.get("altText"), description: "", visibility: "public", purpose: "result" }, editAuth.profile.id);
  if (uploaded.error) return { ok: false, error: uploaded.stage === "validation" ? uploaded.error.message : "Das Gegnerlogo konnte nicht hochgeladen werden." };
  const resolved = await loadMediaAssetForPicker(uploaded.data.id);
  if (resolved.error || !isEligibleResultLogo(resolved.data)) return { ok: false, error: "Das hochgeladene Gegnerlogo konnte nicht geladen werden." };
  return { ok: true, item: resolved.data };
}
