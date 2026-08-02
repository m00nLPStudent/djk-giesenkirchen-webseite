import AdminShell from "./AdminShell";
import { loadAdminNavigation } from "@/components/admin/navigation/adminNavigation.loader";

export default async function AdminLayout({
  children,
  title,
  subtitle,
  showHeader = true,
  navigation: providedNavigation = null,
}) {
  const navigation = providedNavigation || await loadAdminNavigation("/admin");

  return (
    <AdminShell
      showHeader={showHeader}
      title={title}
      subtitle={subtitle}
      navigation={navigation}
    >
      {children}
    </AdminShell>
  );
}
