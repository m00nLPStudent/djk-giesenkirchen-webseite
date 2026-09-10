import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PublicDepartmentSectionPage, loadPublicDepartmentSection } from "@/components/website/department-sections";

const DEPARTMENT_SLUG = "damen-gymnastik";
const PLACEHOLDER = "/images/sports-icons/gymnastics.png";

export const metadata = { title: "Gymnastikdamen | DJK/VfL Giesenkirchen", description: "Gymnastikdamen beim DJK/VfL Giesenkirchen: Informationen, Kontakt und aktuelle Trainingszeiten." };

export default async function WomenGymnasticsPage() {
  await connection();
  const result = await loadPublicDepartmentSection(DEPARTMENT_SLUG);
  if (result.error || !result.data) notFound();
  return <PublicDepartmentSectionPage data={result.data} placeholder={PLACEHOLDER}/>;
}
