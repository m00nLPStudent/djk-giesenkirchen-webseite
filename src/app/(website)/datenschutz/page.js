import { notFound } from "next/navigation";
import RichTextContent from "@/components/website/content/RichTextContent";
import { supabase } from "@/lib/supabase";

async function getPublishedPage(slug) {
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  return data;
}

export default async function DatenschutzPage() {
  const page = await getPublishedPage("datenschutz");

  return (
    <main className="min-h-screen bg-[#101014] px-4 pt-28 pb-20 text-white sm:px-6 md:pt-52 md:pb-24">
      <section className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-6 md:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
          Rechtliches
        </p>
        <h1 className="mt-4 text-3xl font-black leading-tight md:text-6xl">
          {page.title_de || page.title_en || "Datenschutz"}
        </h1>

        <article className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5 md:p-9">
          <RichTextContent content={page.content_de || page.content_en || ""} />
        </article>
      </section>
    </main>
  );
}
