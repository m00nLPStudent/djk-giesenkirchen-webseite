import Link from "next/link";

export default function MembershipPrivacySection({ accepted, onToggle }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => onToggle(event.target.checked)}
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
  );
}
