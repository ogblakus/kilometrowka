"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Legacy `?premium=…` query flag cleanup.
 *
 * The flag no longer unlocks anything (it used to grant local Premium to
 * guests). Plan comes only from the server (GET /api/me → Neon) for signed-in
 * users; guests are always Free. This component just strips the stale flag
 * from old links/bookmarks.
 */
export default function PremiumUnlock() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!search.has("premium")) return;
    const next = new URLSearchParams(search.toString());
    next.delete("premium");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [search, router, pathname]);

  return null;
}
