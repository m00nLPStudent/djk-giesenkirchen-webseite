import { connection } from "next/server";
import { DownloadsPublicPage, loadPublicDownloadGroups } from "@/components/website/downloads";

export const metadata = {
  title: "Downloads | DJK/VfL Giesenkirchen",
  description: "Wichtige Dokumente, Formulare und Informationen des DJK/VfL Giesenkirchen zum sicheren Herunterladen.",
};

export default async function DownloadsPage() {
  await connection();
  const result = await loadPublicDownloadGroups();
  return <DownloadsPublicPage groups={result.groups} />;
}
