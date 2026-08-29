import { notFound } from "next/navigation";
import RichTextContent from "@/components/website/content/RichTextContent";
import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";
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

export default async function ImpressumPage() {
  const page = await getPublishedPage("impressum");

  return (
    <PublicPageShell width="max-w-5xl">
        <PublicPageHero eyebrow="Rechtliches" title={page.title_de || page.title_en || "Impressum"} />

        <PublicCard as="article" className="mt-10">
          <RichTextContent content={page.content_de || page.content_en || ""} />
        </PublicCard>
    </PublicPageShell>
  );
}
