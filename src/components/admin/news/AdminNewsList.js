"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteNewsButton from "@/components/admin/ui/DeleteNewsButton";

function getNewsStatus(item) {
  const now = new Date();

  if (item.published_at && new Date(item.published_at) > now) {
    return "geplant";
  }

  if (!item.is_published) {
    return "entwurf";
  }

  return "veroeffentlicht";
}

export default function AdminNewsList({ news }) {
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const filteredNews = news?.filter((item) => {
    const status = getNewsStatus(item);

    const matchesFilter = filter === "alle" || filter === status;

    const searchText =
      `${item.title_de} ${item.teaser_de} ${item.category} ${item.author}`.toLowerCase();
    const matchesSearch = searchText.includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          {[
            ["alle", "Alle"],
            ["veroeffentlicht", "Veröffentlicht"],
            ["geplant", "Geplant"],
            ["entwurf", "Entwürfe"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                filter === value
                  ? "bg-red-600 text-white"
                  : "border border-white/10 text-white/60 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="News suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white lg:w-80"
        />
      </div>

      <div className="mt-8 space-y-5">
        {filteredNews?.map((item) => {
          const status = getNewsStatus(item);

          return (
            <div
              key={item.id}
              className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[180px_1fr]"
            >
              <div className="flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-white/5 p-4">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title_de}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-white/40">Kein Bild</span>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                    {item.category || "Allgemein"}
                  </span>

                  {status === "geplant" && (
                    <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                      Geplant
                    </span>
                  )}

                  {status === "entwurf" && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                      Entwurf
                    </span>
                  )}

                  {status === "veroeffentlicht" && (
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-green-400">
                      Veröffentlicht
                    </span>
                  )}

                  <span className="text-sm text-white/40">
                    {item.published_at
                      ? new Date(item.published_at).toLocaleString("de-DE")
                      : "Kein Veröffentlichungsdatum"}
                  </span>

                  <span className="text-sm text-white/40">{item.author}</span>
                </div>

                <h2 className="mt-4 text-2xl font-black">{item.title_de}</h2>

                <p className="mt-3 max-w-3xl text-white/60">{item.teaser_de}</p>

                <div className="mt-5 flex gap-3">
                  <Link
                    href={`/admin/news/edit/${item.id}`}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70"
                  >
                    Bearbeiten
                  </Link>

                  <DeleteNewsButton id={item.id} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
