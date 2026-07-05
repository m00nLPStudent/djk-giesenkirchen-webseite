import Link from "next/link";
import { Navigation } from "@/components/website/navigation";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-black/75 backdrop-blur">
      <div className="relative mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 sm:py-3 md:gap-5 md:px-6 md:pl-40 lg:pl-44">
        <Link
          href="/"
          className="group z-20 shrink-0 md:absolute md:left-6 md:top-1/2 md:-translate-y-[38%]"
          aria-label="Zur Startseite"
        >
          <img
            src="https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/logos/Giesenkirchen.png"
            alt="DJK/VfL Giesenkirchen"
            className="h-12 w-12 object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.55)] transition group-hover:scale-105 sm:h-14 sm:w-14 md:h-40 md:w-40"
          />
        </Link>

        <Link
          href="/"
          className="block min-w-0 flex-1 md:w-[250px] md:flex-none xl:w-[280px]"
        >
          <p className="truncate text-[0.5rem] font-black uppercase tracking-[0.2em] text-red-400 sm:text-[0.56rem] sm:tracking-[0.24em] md:text-[0.68rem] md:tracking-[0.32em]">
            Gemeinsam. Stark.
          </p>
          <h1 className="mt-1 truncate text-base font-black leading-tight text-white sm:text-lg md:text-2xl">
            Giesenkirchen
          </h1>
          <p className="mt-1 truncate text-[0.56rem] font-bold uppercase tracking-[0.14em] text-white/45 sm:text-[0.62rem] sm:tracking-[0.18em] md:text-xs md:tracking-[0.24em]">
            05/09 e.V.
          </p>
        </Link>

        <div className="flex min-w-0 shrink-0 justify-end">
          <Navigation />
        </div>
      </div>
    </header>
  );
}
