export function createFieldUpdater(setter) {
  return function updateField(field, value) {
    setter((current) => ({ ...current, [field]: value }));
  };
}
