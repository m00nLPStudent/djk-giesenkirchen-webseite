import FootballDeCard from "./FootballDeCard";
import FootballDeError from "./FootballDeError";
import FootballDeScript from "./FootballDeScript";

export default function FootballDeWidget({ widgetId, widgetType, title, description }) {
  if (!widgetId) {
    return (
      <FootballDeCard title={title} description={description}>
        <FootballDeError title={title} />
      </FootballDeCard>
    );
  }

  return (
    <FootballDeCard title={title} description={description} className="football-de-widget-shell">
      <FootballDeScript />

      <div className="football-de-widget-frame flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#1b1b21] p-4 text-white">
        <div
          className="fussballde_widget"
          data-id={widgetId}
          data-type={widgetType}
          style={{ width: "100%" }}
        />
      </div>
    </FootballDeCard>
  );
}
