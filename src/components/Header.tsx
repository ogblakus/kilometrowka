"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

const links = [
  { href: "/", label: "Start" },
  { href: "/kalkulator", label: "Kalkulator" },
  { href: "/#cennik", label: "Cennik" },
  { href: "/#faq", label: "FAQ" },
  { href: "/kup", label: "Premium" },
];

export default function Header() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 rounded-lg"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm text-white"
            aria-hidden
          >
            km
          </span>
          <span>
            Kilometrówka<span className="text-slate-500">.app</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Główne">
          {links.map((l) => {
            const active =
              l.href === "/kalkulator"
                ? pathname.startsWith("/kalkulator")
                : l.href === "/kup"
                  ? pathname.startsWith("/kup")
                  : l.href === "/"
                    ? pathname === "/"
                    : false;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                  active
                    ? "bg-slate-100 font-medium text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/kalkulator"
            className="ml-2 inline-flex min-h-10 items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            Otwórz ewidencję
          </Link>
          <div className="ml-2 flex items-center gap-2">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Zaloguj się
                </button>
              </SignInButton>
            ) : (
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-9 w-9" },
                }}
              />
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {isSignedIn ? <UserButton /> : null}
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-label={open ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id={menuId} className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Menu mobilne">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-3 text-base text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/kalkulator"
              className="mt-1 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-3 py-3 text-center text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              onClick={() => setOpen(false)}
            >
              Otwórz ewidencję
            </Link>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="mt-1 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 px-3 py-3 text-sm font-medium text-slate-800"
                  onClick={() => setOpen(false)}
                >
                  Zaloguj się, żeby synchronizować
                </button>
              </SignInButton>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
