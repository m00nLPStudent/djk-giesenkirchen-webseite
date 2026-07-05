import {
  FormGrid,
  FormSection,
  InputField,
  SelectField,
} from "@/components/admin/forms";
import { AdminImageUpload } from "@/components/admin/media";

export default function ContactForm({
  selectedContact,
  contactForm,
  contactLoading,
  roleTemplates,
  contactCategoryOptions,
  placeholderUrl,
  onSubmit,
  onFieldChange,
  onRoleTemplateChange,
  onUploadImage,
  onRemoveImage,
  onReset,
  onDelete,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormSection
        eyebrow="Kontakt"
        title={selectedContact ? "Kontakt bearbeiten" : "Neuer Kontakt"}
        description="Allgemeine Ansprechpartner wie Jugendschutz, Platzwart, Webmaster oder Presse."
      >
        <FormGrid>
          <SelectField
            label="Kategorie"
            required
            value={contactForm.category}
            onChange={(event) => onFieldChange("category", event.target.value)}
          >
            {contactCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Rollen-Vorlage"
            required
            value={contactForm.role_template}
            onChange={(event) => onRoleTemplateChange(event.target.value)}
          >
            {roleTemplates.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value === "sonstiges" ? "Sonstiges" : option.role_de}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Rolle (DE)"
            required
            value={contactForm.role_de}
            onChange={(event) => onFieldChange("role_de", event.target.value)}
          />
          <InputField
            label="Rolle (EN)"
            value={contactForm.role_en}
            onChange={(event) => onFieldChange("role_en", event.target.value)}
          />
          <InputField
            label="Name"
            required
            value={contactForm.contact_name}
            onChange={(event) =>
              onFieldChange("contact_name", event.target.value)
            }
          />
          <InputField
            label="E-Mail"
            type="email"
            value={contactForm.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
          />
          <InputField
            label="Telefon"
            value={contactForm.phone}
            onChange={(event) => onFieldChange("phone", event.target.value)}
          />
          <InputField
            label="Sortierung"
            type="number"
            value={contactForm.sort_order}
            onChange={(event) =>
              onFieldChange("sort_order", Number(event.target.value || 0))
            }
          />
        </FormGrid>

        {contactForm.role_template === "sonstiges" && (
          <p className="mt-4 text-sm text-white/55">
            Für Sonstiges kannst du die Rolle frei über die Felder Rolle (DE/EN)
            definieren.
          </p>
        )}

        <div className="mt-5">
          <AdminImageUpload
            imageUrl={contactForm.image_url}
            placeholderUrl={placeholderUrl}
            alt="Kontaktbild"
            description="Kontaktbild für die interne Verwaltung und spätere öffentliche Kontaktdarstellung."
            uploadLabel="Bild auswählen"
            removeLabel="Bild entfernen"
            onUpload={onUploadImage}
            onRemove={onRemoveImage}
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
            <input
              type="checkbox"
              checked={contactForm.is_public}
              onChange={(event) =>
                onFieldChange("is_public", event.target.checked)
              }
            />
            Öffentlich anzeigen
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
            <input
              type="checkbox"
              checked={contactForm.is_active}
              onChange={(event) =>
                onFieldChange("is_active", event.target.checked)
              }
            />
            Aktiv
          </label>
        </div>
      </FormSection>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-white/10 px-6 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
        >
          Neuer Kontakt
        </button>
        {selectedContact && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full border border-red-500/60 px-6 py-3 text-sm font-bold text-red-300 transition hover:bg-red-600 hover:text-white"
          >
            Kontakt löschen
          </button>
        )}
        <button
          type="submit"
          disabled={contactLoading}
          className="rounded-full bg-red-600 px-8 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {contactLoading ? "Speichert..." : "Kontakt speichern"}
        </button>
      </div>
    </form>
  );
}
