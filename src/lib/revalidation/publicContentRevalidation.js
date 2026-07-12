import "server-only";
import { revalidatePath } from "next/cache";

const PUBLIC_REVALIDATION_PATHS = {
  board: [{ path: "/fussball/abteilung/vorstand" }],
  sponsors: [{ path: "/fussball/sponsoren" }],
  teams: [
    { path: "/fussball/mannschaften" },
    { path: "/fussball/mannschaften/senioren" },
    { path: "/fussball/mannschaften/junioren" },
    { path: "/fussball/mannschaften/damen" },
    { path: "/fussball/[slug]", type: "page" },
    { path: "/mitglied-werden" },
    { path: "/termine/training" },
    { path: "/termine/training/[occurrenceId]", type: "page" },
  ],
  coaches: [
    { path: "/fussball/abteilung/trainer" },
    { path: "/fussball/[slug]", type: "page" },
    { path: "/trainer/[slug]", type: "page" },
  ],
  news: [
    { path: "/" },
    { path: "/news" },
    { path: "/news/uebersicht" },
    { path: "/news/[slug]", type: "page" },
  ],
  events: [
    { path: "/" },
    { path: "/termine/allgemein" },
    { path: "/termine/[slug]", type: "page" },
  ],
  "club-history": [{ path: "/fussball/vereinsgeschichte" }],
  contacts: [{ path: "/kontakt" }],
  "pages/settings": [{ path: "/impressum" }, { path: "/datenschutz" }],
  settings: [{ path: "/", type: "layout" }],
};

export const PUBLIC_REVALIDATION_SCOPES = Object.freeze(
  Object.keys(PUBLIC_REVALIDATION_PATHS),
);

function getEntries(scope) {
  const entries = PUBLIC_REVALIDATION_PATHS[scope];

  if (!entries) {
    throw new Error(`Unknown revalidation scope: ${scope}`);
  }

  return entries;
}

export function revalidatePublicContent(scope) {
  const unique = new Set();
  const touched = [];

  for (const entry of getEntries(scope)) {
    const key = `${entry.path}:${entry.type || "page-literal"}`;
    if (unique.has(key)) continue;

    unique.add(key);
    touched.push(entry);

    if (entry.type) {
      revalidatePath(entry.path, entry.type);
      continue;
    }

    revalidatePath(entry.path);
  }

  return touched;
}
