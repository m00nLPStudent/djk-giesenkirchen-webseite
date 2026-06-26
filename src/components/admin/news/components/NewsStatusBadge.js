import { Eye, Clock3, FileText } from "lucide-react";

export default function NewsStatusBadge({ isPublished, publishedAt }) {
  const now = new Date();

  if (!isPublished) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400">
        <FileText size={14} />
        Entwurf
      </span>
    );
  }

  if (publishedAt && new Date(publishedAt) > now) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-400">
        <Clock3 size={14} />
        Geplant
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">
      <Eye size={14} />
      Veröffentlicht
    </span>
  );
}
