import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminSettingsEditor } from "@/components/admin/settings";
import { supabase } from "@/lib/supabase";

export default async function AdminSettingsPage() {
  const [
    settingsResult,
    contactsResult,
    pagesResult,
    recipientsResult,
    requestsResult,
    coachesResult,
    boardMembersResult,
  ] = await Promise.all([
    supabase.from("club_settings").select("*").maybeSingle(),
    supabase
      .from("club_contacts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("pages")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("membership_request_recipients")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("membership_requests")
      .select("*, teams(name_de)")
      .order("created_at", { ascending: false }),
    supabase
      .from("coaches")
      .select(
        "id, first_name, last_name, name, email, role, role_de, teams(name_de)",
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("board_members")
      .select("id, first_name, last_name, email, role_de")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  return (
    <AdminLayout title="Einstellungen" subtitle="Adminbereich">
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
