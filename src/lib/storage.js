import { supabase } from "@/lib/supabase";

const PUBLIC_MEDIA_MARKER = "/storage/v1/object/public/media/";

export function getStoragePathFromPublicUrl(url, ignoredUrls = []) {
  if (!url) return null;
  if (ignoredUrls.includes(url)) return null;

  const cleanUrl = String(url).split("?")[0];
  const index = cleanUrl.indexOf(PUBLIC_MEDIA_MARKER);

  if (index === -1) return null;

  return decodeURIComponent(cleanUrl.slice(index + PUBLIC_MEDIA_MARKER.length));
}

export function getFileExtension(fileName = "") {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension || "png";
}

export function slugifyFileName(value = "datei") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "datei";
}

export async function deleteMediaFile(publicUrl, options = {}) {
  const path = getStoragePathFromPublicUrl(publicUrl, options.ignoredUrls || []);

  if (!path) {
    return { error: null };
  }

  return await supabase.storage.from("media").remove([path]);
}

export async function uploadMediaFile(file, options = {}) {
  if (!file) return { data: null, error: null };

  const {
    folder = "uploads",
    name = "datei",
    previousUrl = null,
    ignoredUrls = [],
  } = options;

  const previousPath = getStoragePathFromPublicUrl(previousUrl, ignoredUrls);
  const extension = getFileExtension(file.name);
  const fileName = `${folder}/${slugifyFileName(name)}.${extension}`;

  if (previousPath && previousPath !== fileName) {
    await supabase.storage.from("media").remove([previousPath]);
  }

  const { error } = await supabase.storage
    .from("media")
    .upload(fileName, file, { upsert: true });

  if (error) {
    return { data: null, error };
  }

  const { data } = supabase.storage.from("media").getPublicUrl(fileName);

  return {
    data: `${data.publicUrl}?v=${Date.now()}`,
    error: null,
  };
}
