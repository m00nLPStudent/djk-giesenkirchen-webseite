export default function SponsorTabs({ categories = [] }) {
  if (!categories.length) return null;

  return (
    <div className="mt-10 flex flex-wrap gap-3">
      {categories.map((category) => (
        <a
          key={category.id}
          href={`#${category.slug}`}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white/70 transition hover:border-red-500 hover:bg-red-600 hover:text-white"
        >
          {category.name_de}
        </a>
      ))}
    </div>
  );
}
