import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const navigationSource = read("src/components/website/navigation/Navigation.js");
const configSource = read("src/components/website/navigation/navigationConfig.js");
const headerSource = read("src/components/Header.js");
const footerSource = read("src/components/Footer.js");
const homeSource = read("src/app/(website)/page.js");
const homeEventsSource = read("src/components/website/events/HomeEventsSection.js");
const trainingSportIconSource = read("src/components/website/events/TrainingSportIcon.js");
const socialLinksSource = read("src/components/common/SocialLinks/SocialLinks.js");
const socialResolverSource = read("src/lib/socialLinks.js");
const directionsSource = read("src/app/(website)/anfahrt/page.js");
const mapsPanelSource = read("src/components/website/maps/GoogleMapsPanel.js");
const cookieSettingsSource = read("src/app/(website)/cookie-einstellungen/page.js");
const roadmapSource = read("docs/planning/current-roadmap.md");
const projectStatusSource = read("docs/planning/project-status.md");
const newsCardSource = read("src/components/website/news/NewsCard.js");

test("public navigation exposes the agreed club and department structure", () => {
  for (const label of [
    "Startseite",
    "Verein",
    "Fußball",
    "Tischtennis",
    "Gymnastikdamen",
    "Behindertensport",
    "Kontakt",
    "Mitglied werden",
    "Sponsoren",
    "Vorstand Gesamtverein",
    "Spielplan & Tabelle",
    "Turniere & Events",
  ]) {
    assert.match(configSource, new RegExp(label.replace("&", "\\&")));
  }
});

