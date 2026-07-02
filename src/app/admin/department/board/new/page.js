import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminBoardMemberForm } from "@/components/admin/board";
import { supabase } from "@/lib/supabase";

export default async function NewBoardMemberPage() {
  const { data: roles } = await supabase
    .from("board_roles")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Neues Vorstandsmitglied" subtitle="Abteilung">
      <AdminBoardMemberForm roles={roles || []} />
    </AdminLayout>
  );
}
