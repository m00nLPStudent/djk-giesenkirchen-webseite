import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminEventsForm } from "@/components/admin/events";
import { loadEventTypes } from "@/components/admin/events/services/eventTypes.repository";
import { AdminDetailHeader, AdminDetailLayout, AdminStatusChip } from "@/components/admin/design-system";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { loadEditorialDepartmentScope } from "@/lib/admin-auth/scopes/editorialDepartmentScope.server";
import { redirect } from "next/navigation";

export default async function NewEventPage() {
  const auth = await assertAdminActionPermission({ requiredPermission: "events.create" });
  if (!auth.ok) redirect("/admin/unauthorized?reason=missing-events-permission");
  const { scope } = await loadEditorialDepartmentScope(auth);
  if (!scope.valid) redirect("/admin/unauthorized?reason=invalid-department-scope");
  let teamsQuery = auth.supabaseServer.from("teams").select("id, name_de, is_active, sort_order, department_id").eq("is_active", true).order("sort_order", { ascending: true });
  if (scope.mode === "department") teamsQuery = teamsQuery.eq("department_id", scope.departmentId);
  const [{ data: teams }, { data: eventTypes }] = await Promise.all([
    teamsQuery,
    loadEventTypes(auth.supabaseServer),
  ]);

  return <AdminLayout title="Neuer Termin" subtitle="Termine" showHeader={false}><AdminDetailLayout header={<AdminDetailHeader backHref="/admin/events" backLabel="Zurück zu Termine" backVariant="pill" eyebrow="Termin" title="Neuer Termin" status={<AdminStatusChip compact>Entwurf</AdminStatusChip>} meta="Termin anlegen und über die vorhandene Veröffentlichungslogik freigeben." />}><AdminEventsForm teams={teams || []} eventTypes={eventTypes || []} /></AdminDetailLayout></AdminLayout>;
}
