export default function AdminContent({ children, className = "" }) {
  return <div className={`min-w-0 space-y-6 ${className}`}>{children}</div>;
}
