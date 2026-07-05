import MembershipRequestForm from "@/components/website/membership/MembershipRequestForm";
import { supabase } from "@/lib/supabase";

export default async function MembershipPage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name_de, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_de", { ascending: true });

  return (
    <main className="min-h-screen bg-[#101014] px-4 pt-28 pb-20 text-white sm:px-6 md:pt-52 md:pb-24">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Mitglied werden
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight md:text-6xl">
            Anfrage senden
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-white/70 md:text-lg md:leading-8">
            Du möchtest aktives oder passives Mitglied werden oder dich als
            Trainer einbringen? Dann sende uns hier deine Anfrage.
          </p>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6 md:p-10">
          <MembershipRequestForm teams={teams || []} />
        </section>
      </section>
    </main>
  );
}
