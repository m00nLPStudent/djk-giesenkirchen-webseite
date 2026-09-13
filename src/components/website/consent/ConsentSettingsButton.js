"use client";
import { useConsent } from "./ConsentProvider";
export default function ConsentSettingsButton({ className = "" }) {
  const { openSettings } = useConsent();
  return <button type="button" onClick={openSettings} className={className}>Cookie-Einstellungen</button>;
}
