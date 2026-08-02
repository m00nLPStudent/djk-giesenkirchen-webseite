"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageForm from "./components/PageForm";
import { createInitialPageForm } from "./helpers/settingsInitialState";
import { createPageHandlers } from "./helpers/pageHandlers";

export default function SettingsPageEditorView({ initialPage = null }) {
  const router = useRouter();
  const [selectedPage, setSelectedPage] = useState(initialPage);
  const [form, setForm] = useState(() => createInitialPageForm(initialPage));
  const [loading, setLoading] = useState(false);
  const handlers = createPageHandlers({ router, selectedPageId: selectedPage?.id || null, selectedPage, pageForm: form, setPages: () => {}, setSelectedPageId: () => {}, setPageForm: setForm, setPageLoading: setLoading, onSaved: (saved) => { setSelectedPage(saved); router.replace(`/admin/settings/pages/edit/${saved.id}`); }, onDeleted: () => router.replace("/admin/settings?tab=pages") });
  return <PageForm selectedPage={selectedPage} pageForm={form} pageLoading={loading} onSubmit={handlers.handlePageSave} onFieldChange={handlers.updatePageField} onSlugChange={handlers.handlePageSlugChange} onReset={() => router.push("/admin/settings/pages/new")} onDelete={handlers.handlePageDelete} onAutoSlug={handlers.handlePageTitleBlur} />;
}
