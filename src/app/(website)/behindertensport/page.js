import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PublicDepartmentSectionEmptyPage, PublicDepartmentSectionPage, loadPublicDepartmentSection } from "@/components/website/department-sections";

const DEPARTMENT_SLUG = "behindertensport";

export const metadata = { title: "Behindertensport", description: "Behindertensport beim DJK/VfL Giesenkirchen: Informationen, Kontakt und aktuelle Trainingszeiten." };

export default async function DisabilitySportsPage() {
  await connection();
  const result = await loadPublicDepartmentSection(DEPARTMENT_SLUG);
  if (result.status === "not_found") notFound();
  if (result.error) throw result.error;
  if (result.status === "empty") return <PublicDepartmentSectionEmptyPage title={result.department.name_de || "Behindertensport"}/>;
  return <PublicDepartmentSectionPage data={result.data}/>;
}
