import { supabase } from "@/lib/supabase";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";
import {
  getStoragePublicUrl,
  removeStorageFiles,
  uploadStorageFile,
} from "@/lib/storage";
import {
  ALLOWED_DOCUMENT_TYPES,
  deriveDisplayName,
  getFileExtension,
} from "@/lib/files";

export async function uploadNewsImage(file) {
  if (!file) return { data: null, error: null };

  const fileName = `news/${Date.now()}-${file.name}`;

  const { error } = await uploadStorageFile("media", fileName, file);

  if (error) {
    return { data: null, error };
  }

  const data = getStoragePublicUrl("media", fileName);

  return {
    data: data.publicUrl,
    error: null,
  };
}

export async function createNews(news) {
  const result = await supabase.from("news").insert(news).select("*").single();

  logAdminSaveEvent({
    module: "news",
    mode: "create",
    step: "service.createNews",
    operation: "insert",
    success: !result.error,
    error: result.error,
    data: result.data,
  });

  return result;
}

export async function updateNews(id, news) {
  const result = await supabase
    .from("news")
    .update(news)
    .eq("id", id)
    .select("*")
    .single();

  logAdminSaveEvent({
    module: "news",
    mode: "edit",
    step: "service.updateNews",
    operation: "update",
    success: !result.error,
    error: result.error,
    data: result.data,
  });

  return result;
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

  const { error: uploadError } = await uploadStorageFile(
    "news-documents",
    path,
    file,
    {
      cacheControl: "3600",
      upsert: false,
    },
  );

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const publicUrlData = getStoragePublicUrl("news-documents", path);

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
    const { error: storageError } = await removeStorageFiles("news-documents", [
      storagePath,
    ]);
    if (storageError) {
      return { data: null, error: storageError };
    }
  }

  return await supabase
    .from("news_documents")
    .delete()
    .eq("id", documentItem.id);
}
