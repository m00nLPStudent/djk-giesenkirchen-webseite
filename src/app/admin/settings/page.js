import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import { AdminSettingsEditor } from "@/components/admin/settings";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "settings.view",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-settings-permission");
  }

  const db = permissionResult.supabaseServer;

  const [
    settingsResult,
    contactsResult,
    pagesResult,
    recipientsResult,
    requestsResult,
    coachesResult,
    boardMembersResult,
  ] = await Promise.all([
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
    db
      .from("membership_request_recipients")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    db
      .from("membership_requests")
      .select("*, teams(name_de)")
      .order("created_at", { ascending: false }),
    db
      .from("coaches")
      .select(
        "id, first_name, last_name, name, email, role, role_de, teams(name_de)",
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    db
      .from("board_members")
      .select("id, first_name, last_name, email, role_de")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const errors = [
    { scope: "club_settings", error: settingsResult?.error },
    { scope: "club_contacts", error: contactsResult?.error },
    { scope: "pages", error: pagesResult?.error },
    { scope: "membership_request_recipients", error: recipientsResult?.error },
    { scope: "membership_requests", error: requestsResult?.error },
    { scope: "coaches", error: coachesResult?.error },
    { scope: "board_members", error: boardMembersResult?.error },
  ].filter((entry) => Boolean(entry.error));

  if (errors.length > 0) {
    console.error("[admin/settings] query failed", errors);

    return (
      <AdminLayout
        title="Einstellungen"
        subtitle="Adminbereich"
        showHeader={false}
      >
        <AdminPageHeader
          eyebrow="System"
          title="Einstellungen"
          description="Globale Inhalte, Kontaktangaben und interne Zuordnungen zentral verwalten."
        />

        <div className="rounded-3xl border border-red-500/40 bg-red-600/10 p-6 text-sm text-red-100">
          Einstellungen konnten nicht vollständig geladen werden. Bitte Seite
          neu laden.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Einstellungen"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminPageHeader
        eyebrow="System"
        title="Einstellungen"
        description="Globale Inhalte, Kontaktangaben und interne Zuordnungen zentral verwalten."
      />

      <AdminSettingsEditor
        initialClubSettings={settingsResult?.data || null}
        initialClubContacts={contactsResult?.data || []}
        initialPages={pagesResult?.data || []}
        initialMembershipRecipients={recipientsResult?.data || []}
        initialMembershipRequests={requestsResult?.data || []}
        initialCoaches={coachesResult?.data || []}
        initialBoardMembers={boardMembersResult?.data || []}
      />
    </AdminLayout>
  );
}
