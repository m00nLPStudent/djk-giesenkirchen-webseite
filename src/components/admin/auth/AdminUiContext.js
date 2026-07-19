"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentAdminContext } from "@/lib/admin-auth/adminSession.service";
import { getAdminFallbackUserContext } from "@/lib/admin-auth/permissionFallbacks";
import { createEmptyScopeContext } from "@/lib/admin-auth/scopes/scopeContext";

const AdminUiContext = createContext({
  userContext: getAdminFallbackUserContext(),
  scopeContext: createEmptyScopeContext(),
  isReady: false,
});

export function AdminUiContextProvider({ children }) {
  const [userContext, setUserContext] = useState(getAdminFallbackUserContext());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      try {
        const context = await getCurrentAdminContext();
        if (!active) return;
        setUserContext(context || getAdminFallbackUserContext());
      } catch {
        if (!active) return;
        setUserContext(getAdminFallbackUserContext());
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    }

    loadContext();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      userContext,
      scopeContext: userContext.scopeContext || createEmptyScopeContext(),
      isReady,
    }),
    [isReady, userContext],
  );

  return (
    <AdminUiContext.Provider value={value}>{children}</AdminUiContext.Provider>
  );
}

export function useAdminUiContext() {
  return useContext(AdminUiContext);
}
