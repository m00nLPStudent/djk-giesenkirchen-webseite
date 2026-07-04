import { supabase } from "@/lib/supabase";

const ALLOWED_DOCUMENT_TYPES = [
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

function getFileExtension(fileName = "") {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension || "";
}

function deriveDisplayName(fileName = "") {
  return (fileName || "").replace(/\.[^/.]+$/, "");
}

export async function uploadNewsImage(file) {
  if (!file) return { data: null, error: null };

  const fileName = `news/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage.from("media").upload(fileName, file);

  if (error) {
    return { data: null, error };
  }

  const { data } = supabase.storage.from("media").getPublicUrl(fileName);

  return {
    data: data.publicUrl,
    error: null,
  };
}

export async function createNews(news) {
  return await supabase.from("news").insert(news).select("*").single();
}

export async function updateNews(id, news) {
  return await supabase
    .from("news")
    .update(news)
    .eq("id", id)
    .select("*")
    .single();
}

export async function getNewsDocuments(newsId) {
  if (!newsId) return { data: [], error: null };

  return await supabase
    .from("news_documents")
    .select("*")
    .eq("news_id", newsId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
}

export async function uploadNewsDocument(file, newsId) {
  if (!file || !newsId) return { data: null, error: null };

  const extension = getFileExtension(file.name);
  if (!ALLOWED_DOCUMENT_TYPES.includes(extension)) {
    return {
      data: null,
      error: { message: "Dieser Dateityp ist nicht erlaubt." },
    };
  }

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const path = `${newsId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("news-documents")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data: publicUrlData } = supabase.storage
    .from("news-documents")
    .getPublicUrl(path);

  const payload = {
    news_id: newsId,
    file_name: file.name,
    file_path: path,
    display_name_de: deriveDisplayName(file.name),
    display_name_en: null,
    description_de: null,
    description_en: null,
    file_url: publicUrlData.publicUrl,
    mime_type: file.type || `application/${extension}`,
    file_size: file.size,
    is_public: true,
    sort_order: 0,
  };

  const { data, error } = await supabase
    .from("news_documents")
    .insert(payload)
    .select("*")
    .single();

  return { data, error };
}

export async function updateNewsDocument(id, updates) {
  if (!id) return { data: null, error: null };

  return await supabase
    .from("news_documents")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();
}

export async function deleteNewsDocument(documentItem) {
  if (!documentItem?.id) return { data: null, error: null };

  const storagePath = documentItem.file_path
    ? decodeURIComponent(documentItem.file_path)
    : null;

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from("news-documents")
      .remove([storagePath]);
    if (storageError) {
      return { data: null, error: storageError };
    }
  }

  return await supabase
    .from("news_documents")
    .delete()
    .eq("id", documentItem.id);
}
