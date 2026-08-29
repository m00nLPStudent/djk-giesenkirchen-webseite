import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import SocialLinks from "@/components/common/SocialLinks";
import { Navigation } from "@/components/website/navigation";
import { PUBLIC_SITE_LOGO_URL } from "@/config/publicSite";
import { resolveSocialLinks, selectMobileHeaderSocialLinks } from "@/lib/socialLinks";
import { supabase } from "@/lib/supabase";

export default async function Header() {
  const { data: settings } = await supabase
    .from("club_settings")
    .select("social_links")
    .eq("singleton", true)
    .maybeSingle();
  const socialLinks = resolveSocialLinks(settings?.social_links);
  const mobileSocialLinks = selectMobileHeaderSocialLinks(socialLinks);
  const serviceLinks = [
    { label: "Sportanlage / Anfahrt", href: "/anfahrt", Icon: MapPin },
    { label: "Termine", href: "/termine/allgemein", Icon: CalendarDays },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 overflow-visible border-b border-white/10 bg-[#0d0d12]/95 text-white shadow-[0_10px_35px_rgba(0,0,0,0.38)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_12%_10%,rgba(220,38,38,0.16),transparent_32%)]" />
      <div className="relative mx-auto flex h-20 max-w-[90rem] items-center gap-3 px-4 sm:px-6 xl:block xl:h-36">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 xl:absolute xl:top-1 xl:left-6 xl:w-[24rem] xl:gap-5"
          aria-label="DJK/VfL Giesenkirchen – zur Startseite"
        >
          <img
            src={PUBLIC_SITE_LOGO_URL}
            alt="Logo der DJK/VfL Giesenkirchen"
            className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_12px_22px_rgba(0,0,0,0.45)] transition group-hover:scale-[1.03] xl:h-32 xl:w-32"
          />
          <div className="hidden min-w-0 min-[390px]:block">
            <p className="truncate text-[0.58rem] font-black uppercase tracking-[0.24em] text-red-400 sm:text-[0.64rem] xl:text-sm xl:tracking-[0.24em]">
              Gemeinsam. Stark.
            </p>
            <p className="mt-0.5 truncate text-base font-black leading-tight sm:text-lg xl:text-3xl">
              Giesenkirchen
            </p>
            <p className="mt-1 truncate text-[0.58rem] font-bold uppercase tracking-[0.16em] text-white/55 xl:text-xs xl:tracking-[0.2em]">
              05/09 e.V.
            </p>
          </div>
        </Link>

        <nav aria-label="Service-Links" className="absolute top-5 right-8 hidden items-center gap-1.5 xl:flex">
          <SocialLinks links={socialLinks} name="DJK/VfL Giesenkirchen" className="mr-1 gap-1" compact />
          {serviceLinks.map(({ label, href, Icon }, index) => {
            const className = "group inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-white/65 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500";
            const content = (
              <>
                <Icon aria-hidden="true" size={15} className="text-red-500 transition group-hover:text-red-400" />
                <span>{label}</span>
              </>
            );

            return (
              <div key={href} className="flex items-center">
                {index > 0 && <span aria-hidden="true" className="mr-1.5 h-4 w-px bg-white/10" />}
                <Link href={href} className={className}>{content}</Link>
              </div>
            );
          })}
        </nav>

        <nav aria-label="Mobile Service-Links" className="ml-auto flex shrink-0 items-center gap-1 xl:hidden">
          <SocialLinks
            links={mobileSocialLinks}
            name="DJK/VfL Giesenkirchen"
            contents
            iconSizes={{ facebook: 17 }}
          />
          <Link href="/anfahrt" aria-label="Sportanlage / Anfahrt" className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-transparent transition hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500">
            <MapPin aria-hidden="true" size={18} className="block shrink-0 text-red-500 transition-colors group-hover:text-red-400" />
          </Link>
        </nav>

        <div className="shrink-0 xl:absolute xl:right-6 xl:bottom-0 xl:left-[9.5rem] xl:flex xl:translate-y-1/2 xl:justify-end 2xl:left-[10.5rem]">
          <Navigation />
        </div>
      </div>
    </header>
  );
}
