export {
  loadPublicTableTennisBoard,
  loadPublicTableTennisTeamBySlug,
  loadPublicTableTennisTeamSummaries,
  loadPublicTableTennisTeams,
  loadPublicTableTennisCompetitionBySlug,
  loadPublicTableTennisCompetitionOptions,
  resolveActiveTableTennisDepartment,
} from "./tableTennisPublic.repository";
export {
  TableTennisContactCard,
  TableTennisPersonCard,
  TableTennisTeamCard,
  TableTennisTeamHero,
  TableTennisTrainingList,
  formatTableTennisWeekday,
} from "./TableTennisPublicUi";
export { default as TableTennisTeamDetailTabs } from "./TableTennisTeamDetailTabs";
export { default as TableTennisCompetitionView } from "./TableTennisCompetitionView";
