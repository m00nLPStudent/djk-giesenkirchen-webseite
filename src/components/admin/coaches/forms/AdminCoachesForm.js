"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { COUNTRIES } from "@/constants";
import { normalizeGermanPhoneNumber } from "@/lib/phone";
import CoachImageUpload from "../components/CoachImageUpload";
import { createSlug } from "../utils/slug";
import {
  deleteCoachImage,
  uploadCoachImage,
  saveCoach,
} from "../services/coaches.service";
import { coachRoles, coachLicenses } from "../constants/CoachOptions";

const germany = COUNTRIES.find((country) => country.iso === "DE");
const countryOptions = germany
  ? [germany, ...COUNTRIES.filter((country) => country.iso !== "DE")]
  : COUNTRIES;

const requiredFields = {
  first_name: "Vorname",
  last_name: "Nachname",
  nationality: "Nationalität",
  role: "Funktion",
  email: "E-Mail",
  phone: "Telefonnummer",
  whatsapp: "WhatsApp-Nummer",
};

function splitName(name = "") {
  const parts = String(name).trim().split(" ").filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

export default function AdminCoachesForm({ coach, teams = [] }) {
  const router = useRouter();
  const fallbackName = splitName(coach?.name);

  const [form, setForm] = useState({
    first_name: coach?.first_name || fallbackName.firstName,
    last_name: coach?.last_name || fallbackName.lastName,
    name: coach?.name || "",
    slug: coach?.slug || "",
    role: coach?.role || "Trainer",
    email: coach?.email || "",
    phone: coach?.phone || "",
    whatsapp: coach?.whatsapp || "",
    license: coach?.license || "Keine Lizenz",
    team_id: coach?.team_id || "",
    nationality: coach?.nationality || "",
    image_url: coach?.image_url || COACH_PLACEHOLDER_IMAGE,
    sort_order: coach?.sort_order || 0,
    is_active: coach?.is_active ?? true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate(currentForm) {
    const nextErrors = {};

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!String(currentForm[field] || "").trim()) {
        nextErrors[field] = `${label} ist ein Pflichtfeld.`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

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

    if (!validate(form)) {
      return;
    }

    setLoading(true);

    const fullName = `${form.first_name} ${form.last_name}`.trim();
    const slug = form.slug || createSlug(fullName);

    const payload = {
      ...form,
      name: fullName,
      slug,
      phone: normalizeGermanPhoneNumber(form.phone),
      whatsapp: normalizeGermanPhoneNumber(form.whatsapp),
      image_url: form.image_url || COACH_PLACEHOLDER_IMAGE,
      team_id: form.team_id || null,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    const { error } = await saveCoach(payload, coach?.id ?? null);

    setLoading(false);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    router.push("/admin/coaches");
    router.refresh();
  }

  function inputClass(field) {
    return `h-14 w-full rounded-2xl border bg-white/5 px-4 outline-none ${
      errors[field] ? "border-red-500" : "border-white/10 focus:border-red-500"
    }`;
  }

  function selectClass(field) {
    return `h-14 w-full rounded-2xl border bg-[#18181d] px-4 text-white outline-none ${
      errors[field] ? "border-red-500" : "border-white/10 focus:border-red-500"
    }`;
  }

  function ErrorText({ field }) {
    if (!errors[field]) return null;
    return <p className="mt-2 text-sm font-medium text-red-400">{errors[field]}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
      {Object.keys(errors).filter((key) => errors[key]).length > 0 && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
          <p className="font-bold">Bitte fülle alle Pflichtfelder aus.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <input
            placeholder="Vorname *"
            value={form.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
            className={inputClass("first_name")}
          />
          <ErrorText field="first_name" />
        </div>

        <div>
          <input
            placeholder="Nachname *"
            value={form.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
            className={inputClass("last_name")}
          />
          <ErrorText field="last_name" />
        </div>
      </div>

      <input
        placeholder="Slug, z. B. swen-verbocket"
        value={form.slug}
        onChange={(e) => updateField("slug", e.target.value)}
        className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none focus:border-red-500"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <select
            value={form.role}
            onChange={(e) => updateField("role", e.target.value)}
            className={selectClass("role")}
          >
            <option value="">Funktion auswählen *</option>
            {coachRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <ErrorText field="role" />
        </div>

        <select
          value={form.team_id}
          onChange={(e) => updateField("team_id", e.target.value)}
          className="h-14 w-full rounded-2xl border border-white/10 bg-[#18181d] px-4 text-white outline-none focus:border-red-500"
        >
          <option value="">Keine Mannschaft zugeordnet</option>

          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name_de}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <input
            placeholder="E-Mail *"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={inputClass("email")}
          />
          <ErrorText field="email" />
        </div>

        <div>
          <input
            placeholder="Telefonnummer *"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            onBlur={(e) => updateField("phone", normalizeGermanPhoneNumber(e.target.value))}
            className={inputClass("phone")}
          />
          <ErrorText field="phone" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <input
            placeholder="WhatsApp-Nummer *"
            value={form.whatsapp}
            onChange={(e) => updateField("whatsapp", e.target.value)}
            onBlur={(e) => updateField("whatsapp", normalizeGermanPhoneNumber(e.target.value))}
            className={inputClass("whatsapp")}
          />
          <ErrorText field="whatsapp" />
        </div>

        <select
          value={form.license}
          onChange={(e) => updateField("license", e.target.value)}
          className="h-14 w-full rounded-2xl border border-white/10 bg-[#18181d] px-4 text-white outline-none focus:border-red-500"
        >
          {coachLicenses.map((license) => (
            <option key={license} value={license}>
              {license}
            </option>
          ))}
        </select>
      </div>

      <div>
        <select
          value={form.nationality}
          onChange={(e) => updateField("nationality", e.target.value)}
          className={selectClass("nationality")}
        >
          <option value="">Nationalität auswählen *</option>
          {countryOptions.map((country) => (
            <option key={country.iso} value={country.iso}>
              {country.flag} {country.de}
            </option>
          ))}
        </select>
        <ErrorText field="nationality" />
      </div>

      <CoachImageUpload
        imageUrl={form.image_url || COACH_PLACEHOLDER_IMAGE}
        placeholderUrl={COACH_PLACEHOLDER_IMAGE}
        onUpload={uploadImage}
        onRemove={removeImage}
      />

      <div>
        <label className="mb-2 block text-sm font-bold uppercase tracking-[0.25em] text-white/60">
          Reihenfolge
        </label>

        <input
          type="number"
          value={form.sort_order}
          onChange={(e) => updateField("sort_order", e.target.value)}
          className="h-14 w-32 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none focus:border-red-500"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="flex items-center gap-3 text-white">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => updateField("is_active", e.target.checked)}
          />

          <span className="font-medium">Trainer aktiv anzeigen</span>
        </label>
      </div>

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
