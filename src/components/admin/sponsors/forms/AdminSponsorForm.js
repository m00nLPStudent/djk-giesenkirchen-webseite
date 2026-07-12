"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { revalidatePublicContentAction } from "@/app/admin/actions/publicContentRevalidation";
import AdminSaveBar from "@/components/admin/common/AdminSaveBar";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";
import {
  ActiveStatusField,
  FormGrid,
  FormSection,
  InputField,
  SelectField,
  SortOrderField,
  TextareaField,
} from "@/components/admin/forms";
import SponsorImageUpload from "../components/SponsorImageUpload";
import { saveSponsor, uploadSponsorImage } from "../services/sponsors.service";

export default function AdminSponsorForm({ sponsor, categories = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category_id: sponsor?.category_id || "",
    name: sponsor?.name || "",
    description_de: sponsor?.description_de || "",
    description_en: sponsor?.description_en || "",
    image_url: sponsor?.image_url || "",
    website_url: sponsor?.website_url || "",
    facebook_url: sponsor?.facebook_url || "",
    instagram_url: sponsor?.instagram_url || "",
    tiktok_url: sponsor?.tiktok_url || "",
    is_active: sponsor?.is_active ?? true,
    sort_order: sponsor?.sort_order ?? 0,
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadImage(file) {
    const { data, error } = await uploadSponsorImage(file, {
      ...form,
      id: sponsor?.id,
    });
    if (error) {
      alert(error.message);
      return;
    }
    updateField("image_url", data);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    logAdminSaveEvent({
      module: "sponsors",
      mode: sponsor?.id ? "edit" : "create",
      step: "form.submit-triggered",
      success: true,
    });
    setLoading(true);
    const { error } = await saveSponsor(form, sponsor?.id || null);
    setLoading(false);

    if (error) {
      logAdminSaveEvent({
        module: "sponsors",
        mode: sponsor?.id ? "edit" : "create",
        step: "form.submit-failed",
        success: false,
        error,
        navigationTriggered: false,
      });
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    logAdminSaveEvent({
      module: "sponsors",
      mode: sponsor?.id ? "edit" : "create",
      step: "form.submit-success",
      success: true,
      navigationTriggered: true,
    });

    await revalidatePublicContentAction("sponsors");

    router.push("/admin/sponsors");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <FormSection eyebrow="Sponsor" title="Grunddaten">
        <FormGrid>
          <InputField
            label="Name"
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
          <SelectField
            label="Kategorie"
            required
            value={form.category_id}
            onChange={(event) => updateField("category_id", event.target.value)}
          >
            <option value="">Kategorie auswählen</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_de}
              </option>
            ))}
          </SelectField>
        </FormGrid>
      </FormSection>

      <FormSection eyebrow="Beschreibung" title="Sponsorentext">
        <FormGrid>
          <TextareaField
            label="Text Deutsch"
            rows={5}
            value={form.description_de}
            onChange={(event) =>
              updateField("description_de", event.target.value)
            }
          />
          <TextareaField
            label="Text Englisch"
            rows={5}
            value={form.description_en}
            onChange={(event) =>
              updateField("description_en", event.target.value)
            }
          />
        </FormGrid>
      </FormSection>

      <FormSection eyebrow="Banner" title="Bild / Banner">
        <SponsorImageUpload
          imageUrl={form.image_url}
          onUpload={uploadImage}
          onRemove={() => updateField("image_url", "")}
        />
      </FormSection>

      <FormSection eyebrow="Links" title="Webseite und Social Media">
        <FormGrid>
          <InputField
            label="Webseite"
            placeholder="https://..."
            value={form.website_url}
            onChange={(event) => updateField("website_url", event.target.value)}
          />
          <InputField
            label="Facebook"
            placeholder="https://facebook.com/..."
            value={form.facebook_url}
            onChange={(event) =>
              updateField("facebook_url", event.target.value)
            }
          />
          <InputField
            label="Instagram"
            placeholder="https://instagram.com/..."
            value={form.instagram_url}
            onChange={(event) =>
              updateField("instagram_url", event.target.value)
            }
          />
          <InputField
            label="TikTok"
            placeholder="https://tiktok.com/@..."
            value={form.tiktok_url}
            onChange={(event) => updateField("tiktok_url", event.target.value)}
          />
        </FormGrid>
      </FormSection>

      <FormSection eyebrow="Einstellungen" title="Status und Sortierung">
        <FormGrid>
          <SortOrderField
            value={form.sort_order}
            onChange={(value) => updateField("sort_order", value)}
          />
          <ActiveStatusField
            checked={form.is_active}
            onChange={(value) => updateField("is_active", value)}
            entityLabel="Sponsor"
          />
        </FormGrid>
      </FormSection>

      <AdminSaveBar
        loading={loading}
        submitLabel="Sponsor speichern"
        cancelHref="/admin/sponsors"
      />
    </form>
  );
}
