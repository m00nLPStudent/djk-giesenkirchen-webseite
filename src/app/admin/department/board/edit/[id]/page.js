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

  return (
    <AdminLayout title="Vorstandsmitglied bearbeiten" subtitle="Abteilung">
      <AdminBoardMemberForm member={member} />
    </AdminLayout>
  );
}
