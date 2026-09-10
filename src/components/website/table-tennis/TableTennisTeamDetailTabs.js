import { PublicCard } from "@/components/website/layout";
import { TeamSectionTabs } from "@/components/website/team";
import { TableTennisContactCard, TableTennisPersonCard, TableTennisTrainingList } from "./TableTennisPublicUi";
import TableTennisCompetitionView from "./TableTennisCompetitionView";

function PeopleSection({ eyebrow, title, people, emptyLabel, kind }) {
  return <section><p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">{eyebrow}</p><h2 className="mt-3 text-3xl font-black">{title}</h2>{people.length ? <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{people.map((person) => <TableTennisPersonCard key={person.id} person={person} kind={typeof kind === "function" ? kind(person) : kind} />)}</div> : <p className="mt-6 text-white/55">{emptyLabel}</p>}</section>;
}

export default function TableTennisTeamDetailTabs({ training = [], roster = [], coaches = [], contact = null, competition = null }) {
  const tabs = [
    { id: "training", label: "Training", content: <PublicCard><p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">Training</p><h2 className="mt-3 text-3xl font-black">Trainingszeiten</h2><TableTennisTrainingList entries={training} /></PublicCard> },
    { id: "players", label: "Kader", content: <PeopleSection eyebrow="Mannschaft" title="Kader" people={roster} emptyLabel="Aktuell ist kein öffentlicher Kader hinterlegt." kind={(player) => player.yearGroup ? `Jahrgang ${player.yearGroup}` : "Spieler"} /> },
    { id: "staff", label: "Trainer", content: <PeopleSection eyebrow="Betreuung" title="Trainer" people={coaches} emptyLabel="Aktuell sind keine öffentlichen Trainerangaben hinterlegt." kind="Trainer" /> },
    { id: "competition", label: "Spielbetrieb", content: <TableTennisCompetitionView competition={competition} /> },
    { id: "contact", label: "Kontakt", content: <TableTennisContactCard contact={contact} /> },
  ];
  return <TeamSectionTabs tabs={tabs} initialTab="training" label="Tischtennis-Mannschaftsbereiche" />;
}
