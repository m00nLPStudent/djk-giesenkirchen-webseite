import FupaCard from "./FupaCard";
import FupaError from "./FupaError";
import FupaScript from "./FupaScript";

export default function FupaWidget({ widgetId, title, description, clubUrl }) {
  if (!widgetId) {
    return (
      <FupaCard title={title} description={description}>
        <FupaError title={title} />
      </FupaCard>
    );
  }

  return (
    <FupaCard title={title} description={description} className="fupa-widget-shell">
      <FupaScript />

      <div className="fupa-widget-frame flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#1b1b21] p-4 text-white">
        <div id={`fp-widget_root-${widgetId}`}>
          {clubUrl && (
            <a href={clubUrl} target="_blank" rel="noopener">
              DJK/VfL Giesenkirchen auf FuPa
            </a>
          )}
        </div>
      </div>
    </FupaCard>
  );
}
