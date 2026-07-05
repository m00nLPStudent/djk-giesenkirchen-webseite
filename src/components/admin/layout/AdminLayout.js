import AdminShell from "./AdminShell";

export default function AdminLayout({
  children,
  title,
  subtitle,
  showHeader = true,
}) {
  return (
    <AdminShell showHeader={showHeader} title={title} subtitle={subtitle}>
      {children}
    </AdminShell>
  );
}
