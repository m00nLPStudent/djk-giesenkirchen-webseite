export const ALLOWED_DOCUMENT_TYPES = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "zip",
  "jpg",
  "png",
  "webp",
];

export function formatFileSize(bytes) {
  if (!bytes || Number.isNaN(Number(bytes))) return null;

  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(fileName = "") {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension || "";
}

export function deriveDisplayName(fileName = "") {
  return (fileName || "").replace(/\.[^/.]+$/, "");
}
