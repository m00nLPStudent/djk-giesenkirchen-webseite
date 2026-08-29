import { PublicPageHero, PublicPageShell } from "@/components/website/layout";

export default function DepartmentPageLayout({
  eyebrow = "Fußballabteilung",
  title,
  description,
  children,
}) {
  return (
    <PublicPageShell>
      <section>
        <PublicPageHero eyebrow={eyebrow} title={title} description={description} />
        {children}
      </section>
    </PublicPageShell>
  );
}
