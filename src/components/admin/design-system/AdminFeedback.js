import Link from "next/link";
import { adminUi } from "./tokens";

export function AdminModuleEmptyState({ icon: Icon, title, description, actionHref, actionLabel, action = null, className = "" }) {
  return <section className={`rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center ${className}`}>{Icon ? <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400"><Icon size={30} aria-hidden="true" /></span> : null}<h2 className={`${Icon ? "mt-6" : ""} text-2xl font-black text-white`}>{title}</h2>{description ? <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/55">{description}</p> : null}{action || (actionHref && actionLabel ? <div className="mt-6"><Link href={actionHref} className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700">{actionLabel}</Link></div> : null)}</section>;
}

export function AdminPanel({ children, className = "" }) {
  return <section className={`${adminUi.panel} ${adminUi.panelPadding} ${className}`}>{children}</section>;
}
