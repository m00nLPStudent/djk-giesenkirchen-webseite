import AdminRouteGuard from "@/components/admin/auth/AdminRouteGuard";

export const metadata = {
  title: { absolute: "DJK/VfL Dashboard" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
