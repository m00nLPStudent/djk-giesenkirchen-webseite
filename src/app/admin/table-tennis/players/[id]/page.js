import Page from "../../../players/[id]/page";

export const dynamic = "force-dynamic";

export default function TableTennisPlayerDetailPage(props) {
  return <Page {...props} requiredDepartmentSlug="tischtennis" />;
}
