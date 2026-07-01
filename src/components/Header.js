import Link from "next/link";
import { Navigation } from "@/components/website/navigation";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-black/75 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="group relative -mb-10 -mt-2 flex w-fit items-center gap-4 rounded-[2rem] border border-white/10 bg-[#101014] p-3 pr-6 shadow-2xl shadow-black/40 transition hover:border-red-500/50">
          <div className="flex h-28 w-28 items-center justify-center rounded-[1.5rem] bg-black/40 p-2 ring-1 ring-white/10 md:h-32 md:w-32">
            <img
              src="https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/logos/Giesenkirchen.png"
              alt="DJK/VfL Giesenkirchen"
              className="h-full w-full object-contain transition group-hover:scale-105"
            />
          </div>

          <div className="hidden sm:block">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-red-400">
              Gemeinsam. Stark.
            </p>
            <h1 className="mt-1 text-2xl font-black leading-tight text-white md:text-3xl">
              Giesenkirchen
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.24em] text-white/45">
              05/09 e.V.
            </p>
          </div>
        </Link>

        <div className="ml-auto">
          <Navigation />
        </div>
      </div>
    </header>
  );
}
