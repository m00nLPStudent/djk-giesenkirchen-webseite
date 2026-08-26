"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { submitMembershipRequestAction } from "@/app/membership/actions";
import MembershipFootballData from "./components/MembershipFootballData";
import MembershipPersonalData from "./components/MembershipPersonalData";
import MembershipPrivacySection from "./components/MembershipPrivacySection";
import MembershipSuccessCard from "./components/MembershipSuccessCard";

const REQUEST_TYPE_OPTIONS = [
  { value: "aktives-mitglied-fussball", label: "Aktives Mitglied Fußball" },
  { value: "aktives-mitglied-tischtennis", label: "Aktives Mitglied Tischtennis" },
  { value: "aktives-mitglied-gymnastik-damen", label: "Aktives Mitglied Damen-Gymnastik" },
  { value: "aktives-mitglied-behindertensport", label: "Aktives Mitglied Behindertensport" },
  { value: "trainer-werden", label: "Trainer werden" },
  { value: "passives-mitglied", label: "Passives Mitglied" },
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
    desired_team_season_id: "",
    message: "",
    privacy_accepted: false,
    website: "",
  };
}

function getYearGroupFromBirthdate(value = "") {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  const [year, month, day] = match.slice(1).map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day ? String(year) : "";
}

export default function MembershipRequestForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState(createInitialForm());
  const [teamResolution, setTeamResolution] = useState({ status: "idle", options: [] });
  const requestSequence = useRef(0);

  const showFootballFields = useMemo(
    () => form.request_type === "aktives-mitglied-fussball",
    [form.request_type],
  );

  const derivedYearGroup = useMemo(
    () => getYearGroupFromBirthdate(form.birthdate),
    [form.birthdate],
  );

  useEffect(() => {
    if (!showFootballFields || !derivedYearGroup) return undefined;
    const controller = new AbortController();
    const sequence = ++requestSequence.current;
    const timer = setTimeout(async () => {
      setTeamResolution({ status: "loading", options: [] });
      try {
        const response = await fetch("/api/membership/team-options", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ birthdate: form.birthdate }), signal: controller.signal });
        const result = await response.json();
        if (controller.signal.aborted || sequence !== requestSequence.current) return;
        const options = Array.isArray(result?.options) ? result.options : [];
        setTeamResolution({ status: result?.status || "unavailable", options });
        if (result?.status === "single" && options[0]?.teamSeasonId) setForm((current) => ({ ...current, desired_team_season_id: options[0].teamSeasonId }));
      } catch (error) {
        if (error?.name !== "AbortError" && sequence === requestSequence.current) setTeamResolution({ status: "unavailable", options: [] });
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [derivedYearGroup, form.birthdate, showFootballFields]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setSuccess(false);
  }

  function updateBirthdate(value) {
    requestSequence.current += 1;
    setForm((current) => ({ ...current, birthdate: value, desired_team_season_id: "" }));
    setTeamResolution({ status: "idle", options: [] });
    setSuccess(false);
  }

  function updateRequestType(value) {
    requestSequence.current += 1;
    setForm((current) => ({ ...current, request_type: value, desired_team_season_id: "" }));
    setTeamResolution({ status: "idle", options: [] });
    setSuccess(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.birthdate
    ) {
      alert("Bitte Vorname, Nachname, Telefonnummer, Geburtsdatum und E-Mail ausfüllen.");
      return;
    }

    if (!form.privacy_accepted) {
      alert("Bitte der Datenschutzerklärung zustimmen.");
      return;
    }
    if (showFootballFields && teamResolution.status === "multiple" && !form.desired_team_season_id) {
      alert("Bitte eine passende Mannschaft auswählen.");
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
      desired_team_season_id: showFootballFields ? form.desired_team_season_id || null : null,
      message: form.message.trim() || null,
      privacy_accepted: form.privacy_accepted,
      website: form.website,
    };

    const { error } = await submitMembershipRequestAction(payload);

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
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="membership-website">Website</label>
        <input
          id="membership-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(event) => updateField("website", event.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MembershipPersonalData
          form={form}
          requestTypeOptions={REQUEST_TYPE_OPTIONS}
          inputClassName={inputClassName()}
          FormField={FormField}
          onUpdateField={updateField}
          onBirthdateChange={updateBirthdate}
          onRequestTypeChange={updateRequestType}
        />

        <FormField label="Jahrgang">
          <input className={inputClassName()} value={derivedYearGroup} readOnly aria-label="Jahrgang" />
        </FormField>

        <MembershipFootballData
          showFootballFields={showFootballFields}
          form={form}
          resolution={teamResolution}
          inputClassName={inputClassName()}
          FormField={FormField}
          onUpdateField={updateField}
        />
      </div>

      <FormField label="Nachricht">
        {form.request_type === "trainer-werden" ? <p className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/65">Bitte teile uns mit, für welchen Jahrgang beziehungsweise welche Mannschaft du dich interessierst und ob du bereits Trainerlizenzen oder andere Qualifikationen besitzt.</p> : null}
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
