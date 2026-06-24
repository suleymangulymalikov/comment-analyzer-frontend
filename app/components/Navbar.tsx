"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCredits = useCallback(async () => {
    if (!session) return;
    const res = await fetch("/api/credits").catch(() => null);
    if (res?.ok) {
      const data = await res.json().catch(() => null);
      if (data?.balance !== undefined) setCredits(data.balance);
    }
  }, [session]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  useEffect(() => {
    const handler = () => fetchCredits();
    window.addEventListener("credits-updated", handler);
    return () => window.removeEventListener("credits-updated", handler);
  }, [fetchCredits]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <svg
            className="h-6 w-6 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="text-base font-bold text-gray-900">Comment Analyzer</span>
        </Link>

        {/* Right side */}
        {status === "loading" ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100" />
        ) : session ? (
          <div className="flex items-center gap-4">
            <Link
              href="/history"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              History
            </Link>
            {credits !== null && (
              <Link
                href="/credits"
                className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                {credits} credits
              </Link>
            )}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="cursor-pointer flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Open user menu"
            >
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "User avatar"}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {session.user?.name?.[0] ?? session.user?.email?.[0] ?? "?"}
                </div>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {/* User info */}
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {session.user?.name ?? session.user?.email}
                  </p>
                  <p className="truncate text-xs text-gray-400">{session.user?.email}</p>
                </div>

                {/* Credit count */}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-600">Credits</span>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {credits ?? "—"}
                  </span>
                </div>

                {/* Buy credits */}
                <Link
                  href="/credits"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Buy credits
                </Link>

                {/* Support */}
                <a
                  href="mailto:suleymanmalikov03@gmail.com"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setDropdownOpen(false)}
                >
                  Support
                </a>

                <div className="my-1 border-t border-gray-100" />

                {/* Sign out */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    signOut();
                  }}
                  className="cursor-pointer flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="cursor-pointer flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
}
