"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { savePlan } from "@/lib/plan";

/**
 * Guest-only local override for demos: /kalkulator?premium=1
 * Signed-in users get plan exclusively from Neon (/api/me) — query flag ignored.
 */
export default function PremiumUnlock() {
  const { isSignedIn } = useAuth();
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const flag = search.get("premium");
    if (!flag) return;

    // Strip flag from URL either way
    const next = new URLSearchParams(search.toString());
    next.delete("premium");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);

    if (isSignedIn) {
      // Do not write local Premium for signed-in accounts
      return;
    }

    if (flag === "1" || flag === "true") {
      savePlan("premium");
      setMsg("Premium odblokowane lokalnie (tryb testowy, gość).");
    } else if (flag === "0" || flag === "free") {
      savePlan("free");
      setMsg("Przywrócono plan Free (tryb testowy).");
    }
  }, [search, router, pathname, isSignedIn]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;

  return (
    <div
      role="status"
      className="fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-900 shadow"
    >
      {msg}
    </div>
  );
}
