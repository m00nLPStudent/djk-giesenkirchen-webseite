export {
  loadPublicTableTennisBoard,
  loadPublicTableTennisTeamBySlug,
  loadPublicTableTennisTeamSummaries,
  loadPublicTableTennisTeams,
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
