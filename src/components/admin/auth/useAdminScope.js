"use client";

import { useAdminUiContext } from "./AdminUiContext";

export default function useAdminScope() {
  const runtimeContext = useAdminUiContext();
  return (
    runtimeContext.scopeContext ||
    runtimeContext.userContext?.scopeContext ||
    null
  );
}
