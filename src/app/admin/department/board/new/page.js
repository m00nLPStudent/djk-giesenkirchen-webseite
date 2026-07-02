import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminBoardMemberForm } from "@/components/admin/board";

export default function NewBoardMemberPage() {
  return (
    <AdminLayout title="Neues Vorstandsmitglied" subtitle="Abteilung">
      <AdminBoardMemberForm />
    </AdminLayout>
  );
}
