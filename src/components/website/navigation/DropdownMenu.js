"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function DropdownMenu({ items }) {
  return (
    <div className="absolute left-0 top-full z-50 w-80 overflow-hidden rounded-3xl border border-white/10 bg-[#141418] shadow-2xl">
      <div className="p-4">
        {items.map((item) => (
          <div key={item.label} className="mb-2 last:mb-0">
            <Link
              href={item.href}
              className="flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition hover:bg-red-600/15 hover:text-red-500"
            >
              {item.label}

              {item.children?.length > 0 && <ChevronRight size={18} />}
            </Link>

            {item.children?.length > 0 && (
              <div className="ml-4 mt-2 space-y-1 border-l border-white/10 pl-4">
                {item.children.map((child) => (
                  <Link
                    key={child.label}
                    href={child.href}
                    className="block rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-red-600/15 hover:text-red-500"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
