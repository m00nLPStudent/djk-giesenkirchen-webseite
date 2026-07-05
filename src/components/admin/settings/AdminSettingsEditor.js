"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FormActions,
  FormGrid,
  FormHintBox,
  FormSection,
  InputField,
  SelectField,
} from "@/components/admin/forms";
import AdminRichTextEditor from "@/components/admin/richtext/AdminRichTextEditor";
import TabNavigation from "@/components/admin/ui/TabNavigation";
import EntityBadge, {
  EntityStatusBadge,
} from "@/components/admin/ui/EntityBadge";
import { AdminImageUpload } from "@/components/admin/media";
import useImageUpload from "@/components/admin/hooks/useImageUpload";
import {
  forwardMembershipRequest,
  saveMembershipRequestStatus,
} from "@/lib/membership/membership.service";
import {
  createClubContact,
  createMembershipRecipient,
  deleteClubContact,
  deleteClubContactImage,
  deleteMembershipRecipient,
  deletePage,
  CLUB_CONTACT_PLACEHOLDER_IMAGE,
  saveClubSettings,
  savePage,
  updateClubContact,
  updateMembershipRecipient,
  uploadClubContactImage,
} from "./settings.service";

const SETTINGS_TABS = [
  { id: "club", label: "Vereinsdaten" },
  { id: "contacts", label: "Allgemeine Kontakte" },
  { id: "membership", label: "Mitglied werden" },
  { id: "pages", label: "Seiten" },
];

const MEMBERSHIP_SUBVIEWS = [
  { id: "recipients", label: "Empfänger" },
  { id: "requests", label: "Mitgliedsanfragen" },
];

const MEMBERSHIP_REQUEST_TYPE_OPTIONS = [
  { value: "", label: "Alle Anfragearten" },
  { value: "aktives-mitglied-fussball", label: "Aktives Mitglied Fußball" },
  { value: "trainer-werden", label: "Trainer werden" },
  { value: "passives-mitglied", label: "Passives Mitglied" },
  { value: "sonstiges", label: "Sonstiges" },
];

const MEMBERSHIP_STATUS_OPTIONS = [
  { value: "new", label: "Neu" },
  { value: "in_progress", label: "In Bearbeitung" },
  { value: "done", label: "Erledigt" },
];

const MEMBERSHIP_FORWARD_TYPE_OPTIONS = [
  { value: "coach", label: "Trainer" },
  { value: "board", label: "Vorstand" },
];

const CONTACT_CATEGORY_OPTIONS = [
  { value: "allgemein", label: "Allgemein" },
  { value: "vorstand-verein", label: "Vorstand Verein" },
  { value: "vorstand-fussball", label: "Vorstand Fußball" },
  { value: "jugend", label: "Jugend" },
  { value: "platzanlage", label: "Platzanlage" },
  { value: "web-medien", label: "Web / Medien" },
  { value: "verwaltung", label: "Verwaltung" },
];

const ROLE_TEMPLATES = [
  {
    value: "jugendschutzbeauftragter",
    role_de: "Jugendschutzbeauftragter",
    role_en: "Youth Protection Officer",
  },
  { value: "platzwart", role_de: "Platzwart", role_en: "Groundskeeper" },
  { value: "webmaster", role_de: "Webmaster", role_en: "Webmaster" },
  {
    value: "vorsitzender-verein",
    role_de: "1. Vorsitzender Verein",
    role_en: "1st Chairman Club",
  },
  {
    value: "vorsitzender-fussball",
    role_de: "1. Vorsitzender Fußball",
    role_en: "1st Chairman Football",
  },
  {
    value: "geschaeftsfuehrer-verein",
    role_de: "Geschäftsführer Verein",
    role_en: "Managing Director Club",
  },
  {
    value: "geschaeftsfuehrer-fussball",
    role_de: "Geschäftsführer Fußball",
    role_en: "Managing Director Football",
  },
  { value: "jugendleiter", role_de: "Jugendleiter", role_en: "Head of Youth" },
  { value: "kassierer", role_de: "Kassierer", role_en: "Treasurer" },
  {
    value: "presse",
    role_de: "Presse / Öffentlichkeitsarbeit",
    role_en: "Press / Public Relations",
  },
  { value: "sonstiges", role_de: "", role_en: "" },
];

const ROLE_TEMPLATE_BY_VALUE = ROLE_TEMPLATES.reduce((map, entry) => {
  map[entry.value] = entry;
  return map;
}, {});

function getMembershipRequestTypeLabel(value = "") {
  return (
    MEMBERSHIP_REQUEST_TYPE_OPTIONS.find((item) => item.value === value)
      ?.label ||
    value ||
    "Alle Anfragearten"
  );
}

function getMembershipStatusLabel(value = "new") {
  return (
    MEMBERSHIP_STATUS_OPTIONS.find((item) => item.value === value)?.label ||
    value
  );
}

function getMembershipForwardTypeLabel(value = "") {
  return (
    MEMBERSHIP_FORWARD_TYPE_OPTIONS.find((item) => item.value === value)
      ?.label ||
    value ||
    "-"
  );
}

function getPersonDisplayName(person = {}) {
  return (
    `${person.first_name || ""} ${person.last_name || ""}`.trim() ||
    person.name ||
    "Unbekannte Person"
  );
}

function getCoachOptionLabel(coach) {
  const name = getPersonDisplayName(coach);
  const role = coach?.role_de || coach?.role || "Trainer";
  const team = coach?.teams?.name_de || "Ohne Mannschaft";
  return `${name} · ${role} · ${team}`;
}

function getBoardOptionLabel(member) {
  const name = getPersonDisplayName(member);
  const role = member?.role_de || "Vorstand";
  return `${name} · ${role}`;
}

function getForwardTargets(type, coaches = [], boardMembers = []) {
  if (type === "coach") {
    return coaches.map((coach) => ({
      id: coach.id,
      name: getPersonDisplayName(coach),
      email: coach.email || "",
      label: getCoachOptionLabel(coach),
    }));
  }

  if (type === "board") {
    return boardMembers.map((member) => ({
      id: member.id,
      name: getPersonDisplayName(member),
      email: member.email || "",
      label: getBoardOptionLabel(member),
    }));
  }

  return [];
}

