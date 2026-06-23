import AdminNewsForm from "@/components/AdminNewsForm";

export default function NewNewsPage() {
  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-32 pb-20 text-white">
      <div className="mx-auto max-w-4xl">

        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
          Adminbereich
        </p>

        <h1 className="mt-4 text-5xl font-black">
          Neue News erstellen
        </h1>

        <AdminNewsForm />

      </div>
    </main>
  );
}