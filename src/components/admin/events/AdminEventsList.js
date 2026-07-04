"use client";

import { useMemo, useState } from "react";
import EventCard from "./components/EventCard";
import EventFilters from "./components/EventFilters";

function getEventStatus(item) {
  const now = new Date();

  if (!item.is_published) {
    return "entwurf";
  }

  if (item.starts_at && new Date(item.starts_at) > now) {
    return "geplant";
  }

  return "veroeffentlicht";
}

export default function AdminEventsList({ events = [] }) {
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      const status = getEventStatus(item);
      const matchesFilter = filter === "alle" || filter === status;

      const searchText =
        `${item.title_de || ""} ${item.teaser_de || ""} ${item.description_de || ""} ${item.event_type || ""} ${item.location_name || ""} ${item.location_city || ""}`.toLowerCase();
      const matchesSearch = searchText.includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [events, filter, search]);

  return (
    <>
      <EventFilters
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
      />

      {filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 py-16 text-center text-white/55">
          Keine passenden Termine gefunden.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredEvents.map((item) => (
            <EventCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
