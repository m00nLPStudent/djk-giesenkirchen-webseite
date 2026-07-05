"use client";

import { useMemo, useState } from "react";
import { submitMembershipRequest } from "@/lib/membership/membership.service";
import MembershipFootballData from "./components/MembershipFootballData";
import MembershipPersonalData from "./components/MembershipPersonalData";
import MembershipPrivacySection from "./components/MembershipPrivacySection";
import MembershipSuccessCard from "./components/MembershipSuccessCard";

const REQUEST_TYPE_OPTIONS = [
  { value: "aktives-mitglied-fussball", label: "Aktives Mitglied Fußball" },
  { value: "trainer-werden", label: "Trainer werden" },
  { value: "passives-mitglied", label: "Passives Mitglied" },
  { value: "sonstiges", label: "Sonstiges" },
];

function FormField({ label, required = false, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/50">
        {label}
        {required ? <span className="ml-1 text-red-400">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function inputClassName() {
  return "h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none transition focus:border-red-500";
}

function textareaClassName() {
  return "w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none transition focus:border-red-500";
}

function createInitialForm() {
  return {
    first_name: "",
    last_name: "",
    phone: "",
    birthdate: "",
    email: "",
    request_type: "aktives-mitglied-fussball",
    year_group: "",
    desired_team_id: "",
    message: "",
    privacy_accepted: false,
  };
}

function getYearGroupFromBirthdate(value = "") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return String(date.getUTCFullYear());
}

export default function MembershipRequestForm({ teams = [] }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState(createInitialForm());

  const showFootballFields = useMemo(
    () => form.request_type === "aktives-mitglied-fussball",
    [form.request_type],
  );

  const derivedYearGroup = useMemo(
    () => getYearGroupFromBirthdate(form.birthdate),
    [form.birthdate],
  );

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setSuccess(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.email.trim() ||
      !form.birthdate
    ) {
      alert("Bitte Vorname, Nachname, Geburtsdatum und E-Mail ausfüllen.");
      return;
    }

    if (!form.privacy_accepted) {
      alert("Bitte der Datenschutzerklärung zustimmen.");
      return;
    }

    setLoading(true);

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim() || null,
      birthdate: form.birthdate || null,
      email: form.email.trim(),
      request_type: form.request_type,
      year_group: showFootballFields ? derivedYearGroup || null : null,
      desired_team_id: showFootballFields ? form.desired_team_id || null : null,
      message: form.message.trim() || null,
    };

    const { error } = await submitMembershipRequest(payload);

    setLoading(false);

    if (error) {
      alert(error.message || "Die Anfrage konnte nicht gesendet werden.");
      return;
    }

    setForm(createInitialForm());
    setSuccess(true);
  }

  if (success) {
    return <MembershipSuccessCard />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MembershipPersonalData
          form={form}
          requestTypeOptions={REQUEST_TYPE_OPTIONS}
          inputClassName={inputClassName()}
          FormField={FormField}
          onUpdateField={updateField}
        />

        <MembershipFootballData
          showFootballFields={showFootballFields}
          teams={teams}
          form={form}
          derivedYearGroup={derivedYearGroup}
          inputClassName={inputClassName()}
          FormField={FormField}
          onUpdateField={updateField}
        />
      </div>

      <FormField label="Nachricht">
        <textarea
          rows={6}
          className={textareaClassName()}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
        />
      </FormField>

      <MembershipPrivacySection
        accepted={form.privacy_accepted}
        onToggle={(checked) => updateField("privacy_accepted", checked)}
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-red-600 px-8 py-4 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Sendet..." : "Anfrage senden"}
        </button>
      </div>
    </form>
  );
}
