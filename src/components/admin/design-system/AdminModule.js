import Link from "next/link";
import { Search } from "lucide-react";
import { adminButtonVariants, adminUi } from "./tokens";

export function AdminModulePage({ children, className = "" }) {
  return <div className={`${adminUi.pageGap} ${className}`.trim()}>{children}</div>;
}

export function AdminModuleHeader({ eyebrow = "Adminbereich", title, description, actions, children, className = "" }) {
  return (
    <section className={`overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-transparent p-6 shadow-[0_24px_90px_rgba(0,0,0,0.22)] md:p-8 ${className}`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">{eyebrow}</p> : null}
          {title ? <h1 className="mt-3 text-3xl font-black md:text-4xl">{title}</h1> : null}
          {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60 md:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div> : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

export function AdminModuleToolbar({ children, className = "" }) {
  return <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>{children}</div>;
}

export function AdminActionBar({ children, className = "" }) {
  return <div className={`flex flex-wrap items-center gap-2 ${className}`}>{children}</div>;
}

export function AdminModuleSearch({ value, onChange, placeholder = "Suchen …", label = "Suchen", className = "" }) {
  return <label className={`relative block w-full max-w-xl ${className}`}><span className="sr-only">{label}</span><Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" aria-hidden="true" /><input type="search" value={value} onChange={onChange} placeholder={placeholder} className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-red-500" /></label>;
}

export function AdminButton({ href, variant = "secondary", children, className = "", ...props }) {
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black transition ${adminButtonVariants[variant] || adminButtonVariants.secondary} ${adminUi.focusRing} ${className}`;
  return href ? <Link href={href} className={classes} {...props}>{children}</Link> : <button type="button" className={classes} {...props}>{children}</button>;
}

export function AdminModulePrimaryAction(props) {
  return <AdminButton variant="primary" {...props} />;
}

export function AdminSectionTitle({ eyebrow, title, description, actions }) {
  return <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div className="max-w-3xl">{eyebrow ? <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-red-400">{eyebrow}</p> : null}{title ? <h2 className="mt-2 text-xl font-black text-white md:text-2xl">{title}</h2> : null}{description ? <p className="mt-2 text-sm leading-7 text-white/55 md:text-[0.95rem]">{description}</p> : null}</div>{actions ? <div className="flex flex-wrap gap-3 md:justify-end">{actions}</div> : null}</div>;
}
