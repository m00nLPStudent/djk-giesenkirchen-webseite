export default function PublicCard({ as: Element = "section", children, className = "", ...props }) {
  return <Element className={`rounded-3xl border border-white/10 bg-[#18181f]/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.22)] sm:p-8 ${className}`} {...props}>{children}</Element>;
}
