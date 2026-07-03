import AdminSidebar from "./AdminSidebar";
import { AdminTopbar } from "@/components/admin/topbar";

export default function AdminLayout({ children, title, subtitle }) {
  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <div className="grid min-h-screen lg:grid-cols-[300px_1fr]">
        <AdminSidebar />

        <section>
          <AdminTopbar />

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
