import { notFound } from "next/navigation";
import RichTextContent from "@/components/website/content/RichTextContent";
import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";
import { loadPublishedPublicPage } from "@/components/website/pages/publicPages.repository";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await loadPublishedPublicPage(slug);
  if (!page) return {};

  return {
    title: page.title_de || page.title_en || page.slug,
  };
}

export default async function PublicCmsPage({ params }) {
  const { slug } = await params;
  const page = await loadPublishedPublicPage(slug);
  if (!page) notFound();

  return (
    <PublicPageShell width="max-w-5xl">
      <PublicPageHero eyebrow="Verein" title={page.title_de || page.title_en || page.slug} />
      <PublicCard as="article" className="mt-10">
        <RichTextContent content={page.content_de || page.content_en || ""} />
      </PublicCard>
    </PublicPageShell>
  );
}
