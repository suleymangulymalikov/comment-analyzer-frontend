"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HistoryCard, type AnalysisSummary } from "@/app/components/HistoryCard";

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (!session) return;

    fetch("/api/analyses")
      .then((r) => r.json())
      .then((data) => setAnalyses(Array.isArray(data) ? data : []))
      .catch(() => setAnalyses([]))
      .finally(() => setLoading(false));
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center justify-center py-24">
            <svg
              className="h-6 w-6 animate-spin text-indigo-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">
            ← Back
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold text-gray-900">All analyses</h1>
        </div>

        {analyses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-gray-500">No analyses yet.</p>
            <Link href="/" className="mt-3 text-sm font-medium text-indigo-600 hover:underline">
              Go analyze a video!
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {analyses.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onClick={() => router.push(`/analysis/${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
