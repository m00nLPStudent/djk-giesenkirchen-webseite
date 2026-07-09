import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminProfilePageShell from "@/components/admin/profile/components/AdminProfilePageShell";

export default function AdminProfilePage() {
  return (
    <AdminLayout title="Mein Profil" subtitle="Adminbereich" showHeader={false}>
      <AdminProfilePageShell />
    </AdminLayout>
  );
}
