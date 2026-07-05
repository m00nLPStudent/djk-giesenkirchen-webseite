import { FormGrid, FormSection, InputField } from "@/components/admin/forms";
import AdminSaveBar from "@/components/admin/common/AdminSaveBar";

export default function ClubSettingsPanel({
  clubForm,
  clubLoading,
  onSubmit,
  onFieldChange,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormSection
        eyebrow="Einstellungen"
        title="Vereinsdaten"
        description="Allgemeine Stammdaten des Vereins für Website, Footer und rechtliche Angaben."
      >
        <FormGrid>
          <InputField
            label="Vereinsname"
            required
            value={clubForm.club_name}
            onChange={(event) => onFieldChange("club_name", event.target.value)}
          />
          <InputField
            label="Kurzname"
            value={clubForm.short_name}
            onChange={(event) =>
              onFieldChange("short_name", event.target.value)
            }
          />
        </FormGrid>

        <div className="mt-5">
          <FormGrid columns={3}>
            <InputField
              label="Straße"
              value={clubForm.street}
              onChange={(event) => onFieldChange("street", event.target.value)}
            />
            <InputField
              label="Hausnummer"
              value={clubForm.house_number}
              onChange={(event) =>
                onFieldChange("house_number", event.target.value)
              }
            />
            <InputField
              label="PLZ"
              value={clubForm.postal_code}
              onChange={(event) =>
                onFieldChange("postal_code", event.target.value)
              }
            />
          </FormGrid>
        </div>

        <div className="mt-5">
          <FormGrid>
            <InputField
              label="Ort"
              value={clubForm.city}
              onChange={(event) => onFieldChange("city", event.target.value)}
            />
            <InputField
              label="Telefon"
              value={clubForm.phone}
              onChange={(event) => onFieldChange("phone", event.target.value)}
            />
            <InputField
              label="E-Mail"
              type="email"
              value={clubForm.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
            />
            <InputField
              label="Website"
              value={clubForm.website_url}
              onChange={(event) =>
                onFieldChange("website_url", event.target.value)
              }
            />
          </FormGrid>
        </div>

        <div className="mt-5">
          <FormGrid>
            <InputField
              label="Vereinsregister"
              value={clubForm.registry_info}
              onChange={(event) =>
                onFieldChange("registry_info", event.target.value)
              }
            />
            <InputField
              label="Copyright"
              value={clubForm.copyright_text}
              onChange={(event) =>
                onFieldChange("copyright_text", event.target.value)
              }
            />
            <InputField
              label="Google Maps URL"
              value={clubForm.google_maps_url}
              onChange={(event) =>
                onFieldChange("google_maps_url", event.target.value)
              }
            />
          </FormGrid>
        </div>
      </FormSection>

      <FormSection
        eyebrow="Farben"
        title="Vereinsfarben"
        description="Diese Felder speichern die Farben strukturiert im Datenfeld club_colors."
      >
        <FormGrid columns={3}>
          <InputField
            label="Primärfarbe"
            placeholder="#c4001a"
            value={clubForm.color_primary}
            onChange={(event) =>
              onFieldChange("color_primary", event.target.value)
            }
          />
          <InputField
            label="Sekundärfarbe"
            placeholder="#ffffff"
            value={clubForm.color_secondary}
            onChange={(event) =>
              onFieldChange("color_secondary", event.target.value)
            }
          />
          <InputField
            label="Akzentfarbe"
            placeholder="#101014"
            value={clubForm.color_accent}
            onChange={(event) =>
              onFieldChange("color_accent", event.target.value)
            }
          />
        </FormGrid>
      </FormSection>

      <FormSection
        eyebrow="Social"
        title="Social Links"
        description="Einfache Plattform-Links für die spätere Nutzung in Footer oder Kontaktbereich."
      >
        <FormGrid>
          <InputField
            label="Facebook"
            value={clubForm.social_facebook}
            onChange={(event) =>
              onFieldChange("social_facebook", event.target.value)
            }
          />
          <InputField
            label="Instagram"
            value={clubForm.social_instagram}
            onChange={(event) =>
              onFieldChange("social_instagram", event.target.value)
            }
          />
          <InputField
            label="YouTube"
            value={clubForm.social_youtube}
            onChange={(event) =>
              onFieldChange("social_youtube", event.target.value)
            }
          />
          <InputField
            label="TikTok"
            value={clubForm.social_tiktok}
            onChange={(event) =>
              onFieldChange("social_tiktok", event.target.value)
            }
          />
          <InputField
            label="LinkedIn"
            value={clubForm.social_linkedin}
            onChange={(event) =>
              onFieldChange("social_linkedin", event.target.value)
            }
          />
          <InputField
            label="X / Twitter"
            value={clubForm.social_x}
            onChange={(event) => onFieldChange("social_x", event.target.value)}
          />
        </FormGrid>
      </FormSection>

      <AdminSaveBar
        loading={clubLoading}
        submitLabel="Vereinsdaten speichern"
        loadingLabel="Speichert Vereinsdaten..."
      />
    </form>
  );
}
