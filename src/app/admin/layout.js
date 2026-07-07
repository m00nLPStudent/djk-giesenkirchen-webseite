import AdminRouteGuard from "@/components/admin/auth/AdminRouteGuard";

export default function AdminRootLayout({ children }) {
  return <AdminRouteGuard route="/admin">{children}</AdminRouteGuard>;
}
