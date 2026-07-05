export default function AdminCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-[1.75rem] border border-white/10 bg-white/[0.04] shadow-[0_20px_70px_rgba(0,0,0,0.18)] ${className}`}
    >
      {children}
    </div>
  );
}
