import Link from "next/link";

export default function AdminActionButton({
  href,
  children,
  variant = "secondary",
}) {
  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700",
    secondary:
      "border border-white/10 bg-white/[0.04] text-white/75 hover:border-red-500/50 hover:text-white hover:bg-white/[0.07]",
  };

  return (
    <Link
      href={href}
      className={`inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-black transition ${variants[variant] || variants.secondary}`}
    >
      {children}
    </Link>
  );
}