function findRoleTemplateValue(roleDe = "") {
  const normalized = String(roleDe || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "jugendschutzbeauftragter";

  const found = ROLE_TEMPLATES.find(
    (entry) =>
      entry.value !== "sonstiges" &&
      entry.role_de.trim().toLowerCase() === normalized,
  );

  return found?.value || "sonstiges";
}

function getCategoryLabel(category) {
  return (
    CONTACT_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ||
    category ||
    "Allgemein"
  );
}

function normalizeSlug(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseJsonObject(source, fallback = {}) {
  if (!source) return fallback;
  if (typeof source === "object" && !Array.isArray(source)) return source;
  return fallback;
}

function createClubSettingsForm(settings) {
  const colors = parseJsonObject(settings?.club_colors, {});
  const socials = parseJsonObject(settings?.social_links, {});

  return {
    club_name: settings?.club_name || "",
    short_name: settings?.short_name || "",
    street: settings?.street || "",
    house_number: settings?.house_number || "",
    postal_code: settings?.postal_code || "",
    city: settings?.city || "",
    phone: settings?.phone || "",
    email: settings?.email || "",
    website_url: settings?.website_url || "",
    registry_info: settings?.registry_info || "",
    copyright_text: settings?.copyright_text || "",
    google_maps_url: settings?.google_maps_url || "",
    color_primary: colors.primary || "",
    color_secondary: colors.secondary || "",
    color_accent: colors.accent || "",
    social_facebook: socials.facebook || "",
    social_instagram: socials.instagram || "",
    social_youtube: socials.youtube || "",
    social_tiktok: socials.tiktok || "",
    social_linkedin: socials.linkedin || "",
    social_x: socials.x || "",
  };
}

function createInitialContactForm(contact = null) {
  const roleTemplate = findRoleTemplateValue(contact?.role_de || "");

  return {
    category: contact?.category || "allgemein",
    role_template: roleTemplate,
    role_de: contact?.role_de || "",
    role_en: contact?.role_en || "",
    contact_name: contact?.contact_name || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    image_url: contact?.image_url || "",
    is_public: contact?.is_public ?? true,
    is_active: contact?.is_active ?? true,
    sort_order: contact?.sort_order ?? 0,
  };
}

function createInitialPageForm(page = null) {
  return {
    slug: page?.slug || "",
    title_de: page?.title_de || "",
    title_en: page?.title_en || "",
    content_de: page?.content_de || "",
    content_en: page?.content_en || "",
    is_published: page?.is_published ?? false,
    show_in_footer: page?.show_in_footer ?? false,
    sort_order: page?.sort_order ?? 0,
  };
}

function createInitialMembershipRecipientForm(item = null) {
  return {
    email: item?.email || "",
    label: item?.label || "",
    request_type: item?.request_type || "",
    is_active: item?.is_active ?? true,
    sort_order: item?.sort_order ?? 0,
  };
}

function createInitialMembershipRequestForm(item = null) {
  return {
    status: item?.status || "new",
    internal_note: item?.internal_note || "",
    forwarded_to_type: item?.forwarded_to_type || "",
    forwarded_to_id: item?.forwarded_to_id || "",
    forwarded_note: item?.forwarded_note || "",
  };
}

function formatRequestDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MembershipSubviewTabs({ activeTab, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-[2rem] border border-white/10 bg-[#17171d]/95 p-3 backdrop-blur">
      {MEMBERSHIP_SUBVIEWS.map((tab) => {
        const active = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-full px-5 py-3 text-sm font-black transition ${
              active
                ? "bg-red-600 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminSettingsEditor({
  initialClubSettings,
  initialClubContacts = [],
  initialPages = [],
  initialMembershipRecipients = [],
  initialMembershipRequests = [],
  initialCoaches = [],
  initialBoardMembers = [],
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("club");
  const [membershipSubview, setMembershipSubview] = useState("recipients");

  const [clubSettings, setClubSettings] = useState(initialClubSettings);
  const [clubForm, setClubForm] = useState(() =>
    createClubSettingsForm(initialClubSettings),
  );
  const [clubLoading, setClubLoading] = useState(false);

  const [contacts, setContacts] = useState(initialClubContacts);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactForm, setContactForm] = useState(createInitialContactForm());
  const [contactLoading, setContactLoading] = useState(false);

  const [pages, setPages] = useState(initialPages);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [pageForm, setPageForm] = useState(createInitialPageForm());
  const [pageLoading, setPageLoading] = useState(false);

  const [membershipRecipients, setMembershipRecipients] = useState(
    initialMembershipRecipients,
  );
  const [selectedMembershipRecipientId, setSelectedMembershipRecipientId] =
    useState(null);
  const [membershipRecipientForm, setMembershipRecipientForm] = useState(
    createInitialMembershipRecipientForm(),
  );
  const [membershipRecipientLoading, setMembershipRecipientLoading] =
    useState(false);

  const [membershipRequests, setMembershipRequests] = useState(
    initialMembershipRequests,
  );
  const [selectedMembershipRequestId, setSelectedMembershipRequestId] =
    useState(null);
  const [membershipRequestForm, setMembershipRequestForm] = useState(
    createInitialMembershipRequestForm(),
  );
  const [membershipRequestLoading, setMembershipRequestLoading] =
    useState(false);

  const selectedContact = useMemo(
    () => contacts.find((item) => item.id === selectedContactId) || null,
    [contacts, selectedContactId],
  );
  const selectedPage = useMemo(
    () => pages.find((item) => item.id === selectedPageId) || null,
    [pages, selectedPageId],
  );
  const selectedMembershipRecipient = useMemo(
    () =>
      membershipRecipients.find(
        (item) => item.id === selectedMembershipRecipientId,
      ) || null,
    [membershipRecipients, selectedMembershipRecipientId],
  );
  const selectedMembershipRequest = useMemo(
    () =>
      membershipRequests.find(
        (item) => item.id === selectedMembershipRequestId,
      ) || null,
    [membershipRequests, selectedMembershipRequestId],
  );
  const forwardingTargets = useMemo(
    () =>
      getForwardTargets(
        membershipRequestForm.forwarded_to_type,
        initialCoaches,
        initialBoardMembers,
      ),
    [
      initialBoardMembers,
      initialCoaches,
      membershipRequestForm.forwarded_to_type,
    ],
  );

  const { uploadImage: uploadContactImage, removeImage: removeContactImage } =
    useImageUpload({
      currentUrl: contactForm.image_url,
      placeholderUrl: CLUB_CONTACT_PLACEHOLDER_IMAGE,
      uploadAction: uploadClubContactImage,
      deleteAction: deleteClubContactImage,
      onChange: (url) => updateContactField("image_url", url),
      getUploadContext: () => ({
        id: selectedContactId,
        role_de: contactForm.role_de,
        contact_name: contactForm.contact_name,
      }),
    });

  function sortedByOrder(items) {
    return [...items].sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
    );
  }

  function updateClubField(field, value) {
    setClubForm((current) => ({ ...current, [field]: value }));
  }

  function updateContactField(field, value) {
    setContactForm((current) => ({ ...current, [field]: value }));
  }

  function updatePageField(field, value) {
    setPageForm((current) => ({ ...current, [field]: value }));
  }

  function updateMembershipRecipientField(field, value) {
    setMembershipRecipientForm((current) => ({ ...current, [field]: value }));
  }

  function updateMembershipRequestField(field, value) {
    setMembershipRequestForm((current) => {
      if (field === "forwarded_to_type") {
        return {
          ...current,
          forwarded_to_type: value,
          forwarded_to_id: "",
        };
      }

      return { ...current, [field]: value };
    });
  }

  async function handleClubSave(event) {
    event.preventDefault();
    setClubLoading(true);
    const { data, error } = await saveClubSettings(
      clubForm,
      clubSettings?.id || null,
    );
    setClubLoading(false);

    if (error) {
      alert(error.message || "Fehler beim Speichern der Vereinsdaten.");
      return;
    }

    const nextSettings = data || clubSettings || null;
    setClubSettings(nextSettings);
    if (nextSettings) setClubForm(createClubSettingsForm(nextSettings));
    alert("Vereinsdaten gespeichert.");
    router.refresh();
  }

  function selectContact(contact) {
    setSelectedContactId(contact?.id || null);
    setContactForm(createInitialContactForm(contact));
  }

  function resetContactForm() {
    setSelectedContactId(null);
    setContactForm(createInitialContactForm());
  }

  function updateContactRoleTemplate(value) {
    const template = ROLE_TEMPLATE_BY_VALUE[value];

    setContactForm((current) => {
      if (!template || value === "sonstiges") {
        return { ...current, role_template: value };
      }

      return {
        ...current,
        role_template: value,
        role_de: template.role_de,
        role_en: template.role_en,
      };
    });
  }

  async function handleContactSave(event) {
    event.preventDefault();

    if (!contactForm.role_de.trim() || !contactForm.contact_name.trim()) {
      alert("Bitte Rolle (DE) und Name ausfüllen.");
      return;
    }

    setContactLoading(true);
    const result = selectedContactId
      ? await updateClubContact(selectedContactId, contactForm)
      : await createClubContact(contactForm);
    setContactLoading(false);

    if (result.error) {
      alert(result.error.message || "Fehler beim Speichern des Kontakts.");
      return;
    }

    const saved = result.data;
    if (!saved) {
      alert(
        "Kontakt wurde gespeichert, konnte aber nicht direkt zurückgeladen werden.",
      );
      router.refresh();
      return;
    }

    setContacts((current) => {
      const next = selectedContactId
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [...current, saved];
      return sortedByOrder(next);
    });

    selectContact(saved);
    alert("Kontakt gespeichert.");
    router.refresh();
  }

  async function handleContactDelete() {
    if (!selectedContact) return;

    const confirmed = window.confirm(
      `Kontakt \"${selectedContact.role_de}\" wirklich löschen?`,
    );
    if (!confirmed) return;

    const { error } = await deleteClubContact(selectedContact.id);
    if (error) {
      alert(error.message || "Kontakt konnte nicht gelöscht werden.");
      return;
    }

    setContacts((current) =>
      current.filter((item) => item.id !== selectedContact.id),
    );
    resetContactForm();
    alert("Kontakt gelöscht.");
    router.refresh();
  }

  function selectPage(page) {
    setSelectedPageId(page?.id || null);
    setPageForm(createInitialPageForm(page));
  }

  function resetPageForm() {
    setSelectedPageId(null);
    setPageForm(createInitialPageForm());
  }

  async function handlePageSave(event) {
    event.preventDefault();

    const preparedSlug = normalizeSlug(pageForm.slug || pageForm.title_de);
    if (!preparedSlug || !pageForm.title_de.trim()) {
      alert("Bitte mindestens Slug und Titel (DE) eintragen.");
      return;
    }

    setPageLoading(true);
    const result = await savePage(
      { ...pageForm, slug: preparedSlug },
      selectedPageId,
    );
    setPageLoading(false);

    if (result.error) {
      alert(result.error.message || "Fehler beim Speichern der Seite.");
      return;
    }

    const saved = result.data;
    if (!saved) {
      alert(
        "Seite wurde gespeichert, konnte aber nicht direkt zurückgeladen werden.",
      );
      router.refresh();
      return;
    }

    setPages((current) => {
      const next = selectedPageId
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [...current, saved];
      return sortedByOrder(next);
    });

    selectPage(saved);
    alert("Seite gespeichert.");
    router.refresh();
  }

  async function handlePageDelete() {
    if (!selectedPage) return;

    const confirmed = window.confirm(
      `Seite \"${selectedPage.title_de || selectedPage.slug}\" wirklich löschen?`,
    );
    if (!confirmed) return;

    const { error } = await deletePage(selectedPage.id);
    if (error) {
      alert(error.message || "Seite konnte nicht gelöscht werden.");
      return;
    }

    setPages((current) =>
      current.filter((item) => item.id !== selectedPage.id),
    );
    resetPageForm();
    alert("Seite gelöscht.");
    router.refresh();
  }

  function selectMembershipRecipient(item) {
    setSelectedMembershipRecipientId(item?.id || null);
    setMembershipRecipientForm(createInitialMembershipRecipientForm(item));
  }

  function resetMembershipRecipientForm() {
    setSelectedMembershipRecipientId(null);
    setMembershipRecipientForm(createInitialMembershipRecipientForm());
  }

  async function handleMembershipRecipientSave(event) {
    event.preventDefault();
    if (!membershipRecipientForm.email.trim()) {
      alert("Bitte eine E-Mail-Adresse eintragen.");
      return;
    }

    setMembershipRecipientLoading(true);
    const result = selectedMembershipRecipientId
      ? await updateMembershipRecipient(
          selectedMembershipRecipientId,
          membershipRecipientForm,
        )
      : await createMembershipRecipient(membershipRecipientForm);
    setMembershipRecipientLoading(false);

    if (result.error) {
      alert(result.error.message || "Fehler beim Speichern des Empfängers.");
      return;
    }

    const saved = result.data;
    if (!saved) {
      alert(
        "Empfänger wurde gespeichert, konnte aber nicht direkt zurückgeladen werden.",
      );
      router.refresh();
      return;
    }

    setMembershipRecipients((current) => {
      const next = selectedMembershipRecipientId
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [...current, saved];
      return sortedByOrder(next);
    });

    selectMembershipRecipient(saved);
    alert("Empfänger gespeichert.");
    router.refresh();
  }

  async function handleMembershipRecipientDelete() {
    if (!selectedMembershipRecipient) return;

    const confirmed = window.confirm(
      `Empfänger \"${selectedMembershipRecipient.email}\" wirklich löschen?`,
    );
    if (!confirmed) return;

    const { error } = await deleteMembershipRecipient(
      selectedMembershipRecipient.id,
    );
    if (error) {
      alert(error.message || "Empfänger konnte nicht gelöscht werden.");
      return;
    }

    setMembershipRecipients((current) =>
      current.filter((item) => item.id !== selectedMembershipRecipient.id),
    );
    resetMembershipRecipientForm();
    alert("Empfänger gelöscht.");
    router.refresh();
  }

  function selectMembershipRequest(item) {
    setSelectedMembershipRequestId(item?.id || null);
    setMembershipRequestForm(createInitialMembershipRequestForm(item));
  }

  async function handleMembershipRequestSave(event) {
    event.preventDefault();
    if (!selectedMembershipRequest) return;

    setMembershipRequestLoading(true);
    const result = await saveMembershipRequestStatus(
      selectedMembershipRequest,
      membershipRequestForm,
    );
    setMembershipRequestLoading(false);

    if (result.error) {
      alert(result.error.message || "Fehler beim Speichern der Anfrage.");
      return;
    }

    const saved = result.data;
    if (!saved) {
      alert(
        "Anfrage wurde gespeichert, konnte aber nicht direkt zurückgeladen werden.",
      );
      router.refresh();
      return;
    }

    setMembershipRequests((current) =>
      current.map((item) => (item.id === saved.id ? saved : item)),
    );
    selectMembershipRequest(saved);
    alert("Anfrage gespeichert.");
    router.refresh();
  }

  async function markMembershipRequestDone() {
    if (!selectedMembershipRequest) return;

    setMembershipRequestLoading(true);
    const result = await saveMembershipRequestStatus(
      selectedMembershipRequest,
      {
        ...membershipRequestForm,
        status: "done",
      },
    );
    setMembershipRequestLoading(false);

    if (result.error) {
      alert(result.error.message || "Status konnte nicht aktualisiert werden.");
      return;
    }

    const saved = result.data;
    if (!saved) {
      alert(
        "Status wurde gespeichert, konnte aber nicht direkt zurückgeladen werden.",
      );
      router.refresh();
      return;
    }

    setMembershipRequests((current) =>
      current.map((item) => (item.id === saved.id ? saved : item)),
    );
    selectMembershipRequest(saved);
    alert("Anfrage als erledigt markiert.");
    router.refresh();
  }

  async function handleMembershipRequestForward() {
    if (!selectedMembershipRequest) return;

    if (!membershipRequestForm.forwarded_to_type) {
      alert("Bitte zuerst Trainer oder Vorstand auswählen.");
      return;
    }

    if (!membershipRequestForm.forwarded_to_id) {
      alert("Bitte eine Person für die Weiterleitung auswählen.");
      return;
    }

    const selectedTarget = forwardingTargets.find(
      (item) =>
        String(item.id) === String(membershipRequestForm.forwarded_to_id),
    );

    if (!selectedTarget) {
      alert("Die ausgewählte Person konnte nicht geladen werden.");
      return;
    }

    setMembershipRequestLoading(true);
    const result = await forwardMembershipRequest(selectedMembershipRequest, {
      forwarded_to_type: membershipRequestForm.forwarded_to_type,
      forwarded_to_id: selectedTarget.id,
      forwarded_to_name: selectedTarget.name,
      forwarded_to_email: selectedTarget.email,
      forwarded_note: membershipRequestForm.forwarded_note,
    });
    setMembershipRequestLoading(false);

    if (result.error) {
      alert(
        result.error.message ||
          "Weiterleitung konnte nicht gespeichert werden.",
      );
      return;
    }

    const saved = result.data;
    if (!saved) {
      alert(
        "Weiterleitung wurde gespeichert, konnte aber nicht direkt zurückgeladen werden.",
      );
      router.refresh();
      return;
    }

    setMembershipRequests((current) =>
      current.map((item) => (item.id === saved.id ? saved : item)),
    );
    selectMembershipRequest(saved);
    alert("Anfrage weitergeleitet.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <TabNavigation
        tabs={SETTINGS_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "club" && (
        <form onSubmit={handleClubSave} className="space-y-6">
          <FormSection
            eyebrow="Einstellungen"
            title="Vereinsdaten"
            description="Allgemeine Stammdaten des Vereins für Website, Footer und rechtliche Angaben."
          >
            <FormGrid>
              <InputField
                label="Vereinsname"
                required
                value={clubForm.club_name}
                onChange={(event) =>
                  updateClubField("club_name", event.target.value)
                }
              />
              <InputField
                label="Kurzname"
                value={clubForm.short_name}
                onChange={(event) =>
                  updateClubField("short_name", event.target.value)
                }
              />
            </FormGrid>

            <div className="mt-5">
              <FormGrid columns={3}>
                <InputField
                  label="Straße"
                  value={clubForm.street}
                  onChange={(event) =>
                    updateClubField("street", event.target.value)
                  }
                />
                <InputField
                  label="Hausnummer"
                  value={clubForm.house_number}
                  onChange={(event) =>
                    updateClubField("house_number", event.target.value)
                  }
                />
                <InputField
                  label="PLZ"
                  value={clubForm.postal_code}
                  onChange={(event) =>
                    updateClubField("postal_code", event.target.value)
                  }
                />
              </FormGrid>
            </div>

            <div className="mt-5">
              <FormGrid>
                <InputField
                  label="Ort"
                  value={clubForm.city}
                  onChange={(event) =>
                    updateClubField("city", event.target.value)
                  }
                />
                <InputField
                  label="Telefon"
                  value={clubForm.phone}
                  onChange={(event) =>
                    updateClubField("phone", event.target.value)
                  }
                />
                <InputField
                  label="E-Mail"
                  type="email"
                  value={clubForm.email}
                  onChange={(event) =>
                    updateClubField("email", event.target.value)
                  }
                />
                <InputField
                  label="Website"
                  value={clubForm.website_url}
                  onChange={(event) =>
                    updateClubField("website_url", event.target.value)
                  }
                />
              </FormGrid>
            </div>

            <div className="mt-5">
              <FormGrid>
                <InputField
                  label="Vereinsregister"
                  value={clubForm.registry_info}
                  onChange={(event) =>
                    updateClubField("registry_info", event.target.value)
                  }
                />
                <InputField
                  label="Copyright"
                  value={clubForm.copyright_text}
                  onChange={(event) =>
                    updateClubField("copyright_text", event.target.value)
                  }
                />
                <InputField
                  label="Google Maps URL"
                  value={clubForm.google_maps_url}
                  onChange={(event) =>
                    updateClubField("google_maps_url", event.target.value)
                  }
                />
              </FormGrid>
            </div>
          </FormSection>

          <FormSection
            eyebrow="Farben"
            title="Vereinsfarben"
            description="Diese Felder speichern die Farben strukturiert im Datenfeld club_colors."
          >
            <FormGrid columns={3}>
              <InputField
                label="Primärfarbe"
                placeholder="#c4001a"
                value={clubForm.color_primary}
                onChange={(event) =>
                  updateClubField("color_primary", event.target.value)
                }
              />
              <InputField
                label="Sekundärfarbe"
                placeholder="#ffffff"
                value={clubForm.color_secondary}
                onChange={(event) =>
                  updateClubField("color_secondary", event.target.value)
                }
              />
              <InputField
                label="Akzentfarbe"
                placeholder="#101014"
                value={clubForm.color_accent}
                onChange={(event) =>
                  updateClubField("color_accent", event.target.value)
                }
              />
            </FormGrid>
          </FormSection>

          <FormSection
            eyebrow="Social"
            title="Social Links"
            description="Einfache Plattform-Links für die spätere Nutzung in Footer oder Kontaktbereich."
          >
            <FormGrid>
              <InputField
                label="Facebook"
                value={clubForm.social_facebook}
                onChange={(event) =>
                  updateClubField("social_facebook", event.target.value)
                }
              />
              <InputField
                label="Instagram"
                value={clubForm.social_instagram}
                onChange={(event) =>
                  updateClubField("social_instagram", event.target.value)
                }
              />
              <InputField
                label="YouTube"
                value={clubForm.social_youtube}
                onChange={(event) =>
                  updateClubField("social_youtube", event.target.value)
                }
              />
              <InputField
                label="TikTok"
                value={clubForm.social_tiktok}
                onChange={(event) =>
                  updateClubField("social_tiktok", event.target.value)
                }
              />
              <InputField
                label="LinkedIn"
                value={clubForm.social_linkedin}
                onChange={(event) =>
                  updateClubField("social_linkedin", event.target.value)
                }
              />
              <InputField
                label="X / Twitter"
                value={clubForm.social_x}
                onChange={(event) =>
                  updateClubField("social_x", event.target.value)
                }
              />
            </FormGrid>
          </FormSection>

          <FormActions
            loading={clubLoading}
            submitLabel="Vereinsdaten speichern"
            loadingLabel="Speichert Vereinsdaten..."
          />
        </form>
      )}

      {activeTab === "contacts" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
          <FormSection
            eyebrow="Kontakte"
            title="Vorhandene Kontakte"
            description="Wähle einen Eintrag zum Bearbeiten oder lege einen neuen Kontakt an."
          >
            <div className="space-y-3">
              {contacts.length === 0 && (
                <p className="text-sm text-white/55">
                  Noch keine allgemeinen Kontakte angelegt.
                </p>
              )}
              {contacts.map((contact) => {
                const active = selectedContactId === contact.id;
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => selectContact(contact)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-red-500/70 bg-red-600/10" : "border-white/10 bg-black/20 hover:border-red-500/40"}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <EntityStatusBadge active={contact.is_active} />
                      <EntityBadge
                        variant={contact.is_public ? "blue" : "neutral"}
                      >
                        {contact.is_public ? "Öffentlich" : "Intern"}
                      </EntityBadge>
                    </div>
                    <p className="mt-3 text-lg font-black">{contact.role_de}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {contact.contact_name}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">
                      {getCategoryLabel(contact.category)} · Sortierung{" "}
                      {contact.sort_order || 0}
                    </p>
                  </button>
                );
              })}
            </div>
          </FormSection>

          <form onSubmit={handleContactSave} className="space-y-6">
            <FormSection
              eyebrow="Kontakt"
              title={selectedContact ? "Kontakt bearbeiten" : "Neuer Kontakt"}
              description="Allgemeine Ansprechpartner wie Jugendschutz, Platzwart, Webmaster oder Presse."
            >
              <FormGrid>
                <SelectField
                  label="Kategorie"
                  required
                  value={contactForm.category}
                  onChange={(event) =>
                    updateContactField("category", event.target.value)
                  }
                >
                  {CONTACT_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Rollen-Vorlage"
                  required
                  value={contactForm.role_template}
                  onChange={(event) =>
                    updateContactRoleTemplate(event.target.value)
                  }
                >
                  {ROLE_TEMPLATES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value === "sonstiges"
                        ? "Sonstiges"
                        : option.role_de}
                    </option>
                  ))}
                </SelectField>
                <InputField
                  label="Rolle (DE)"
                  required
                  value={contactForm.role_de}
                  onChange={(event) =>
                    updateContactField("role_de", event.target.value)
                  }
                />
                <InputField
                  label="Rolle (EN)"
                  value={contactForm.role_en}
                  onChange={(event) =>
                    updateContactField("role_en", event.target.value)
                  }
                />
                <InputField
                  label="Name"
                  required
                  value={contactForm.contact_name}
                  onChange={(event) =>
                    updateContactField("contact_name", event.target.value)
                  }
                />
                <InputField
                  label="E-Mail"
                  type="email"
                  value={contactForm.email}
                  onChange={(event) =>
                    updateContactField("email", event.target.value)
                  }
                />
                <InputField
                  label="Telefon"
                  value={contactForm.phone}
                  onChange={(event) =>
                    updateContactField("phone", event.target.value)
                  }
                />
                <InputField
                  label="Sortierung"
                  type="number"
                  value={contactForm.sort_order}
                  onChange={(event) =>
                    updateContactField(
                      "sort_order",
                      Number(event.target.value || 0),
                    )
                  }
                />
              </FormGrid>

              {contactForm.role_template === "sonstiges" && (
                <p className="mt-4 text-sm text-white/55">
                  Für Sonstiges kannst du die Rolle frei über die Felder Rolle
                  (DE/EN) definieren.
                </p>
              )}

              <div className="mt-5">
                <AdminImageUpload
                  imageUrl={contactForm.image_url}
                  placeholderUrl={CLUB_CONTACT_PLACEHOLDER_IMAGE}
                  alt="Kontaktbild"
                  description="Kontaktbild für die interne Verwaltung und spätere öffentliche Kontaktdarstellung."
                  uploadLabel="Bild auswählen"
                  removeLabel="Bild entfernen"
                  onUpload={uploadContactImage}
                  onRemove={removeContactImage}
                />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={contactForm.is_public}
                    onChange={(event) =>
                      updateContactField("is_public", event.target.checked)
                    }
                  />
                  Öffentlich anzeigen
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={contactForm.is_active}
                    onChange={(event) =>
                      updateContactField("is_active", event.target.checked)
                    }
                  />
                  Aktiv
                </label>
              </div>
            </FormSection>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={resetContactForm}
                className="rounded-full border border-white/10 px-6 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
              >
                Neuer Kontakt
              </button>
              {selectedContact && (
                <button
                  type="button"
                  onClick={handleContactDelete}
                  className="rounded-full border border-red-500/60 px-6 py-3 text-sm font-bold text-red-300 transition hover:bg-red-600 hover:text-white"
                >
                  Kontakt löschen
                </button>
              )}
              <button
                type="submit"
                disabled={contactLoading}
                className="rounded-full bg-red-600 px-8 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {contactLoading ? "Speichert..." : "Kontakt speichern"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "membership" && (
        <div className="space-y-6">
          <MembershipSubviewTabs
            activeTab={membershipSubview}
            onChange={setMembershipSubview}
          />

          {membershipSubview === "recipients" && (
            <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
              <FormSection
                eyebrow="Mitglied werden"
                title="Empfänger"
                description="Verwalte, an welche E-Mail-Adressen spätere Mitgliedsanfragen je nach Anfrageart gesendet werden sollen."
              >
                <div className="space-y-3">
                  {membershipRecipients.length === 0 && (
                    <p className="text-sm text-white/55">
                      Noch keine Empfänger angelegt.
                    </p>
                  )}
                  {membershipRecipients.map((item) => {
                    const active = selectedMembershipRecipientId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectMembershipRecipient(item)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-red-500/70 bg-red-600/10" : "border-white/10 bg-black/20 hover:border-red-500/40"}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <EntityStatusBadge active={item.is_active} />
                          <EntityBadge variant="blue">
                            {getMembershipRequestTypeLabel(item.request_type)}
                          </EntityBadge>
                        </div>
                        <p className="mt-3 text-lg font-black">
                          {item.label || item.email}
                        </p>
                        <p className="mt-1 text-sm text-white/60">
                          {item.email}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">
                          Sortierung {item.sort_order || 0}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </FormSection>

              <form
                onSubmit={handleMembershipRecipientSave}
                className="space-y-6"
              >
                <FormSection
                  eyebrow="Formular"
                  title={
                    selectedMembershipRecipient
                      ? "Empfänger bearbeiten"
                      : "Neuer Empfänger"
                  }
                  description="Diese Daten werden für die spätere Zuordnung und den Mailversand von Mitgliedsanfragen verwendet."
                >
                  <FormGrid>
                    <InputField
                      label="E-Mail"
                      type="email"
                      required
                      value={membershipRecipientForm.email}
                      onChange={(event) =>
                        updateMembershipRecipientField(
                          "email",
                          event.target.value,
                        )
                      }
                    />
                    <InputField
                      label="Label"
                      value={membershipRecipientForm.label}
                      onChange={(event) =>
                        updateMembershipRecipientField(
                          "label",
                          event.target.value,
                        )
                      }
                    />
                    <SelectField
                      label="Anfrageart"
                      value={membershipRecipientForm.request_type}
                      onChange={(event) =>
                        updateMembershipRecipientField(
                          "request_type",
                          event.target.value,
                        )
                      }
                    >
                      {MEMBERSHIP_REQUEST_TYPE_OPTIONS.map((option) => (
                        <option
                          key={option.value || "all"}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                    <InputField
                      label="Sortierung"
                      type="number"
                      value={membershipRecipientForm.sort_order}
                      onChange={(event) =>
                        updateMembershipRecipientField(
                          "sort_order",
                          Number(event.target.value || 0),
                        )
                      }
                    />
                  </FormGrid>
                  <div className="mt-5">
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
                      <input
                        type="checkbox"
                        checked={membershipRecipientForm.is_active}
                        onChange={(event) =>
                          updateMembershipRecipientField(
                            "is_active",
                            event.target.checked,
                          )
                        }
                      />
                      Aktiv
                    </label>
                  </div>
                </FormSection>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetMembershipRecipientForm}
                    className="rounded-full border border-white/10 px-6 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
                  >
                    Neuer Empfänger
                  </button>
                  {selectedMembershipRecipient && (
                    <button
                      type="button"
                      onClick={handleMembershipRecipientDelete}
                      className="rounded-full border border-red-500/60 px-6 py-3 text-sm font-bold text-red-300 transition hover:bg-red-600 hover:text-white"
                    >
                      Empfänger löschen
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={membershipRecipientLoading}
                    className="rounded-full bg-red-600 px-8 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {membershipRecipientLoading
                      ? "Speichert..."
                      : "Empfänger speichern"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {membershipSubview === "requests" && (
            <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
              <FormSection
                eyebrow="Mitgliedsanfragen"
                title="Eingegangene Anfragen"
                description="Neueste Anfragen werden zuerst angezeigt. Wähle eine Anfrage, um Status und interne Angaben zu prüfen oder zu aktualisieren."
              >
                <div className="space-y-3">
                  {membershipRequests.length === 0 && (
                    <p className="text-sm text-white/55">
                      Noch keine Mitgliedsanfragen eingegangen.
                    </p>
                  )}
                  {membershipRequests.map((item) => {
                    const active = selectedMembershipRequestId === item.id;
                    const fullName =
                      `${item.first_name || ""} ${item.last_name || ""}`.trim();

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectMembershipRequest(item)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-red-500/70 bg-red-600/10" : "border-white/10 bg-black/20 hover:border-red-500/40"}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <EntityBadge variant="blue">
                            {getMembershipRequestTypeLabel(item.request_type)}
                          </EntityBadge>
                          <EntityBadge
                            variant={
                              item.status === "done"
                                ? "success"
                                : item.status === "in_progress"
                                  ? "warning"
                                  : "red"
                            }
                          >
                            {getMembershipStatusLabel(item.status)}
                          </EntityBadge>
                          {item.forwarded_at && (
                            <EntityBadge variant="success">
                              Weitergeleitet
                            </EntityBadge>
                          )}
                        </div>
                        <p className="mt-3 text-lg font-black">
                          {fullName || "Anfrage"}
                        </p>
                        <div className="mt-2 space-y-1 text-sm text-white/60">
                          <p>Jahrgang: {item.year_group || "-"}</p>
                          <p>Mannschaft: {item.teams?.name_de || "-"}</p>
                          <p>Telefon: {item.phone || "-"}</p>
                          <p>E-Mail: {item.email || "-"}</p>
                          <p>Eingang: {formatRequestDate(item.created_at)}</p>
                          {item.forwarded_at && (
                            <p>
                              Weitergeleitet an {item.forwarded_to_name || "-"}{" "}
                              (
                              {getMembershipForwardTypeLabel(
                                item.forwarded_to_type,
                              )}
                              )
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FormSection>

              <form
                onSubmit={handleMembershipRequestSave}
                className="space-y-6"
              >
                <FormSection
                  eyebrow="Anfrage"
                  title={
                    selectedMembershipRequest
                      ? "Anfrage bearbeiten"
                      : "Anfrage auswählen"
                  }
                  description="Status aktualisieren, komplette Anfrage lesen und später interne Notizen ergänzen."
                >
                  {!selectedMembershipRequest && (
                    <p className="text-sm text-white/55">
                      Wähle links eine Anfrage aus.
                    </p>
                  )}

                  {selectedMembershipRequest && (
                    <>
                      <FormGrid>
                        <InputField
                          label="Vorname"
                          value={selectedMembershipRequest.first_name || ""}
                          readOnly
                        />
                        <InputField
                          label="Nachname"
                          value={selectedMembershipRequest.last_name || ""}
                          readOnly
                        />
                        <InputField
                          label="Telefon"
                          value={selectedMembershipRequest.phone || ""}
                          readOnly
                        />
                        <InputField
                          label="E-Mail"
                          value={selectedMembershipRequest.email || ""}
                          readOnly
                        />
                        <InputField
                          label="Jahrgang"
                          value={selectedMembershipRequest.year_group || ""}
                          readOnly
                        />
                        <InputField
                          label="Gewünschte Mannschaft"
                          value={selectedMembershipRequest.teams?.name_de || ""}
                          readOnly
                        />
                      </FormGrid>

                      <div className="mt-5">
                        <SelectField
                          label="Status"
                          value={membershipRequestForm.status}
                          onChange={(event) =>
                            updateMembershipRequestField(
                              "status",
                              event.target.value,
                            )
                          }
                        >
                          {MEMBERSHIP_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </SelectField>
                      </div>

                      <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                              Weiterleiten an
                            </p>
                            <h3 className="mt-2 text-xl font-black text-white">
                              Trainer oder Vorstand auswählen
                            </h3>
                            <p className="mt-2 max-w-2xl text-sm text-white/55">
                              Die Anfrage wird nur in membership_requests
                              dokumentiert. Ein echter Mailversand folgt später.
                            </p>
                          </div>
                          {selectedMembershipRequest.forwarded_at && (
                            <EntityBadge variant="success">
                              Weitergeleitet am{" "}
                              {formatRequestDate(
                                selectedMembershipRequest.forwarded_at,
                              )}
                            </EntityBadge>
                          )}
                        </div>

                        <div className="mt-5">
                          <FormGrid>
                            <SelectField
                              label="Auswahltyp"
                              value={membershipRequestForm.forwarded_to_type}
                              onChange={(event) =>
                                updateMembershipRequestField(
                                  "forwarded_to_type",
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">Bitte wählen</option>
                              {MEMBERSHIP_FORWARD_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </SelectField>

                            <SelectField
                              label="Person"
                              value={membershipRequestForm.forwarded_to_id}
                              onChange={(event) =>
                                updateMembershipRequestField(
                                  "forwarded_to_id",
                                  event.target.value,
                                )
                              }
                              disabled={
                                !membershipRequestForm.forwarded_to_type
                              }
                            >
                              <option value="">
                                {membershipRequestForm.forwarded_to_type
                                  ? "Person auswählen"
                                  : "Bitte zuerst Typ wählen"}
                              </option>
                              {forwardingTargets.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </SelectField>
                          </FormGrid>
                        </div>

                        <div className="mt-5">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                            Weiterleitungsnotiz
                          </label>
                          <textarea
                            rows={4}
                            value={membershipRequestForm.forwarded_note}
                            onChange={(event) =>
                              updateMembershipRequestField(
                                "forwarded_note",
                                event.target.value,
                              )
                            }
                            placeholder="Optionaler Hinweis für spätere Übergabe oder Mail"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none transition focus:border-red-500"
                          />
                        </div>

                        {selectedMembershipRequest.forwarded_at && (
                          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                            <p>
                              Aktuelle Weiterleitung:{" "}
                              {selectedMembershipRequest.forwarded_to_name ||
                                "-"}{" "}
                              (
                              {getMembershipForwardTypeLabel(
                                selectedMembershipRequest.forwarded_to_type,
                              )}
                              )
                            </p>
                            <p className="mt-1">
                              E-Mail:{" "}
                              {selectedMembershipRequest.forwarded_to_email ||
                                "-"}
                            </p>
                            <p className="mt-1">
                              Notiz:{" "}
                              {selectedMembershipRequest.forwarded_note || "-"}
                            </p>
                          </div>
                        )}

                        <div className="mt-5 flex justify-end">
                          <button
                            type="button"
                            onClick={handleMembershipRequestForward}
                            disabled={membershipRequestLoading}
                            className="rounded-full border border-red-500/60 px-6 py-3 text-sm font-bold text-red-200 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                          >
                            {membershipRequestLoading
                              ? "Leitet weiter..."
                              : "Weiterleiten"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                          Nachricht
                        </label>
                        <textarea
                          rows={6}
                          value={selectedMembershipRequest.message || ""}
                          readOnly
                          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 outline-none"
                        />
                      </div>

                      {Object.prototype.hasOwnProperty.call(
                        selectedMembershipRequest,
                        "internal_note",
                      ) ? (
                        <div className="mt-5">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                            Interne Notiz
                          </label>
                          <textarea
                            rows={5}
                            value={membershipRequestForm.internal_note}
                            onChange={(event) =>
                              updateMembershipRequestField(
                                "internal_note",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none transition focus:border-red-500"
                          />
                        </div>
                      ) : (
                        <FormHintBox eyebrow="Hinweis">
                          Interne Notizen werden verfügbar, sobald die
                          vorbereitete SQL-Migration für membership_requests
                          angewendet wurde.
                        </FormHintBox>
                      )}
                    </>
                  )}
                </FormSection>

                {selectedMembershipRequest && (
                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={markMembershipRequestDone}
                      disabled={membershipRequestLoading}
                      className="rounded-full border border-green-500/60 px-6 py-3 text-sm font-bold text-green-300 transition hover:bg-green-600 hover:text-white disabled:opacity-50"
                    >
                      Als erledigt markieren
                    </button>
                    <button
                      type="submit"
                      disabled={membershipRequestLoading}
                      className="rounded-full bg-red-600 px-8 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      {membershipRequestLoading
                        ? "Speichert..."
                        : "Anfrage speichern"}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === "pages" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
          <FormSection
            eyebrow="Seiten"
            title="Statische Seiten"
            description="Impressum, Datenschutz und weitere CMS-Seiten verwalten."
          >
            <div className="space-y-3">
              {pages.length === 0 && (
                <p className="text-sm text-white/55">
                  Noch keine Seiten angelegt.
                </p>
              )}
              {pages.map((page) => {
                const active = selectedPageId === page.id;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => selectPage(page)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-red-500/70 bg-red-600/10" : "border-white/10 bg-black/20 hover:border-red-500/40"}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <EntityStatusBadge
                        active={page.is_published}
                        activeLabel="Veröffentlicht"
                        inactiveLabel="Entwurf"
                      />
                      <EntityBadge
                        variant={page.show_in_footer ? "blue" : "neutral"}
                      >
                        {page.show_in_footer ? "Im Footer" : "Nicht im Footer"}
                      </EntityBadge>
                    </div>
                    <p className="mt-3 text-lg font-black">
                      {page.title_de || page.slug}
                    </p>
                    <p className="mt-1 text-sm text-white/60">/{page.slug}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">
                      Sortierung {page.sort_order || 0}
                    </p>
                  </button>
                );
              })}
            </div>
          </FormSection>

          <form onSubmit={handlePageSave} className="space-y-6">
            <FormSection
              eyebrow="CMS"
              title={selectedPage ? "Seite bearbeiten" : "Neue Seite"}
              description="Titel, Slug, RichText-Inhalte und Sichtbarkeit der statischen Seite."
            >
              <FormGrid>
                <InputField
                  label="Slug"
                  required
                  value={pageForm.slug}
                  onChange={(event) =>
                    updatePageField("slug", normalizeSlug(event.target.value))
                  }
                />
                <InputField
                  label="Titel (DE)"
                  required
                  value={pageForm.title_de}
                  onChange={(event) =>
                    updatePageField("title_de", event.target.value)
                  }
                  onBlur={() => {
                    if (!pageForm.slug.trim() && pageForm.title_de.trim()) {
                      updatePageField("slug", normalizeSlug(pageForm.title_de));
                    }
                  }}
                />
                <InputField
                  label="Titel (EN)"
                  value={pageForm.title_en}
                  onChange={(event) =>
                    updatePageField("title_en", event.target.value)
                  }
                />
                <InputField
                  label="Sortierung"
                  type="number"
                  value={pageForm.sort_order}
                  onChange={(event) =>
                    updatePageField(
                      "sort_order",
                      Number(event.target.value || 0),
                    )
                  }
                />
              </FormGrid>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <AdminRichTextEditor
                  label="Inhalt (DE)"
                  value={pageForm.content_de}
                  placeholder="Hier den deutschen Seitentext pflegen..."
                  onChange={(value) => updatePageField("content_de", value)}
                />
                <AdminRichTextEditor
                  label="Inhalt (EN)"
                  value={pageForm.content_en}
                  placeholder="Maintain English page content here..."
                  onChange={(value) => updatePageField("content_en", value)}
                />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={pageForm.is_published}
                    onChange={(event) =>
                      updatePageField("is_published", event.target.checked)
                    }
                  />
                  Veröffentlicht
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={pageForm.show_in_footer}
                    onChange={(event) =>
                      updatePageField("show_in_footer", event.target.checked)
                    }
                  />
                  Im Footer anzeigen
                </label>
              </div>
            </FormSection>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={resetPageForm}
                className="rounded-full border border-white/10 px-6 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
              >
                Neue Seite
              </button>
              {selectedPage && (
                <button
                  type="button"
                  onClick={handlePageDelete}
                  className="rounded-full border border-red-500/60 px-6 py-3 text-sm font-bold text-red-300 transition hover:bg-red-600 hover:text-white"
                >
                  Seite löschen
                </button>
              )}
              <button
                type="submit"
                disabled={pageLoading}
                className="rounded-full bg-red-600 px-8 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {pageLoading ? "Speichert..." : "Seite speichern"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
