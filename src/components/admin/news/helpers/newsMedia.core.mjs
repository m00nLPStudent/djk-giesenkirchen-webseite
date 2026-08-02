export function resolveMediaFileName(item = {}, fallback = "Datei") {
  if (item.file_name?.trim()) return item.file_name.trim();
  const url = item.file_url || item.image_url || "";
  if (!url) return fallback;
  try {
    return decodeURIComponent(new URL(url, "http://local").pathname.split("/").pop()) || fallback;
  } catch {
    return fallback;
  }
}
