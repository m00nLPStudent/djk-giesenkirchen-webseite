"use client";

import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";
import { buildContributionActionItems } from "../helpers/contributionActions.js";

function getItemClassName(tone = "default") {
  if (tone === "danger") {
    return "text-red-200 hover:bg-red-500/10 hover:text-red-100";
  }

  return "text-white/80 hover:bg-white/5 hover:text-white";
}

export default function ContributionActionsMenu({
  contribution,
  permissions = [],
}) {
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const actionItems = buildContributionActionItems(contribution, permissions);
  const closeMenu = useEffectEvent(() => {
    setOpen(false);
    buttonRef.current?.focus();
  });

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex w-full md:w-auto">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/75 transition hover:border-red-500 hover:text-white md:w-auto"
      >
        Aktionen
        <ChevronDown
          size={15}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute left-0 top-full z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-3xl border border-white/10 bg-[#17171d] p-2 shadow-2xl shadow-black/40 md:left-auto md:right-0"
          role="menu"
        >
          {actionItems.map((item) => (
            <Link
              key={`${contribution.id}-${item.label}`}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`block rounded-2xl px-4 py-3 text-sm font-bold transition ${getItemClassName(item.tone)}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
