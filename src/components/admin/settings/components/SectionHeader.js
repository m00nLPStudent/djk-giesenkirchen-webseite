import { AdminSectionTitle } from "@/components/admin/design-system";

export default function SectionHeader({ eyebrow, title, description, right }) {
  return <AdminSectionTitle eyebrow={eyebrow} title={title} description={description} actions={right} />;
}
