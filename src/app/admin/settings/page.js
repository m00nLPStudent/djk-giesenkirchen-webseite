import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminModuleHeader, AdminModulePage } from "@/components/admin/design-system";
import { AdminSettingsEditor } from "@/components/admin/settings";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ searchParams }) {
  const params = await searchParams;
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "settings.view",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-settings-permission");
  }

  const db = permissionResult.supabaseServer;

  const [settingsResult, contactsResult, pagesResult] = await Promise.all([
    db.from("club_settings").select("*").maybeSingle(),
    db
      .from("club_contacts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    db
      .from("pages")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const errors = [
    { scope: "club_settings", error: settingsResult?.error },
    { scope: "club_contacts", error: contactsResult?.error },
    { scope: "pages", error: pagesResult?.error },
  ].filter((entry) => Boolean(entry.error));

  if (errors.length > 0) {
    console.error("[admin/settings] query failed", errors);

    return (
      <AdminLayout
        title="Einstellungen"
        subtitle="Adminbereich"
        showHeader={false}
      >
        <AdminModulePage>
        <AdminModuleHeader
          eyebrow="System"
          title="Einstellungen"
          description="Vereinsdaten, Systemeinstellungen und Verwaltung konfigurieren."
        />

        <div className="rounded-3xl border border-red-500/40 bg-red-600/10 p-6 text-sm text-red-100">
          Einstellungen konnten nicht vollständig geladen werden. Bitte Seite
          neu laden.
        </div>
        </AdminModulePage>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Einstellungen"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminModulePage>
      <AdminModuleHeader
        eyebrow="System"
        title="Einstellungen"
        description="Vereinsdaten, Systemeinstellungen und Verwaltung konfigurieren."
      />

      <AdminSettingsEditor
        initialClubSettings={settingsResult?.data || null}
        initialClubContacts={contactsResult?.data || []}
        initialPages={pagesResult?.data || []}
        initialTab={params?.tab}
      />
      </AdminModulePage>
    </AdminLayout>
  );
}
