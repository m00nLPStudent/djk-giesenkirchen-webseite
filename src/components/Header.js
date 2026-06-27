import Link from "next/link";
import { Navigation } from "@/components/website/navigation";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-4">
          <img
            src="https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/logos/Giesenkirchen.png"
            alt="DJK/VfL Giesenkirchen"
            className="h-12 w-12 object-contain"
          />

          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-red-400">
              DJK/VfL
            </p>
            <h1 className="text-lg font-bold text-white">
              Giesenkirchen 05/09 e.V.
            </h1>
          </div>
        </Link>

        <Navigation />
      </div>
    </header>
  );
}
