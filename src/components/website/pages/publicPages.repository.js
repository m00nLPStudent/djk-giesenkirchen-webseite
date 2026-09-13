import "server-only";
import { supabase } from "@/lib/supabase";
import {
  normalizePublicPageSlug,
  selectPublicFooterPages,
} from "./publicPages.helpers";

export async function loadPublishedPublicPage(slug) {
  const safeSlug = normalizePublicPageSlug(slug);
  if (!safeSlug) return null;

  const { data, error } = await supabase
    .from("pages")
    .select("slug, title_de, title_en, content_de, content_en")
    .eq("slug", safeSlug)
    .eq("is_published", true)
    .maybeSingle();

  return error ? null : data;
}

export async function loadPublicFooterPages() {
  const { data, error } = await supabase
    .from("pages")
    .select("slug, title_de, title_en, is_published, show_in_footer, sort_order")
    .eq("is_published", true)
    .eq("show_in_footer", true)
    .order("sort_order", { ascending: true })
    .order("title_de", { ascending: true })
    .order("slug", { ascending: true });

  return error ? [] : selectPublicFooterPages(data || []);
}
