import { InputField } from "@/components/admin/forms";
import Can from "@/components/admin/auth/Can";
import { AdminActionBar, AdminButton, AdminDetailHeader, AdminDetailLayout, AdminInformationRow, AdminInformationSection } from "@/components/admin/design-system";

const fieldClass = "h-11";

function Field({ label, field, form, onChange, type = "text", required = false, placeholder }) {
  return <InputField label={label} type={type} required={required} placeholder={placeholder} value={form[field]} onChange={(event) => onChange(field, event.target.value)} className={fieldClass} />;
}

function Fields({ children }) {
  return <div className="grid gap-4 xl:grid-cols-2">{children}</div>;
}

function ColorField({ label, field, form, onChange, placeholder }) {
  const value = form[field];
  return <div className="flex items-end gap-3"><span aria-hidden="true" style={{ backgroundColor: value || "transparent" }} className="mb-0.5 h-10 w-10 shrink-0 rounded-xl border border-white/15 bg-[linear-gradient(135deg,#fff_0_45%,#ddd_45%_55%,#fff_55%)]" /><div className="min-w-0 flex-1"><Field label={label} field={field} form={form} onChange={onChange} placeholder={placeholder} /></div></div>;
}

export default function ClubSettingsPanel({ clubForm, clubLoading, onSubmit, onFieldChange }) {
  return <form onSubmit={onSubmit}>
    <AdminDetailLayout header={<AdminDetailHeader eyebrow="Einstellungen" title="Vereinsdaten" meta="Stammdaten, Erscheinungsbild und Verlinkungen des Vereins." />}>
      <AdminInformationSection title="Allgemeine Vereinsdaten"><AdminInformationRow label="Stammdaten"><Fields><Field label="Vereinsname" field="club_name" form={clubForm} onChange={onFieldChange} required /><Field label="Kurzname" field="short_name" form={clubForm} onChange={onFieldChange} /></Fields></AdminInformationRow><AdminInformationRow label="Anschrift"><Fields><Field label="Straße" field="street" form={clubForm} onChange={onFieldChange} /><Field label="Hausnummer" field="house_number" form={clubForm} onChange={onFieldChange} /><Field label="PLZ" field="postal_code" form={clubForm} onChange={onFieldChange} /><Field label="Ort" field="city" form={clubForm} onChange={onFieldChange} /></Fields></AdminInformationRow><AdminInformationRow label="Kontakt"><Fields><Field label="Telefon" field="phone" form={clubForm} onChange={onFieldChange} /><Field label="E-Mail" field="email" form={clubForm} onChange={onFieldChange} type="email" /></Fields></AdminInformationRow><AdminInformationRow label="Rechtliches"><Fields><Field label="Vereinsregister" field="registry_info" form={clubForm} onChange={onFieldChange} /><Field label="Copyright" field="copyright_text" form={clubForm} onChange={onFieldChange} /><Field label="Google Maps URL" field="google_maps_url" form={clubForm} onChange={onFieldChange} /></Fields></AdminInformationRow></AdminInformationSection>
      <AdminInformationSection title="Vereinsfarben"><AdminInformationRow label="Farben"><div className="grid gap-4 xl:grid-cols-3"><ColorField label="Primärfarbe" field="color_primary" form={clubForm} onChange={onFieldChange} placeholder="#c4001a" /><ColorField label="Sekundärfarbe" field="color_secondary" form={clubForm} onChange={onFieldChange} placeholder="#ffffff" /><ColorField label="Akzentfarbe" field="color_accent" form={clubForm} onChange={onFieldChange} placeholder="#101014" /></div></AdminInformationRow></AdminInformationSection>
      <AdminInformationSection title="Social Media und Website"><AdminInformationRow label="Verlinkungen"><Fields><Field label="Website" field="website_url" form={clubForm} onChange={onFieldChange} /><Field label="Facebook" field="social_facebook" form={clubForm} onChange={onFieldChange} /><Field label="Instagram" field="social_instagram" form={clubForm} onChange={onFieldChange} /><Field label="YouTube" field="social_youtube" form={clubForm} onChange={onFieldChange} /><Field label="TikTok" field="social_tiktok" form={clubForm} onChange={onFieldChange} /><Field label="LinkedIn" field="social_linkedin" form={clubForm} onChange={onFieldChange} /><Field label="X / Twitter" field="social_x" form={clubForm} onChange={onFieldChange} /></Fields></AdminInformationRow></AdminInformationSection>
      <Can permission="settings.edit" uiOnly><AdminActionBar className="justify-end"><AdminButton type="submit" variant="primary" disabled={clubLoading}>{clubLoading ? "Speichert Vereinsdaten..." : "Vereinsdaten speichern"}</AdminButton></AdminActionBar></Can>
    </AdminDetailLayout>
  </form>;
}
