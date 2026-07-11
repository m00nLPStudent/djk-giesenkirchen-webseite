import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADMIN_PUBLIC_ROUTE_PATTERNS,
  ADMIN_ROUTE_PERMISSIONS,
  resolveAdminRoutePermission,
} from "../src/lib/admin-auth/adminPermissionConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const adminAppDir = path.join(projectRoot, "src", "app", "admin");

async function listPageFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listPageFiles(fullPath);
      }

      if (/^page\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        return [fullPath];
      }

      return [];
    }),
  );

  return files.flat();
}

function routeFromPageFile(filePath) {
  const relative = path.relative(adminAppDir, filePath).replace(/\\/g, "/");
  const pageDir = path.dirname(relative).replace(/\\/g, "/");

  if (pageDir === ".") {
    return "/admin";
  }

  const segments = pageDir
    .split("/")
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));

  return `/admin/${segments.join("/")}`;
}

function runtimePathFromRoute(route) {
  return route.replace(/\[[^\]]+\]/g, "123");
}

function findDuplicatePatterns() {
  const counts = new Map();
  for (const rule of ADMIN_ROUTE_PERMISSIONS) {
    const key = `${rule.matchType}:${rule.routePattern}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return ADMIN_ROUTE_PERMISSIONS.filter((rule) => {
    const key = `${rule.matchType}:${rule.routePattern}`;
    return counts.get(key) > 1;
  }).map((rule) => ({
    routePattern: rule.routePattern,
    matchType: rule.matchType,
    permission: rule.permission,
  }));
}

function isDynamicSegment(segment = "") {
  return segment.startsWith(":") || /^\[[^\]]+\]$/.test(segment);
}

function findOverlappingPatterns() {
  const overlaps = [];

  for (let i = 0; i < ADMIN_ROUTE_PERMISSIONS.length; i += 1) {
    for (let j = i + 1; j < ADMIN_ROUTE_PERMISSIONS.length; j += 1) {
      const a = ADMIN_ROUTE_PERMISSIONS[i];
      const b = ADMIN_ROUTE_PERMISSIONS[j];
      const minLen = Math.min(a.segments.length, b.segments.length);

      let sharePrefix = true;
      for (let idx = 0; idx < minLen; idx += 1) {
        const bothStatic =
          !isDynamicSegment(a.segments[idx]) &&
          !isDynamicSegment(b.segments[idx]);

        if (bothStatic && a.segments[idx] !== b.segments[idx]) {
          sharePrefix = false;
          break;
        }
      }

      if (sharePrefix) {
        overlaps.push({
          firstPattern: a.routePattern,
          firstPermission: a.permission,
          secondPattern: b.routePattern,
          secondPermission: b.permission,
        });
      }
    }
  }

  return overlaps;
}

function printList(title, entries) {
  console.log(`\n${title}:`);
  if (!entries.length) {
    console.log("- none");
    return;
  }

  entries.forEach((entry) => console.log(`- ${entry}`));
}

async function runAudit() {
  const pageFiles = await listPageFiles(adminAppDir);
  const routes = Array.from(new Set(pageFiles.map(routeFromPageFile))).sort();

  const mapped = [];
  const unmapped = [];
  const publicRoutes = [];

  for (const route of routes) {
    if (ADMIN_PUBLIC_ROUTE_PATTERNS.includes(route)) {
      publicRoutes.push(route);
      continue;
    }

    const runtimeRoute = runtimePathFromRoute(route);
    const resolution = resolveAdminRoutePermission(runtimeRoute);

    if (!resolution.matched) {
      unmapped.push(route);
      continue;
    }

    mapped.push({
      route,
      runtimeRoute,
      routePattern: resolution.routePattern,
      permission: resolution.permission,
      matchType: resolution.matchType,
      priority: resolution.priority,
    });
  }

  const usedPatterns = new Set(mapped.map((entry) => entry.routePattern));
  const unusedConfiguredPatterns = ADMIN_ROUTE_PERMISSIONS.filter(
    (rule) => !usedPatterns.has(rule.routePattern),
  ).map((rule) => `${rule.routePattern} (${rule.permission})`);

  const overlaps = findOverlappingPatterns().map(
    (entry) =>
      `${entry.firstPattern} -> ${entry.firstPermission} | ${entry.secondPattern} -> ${entry.secondPermission}`,
  );

  const duplicates = findDuplicatePatterns().map(
    (entry) =>
      `${entry.routePattern} (${entry.matchType}) -> ${entry.permission}`,
  );

  printList(
    "Mapped",
    mapped.map(
      (entry) =>
        `${entry.route} -> ${entry.permission} [pattern=${entry.routePattern}; match=${entry.matchType}; priority=${entry.priority}]`,
    ),
  );
  printList("Public auth routes", publicRoutes);
  printList("Unmapped", unmapped);
  printList(
    "Configured patterns without real page file",
    unusedConfiguredPatterns,
  );
  printList("Duplicate patterns", duplicates);
  printList("Overlapping pattern pairs", overlaps);

  console.log("\nSummary:");
  console.log(`- totalAdminPageRoutes=${routes.length}`);
  console.log(`- mapped=${mapped.length}`);
  console.log(`- public=${publicRoutes.length}`);
  console.log(`- unmapped=${unmapped.length}`);
  console.log(`- duplicatePatterns=${duplicates.length}`);
  console.log(`- overlappingPairs=${overlaps.length}`);
}

runAudit().catch((error) => {
  console.error("[admin-route-permission-audit] failed", error);
  process.exitCode = 1;
});
