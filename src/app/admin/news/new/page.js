import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminNewsForm } from "@/components/admin/news";
import BackButton from "@/components/admin/ui/BackButton";

export default function NewNewsPage() {
  return (
    <AdminLayout title="Neue News" subtitle="News">
      <BackButton />
      <AdminNewsForm />
    </AdminLayout>
  );
}
