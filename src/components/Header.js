import Link from "next/link";
import { Navigation } from "@/components/website/navigation";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-black/75 backdrop-blur">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4 pl-44 md:pl-56 lg:pl-60">
        <Link
          href="/"
          className="group absolute left-6 top-1/2 z-20 -translate-y-[38%]"
          aria-label="Zur Startseite"
        >
          <img
            src="https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/logos/Giesenkirchen.png"
            alt="DJK/VfL Giesenkirchen"
            className="h-32 w-32 object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.55)] transition group-hover:scale-105 md:h-40 md:w-40"
          />
        </Link>

        <Link href="/" className="block min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-red-400">
            Gemeinsam. Stark.
          </p>
          <h1 className="mt-1 text-2xl font-black leading-tight text-white md:text-3xl">
            Giesenkirchen
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.24em] text-white/45">
            05/09 e.V.
          </p>
        </Link>

        <div className="ml-auto">
          <Navigation />
        </div>
      </div>
    </header>
  );
}
