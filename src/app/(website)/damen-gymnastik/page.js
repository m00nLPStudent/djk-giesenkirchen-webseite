import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PublicDepartmentSectionEmptyPage, PublicDepartmentSectionPage, loadPublicDepartmentSection } from "@/components/website/department-sections";

const DEPARTMENT_SLUG = "damen-gymnastik";
const PLACEHOLDER = "/images/sports-icons/gymnastics.png";

export const metadata = { title: "Gymnastikdamen", description: "Gymnastikdamen beim DJK/VfL Giesenkirchen: Informationen, Kontakt und aktuelle Trainingszeiten." };

export default async function WomenGymnasticsPage() {
  await connection();
  const result = await loadPublicDepartmentSection(DEPARTMENT_SLUG);
  if (result.status === "not_found") notFound();
  if (result.error) throw result.error;
  if (result.status === "empty") return <PublicDepartmentSectionEmptyPage title={result.department.name_de || "Gymnastikdamen"}/>;
  return <PublicDepartmentSectionPage data={result.data} placeholder={PLACEHOLDER}/>;
}
