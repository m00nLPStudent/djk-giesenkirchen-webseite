import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AdminCard from "@/components/admin/common/AdminCard";
import { adminUi } from "./tokens";

export function AdminModuleList({ mobile, children, className = "", desktopClassName = "hidden overflow-hidden lg:block" }) {
  return <div className={`space-y-3 ${className}`}>{mobile}<AdminCard className={desktopClassName}>{children}</AdminCard></div>;
}

export function AdminModuleCards({ children, className = "lg:hidden" }) {
  return <div className={`space-y-3 ${className}`}>{children}</div>;
}

export function AdminListHeader({ columns, template, className = "" }) {
  return <div style={{ gridTemplateColumns: template }} className={`grid gap-4 border-b border-white/10 px-5 py-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/45 ${className}`}>{columns.map((column) => <span key={column.key || column.label} className={column.className}>{column.label}</span>)}</div>;
}

export function AdminListRow({ href, label, template, children, className = "" }) {
  return <Link href={href} aria-label={label} style={{ gridTemplateColumns: template }} className={`grid items-center gap-4 border-t border-white/10 px-5 py-3 text-sm transition hover:bg-white/[0.05] ${adminUi.focusRing} focus-visible:outline-offset-[-2px] ${className}`}>{children}</Link>;
}

export function AdminListMobileCard({ href, label, children, className = "" }) {
  return <Link href={href} aria-label={label} className={`block transition hover:border-red-500/40 hover:bg-white/[0.06] ${adminUi.mobileCard} ${adminUi.focusRing} ${className}`}>{children}</Link>;
}

export function AdminListChevron({ label }) {
  return <span className="flex items-center justify-end text-white/45"><span className="sr-only">{label}</span><ChevronRight size={18} aria-hidden="true" /></span>;
}

export function AdminModulePagination({ children, className = "" }) {
  return <nav aria-label="Seitennavigation" className={`${adminUi.panel} flex flex-col gap-3 p-4 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between ${className}`}>{children}</nav>;
}
