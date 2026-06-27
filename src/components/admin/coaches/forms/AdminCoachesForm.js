"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import CoachImageUpload from "../components/CoachImageUpload";
import {
  deleteCoachImage,
  uploadCoachImage,
  saveCoach,
} from "../services/coaches.service";
import {
  createCoachPayload,
  createInitialCoachForm,
  validateCoachForm,
} from "./coachForm.helpers";
import CoachBasicFields from "./fields/CoachBasicFields";
import CoachContactFields from "./fields/CoachContactFields";
import CoachProfileFields from "./fields/CoachProfileFields";
import CoachRoleFields from "./fields/CoachRoleFields";
import CoachSettingsFields from "./fields/CoachSettingsFields";

export default function AdminCoachesForm({ coach, teams = [] }) {
  const router = useRouter();
  const [form, setForm] = useState(() => createInitialCoachForm(coach));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: null }));
    }
  }

  async function uploadImage(file) {
    const fullName = `${form.first_name} ${form.last_name}`.trim();

    const { data, error } = await uploadCoachImage(file, {
      id: coach?.id,
      name: fullName,
      image_url: form.image_url,
    });

    if (error) {
      alert(error.message);
      return;
    }

    updateField("image_url", data);
  }

  async function removeImage() {
    const { error } = await deleteCoachImage(form.image_url);

    if (error) {
      alert(error.message);
      return;
    }

    updateField("image_url", COACH_PLACEHOLDER_IMAGE);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateCoachForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    const { error } = await saveCoach(createCoachPayload(form), coach?.id ?? null);

    setLoading(false);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    router.push("/admin/coaches");
    router.refresh();
  }

  const hasErrors = Object.keys(errors).some((key) => errors[key]);

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
      {hasErrors && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
          <p className="font-bold">Bitte fülle alle Pflichtfelder aus.</p>
        </div>
      )}

      <CoachBasicFields form={form} errors={errors} updateField={updateField} />
      <CoachRoleFields form={form} errors={errors} teams={teams} updateField={updateField} />
      <CoachContactFields form={form} errors={errors} updateField={updateField} />
      <CoachProfileFields form={form} errors={errors} updateField={updateField} />

      <CoachImageUpload
        imageUrl={form.image_url || COACH_PLACEHOLDER_IMAGE}
        placeholderUrl={COACH_PLACEHOLDER_IMAGE}
        onUpload={uploadImage}
        onRemove={removeImage}
      />

      <CoachSettingsFields form={form} updateField={updateField} />

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-red-600 px-8 py-4 font-bold disabled:opacity-50"
      >
        {loading ? "Speichert..." : "Trainer speichern"}
      </button>
    </form>
  );
}
