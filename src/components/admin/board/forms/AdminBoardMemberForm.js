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
import {
  BOARD_RESPONSIBILITY_LIMIT,
  BOARD_RESPONSIBILITY_MAX_LENGTH,
  findBoardResponsibilities,
} from "@/components/admin/board/boardResponsibilities.core.mjs";

export default function AdminBoardMemberForm({ member, roles = [], departments = [], responsibilityConfigurations = [], canManageResponsibilities = true, canManageOrganizationScope = false, canManageStructuralFields = true, canManageUnassigned = false, initialMedia = null, returnPath = "/admin/department", departmentSlug = null, organizationScope = null, departmentLabel = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(initialMedia);
  const initialTarget = {
    organization_scope: member?.organization_scope || (member?.department_id ? "department" : "unassigned"),
    department_id: member?.department_id || null,
    role_id: member?.role_id || "",
  };
  const [form, setForm] = useState({
    organization_scope: member?.organization_scope || (member?.department_id ? "department" : "unassigned"),
    department_id: member?.department_id || null,
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
    ...(canManageResponsibilities ? { responsibilities: findBoardResponsibilities(responsibilityConfigurations, initialTarget) } : {}),
  });

  function responsibilitiesFor(target) {
    return findBoardResponsibilities(responsibilityConfigurations, target);
  }

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
      ...(canManageResponsibilities ? { responsibilities: responsibilitiesFor({ ...current, role_id: roleId }) } : {}),
    }));
  }

  function updateOrganizationScope(scope) {
    setForm((current) => ({
      ...current,
      organization_scope: scope,
      department_id: scope === "department" ? current.department_id : null,
      ...(canManageResponsibilities ? { responsibilities: responsibilitiesFor({ ...current, organization_scope: scope, department_id: scope === "department" ? current.department_id : null }) } : {}),
    }));
  }

  function updateDepartment(departmentId) {
    setForm((current) => ({
      ...current,
      department_id: departmentId,
      ...(canManageResponsibilities ? { responsibilities: responsibilitiesFor({ ...current, department_id: departmentId }) } : {}),
    }));
  }

  function updateResponsibility(index, value) {
    setForm((current) => ({
      ...current,
      responsibilities: current.responsibilities.map((item, itemIndex) => itemIndex === index ? value : item),
    }));
  }

  function addResponsibility() {
    setForm((current) => current.responsibilities.length >= BOARD_RESPONSIBILITY_LIMIT
      ? current
      : { ...current, responsibilities: [...current.responsibilities, ""] });
  }

  function removeResponsibility(index) {
    setForm((current) => ({
      ...current,
      responsibilities: current.responsibilities.filter((_, itemIndex) => itemIndex !== index),
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
      { departmentSlug, organizationScope },
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

    router.push(returnPath);
    router.refresh();
  }

  return (
    <form id="board-member-editor" onSubmit={handleSubmit} className="space-y-6">
      <FormSection eyebrow="Vorstand" title="Personendaten">
        {departmentSlug || organizationScope === "club" ? <p className="mb-4 text-sm text-white/65">Bereich: <span className="font-bold text-white">{departmentLabel || departmentSlug}</span></p> : null}
        {canManageOrganizationScope ? (
          <FormGrid>
            <SelectField label="Organisationsbereich" required value={form.organization_scope} onChange={(event) => updateOrganizationScope(event.target.value)}>
              {canManageUnassigned ? <option value="unassigned">Nicht zugeordnet</option> : null}
              <option value="club">Gesamtverein</option>
              <option value="department">Abteilung</option>
            </SelectField>
            {form.organization_scope === "department" ? (
              <SelectField label="Abteilung" required value={form.department_id || ""} onChange={(event) => updateDepartment(event.target.value || null)}>
                <option value="">Abteilung auswählen</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name_de}</option>)}
              </SelectField>
            ) : null}
          </FormGrid>
        ) : null}
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
          {canManageStructuralFields ? <SelectField label="Funktion" required value={form.role_id} onChange={(event) => updateRole(event.target.value)}><option value="">Funktion auswählen</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name_de}</option>)}</SelectField> : null}
        </FormGrid>
      </FormSection>
      {canManageResponsibilities && form.organization_scope !== "unassigned" ? (
        <FormSection eyebrow="Funktion" title={"Aufgaben / Zust\u00e4ndigkeiten"}>
          <p className="mb-4 text-sm text-white/65">Diese Aufgaben gelten f&uuml;r die gew&auml;hlte Funktion in diesem Organisationsbereich, unabh&auml;ngig von der eingetragenen Person.</p>
          <div className="space-y-3">
            {form.responsibilities.map((responsibility, index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="sr-only" htmlFor={`board-responsibility-${index}`}>Aufgabe {index + 1}</label>
                <input
                  id={`board-responsibility-${index}`}
                  type="text"
                  maxLength={BOARD_RESPONSIBILITY_MAX_LENGTH}
                  value={responsibility}
                  onChange={(event) => updateResponsibility(index, event.target.value)}
                  placeholder={`Aufgabe ${index + 1}`}
                  className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                />
                <button type="button" onClick={() => removeResponsibility(index)} className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white/75 transition hover:border-red-400/60 hover:text-white" aria-label={`Aufgabe ${index + 1} entfernen`}>Entfernen</button>
              </div>
            ))}
            {form.responsibilities.length === 0 ? <p className="text-sm text-white/50">Noch keine Aufgaben hinterlegt.</p> : null}
            <button type="button" onClick={addResponsibility} disabled={form.responsibilities.length >= BOARD_RESPONSIBILITY_LIMIT} className="rounded-lg border border-red-400/40 px-4 py-2 text-sm font-bold text-red-200 transition hover:border-red-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">+ Aufgabe hinzuf&uuml;gen</button>
          </div>
        </FormSection>
      ) : null}
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
      {canManageStructuralFields ? <FormSection eyebrow="Einstellungen" title="Status und Sortierung">
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
      </FormSection> : null}
      <AdminSaveBar
        loading={loading}
        submitLabel="Vorstandsmitglied speichern"
        cancelHref={returnPath}
      />
    </form>
  );
}
