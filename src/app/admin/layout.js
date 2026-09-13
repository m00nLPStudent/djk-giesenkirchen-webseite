import AdminRouteGuard from "@/components/admin/auth/AdminRouteGuard";

export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
