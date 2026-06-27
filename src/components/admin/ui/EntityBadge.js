export default function EntityBadge({
  children,
  variant = "default",
  className = "",
  icon: Icon,
}) {
  const variants = {
    default: "bg-white/10 text-white/60",
    red: "bg-red-600/20 text-red-400",
    yellow: "bg-yellow-500/20 text-yellow-400",
    green: "bg-green-500/20 text-green-400",
    blue: "bg-blue-500/20 text-blue-400",
    neutral: "bg-white/10 text-white/50",
    success: "bg-green-500/20 text-green-400",
    warning: "bg-yellow-500/20 text-yellow-400",
    danger: "bg-red-600/20 text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </span>
  );
}

export function EntityStatusBadge({ active, activeLabel = "Aktiv", inactiveLabel = "Inaktiv" }) {
  return (
    <EntityBadge variant={active ? "success" : "warning"}>
      {active ? activeLabel : inactiveLabel}
    </EntityBadge>
  );
}
