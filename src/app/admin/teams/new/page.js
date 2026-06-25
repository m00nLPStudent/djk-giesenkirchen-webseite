import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminTeamsForm from "@/components/admin/teams/AdminTeamsForm";
import BackButton from "@/components/admin/ui/BackButton";

export default function NewTeamPage() {
  return (
    <AdminLayout title="Neue Mannschaft" subtitle="Mannschaften">
      <BackButton />
      <AdminTeamsForm />
    </AdminLayout>
  );
}
