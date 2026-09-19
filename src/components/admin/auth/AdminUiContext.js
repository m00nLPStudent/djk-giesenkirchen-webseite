"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getCurrentAdminContext } from "@/lib/admin-auth/adminSession.service";
import { getAdminFallbackUserContext } from "@/lib/admin-auth/permissionFallbacks";
import { createEmptyScopeContext } from "@/lib/admin-auth/scopes/scopeContext";

const AdminUiContext = createContext({
  userContext: getAdminFallbackUserContext(),
  scopeContext: createEmptyScopeContext(),
  isReady: false,
  updateOwnProfile: () => {},
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

  const updateOwnProfile = useCallback((profilePatch) => {
    setUserContext((current) => {
      if (!current?.profile) return current;
      return {
        ...current,
        profile: {
          ...current.profile,
          ...profilePatch,
        },
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      userContext,
      scopeContext: userContext.scopeContext || createEmptyScopeContext(),
      isReady,
      updateOwnProfile,
    }),
    [isReady, updateOwnProfile, userContext],
  );

  return (
    <AdminUiContext.Provider value={value}>{children}</AdminUiContext.Provider>
  );
}

export function useAdminUiContext() {
  return useContext(AdminUiContext);
}
