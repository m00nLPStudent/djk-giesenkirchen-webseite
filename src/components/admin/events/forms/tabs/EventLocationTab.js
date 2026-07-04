import { FormGrid, FormSection, InputField } from "@/components/admin/forms";

export default function EventLocationTab({ form, updateField }) {
  return (
    <FormSection
      eyebrow="Ort"
      title="Veranstaltungsort"
      description="Pflege Ort und optionale externe URL für weitere Informationen."
    >
      <FormGrid>
        <InputField
          label="Ort"
          value={form.location_name}
          onChange={(eventValue) =>
            updateField("location_name", eventValue.target.value)
          }
        />
        <InputField
          label="Stadt"
          value={form.location_city}
          onChange={(eventValue) =>
            updateField("location_city", eventValue.target.value)
          }
        />
      </FormGrid>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <InputField
          label="Adresse"
          value={form.location_address}
          onChange={(eventValue) =>
            updateField("location_address", eventValue.target.value)
          }
        />
        <InputField
          label="Externer Link"
          placeholder="https://..."
          value={form.external_url}
          onChange={(eventValue) =>
            updateField("external_url", eventValue.target.value)
          }
        />
      </div>
    </FormSection>
  );
}
