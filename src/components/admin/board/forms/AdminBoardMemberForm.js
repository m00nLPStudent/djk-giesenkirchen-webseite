"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { revalidatePublicContentAction } from "@/app/admin/actions/publicContentRevalidation";
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
import BoardMemberImageUpload from "../components/BoardMemberImageUpload";
import {
  BOARD_PLACEHOLDER_IMAGE,
  saveBoardMember,
  uploadBoardImage,
} from "../services/board.service";

export default function AdminBoardMemberForm({ member, roles = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    role_id: member?.role_id || "",
    first_name: member?.first_name || "",
    last_name: member?.last_name || "",
    role_de: member?.role_de || "",
    role_en: member?.role_en || "",
    email: member?.email || "",
    phone: member?.phone || "",
    image_url: member?.image_url || BOARD_PLACEHOLDER_IMAGE,
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

  async function uploadImage(file) {
    const { data, error } = await uploadBoardImage(file, {
      ...form,
      id: member?.id,
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
      module: "board_members",
      mode: member?.id ? "edit" : "create",
      step: "form.submit-triggered",
      success: true,
    });
    setLoading(true);
    const { error } = await saveBoardMember(form, member?.id || null);
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
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
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
        <BoardMemberImageUpload
          imageUrl={form.image_url}
          onUpload={uploadImage}
          onRemove={() => updateField("image_url", BOARD_PLACEHOLDER_IMAGE)}
        />
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
