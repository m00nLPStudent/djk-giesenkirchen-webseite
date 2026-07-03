import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function WebsiteButton() {
  return (
    <Link
      href="/"
      target="_blank"
      className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-white/70 transition hover:border-red-500/70 hover:bg-white/[0.07] hover:text-white md:flex"
    >
      <ExternalLink size={17} />
      Webseite
    </Link>
  );
}
