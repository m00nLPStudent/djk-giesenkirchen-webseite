import AdminToolbar from "@/components/admin/common/AdminToolbar";

export default function SettingsToolbar({ items = [], activeId, onChange }) {
  return (
    <AdminToolbar
      items={items}
      activeId={activeId}
      onChange={onChange}
      outerClassName="flex flex-wrap gap-2 rounded-[2rem] border border-white/10 bg-[#17171d]/95 p-3 backdrop-blur"
      innerClassName="contents"
      itemClassName="rounded-full px-5 py-3 text-sm font-black transition"
    />
  );
}
