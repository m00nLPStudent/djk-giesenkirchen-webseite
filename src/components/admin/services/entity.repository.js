import { supabase } from "@/lib/supabase";
import { deleteEntityWithImage } from "./deleteEntity.service";

export function createEntityRepository({
  table,
  placeholderImage,
  imageFields = ["image_url"],
}) {
  function getEntityImageUrl(entity = {}) {
    for (const field of imageFields) {
      if (entity[field]) return entity[field];
    }

    return placeholderImage;
  }

  async function insert(payload) {
    return await supabase.from(table).insert(payload).select("*");
  }

  async function update(id, payload) {
    return await supabase.from(table).update(payload).eq("id", id).select("*");
  }

  async function upsert(payload, id = null) {
    if (id) return await update(id, payload);
    return await insert(payload);
  }

  async function remove(id) {
    return await supabase.from(table).delete().eq("id", id);
  }

  async function removeWithImage(entity) {
    return await deleteEntityWithImage({
      table,
      id: entity?.id,
      imageUrl: getEntityImageUrl(entity),
      ignoredUrls: placeholderImage ? [placeholderImage] : [],
    });
  }

  return {
    insert,
    update,
    upsert,
    remove,
    removeWithImage,
    getEntityImageUrl,
  };
}
