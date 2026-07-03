import { SponsorSection, SponsorTabs } from "@/components/website/sponsors";
import { supabase } from "@/lib/supabase";

export default async function FootballSponsorsPage() {
  const { data: categories } = await supabase
    .from("sponsor_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const sponsorsByCategory = (sponsors || []).reduce((groups, sponsor) => {
    const key = sponsor.category_id || "none";
    return { ...groups, [key]: [...(groups[key] || []), sponsor] };
  }, {});

  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-48 pb-24 text-white md:pt-56">
      <section className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">Fußballabteilung</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight md:text-7xl">Sponsoren</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">
          Unsere Unterstützer und Partner der Fußballabteilung.
        </p>

        <SponsorTabs categories={categories || []} />

        <div className="mt-16 space-y-20">
          {(categories || []).map((category) => (
            <SponsorSection
              key={category.id}
              category={category}
              sponsors={sponsorsByCategory[category.id] || []}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
