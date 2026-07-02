import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminBoardMemberForm } from "@/components/admin/board";
import { supabase } from "@/lib/supabase";

export default async function EditBoardMemberPage({ params }) {
  const { id } = await params;

  const { data: member } = await supabase
    .from("board_members")
    .select("*")
    .eq("id", id)
    .single();

  const { data: roles } = await supabase
    .from("board_roles")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Vorstandsmitglied bearbeiten" subtitle="Abteilung">
      <AdminBoardMemberForm member={member} roles={roles || []} />
    </AdminLayout>
  );
}
