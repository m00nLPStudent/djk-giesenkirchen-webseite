import Link from "next/link";

export default function ContributionEmptyState({
  title,
  description,
  actionHref = null,
  actionLabel = null,
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/55">
        {description}
      </p>
      {actionHref && actionLabel && (
        <div className="mt-6">
          <Link
            href={actionHref}
            className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700"
          >
            {actionLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
