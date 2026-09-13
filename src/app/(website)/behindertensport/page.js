import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PublicDepartmentSectionPage, loadPublicDepartmentSection } from "@/components/website/department-sections";

const DEPARTMENT_SLUG = "behindertensport";

export const metadata = { title: "Behindertensport", description: "Behindertensport beim DJK/VfL Giesenkirchen: Informationen, Kontakt und aktuelle Trainingszeiten." };

export default async function DisabilitySportsPage() {
  await connection();
  const result = await loadPublicDepartmentSection(DEPARTMENT_SLUG);
  if (result.error || !result.data) notFound();
  return <PublicDepartmentSectionPage data={result.data}/>;
}
