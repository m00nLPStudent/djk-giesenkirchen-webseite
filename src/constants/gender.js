export const GENDER_OPTIONS = [
  { value: "male", label: "Männlich" },
  { value: "female", label: "Weiblich" },
  { value: "diverse", label: "Divers" },
];

export function getGenderLabel(value) {
  return GENDER_OPTIONS.find((option) => option.value === value)?.label || "";
}
