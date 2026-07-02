import Link from "next/link";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminBoardList } from "@/components/admin/board";
import { supabase } from "@/lib/supabase";

export default async function AdminDepartmentPage() {
  const { data: members } = await supabase
    .from("board_members")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Abteilung" subtitle="Adminbereich">
      <div className="mb-8 flex flex-wrap justify-end gap-3">
        <Link
          href="/admin/department/board/new"
          className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
        >
          Neues Vorstandsmitglied
        </Link>
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">Fußballabteilung</p>
        <h2 className="mt-2 text-3xl font-black">Vorstand verwalten</h2>
        <p className="mt-3 max-w-3xl text-white/55">
          Hier werden die Personen gepflegt, die öffentlich auf der Abteilungsseite im Bereich Vorstand angezeigt werden.
        </p>
      </section>

      <div className="mt-8">
        <AdminBoardList members={members || []} />
      </div>
    </AdminLayout>
  );
}
