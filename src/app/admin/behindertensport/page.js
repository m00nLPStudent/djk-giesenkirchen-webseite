import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminModuleHeader, AdminModulePage } from "@/components/admin/design-system";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { DepartmentSectionEditor } from "@/components/admin/department-sections";
import { DEPARTMENT_SECTION_CONFIGS } from "@/components/admin/department-sections/departmentSection.core.mjs";
import { loadDepartmentSectionEditorData } from "@/components/admin/department-sections/departmentSection.service";

export const dynamic = "force-dynamic";

export default async function AdminDisabledSportsPage() {
  const auth = await assertAdminActionPermission({ requiredPermission: "department_sections.view" });
  if (!auth.ok) redirect("/admin/unauthorized?reason=missing-department-sections-permission");
  const config = DEPARTMENT_SECTION_CONFIGS.behindertensport;
  const loaded = await loadDepartmentSectionEditorData(config.slug);

  return <AdminLayout title={config.label} subtitle="Adminbereich" showHeader={false}>
    <AdminModulePage>
      <AdminModuleHeader eyebrow="Abteilungsseite" title="Behindertensport" description="Inhalte, Ansprechpartner, Gruppenbild und teamunabhängige Trainingszeiten pflegen."/>
      {loaded.error ? (
        <div role="alert" className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">Der Behindertensport-Bereich konnte nicht geladen werden. Bitte die Seite neu laden.</div>
      ) : (
        <DepartmentSectionEditor config={config} initialSection={loaded.data.section} initialTrainingTimes={loaded.data.trainingTimes}/>
      )}
    </AdminModulePage>
  </AdminLayout>;
}
