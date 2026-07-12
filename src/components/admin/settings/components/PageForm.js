import { FormGrid, FormSection, InputField } from "@/components/admin/forms";
import Can from "@/components/admin/auth/Can";
import AdminRichTextEditor from "@/components/admin/richtext/AdminRichTextEditor";

export default function PageForm({
  selectedPage,
  pageForm,
  pageLoading,
  onSubmit,
  onFieldChange,
  onSlugChange,
  onReset,
  onDelete,
  onAutoSlug,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormSection
        eyebrow="CMS"
        title={selectedPage ? "Seite bearbeiten" : "Neue Seite"}
        description="Titel, Slug, RichText-Inhalte und Sichtbarkeit der statischen Seite."
      >
        <FormGrid>
          <InputField
            label="Slug"
            required
            value={pageForm.slug}
            onChange={(event) => onSlugChange(event.target.value)}
          />
          <InputField
            label="Titel (DE)"
            required
            value={pageForm.title_de}
            onChange={(event) => onFieldChange("title_de", event.target.value)}
            onBlur={onAutoSlug}
          />
          <InputField
            label="Titel (EN)"
            value={pageForm.title_en}
            onChange={(event) => onFieldChange("title_en", event.target.value)}
          />
          <InputField
            label="Sortierung"
            type="number"
            value={pageForm.sort_order}
            onChange={(event) =>
              onFieldChange("sort_order", Number(event.target.value || 0))
            }
          />
        </FormGrid>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <AdminRichTextEditor
            label="Inhalt (DE)"
            value={pageForm.content_de}
            placeholder="Hier den deutschen Seitentext pflegen..."
            onChange={(value) => onFieldChange("content_de", value)}
          />
          <AdminRichTextEditor
            label="Inhalt (EN)"
            value={pageForm.content_en}
            placeholder="Maintain English page content here..."
            onChange={(value) => onFieldChange("content_en", value)}
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
            <input
              type="checkbox"
              checked={pageForm.is_published}
              onChange={(event) =>
                onFieldChange("is_published", event.target.checked)
              }
            />
            Veröffentlicht
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
            <input
              type="checkbox"
              checked={pageForm.show_in_footer}
              onChange={(event) =>
                onFieldChange("show_in_footer", event.target.checked)
              }
            />
            Im Footer anzeigen
          </label>
        </div>
      </FormSection>

      <Can permission="settings.edit" uiOnly>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Neue Seite
          </button>
          {selectedPage && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full border border-red-500/60 px-6 py-3 text-sm font-bold text-red-300 transition hover:bg-red-600 hover:text-white"
            >
              Seite löschen
            </button>
          )}
          <button
            type="submit"
            disabled={pageLoading}
            className="rounded-full bg-red-600 px-8 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {pageLoading ? "Speichert..." : "Seite speichern"}
          </button>
        </div>
      </Can>
    </form>
  );
}
