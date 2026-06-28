import FupaScript from "./FupaScript";

export default function FupaWidget({ widgetId, title, description, clubUrl }) {
  if (!widgetId) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
          FuPa
        </p>
        <h2 className="mt-3 text-3xl font-black">{title}</h2>
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6 text-white/55">
          Für diesen Bereich ist noch kein FuPa-Widget hinterlegt.
        </div>
      </section>
    );
  }

  return (
    <section className="fupa-widget-shell rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
      <FupaScript />

      <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
        FuPa
      </p>
      <h2 className="mt-3 text-3xl font-black">{title}</h2>
      {description && (
        <p className="mt-3 text-sm leading-6 text-white/55">{description}</p>
      )}

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white p-4 text-black">
        <div id={`fp-widget_root-${widgetId}`}>
          {clubUrl && (
            <a href={clubUrl} target="_blank" rel="noopener">
              DJK/VfL Giesenkirchen auf FuPa
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
