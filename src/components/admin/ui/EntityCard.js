import Link from "next/link";

export function EntityCard({ children, image, imageAlt = "Bild", imageSize = "md" }) {
  const imageSizes = {
    sm: "h-28 w-28",
    md: "h-32 w-32",
  };

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[140px_1fr]">
      <div className={`flex ${imageSizes[imageSize] || imageSizes.md} items-center justify-center overflow-hidden rounded-3xl bg-black/20`}>
        <img src={image} alt={imageAlt} className="h-full w-full object-cover" />
      </div>

      <div>{children}</div>
    </div>
  );
}

export function EntityCardBadges({ children }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export function EntityCardTitle({ children, className = "" }) {
  return <h2 className={`mt-4 text-2xl font-black ${className}`}>{children}</h2>;
}

export function EntityCardMeta({ children }) {
  if (!children) return null;
  return <p className="mt-3 max-w-3xl text-white/60">{children}</p>;
}

export function EntityCardActions({ children }) {
  return <div className="mt-5 flex flex-wrap gap-3">{children}</div>;
}

export function EntityActionLink({ href, children, variant = "default", target }) {
  const variants = {
    default: "border border-white/10 text-white/70 hover:border-red-500 hover:text-white",
    primary: "bg-red-600 text-white hover:bg-red-700",
  };

  if (!href) return null;

  return (
    <Link
      href={href}
      target={target}
      className={`rounded-full px-4 py-2 text-sm font-bold transition ${variants[variant] || variants.default}`}
    >
      {children}
    </Link>
  );
}

export function EntityDeleteButton({ onClick, deleting = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deleting}
      className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
    >
      {deleting ? "Löscht..." : "Löschen"}
    </button>
  );
}
