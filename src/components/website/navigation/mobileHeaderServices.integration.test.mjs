import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { selectMobileHeaderSocialLinks } from "../../../lib/socialLinks.js";

const header = readFileSync(new URL("../../Header.js", import.meta.url), "utf8");
const navigation = readFileSync(new URL("./Navigation.js", import.meta.url), "utf8");
const socialLinks = readFileSync(new URL("../../common/SocialLinks/SocialLinks.js", import.meta.url), "utf8");

test("mobile header selects only configured Instagram and Facebook links", () => {
  assert.deepEqual(selectMobileHeaderSocialLinks({ instagram: "https://instagram.example/club", facebook: "https://facebook.example/club", youtube: "https://youtube.example/club" }), {
    instagram: "https://instagram.example/club",
    facebook: "https://facebook.example/club",
  });
  assert.deepEqual(selectMobileHeaderSocialLinks({ instagram: "https://instagram.example/club" }), { instagram: "https://instagram.example/club" });
  assert.deepEqual(selectMobileHeaderSocialLinks({}), {});
  assert.match(header, /links=\{mobileSocialLinks\}/);
  assert.match(socialLinks, /if \(!entries\.length\) return null/);
});

test("mobile header keeps pin and hamburger but excludes the Termine service link", () => {
  const mobileBlock = header.match(/aria-label="Mobile Service-Links"[\s\S]*?<\/nav>/)?.[0] || "";
  assert.match(mobileBlock, /href="\/anfahrt"/);
  assert.match(mobileBlock, /aria-label="Sportanlage \/ Anfahrt"/);
  assert.match(mobileBlock, /h-10 w-10/);
  assert.doesNotMatch(mobileBlock, /Termine|CalendarDays/);
  assert.match(header, /label: "Termine", href: "\/termine\/allgemein"/);
  assert.match(navigation, /h-11 w-11/);
  assert.match(navigation, /aria-label=\{isMobileOpen \? "Menü schließen" : "Menü öffnen"\}/);
});

test("mobile header preserves red icon styling and protects the 360px composition", () => {
  assert.match(header, /hidden min-w-0 min-\[390px\]:block/);
  assert.match(header, /aria-label="Mobile Service-Links" className="ml-auto flex shrink-0 items-center gap-1 xl:hidden"/);
  assert.match(header, /contents/);
  assert.match(header, /iconSizes=\{\{ facebook: 17 \}\}/);
  assert.match(header, /MapPin aria-hidden="true" size=\{18\}/);
  assert.match(header, /block shrink-0 text-red-500 transition-colors group-hover:text-red-400/);
  assert.match(socialLinks, /h-10 w-10/);
  assert.match(socialLinks, /contents \? "contents"/);
  assert.match(socialLinks, /size=\{iconSizes\[key\] \|\| 18\}/);
  assert.match(socialLinks, /block shrink-0 text-red-500 transition-colors group-hover:text-red-400/);
});

test("mobile service icons share one group while the hamburger remains separate", () => {
  const mobileBlock = header.match(/<nav aria-label="Mobile Service-Links"[\s\S]*?<\/nav>/)?.[0] || "";
  const mobileNavigationWrapper = header.match(/<div className="shrink-0 xl:absolute[\s\S]*?<Navigation \/>/)?.[0] || "";

  assert.match(mobileBlock, /gap-1/);
  assert.match(mobileBlock, /<SocialLinks[\s\S]*?contents/);
  assert.match(mobileBlock, /h-10 w-10/);
  assert.doesNotMatch(mobileBlock, /<Navigation \/>/);
  assert.match(mobileNavigationWrapper, /<Navigation \/>/);
  assert.match(header, /relative mx-auto flex h-20 max-w-\[90rem\] items-center gap-3/);
});
