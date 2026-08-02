import { Shield } from "lucide-react";
import { AdminModuleEmptyState } from "@/components/admin/design-system";
import TeamCreateButton from "./TeamCreateButton";

export default function TeamEmptyState({ hasTeamManagementScope = true }) {
  return <AdminModuleEmptyState icon={Shield} title="Keine Mannschaften gefunden" description={hasTeamManagementScope ? "Lege eine neue Mannschaft an oder ändere Suche beziehungsweise Filter." : "Für dein Profil ist keine Teamverwaltung freigeschaltet."} action={hasTeamManagementScope ? <TeamCreateButton className="mt-6 inline-flex rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white" label="Neue Mannschaft erstellen" /> : null} />;
}
