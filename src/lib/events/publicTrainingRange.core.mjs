export function resolvePublicTrainingRange(searchParams = {}, now = new Date()) {
  const range = searchParams?.range === "week" ? "week" : "short";
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = range === "week" ? 6 : 1;
  const to = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + days,
    23,
    59,
    59,
    999,
  );

  return {
    range,
    from,
    to,
    maxOccurrencesPerTraining: range === "week" ? 8 : 3,
  };
}
