import Link from "next/link";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import AdminPageSection from "@/components/admin/layout/AdminPageSection";
import { AdminBoardList } from "@/components/admin/board";
import { supabase } from "@/lib/supabase";

export default async function AdminDepartmentPage() {
  const { data: members } = await supabase
    .from("board_members")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Abteilung" subtitle="Adminbereich" showHeader={false}>
      <AdminPageHeader
        eyebrow="Abteilung"
        title="Abteilung"
        description="Vorstand und organisatorische Strukturen für die öffentliche Darstellung pflegen."
        actions={
          <Link
            href="/admin/department/board/new"
            className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
          >
            Neues Vorstandsmitglied
          </Link>
        }
      />

      <AdminPageSection
        eyebrow="Fußballabteilung"
        title="Vorstand verwalten"
        description="Hier werden die Personen gepflegt, die öffentlich auf der Abteilungsseite im Bereich Vorstand angezeigt werden."
      >
        <AdminBoardList members={members || []} />
      </AdminPageSection>
    </AdminLayout>
  );
}
