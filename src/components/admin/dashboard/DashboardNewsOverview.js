import Link from "next/link";
import DashboardEmptyState from "./DashboardEmptyState";
import AdminPanel from "@/components/admin/common/AdminPanel";
import AdminSectionHeader from "@/components/admin/common/AdminSectionHeader";
import { formatDateTime, getNewsStateLabel } from "./dashboard.helpers";

function NewsList({ title, items, now }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">
        {title}
      </h3>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <DashboardEmptyState
            text={`Keine Eintraege in ${title.toLowerCase()}.`}
          />
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/news/edit/${item.id}`}
              className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-red-500/40"
            >
              <p className="truncate text-base font-black text-white">
                {item.title_de || "Ohne Titel"}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-red-400">
                {getNewsStateLabel(item, now)}
              </p>
              <p className="mt-2 text-sm text-white/60">
                {formatDateTime(item.published_at || item.created_at)}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function DashboardNewsOverview({
  latestNews = [],
  draftOrPlannedNews = [],
  now,
}) {
  return (
    <AdminPanel>
      <AdminSectionHeader
        eyebrow="Inhalte"
        title="News-Uebersicht"
        actionLabel="News-Verwaltung"
        actionHref="/admin/news"
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <NewsList title="Letzte News" items={latestNews} now={now} />
        <NewsList
          title="Entwuerfe/Geplante"
          items={draftOrPlannedNews}
          now={now}
        />
      </div>
    </AdminPanel>
  );
}
