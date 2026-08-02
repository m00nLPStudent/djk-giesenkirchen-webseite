function normalizePath(path = "") {
  const pathname = String(path || "").split(/[?#]/)[0].replace(/\/+$/, "");
  return pathname || "/";
}

function matchesPrefix(path, prefix) {
  const target = normalizePath(prefix);
  return path === target || path.startsWith(`${target}/`);
}

export function getNavigationItemMatch(item, currentPath) {
  const path = normalizePath(currentPath);
  if (item?.exactMatch) {
    return path === normalizePath(item.href) ? normalizePath(item.href).length : -1;
  }
  const prefixes = item?.matchPrefixes?.length ? item.matchPrefixes : [item?.href];
  return prefixes.filter(Boolean).reduce((best, prefix) => {
    const normalized = normalizePath(prefix);
    return matchesPrefix(path, normalized) ? Math.max(best, normalized.length) : best;
  }, -1);
}

export function findActiveNavigationEntry(sections = [], currentPath = "") {
  let winner = null;
  for (const section of sections) {
    for (const item of section.items || []) {
      const score = getNavigationItemMatch(item, currentPath);
      if (score < 0 || (winner && winner.score >= score)) continue;
      winner = { sectionKey: section.key, itemKey: item.key, score };
    }
  }
  return winner || { sectionKey: null, itemKey: null, score: -1 };
}

export function applyActivePathToNavigationDto(dto = {}, currentPath = "") {
  const active = findActiveNavigationEntry(dto.sections || [], currentPath);
  return {
    ...dto,
    activeSectionKey: active.sectionKey,
    activeItemKey: active.itemKey,
    sections: (dto.sections || []).map((section) => ({
      ...section,
      isActive: section.key === active.sectionKey,
      items: (section.items || []).map((item) => ({
        ...item,
        isActive: item.key === active.itemKey,
      })),
    })),
  };
}
