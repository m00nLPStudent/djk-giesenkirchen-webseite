export default function EntityBadge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-white/10 text-white/60",
    red: "bg-red-600/20 text-red-400",
    yellow: "bg-yellow-500/20 text-yellow-400",
    green: "bg-green-500/20 text-green-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {children}
    </span>
  );
}
