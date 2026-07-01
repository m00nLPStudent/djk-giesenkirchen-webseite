import Link from "next/link";
import { Navigation } from "@/components/website/navigation";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-black/75 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex w-fit items-center gap-5">
          <img
            src="https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/logos/Giesenkirchen.png"
            alt="DJK/VfL Giesenkirchen"
            className="h-20 w-20 object-contain md:h-24 md:w-24"
          />

          <div>
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

        <Navigation />
      </div>
    </header>
  );
}
