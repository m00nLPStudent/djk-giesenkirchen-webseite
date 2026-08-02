"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AdminMetric, AdminModuleSummary } from "@/components/admin/design-system";

export default function PlayerStats({
  total = 0,
  inactive = 0,
  nationalityCount = 0,
  openContributions = 0,
  nationalities = [],
  enableContributionFilter = false,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showNationalityDialog, setShowNationalityDialog] = useState(false);

  const selectableNationalities = useMemo(
    () =>
      (nationalities || []).filter(
        (item) => item?.iso && item.iso !== "UNKNOWN",
      ),
    [nationalities],
  );

  function replaceUrlParams(updater) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    updater(params);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  function applyNationalityFilter(iso) {
    replaceUrlParams((params) => {
      if (!iso) {
        params.delete("nationality");
      } else {
        params.set("nationality", iso);
      }
      params.delete("view");
    });
    setShowNationalityDialog(false);
  }

  function handleNationalityClick() {
    if (!selectableNationalities.length) return;
    if (selectableNationalities.length === 1) {
      applyNationalityFilter(selectableNationalities[0].iso);
      return;
    }

    setShowNationalityDialog(true);
  }

  function handleOpenContributionsClick() {
    if (!enableContributionFilter) return;

    replaceUrlParams((params) => {
      params.set("contribution", "open_cases");
    });
  }

  const stats = [
    {
      title: "Spieler",
      value: total,
    },
    {
      title: "Inaktiv",
      value: inactive,
    },
    {
      title: "Nationalitaeten",
      value: nationalityCount,
      onClick: handleNationalityClick,
      disabled: !selectableNationalities.length || isPending,
    },
    {
      title: "Beitragsfaelle offen",
      value: openContributions,
      onClick: handleOpenContributionsClick,
      disabled: !enableContributionFilter || isPending,
    },
  ];

  return (
    <>
      <AdminModuleSummary>
        {stats.map((item) => <AdminMetric key={item.title} label={item.title} value={item.value} onClick={item.onClick} disabled={item.disabled} />)}
      </AdminModuleSummary>

      {showNationalityDialog ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Dialog schliessen"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowNationalityDialog(false)}
          />

          <div className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#101014] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
                  Nationalitaeten
                </p>
                <h3 className="mt-2 text-2xl font-black text-white">
                  Filter auswaehlen
                </h3>
                <p className="mt-1 text-sm text-white/55">
                  Nach Auswahl werden nur Spieler aus dem gewaehlten Land angezeigt.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNationalityDialog(false)}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
              >
                Schliessen
              </button>
            </div>

            <div className="mt-5 grid max-h-[50vh] gap-2 overflow-y-auto">
              {selectableNationalities.map((item) => (
                <button
                  key={item.iso}
                  type="button"
                  onClick={() => applyNationalityFilter(item.iso)}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-red-500/60 hover:bg-white/[0.05]"
                >
                  <span className="font-bold text-white">{item.label}</span>
                  <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
