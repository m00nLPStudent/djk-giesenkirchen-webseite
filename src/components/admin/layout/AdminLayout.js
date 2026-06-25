import AdminSidebar from "./AdminSidebar";
import AdminCreateMenu from "@/components/admin/ui/AdminCreateMenu";
import Link from "next/link";
import { ExternalLink, Search, Bell, UserCircle } from "lucide-react";
import AdminClock from "@/components/admin/ui/AdminClock";

export default function AdminLayout({ children, title, subtitle }) {
  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <div className="grid min-h-screen lg:grid-cols-[300px_1fr]">
        <AdminSidebar />

        <section>
          <div className="border-b border-white/10 bg-black/30 px-6 py-5">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
              <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-white/50 md:flex">
                <Search size={18} />
                <span className="text-sm">Suche im CMS...</span>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <AdminClock />
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
                >
                  <ExternalLink size={18} />
                  Webseite
                </Link>
                <AdminCreateMenu />

                <button className="rounded-full border border-white/10 p-3 text-white/70 transition hover:border-red-500 hover:text-white">
                  <Bell size={18} />
                </button>

                <div className="flex items-center gap-3 rounded-full border border-white/10 px-4 py-2">
                  <UserCircle size={24} />
                  <div className="hidden text-sm md:block">
                    <p className="font-bold">Swen Verbocket</p>
                    <p className="text-white/40">Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-12">
            <div className="mx-auto max-w-7xl">
              {(title || subtitle) && (
                <div className="mb-10">
                  {subtitle && (
                    <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
                      {subtitle}
                    </p>
                  )}

                  {title && (
                    <h1 className="mt-4 text-5xl font-black">{title}</h1>
                  )}
                </div>
              )}

              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
