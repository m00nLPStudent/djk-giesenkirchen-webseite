import { adminStatusVariants } from "./tokens";

export function AdminStatusChip({ children, variant = "default", compact = false, className = "", icon: Icon }) {
  return <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${adminStatusVariants[variant] || adminStatusVariants.default} ${compact ? "px-2.5 text-[0.68rem] tracking-[0.12em]" : ""} ${className}`}>{Icon ? <Icon size={14} aria-hidden="true" /> : null}{children}</span>;
}

export function AdminMetric({ label, value, onClick, disabled = false }) {
  const className = `inline-flex min-h-10 items-baseline gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-left ${onClick && !disabled ? "transition hover:border-red-500/45 hover:bg-white/[0.07]" : ""} ${disabled ? "opacity-60" : ""}`;
  const content = <><span className="text-xs font-bold uppercase tracking-[0.12em] text-white/45">{label}</span><span className="text-sm font-black text-white">{value}</span></>;
  return onClick ? <button type="button" onClick={onClick} disabled={disabled} className={className}>{content}</button> : <div className={className}>{content}</div>;
}

export function AdminModuleSummary({ children, className = "" }) {
  return <div className={`flex flex-wrap gap-2.5 ${className}`}>{children}</div>;
}
