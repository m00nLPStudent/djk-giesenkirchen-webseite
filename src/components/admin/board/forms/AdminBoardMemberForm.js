"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { revalidatePublicContentAction } from "@/app/admin/actions/publicContentRevalidation";
import { saveBoardMemberWithScopeAction } from "@/app/admin/department/board/actions";
import {
  ActiveStatusField,
  EmailField,
  FormGrid,
  FormSection,
  InputField,
  PhoneField,
  SelectField,
  SortOrderField,
} from "@/components/admin/forms";
import AdminSaveBar from "@/components/admin/common/AdminSaveBar";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";
import AdminMediaPicker from "@/components/admin/media-library/AdminMediaPicker";
import { BOARD_PLACEHOLDER_IMAGE } from "../services/board.service";
import { loadBoardMediaPickerAction, uploadBoardMediaAction } from "@/app/admin/department/board/actions";

export default function AdminBoardMemberForm({ member, roles = [], initialMedia = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(initialMedia);
  const [form, setForm] = useState({
    role_id: member?.role_id || "",
    first_name: member?.first_name || "",
    last_name: member?.last_name || "",
    role_de: member?.role_de || "",
    role_en: member?.role_en || "",
    email: member?.email || "",
    phone: member?.phone || "",
    image_url: member?.image_url || BOARD_PLACEHOLDER_IMAGE,
    image_media_asset_id: member?.image_media_asset_id || null,
    is_active: member?.is_active ?? true,
    sort_order: member?.sort_order ?? 0,
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateRole(roleId) {
    const role = roles.find((item) => item.id === roleId);
    setForm((current) => ({
      ...current,
      role_id: roleId,
      role_de: role?.name_de || "",
      role_en: role?.name_en || "",
    }));
  }

  function handleMediaChange(media) {
    setSelectedMedia(media);
    setForm((current) => ({ ...current, image_media_asset_id: media?.id || null }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    logAdminSaveEvent({
      module: "board_members",
      mode: member?.id ? "edit" : "create",
      step: "form.submit-triggered",
      success: true,
    });
    setLoading(true);
    const { error } = await saveBoardMemberWithScopeAction(
      form,
      member?.id || null,
    );
    setLoading(false);

    if (error) {
      logAdminSaveEvent({
        module: "board_members",
        mode: member?.id ? "edit" : "create",
        step: "form.submit-failed",
        success: false,
        error,
        navigationTriggered: false,
      });
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    logAdminSaveEvent({
      module: "board_members",
      mode: member?.id ? "edit" : "create",
      step: "form.submit-success",
      success: true,
      navigationTriggered: true,
    });

    await revalidatePublicContentAction("board");

    router.push("/admin/department");
    router.refresh();
  }

  return (
    <form id="board-member-editor" onSubmit={handleSubmit} className="space-y-6">
      <FormSection eyebrow="Vorstand" title="Personendaten">
        <FormGrid>
          <InputField
            label="Vorname"
            required
            value={form.first_name}
            onChange={(event) => updateField("first_name", event.target.value)}
          />
          <InputField
            label="Nachname"
            required
            value={form.last_name}
            onChange={(event) => updateField("last_name", event.target.value)}
          />
          <SelectField
            label="Funktion"
            required
            value={form.role_id}
            onChange={(event) => updateRole(event.target.value)}
          >
            <option value="">Funktion auswählen</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name_de}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Funktion Englisch"
            value={form.role_en}
            onChange={(event) => updateField("role_en", event.target.value)}
          />
        </FormGrid>
      </FormSection>
      <FormSection eyebrow="Kontakt" title="Kontaktdaten">
        <FormGrid>
          <EmailField
            value={form.email}
            onChange={(value) => updateField("email", value)}
          />
          <PhoneField
            value={form.phone}
            onChange={(value) => updateField("phone", value)}
          />
        </FormGrid>
      </FormSection>
      <FormSection eyebrow="Bild" title="Profilbild">
        <AdminMediaPicker value={selectedMedia} legacyUrl={selectedMedia ? null : form.image_url} placeholderUrl={BOARD_PLACEHOLDER_IMAGE} onChange={handleMediaChange} loadAction={(filters) => loadBoardMediaPickerAction(filters, member?.id || null)} uploadAction={(data) => uploadBoardMediaAction(data, member?.id || null)} usageContext="board_member" entityLabel="Vorstandsbild" />
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
            entityLabel="Vorstandsmitglied"
          />
        </FormGrid>
      </FormSection>
      <AdminSaveBar
        loading={loading}
        submitLabel="Vorstandsmitglied speichern"
        cancelHref="/admin/department"
      />
    </form>
  );
}
