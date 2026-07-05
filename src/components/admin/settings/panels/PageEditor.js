import PageForm from "../components/PageForm";

export default function PageEditor({
  selectedPage,
  pageForm,
  pageLoading,
  onSubmit,
  onFieldChange,
  onSlugChange,
  onReset,
  onDelete,
  onAutoSlug,
}) {
  return (
    <PageForm
      selectedPage={selectedPage}
      pageForm={pageForm}
      pageLoading={pageLoading}
      onSubmit={onSubmit}
      onFieldChange={onFieldChange}
      onSlugChange={onSlugChange}
      onReset={onReset}
      onDelete={onDelete}
      onAutoSlug={onAutoSlug}
    />
  );
}
