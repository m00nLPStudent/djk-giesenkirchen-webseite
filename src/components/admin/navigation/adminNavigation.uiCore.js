export function getNextNavigationIndex(current, length, direction) {
  if (length <= 0) return -1;
  return (current + direction + length) % length;
}

export function getInitialOpenSectionKeys(dto = {}) {
  return dto.activeSectionKey ? [dto.activeSectionKey] : [];
}

export function getNavigationResponsiveMode(width) {
  return Number(width) >= 1280 ? "desktop" : "mobile";
}

export function getAdminNavigationSurfaceState() {
  return {
    sidebarVisible: false,
    sidebarWidthReserved: false,
    horizontalVisible: true,
    mobileDrawerAvailable: true,
    mobileMenuButtonCount: 1,
  };
}

export function getNavigationDropdownLayout(items = []) {
  const visibleItems = items.filter((item) => item?.status === "active" && item.href);
  const itemCount = visibleItems.length;

  if (itemCount === 0) {
    return { key: "empty", itemCount, visibleItems, panelClassName: "", gridClassName: "" };
  }
  if (itemCount === 1) {
    return {
      key: "compact-single", itemCount, visibleItems,
      panelClassName: "w-[min(22rem,calc(100vw-2rem))]", gridClassName: "grid-cols-1",
    };
  }
  if (itemCount === 2) {
    return {
      key: "compact-list", itemCount, visibleItems,
      panelClassName: "w-[min(24rem,calc(100vw-2rem))]", gridClassName: "grid-cols-1",
    };
  }
  if (itemCount <= 4) {
    return {
      key: "medium-layout", itemCount, visibleItems,
      panelClassName: "w-[min(36rem,calc(100vw-2rem))]", gridClassName: "grid-cols-1 sm:grid-cols-2",
    };
  }
  return {
    key: "mega-grid", itemCount, visibleItems,
    panelClassName: "w-[min(42rem,calc(100vw-2rem))]", gridClassName: "grid-cols-1 sm:grid-cols-2",
  };
}
