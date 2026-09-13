export function normalizePublicPageSlug(value) {
  const slug = String(value || "").trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

export function getPublicPageHref(page) {
  const slug = normalizePublicPageSlug(page?.slug);
  return slug ? `/${slug}` : null;
}

export function selectPublicFooterPages(pages = []) {
  return pages
    .filter(
      (page) =>
        page?.is_published === true &&
        page?.show_in_footer === true &&
        getPublicPageHref(page),
    )
    .sort((left, right) => {
      const order = Number(left.sort_order || 0) - Number(right.sort_order || 0);
      if (order) return order;

      const title = String(left.title_de || left.title_en || left.slug).localeCompare(
        String(right.title_de || right.title_en || right.slug),
        "de",
      );
      return title || String(left.slug).localeCompare(String(right.slug), "de");
    });
}
