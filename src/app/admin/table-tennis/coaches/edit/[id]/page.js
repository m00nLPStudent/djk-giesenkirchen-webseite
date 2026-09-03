import Page from "../../../../coaches/edit/[id]/page";

export const dynamic = "force-dynamic";

export default function TableTennisCoachEditPage(props) {
  return <Page {...props} requiredDepartmentSlug="tischtennis" />;
}
