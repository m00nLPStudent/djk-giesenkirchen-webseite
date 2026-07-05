"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitMembershipRequest } from "@/lib/membership/membership.service";

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

export default function MembershipRequestForm({ teams = [] }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
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
  });

  function getYearGroupFromBirthdate(value = "") {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return String(date.getUTCFullYear());
  }

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

    setForm({
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
    });
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-[2rem] border border-green-500/25 bg-gradient-to-br from-green-500/12 to-emerald-500/8 p-8 text-center md:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-green-300">
          <CheckCircle2 size={34} />
        </div>
        <h2 className="mt-6 text-3xl font-black text-white md:text-4xl">
          Vielen Dank!
        </h2>
        <p className="mt-4 text-lg leading-8 text-white/70">
          Wir haben deine Anfrage erhalten.
        </p>
        <p className="mt-2 text-lg leading-8 text-white/70">
          Unser Verein wird sich schnellstmöglich mit dir in Verbindung setzen.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-red-600 px-7 py-4 text-sm font-black text-white transition hover:bg-red-700"
          >
            Zur Startseite
          </Link>
          <Link
            href="/kontakt"
            className="rounded-full border border-white/10 px-7 py-4 text-sm font-bold text-white/75 transition hover:border-red-500 hover:text-white"
          >
            Weitere Informationen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Vorname" required>
          <input
            className={inputClassName()}
            value={form.first_name}
            onChange={(event) => updateField("first_name", event.target.value)}
          />
        </FormField>

        <FormField label="Nachname" required>
          <input
            className={inputClassName()}
            value={form.last_name}
            onChange={(event) => updateField("last_name", event.target.value)}
          />
        </FormField>

        <FormField label="Telefonnummer">
          <input
            className={inputClassName()}
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
        </FormField>

        <FormField label="Geburtsdatum" required>
          <input
            type="date"
            className={inputClassName()}
            value={form.birthdate}
            onChange={(event) => updateField("birthdate", event.target.value)}
          />
        </FormField>

        <FormField label="E-Mail" required>
          <input
            type="email"
            className={inputClassName()}
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </FormField>

        <FormField label="Art der Anfrage" required>
          <select
            className={inputClassName()}
            value={form.request_type}
            onChange={(event) =>
              updateField("request_type", event.target.value)
            }
          >
            {REQUEST_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        {showFootballFields && (
          <>
            <FormField label="Jahrgang">
              <input
                className={inputClassName()}
                value={derivedYearGroup}
                readOnly
              />
            </FormField>

            <FormField label="Gewünschte Mannschaft optional">
              <select
                className={inputClassName()}
                value={form.desired_team_id}
                onChange={(event) =>
                  updateField("desired_team_id", event.target.value)
                }
              >
                <option value="">Keine Auswahl</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name_de}
                  </option>
                ))}
              </select>
            </FormField>
          </>
        )}
      </div>

      <FormField label="Nachricht">
        <textarea
          rows={6}
          className={textareaClassName()}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
        />
      </FormField>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.privacy_accepted}
            onChange={(event) =>
              updateField("privacy_accepted", event.target.checked)
            }
            className="mt-1"
          />
          <span>
            Ich habe die{" "}
            <Link
              href="/datenschutz"
              className="font-bold text-red-300 underline underline-offset-4"
            >
              Datenschutzerklärung
            </Link>{" "}
            gelesen und stimme der Verarbeitung meiner Daten zu.
            <span className="ml-1 text-red-400">*</span>
          </span>
        </label>
      </div>

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
