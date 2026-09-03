import Page from "../../../../players/edit/[id]/page";

export const dynamic = "force-dynamic";

export default function TableTennisPlayerEditPage(props) {
  return <Page {...props} requiredDepartmentSlug="tischtennis" />;
}
