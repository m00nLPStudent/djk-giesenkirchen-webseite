import AdminCard from "./AdminCard";

export default function AdminPanel({ children, className = "" }) {
  return (
    <AdminCard className={`p-6 md:p-7 ${className}`}>{children}</AdminCard>
  );
}
