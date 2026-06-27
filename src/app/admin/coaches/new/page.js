import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminCoachesForm } from "@/components/admin/coaches";
import BackButton from "@/components/admin/ui/BackButton";

export default function NewCoachPage() {
  return (
    <AdminLayout title="Neuer Trainer" subtitle="Trainer">
      <BackButton />
      <AdminCoachesForm />
    </AdminLayout>
  );
}
