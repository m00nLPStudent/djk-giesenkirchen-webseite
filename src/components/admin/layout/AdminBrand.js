const logoUrl =
  "https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/logos/Giesenkirchen.png";

export default function AdminBrand() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-1">
        <img
          src={logoUrl}
          alt="DJK/VfL Giesenkirchen"
          className="h-9 w-9 object-contain"
        />
      </div>

      <div className="min-w-0 leading-tight">
        <p className="text-[0.62rem] font-black uppercase tracking-[0.35em] text-red-400">
          Vereins-CMS
        </p>
        <p className="truncate text-sm font-black text-white sm:text-base">
          DJK/VfL Giesenkirchen
        </p>
      </div>
    </div>
  );
}
