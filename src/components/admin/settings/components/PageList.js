import { FormSection } from "@/components/admin/forms";
import EntityBadge, {
  EntityStatusBadge,
} from "@/components/admin/ui/EntityBadge";
import SettingsSelectionList from "./SettingsSelectionList";

export default function PageList({ pages, selectedPageId, onSelectPage }) {
  return (
    <FormSection
      eyebrow="Seiten"
      title="Statische Seiten"
      description="Impressum, Datenschutz und weitere CMS-Seiten verwalten."
    >
      <SettingsSelectionList
        items={pages}
        emptyText="Noch keine Seiten angelegt."
        renderItem={(page) => {
          const active = selectedPageId === page.id;
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page)}
              className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-red-500/70 bg-red-600/10" : "border-white/10 bg-black/20 hover:border-red-500/40"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <EntityStatusBadge
                  active={page.is_published}
                  activeLabel="Veröffentlicht"
                  inactiveLabel="Entwurf"
                />
                <EntityBadge variant={page.show_in_footer ? "blue" : "neutral"}>
                  {page.show_in_footer ? "Im Footer" : "Nicht im Footer"}
                </EntityBadge>
              </div>
              <p className="mt-3 text-lg font-black">
                {page.title_de || page.slug}
              </p>
              <p className="mt-1 text-sm text-white/60">/{page.slug}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">
                Sortierung {page.sort_order || 0}
              </p>
            </button>
          );
        }}
      />
    </FormSection>
  );
}
