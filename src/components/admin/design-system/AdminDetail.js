import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminUi } from "./tokens";

export function AdminDetailLayout({ header, children, dangerZone, className = "" }) {
  return <div className={`${adminUi.pageGap} ${className}`}>{header}{children}{dangerZone}</div>;
}

export function AdminBackLink({ href, children = "Zurück", variant = "text", className = "" }) {
  const variantClass = variant === "pill" ? "rounded-full border border-white/10 px-4 py-2.5 text-white/70 hover:border-red-500" : "text-white/60";
  return <Link href={href} className={`inline-flex items-center gap-2 text-sm font-bold transition hover:text-white ${adminUi.focusRing} ${variantClass} ${className}`}><ArrowLeft size={16} aria-hidden="true" />{children}</Link>;
}

export function AdminDetailHeader({ backHref, backLabel, backVariant = "text", eyebrow, title, status, statusPlacement = "inline", actions, meta, leading, variant = "panel", className = "" }) {
  const surface = variant === "hero" ? "rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-transparent p-5 md:p-7" : adminUi.detailPanel;
  return (
    <section className={`${surface} ${className}`}>
      {backHref ? <AdminBackLink href={backHref} variant={backVariant}>{backLabel}</AdminBackLink> : null}
      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">{leading}<div className="min-w-0">{eyebrow ? <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">{eyebrow}</p> : null}<div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="min-w-0 text-2xl font-black text-white md:text-[2rem]">{title}</h1>{statusPlacement === "inline" ? status : null}</div>{statusPlacement === "below" && status ? <div className="mt-2">{status}</div> : null}{meta ? <div className="mt-2 text-sm text-white/60 md:text-[0.95rem]">{meta}</div> : null}</div></div>
        {actions ? <div className="flex flex-wrap gap-3 lg:max-w-md lg:justify-end">{actions}</div> : null}
      </div>
    </section>
  );
}

export function AdminInformationSection({ title, children, className = "" }) {
  return <section className={`${adminUi.panel} px-5 ${className}`}>{title ? <h2 className="pt-5 text-xl font-black text-white">{title}</h2> : null}<dl className={title ? "mt-3" : ""}>{children}</dl></section>;
}

export function AdminInformationRow({ label, children, align = "left", className = "", labelClassName = "", valueClassName = "" }) {
  return <div className={`grid gap-1 border-t border-white/10 py-4 first:border-t-0 sm:grid-cols-[10rem_1fr] sm:gap-5 ${className}`}><dt className={`${adminUi.label} ${labelClassName}`}>{label}</dt><dd className={`${adminUi.body} min-w-0 break-words whitespace-pre-wrap ${align === "right" ? "sm:text-right" : ""} ${valueClassName}`}>{children || "Nicht hinterlegt"}</dd></div>;
}

export function AdminDangerZone({ title = "Gefahrenbereich", description, children, className = "" }) {
  return <section className={`rounded-[1.5rem] border border-red-500/20 bg-red-500/[0.06] p-5 ${className}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black text-white">{title}</h2>{description ? <p className="mt-1 text-sm text-white/55">{description}</p> : null}</div>{children}</div></section>;
}

export function AdminTimeline({ children, className = "" }) {
  return <ol className={`space-y-3 border-l border-white/10 pl-5 ${className}`}>{children}</ol>;
}

export function AdminMetaList({ children, className = "" }) {
  return <dl className={`divide-y divide-white/10 ${className}`}>{children}</dl>;
}
