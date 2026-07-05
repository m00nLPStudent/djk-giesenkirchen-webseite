import { TEAM_FORM_TABS } from "../helpers/teamFormOptions";
import AdminToolbar from "@/components/admin/common/AdminToolbar";

export default function TeamFormTabs({ activeTab, onChange }) {
  return (
    <AdminToolbar
      items={TEAM_FORM_TABS}
      activeId={activeTab}
      onChange={onChange}
      outerClassName="sticky top-4 z-10 rounded-[2rem] border border-white/10 bg-[#17171d]/95 p-3 backdrop-blur"
      innerClassName="flex gap-2 overflow-x-auto pb-1"
      itemClassName="shrink-0 rounded-full px-5 py-3 text-sm font-black transition"
    />
  );
}
