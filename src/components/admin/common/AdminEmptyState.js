export default function AdminEmptyState({
  text,
  className = "text-sm text-white/55",
}) {
  return <p className={className}>{text}</p>;
}
