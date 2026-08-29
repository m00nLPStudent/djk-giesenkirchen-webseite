import { permanentRedirect } from "next/navigation";

export default function LegacyFootballHistoryPage() {
  permanentRedirect("/verein/vereinsgeschichte");
}
