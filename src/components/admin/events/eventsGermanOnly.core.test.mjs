import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

async function importSource(path, replacements = []) {
  let source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
  for (const [from, to] of replacements) source = source.replace(from, to);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

const initialStateModule = await importSource("./forms/eventEditor.initialState.js", [
  ['import { createSlug } from "@/lib/slug";', 'const createSlug = (value = "") => value.toLowerCase().replaceAll(" ", "-");'],
  ['import { formatDateLocalInput, formatDateTimeLocalInput } from "@/lib/dates";', 'const formatDateLocalInput = (value) => value || ""; const formatDateTimeLocalInput = (value) => value || "";'],
]);
const payloadModule = await importSource("./forms/eventEditor.payload.js");
const { createInitialEventForm } = initialStateModule;
const { buildEventPayload } = payloadModule;

function createGermanForm() {
  return {
    title_de: "Vereinsabend",
    teaser_de: "Kurzbeschreibung",
    description_de: "Beschreibung",
    event_type: "vereinstermin",
    starts_at: "2026-08-03T18:00",
    ends_at: "2026-08-03T20:00",
    is_all_day: false,
    location_name: "Vereinsheim",
    location_address: "Musterstraße 1",
    location_city: "Mönchengladbach",
    team_id: "",
    external_url: "",
    image_url: "",
    recurrence_type: "none",
    recurrence_interval: 1,
    recurrence_until: "",
    recurrence_count: "",
    is_published: true,
    is_featured: false,
    sort_order: 0,
  };
}

test("create state contains no English fields", () => {
  const state = createInitialEventForm(null);
  assert.equal(Object.keys(state).some((key) => key.endsWith("_en")), false);
});

test("existing English values are not copied into edit state", () => {
  const state = createInitialEventForm({ title_de: "Deutsch", title_en: "English", teaser_en: "Teaser", description_en: "Details" });
  assert.equal(state.title_de, "Deutsch");
  for (const key of ["title_en", "teaser_en", "description_en"]) assert.equal(key in state, false);
});

test("create payload works with German fields only", () => {
  const payload = buildEventPayload({ form: createGermanForm(), publicSlug: "vereinsabend", hasRecurrence: false });
  assert.equal(payload.title_de, "Vereinsabend");
  assert.equal(Object.keys(payload).some((key) => key.endsWith("_en")), false);
});

test("update payload never overwrites existing English columns", () => {
  const form = { ...createGermanForm(), title_en: "Must stay", teaser_en: "Must stay", description_en: "Must stay" };
  const payload = buildEventPayload({ form, publicSlug: "vereinsabend", hasRecurrence: false });
  for (const key of ["title_en", "teaser_en", "description_en"]) assert.equal(key in payload, false);
});
