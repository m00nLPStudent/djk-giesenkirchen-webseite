"use client";

import { useState } from "react";
import NewsFilters from "./components/NewsFilters";
import NewsCard from "./components/NewsCard";
import NewsEmptyState from "./components/NewsEmptyState";
import NewsStats from "./components/NewsStats";
import NewsStatusBadge from "./components/NewsStatusBadge";
import Can from "@/components/admin/auth/Can";
import { getNewsCategoryDisplay } from "@/components/website/news/NewsCard";
import { AdminButton, AdminListChevron, AdminListHeader, AdminListRow, AdminModuleCards, AdminModuleHeader, AdminModuleList, AdminModulePage, AdminModuleSearch } from "@/components/admin/design-system";

const TEMPLATE = "minmax(14rem,1.5fr) minmax(8rem,0.8fr) 8rem minmax(8rem,0.8fr) minmax(10rem,0.9fr) 3rem";
const formatDate = (value) => value ? new Date(value).toLocaleString("de-DE") : "–";

function getNewsStatus(item) {
  const now = new Date();

  if (!item.is_published) {
    return "entwurf";
  }

  if (item.published_at && new Date(item.published_at) > now) {
    return "geplant";
  }

  return "veroeffentlicht";
}

function DesktopRow({ item, href = null }) {
  return <AdminListRow href={href} label={href ? `News ${item.title_de} bearbeiten` : undefined} template={TEMPLATE}><span className="truncate font-black text-white">{item.title_de}</span><span className="truncate text-white/65">{getNewsCategoryDisplay(item)}</span><NewsStatusBadge isPublished={item.is_published} publishedAt={item.published_at} /><span className="truncate text-white/65">{item.author || "Autor nicht hinterlegt"}</span><span className="text-white/65">{formatDate(item.published_at)}</span>{href ? <AdminListChevron label={`News ${item.title_de} bearbeiten`} /> : <span />}</AdminListRow>;
}

export default function AdminNewsList({ news = [], total = 0, published = 0, planned = 0, drafts = 0 }) {
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const filteredNews = news.filter((item) => {
    const status = getNewsStatus(item);

    const matchesFilter = filter === "alle" || filter === status;

    const searchText =
      `${item.title_de} ${item.teaser_de} ${item.category} ${item.author}`.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <AdminModulePage>
      <AdminModuleHeader eyebrow="News" title="News verwalten" description="News erstellen, bearbeiten und veröffentlichen." actions={<Can permission="news.create" uiOnly><AdminButton href="/admin/news/new" variant="primary">+ Neue News</AdminButton></Can>}><AdminModuleSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="News suchen …" label="News durchsuchen" /></AdminModuleHeader>
      <NewsStats total={total} published={published} planned={planned} drafts={drafts} />
      <NewsFilters filter={filter} setFilter={setFilter} />

      {filteredNews.length === 0 ? (
        <NewsEmptyState />
      ) : (
        <AdminModuleList desktopClassName="hidden overflow-hidden xl:block" mobile={<AdminModuleCards className="xl:hidden">{filteredNews.map((item) => <Can key={`${item.id}-mobile`} permission="news.edit" uiOnly fallback={<NewsCard item={item} />}><NewsCard item={item} href={`/admin/news/edit/${item.id}`} /></Can>)}</AdminModuleCards>}><AdminListHeader columns={[{ key: "title", label: "Titel" }, { key: "category", label: "Kategorie" }, { key: "status", label: "Status" }, { key: "author", label: "Autor" }, { key: "date", label: "Veröffentlichungsdatum" }, { key: "details", label: "Übersicht" }]} template={TEMPLATE} />{filteredNews.map((item) => <Can key={item.id} permission="news.edit" uiOnly fallback={<DesktopRow item={item} />}><DesktopRow item={item} href={`/admin/news/edit/${item.id}`} /></Can>)}</AdminModuleList>
      )}
    </AdminModulePage>
  );
}
