import Page from "../../../teams/[id]/page";

export const dynamic = "force-dynamic";

export default function TableTennisTeamDetailPage(props) {
  return <Page {...props} requiredDepartmentSlug="tischtennis" />;
}
