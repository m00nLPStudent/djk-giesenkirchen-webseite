"use client";

import { useState } from "react";
import NewsFilters from "./components/NewsFilters";
import NewsCard from "./components/NewsCard";
import NewsEmptyState from "./components/NewsEmptyState";

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

export default function AdminNewsList({ news = [] }) {
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
    <>
      <NewsFilters
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
      />

      {filteredNews.length === 0 ? (
        <NewsEmptyState />
      ) : (
        <div className="space-y-5">
          {filteredNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
