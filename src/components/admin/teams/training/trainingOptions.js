export const WEEKDAY_OPTIONS = [
  { value: 1, label: "Montag" },
  { value: 2, label: "Dienstag" },
  { value: 3, label: "Mittwoch" },
  { value: 4, label: "Donnerstag" },
  { value: 5, label: "Freitag" },
  { value: 6, label: "Samstag" },
  { value: 7, label: "Sonntag" },
];

export const TRAINING_TYPE_OPTIONS = [
  { value: "training", label: "Training" },
  { value: "torwart", label: "Torwarttraining" },
  { value: "foerdertraining", label: "Fördertraining" },
  { value: "athletik", label: "Athletik" },
  { value: "hallentraining", label: "Hallentraining" },
  { value: "sonstiges", label: "Sonstiges" },
];

export const TABLE_TENNIS_TRAINING_TYPE_OPTIONS = TRAINING_TYPE_OPTIONS.filter(({ value }) => ["training", "foerdertraining", "sonstiges"].includes(value));
export const TRAINING_LOCATION_TYPE_OPTIONS = [
  { value: "kleinfeld", label: "Kleinfeld" }, { value: "rasenplatz", label: "Rasenplatz" },
  { value: "kunstrasen", label: "Kunstrasen" }, { value: "halle", label: "Halle" },
];
export function getTrainingTypeOptions(departmentSlug) { return departmentSlug === "tischtennis" ? TABLE_TENNIS_TRAINING_TYPE_OPTIONS : TRAINING_TYPE_OPTIONS; }
export function getTrainingLocationTypeOptions(departmentSlug) { return departmentSlug === "tischtennis" ? TRAINING_LOCATION_TYPE_OPTIONS.filter(({ value }) => value === "halle") : TRAINING_LOCATION_TYPE_OPTIONS; }
