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
    <main className="min-h-screen bg-[#101014] overflow-x-hidden px-4 pt-32 pb-20 text-white sm:px-6 md:pt-56 md:pb-24">
      <section className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
          Fußballabteilung
        </p>
        <h1 className="mt-5 max-w-4xl break-words text-4xl font-black leading-tight md:text-7xl">
          Sponsoren
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-white/60 md:text-lg md:leading-8">
          Unsere Unterstützer und Partner der Fußballabteilung.
        </p>

        <SponsorTabs categories={categories || []} />

        <div className="mt-14 space-y-14 md:mt-16 md:space-y-20">
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
