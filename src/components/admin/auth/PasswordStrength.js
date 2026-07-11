function strengthStyle(strength) {
  if (strength === "Stark") {
    return "text-emerald-200";
  }
  if (strength === "Mittel") {
    return "text-amber-200";
  }
  return "text-red-200";
}

export default function PasswordStrength({ strength = "Schwach" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
        Passwortstaerke
      </p>
      <p className={`mt-1 text-sm font-bold ${strengthStyle(strength)}`}>
        {strength}
      </p>
    </div>
  );
}