test("every newly introduced navigation target has a real page", () => {
  for (const route of [
    "verein/vorstand",
    "verein/vereinsgeschichte",
    "fussball/turniere-events",
    "behindertensport",
    "tischtennis/mannschaften",
    "tischtennis/spielplan-tabelle",
    "tischtennis/vorstand",
    "tischtennis/termine",
  ]) {
    assert.equal(existsSync(resolve(root, `src/app/(website)/${route}/page.js`)), true, route);
  }
  assert.doesNotMatch(configSource, /\/fussball\/(turniere|events)["']/);
});

test("desktop and mobile navigation expose accessible disclosure controls", () => {
  assert.match(navigationSource, /aria-label="Hauptnavigation"/);
  assert.match(navigationSource, /aria-label="Mobile Hauptnavigation"/);
  assert.match(navigationSource, /aria-expanded=/);
  assert.match(navigationSource, /aria-controls=/);
  assert.match(navigationSource, /event\.key === "Escape"/);
  assert.match(navigationSource, /focus-visible:outline/);
  assert.match(navigationSource, /openMobileMenus/);
  assert.match(navigationSource, /aria-current=/);
  assert.match(navigationSource, /bg-red-600\/45/);
  assert.match(navigationSource, /bg-red-600\/20/);
  assert.match(navigationSource, /ring-red-600\/50/);
  assert.match(navigationSource, /bg-red-600 px-3 py-3 text-\[0\.85rem\]/);
  assert.match(navigationSource, /bg-red-600 px-\[1\.125rem\] py-3\.5 text-\[1rem\]/);
  assert.doesNotMatch(navigationSource, new RegExp(["#ff", "6467"].join("")));
  assert.doesNotMatch(navigationSource, new RegExp(["rgba\\(255", "100", "103"].join(",")));
  assert.doesNotMatch(navigationSource, /#742734/);
});

test("header has no global h1 and shares the centralized logo source", () => {
  assert.doesNotMatch(headerSource, /<h1\b/);
  assert.match(headerSource, /PUBLIC_SITE_LOGO_URL/);
  assert.match(footerSource, /PUBLIC_SITE_LOGO_URL/);
  assert.match(headerSource, /max-w-\[90rem\]/);
  assert.match(headerSource, /xl:h-36/);
  assert.match(headerSource, /xl:bottom-0/);
  assert.match(headerSource, /xl:translate-y-1\/2/);
  assert.match(headerSource, /xl:left-\[9\.5rem\]/);
  assert.match(navigationSource, /rounded-full border border-white\/10 bg-\[#15151b\]\/90/);
  assert.match(navigationSource, /top-\[calc\(100%-0\.125rem\)\]/);
});

test("desktop header service links share validated social settings and existing internal routes", () => {
  assert.match(headerSource, /from\("club_settings"\)/);
  assert.match(headerSource, /select\("social_links"\)/);
  assert.match(headerSource, /resolveSocialLinks\(settings\?\.social_links\)/);
  assert.match(footerSource, /resolveSocialLinks\(settings\?\.social_links\)/);
  for (const key of ["facebook", "instagram", "youtube", "tiktok", "linkedin", "x"]) {
    assert.match(socialResolverSource, new RegExp(`"${key}"`));
  }
  assert.match(socialResolverSource, /normalizeExternalHttpUrl/);
  assert.match(socialResolverSource, /url\.username \|\| url\.password/);
  assert.match(headerSource, /label: "Sportanlage \/ Anfahrt", href: "\/anfahrt"/);
  assert.match(headerSource, /label: "Termine", href: "\/termine"/);
  assert.match(headerSource, /aria-label="Service-Links"/);
  assert.match(headerSource, /hidden items-center.*xl:flex/);
  assert.match(socialLinksSource, /target="_blank"/);
  assert.match(socialLinksSource, /rel="noopener noreferrer"/);
});

test("footer exposes real legal routes without powered-by or missing AGB links", () => {
  assert.doesNotMatch(footerSource, /href="#"/);
  assert.doesNotMatch(footerSource, /href="\/agb"/);
  assert.match(footerSource, /href="\/cookie-einstellungen"/);
  assert.doesNotMatch(footerSource, /Powered by/);
  assert.match(footerSource, /Behindertensport/);
  assert.match(footerSource, /social_links/);
  assert.match(footerSource, /\.in\("slug", \["impressum", "datenschutz"\]\)/);
  assert.match(footerSource, /settings\?\.club_name \|\| PUBLIC_SITE_NAME/);
  assert.match(footerSource, /settings\?\.street/);
  assert.match(footerSource, /settings\?\.house_number/);
  assert.match(footerSource, /settings\?\.postal_code/);
  assert.match(footerSource, /settings\?\.city/);
  assert.match(footerSource, /settings\?\.phone/);
  assert.match(footerSource, /settings\?\.email/);
  assert.match(footerSource, /xl:grid-cols-\[1\.45fr_0\.8fr_0\.9fr_0\.8fr_1\.2fr\]/);
  assert.match(footerSource, /new Date\(\)\.getFullYear\(\)/);
  assert.match(socialLinksSource, /rel="noopener noreferrer"/);
  for (const icon of ["SiFacebook", "SiInstagram", "SiYoutube", "SiTiktok", "FaLinkedinIn", "SiX"]) {
    assert.match(socialLinksSource, new RegExp(icon));
  }
  assert.match(socialLinksSource, /bg-transparent/);
  assert.match(socialLinksSource, /<Icon size=\{18\} className="text-red-500 transition-colors group-hover:text-red-400"/);
  assert.doesNotMatch(socialLinksSource, /bg-transparent text-white|<Icon[^>]+text-white/);
  assert.doesNotMatch(socialLinksSource, /#1877f2|radial-gradient|#ff0000|#0a66c2|#25f4ee|#fe2c55/);
  assert.match(socialLinksSource, /title=\{config\.label\}/);
});

test("roadmap keeps maps embed and real consent management explicitly open", () => {
  for (const source of [roadmapSource, projectStatusSource]) {
    assert.match(source, /GOOGLE_MAPS_EMBED_API_KEY/);
    assert.match(source, /Maps Embed API/);
    assert.match(source, /Consent/);
    assert.match(source, /offen/i);
  }
  assert.match(roadmapSource, /notwendige\/funktionale\/externe Dienste/);
  assert.match(roadmapSource, /Zustimmung speichern, ändern und widerrufen/);
  assert.match(roadmapSource, /\/cookie-einstellungen.*keine fertige Consent/i);
});

test("directions and cookie routes are real, settings-backed and transparent", () => {
  assert.equal(existsSync(resolve(root, "src/app/(website)/anfahrt/page.js")), true);
  assert.equal(existsSync(resolve(root, "src/app/(website)/cookie-einstellungen/page.js")), true);
  assert.match(directionsSource, /google_maps_url/);
  assert.match(directionsSource, /street, house_number, postal_code, city/);
  assert.match(directionsSource, /normalizeGoogleMapsUrl/);
  assert.match(directionsSource, /GOOGLE_MAPS_EMBED_API_KEY/);
  assert.match(directionsSource, /buildGoogleMapsEmbedUrl/);
  assert.match(mapsPanelSource, /embedUrl && showMap/);
  assert.match(mapsPanelSource, /src=\{embedUrl\}/);
  assert.doesNotMatch(mapsPanelSource, /src=\{mapsUrl\}/);
  assert.match(mapsPanelSource, /Google Maps anzeigen/);
  assert.match(mapsPanelSource, /In Google Maps öffnen/);
  assert.match(mapsPanelSource, /loading="lazy"/);
  assert.match(mapsPanelSource, /strict-origin-when-cross-origin/);
  assert.match(cookieSettingsSource, /wird derzeit vorbereitet/);
  assert.match(cookieSettingsSource, /keine Einstellungen vorgetäuscht/);
  assert.doesNotMatch(cookieSettingsSource, /type="(?:checkbox|radio)"/);
});

test("footer uses only existing internal targets and leaves news cards untouched by chrome", () => {
  for (const href of [
    "/news",
    "/news/uebersicht",
    "/termine",
    "/downloads",
    "/verein/vereinsgeschichte",
    "/verein/vorstand",
    "/fussball/mannschaften/senioren",
    "/fussball/mannschaften/junioren",
    "/tischtennis",
    "/behindertensport",
    "/damen-gymnastik",
  ]) {
    assert.match(footerSource, new RegExp(`href: "${href}"`));
  }
  assert.doesNotMatch(headerSource, /NewsCard/);
  assert.doesNotMatch(footerSource, /NewsCard/);
  assert.match(newsCardSource, /export default function NewsCard/);
});

test("home reuses virtual training generation without loading general events", () => {
  assert.match(homeSource, /getVirtualTrainingEvents/);
  assert.match(homeSource, /selectUpcomingHomeTrainings/);
  assert.match(homeSource, /export const dynamic = "force-dynamic"/);
  assert.match(homeSource, /365 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(homeSource, /maxOccurrencesPerTraining: 180/);
  assert.doesNotMatch(homeSource, /\.from\("events"\)/);
  assert.match(homeEventsSource, /Nächste Trainingstermine/);
  assert.match(homeEventsSource, /\/termine\/training/);
  assert.match(homeEventsSource, /keine kommenden Trainingstermine/);
  assert.match(homeEventsSource, /TrainingSportIcon/);
  assert.match(trainingSportIconSource, /\/images\/sports-icons\/football\.png/);
  assert.match(trainingSportIconSource, /\/images\/sports-icons\/table-tennis\.png/);
  assert.match(trainingSportIconSource, /\/images\/sports-icons\/gymnastics\.png/);
  assert.match(trainingSportIconSource, /\/images\/sports-icons\/adaptive-sports\.png/);
  assert.match(trainingSportIconSource, /CalendarDays/);
  assert.match(navigationSource, /bg-\[#15151b\]\/90 px-2 py-2\.5/);
  assert.match(navigationSource, /px-2\.5 py-2\.5/);
  assert.match(homeEventsSource, /grid-cols-\[auto_minmax\(0,1fr\)_auto\]/);
  assert.match(homeSource, /max-w-\[90rem\]/);
});
