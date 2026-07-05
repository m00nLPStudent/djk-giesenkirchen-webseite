import PageList from "../components/PageList";
import PageEditor from "../panels/PageEditor";

export default function PagesTab({
  pages,
  selectedPageId,
  selectedPage,
  pageForm,
  pageLoading,
  onSelectPage,
  onPageSubmit,
  onPageFieldChange,
  onPageSlugChange,
  onResetPageForm,
  onDeletePage,
  onAutoSlug,
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
      <PageList
        pages={pages}
        selectedPageId={selectedPageId}
        onSelectPage={onSelectPage}
      />

      <PageEditor
        selectedPage={selectedPage}
        pageForm={pageForm}
        pageLoading={pageLoading}
        onSubmit={onPageSubmit}
        onFieldChange={onPageFieldChange}
        onSlugChange={onPageSlugChange}
        onReset={onResetPageForm}
        onDelete={onDeletePage}
        onAutoSlug={onAutoSlug}
      />
    </div>
  );
}
