"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VideoCard, VideoCardSkeleton, type AnalysisSummary } from "@/app/components/VideoCard";

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

  return (
    <main className="min-h-screen">
      <div className="px-8 py-10">
        <div className="mb-8">
          <Link href="/" className="cursor-pointer text-sm text-indigo-600 hover:underline">
            ← Back
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold text-gray-900">All analyses</h1>
        </div>

        {!loading && analyses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-gray-500">No analyses yet.</p>
            <Link href="/" className="mt-3 cursor-pointer text-sm font-medium text-indigo-600 hover:underline">
              Go analyze a video!
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <VideoCardSkeleton key={i} />)
              : analyses.map((item) => (
                  <VideoCard
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
