import Page from "../../../../teams/edit/[id]/page";

export const dynamic = "force-dynamic";

export default function TableTennisTeamEditPage(props) {
  return <Page {...props} requiredDepartmentSlug="tischtennis" />;
}
