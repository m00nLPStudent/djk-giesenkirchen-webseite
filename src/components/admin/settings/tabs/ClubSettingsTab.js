import ClubSettingsPanel from "../panels/ClubSettingsPanel";

export default function ClubSettingsTab({
  clubForm,
  clubLoading,
  onSubmit,
  onFieldChange,
}) {
  return (
    <ClubSettingsPanel
      clubForm={clubForm}
      clubLoading={clubLoading}
      onSubmit={onSubmit}
      onFieldChange={onFieldChange}
    />
  );
}
