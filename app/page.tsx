"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VideoCard, VideoCardSkeleton, type AnalysisSummary } from "@/app/components/VideoCard";

// ── Main page ──────────────────────────────────────────────────────────────

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<AnalysisSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!session) return;
    const res = await fetch("/api/analyses").catch(() => null);
    if (res?.ok) {
      const data = await res.json().catch(() => []);
      setHistory((current) => {
        // Prefer pending items already in state; fall back to sessionStorage so
        // we never drop the placeholder in case fetchHistory resolves before the
        // mount effect's setHistory has committed.
        const pending = current.filter((i) => i.pending);
        const hasActiveJob = sessionStorage.getItem("activeJobId") !== null;
        const placeholder: AnalysisSummary[] =
          pending.length === 0 && hasActiveJob
            ? [{
                id: "__pending__",
                video_id: "",
                video_title: "",
                video_thumbnail_url: "",
                provider: "",
                model: "",
                summary: "",
                created_at: new Date().toISOString(),
                pending: true,
              }]
            : pending;
        return [...placeholder, ...data];
      });
    }
    setHistoryLoading(false);
  }, [session]);

  const startPolling = useCallback((jobId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      let pollRes: Response;
      try {
        pollRes = await fetch(`/api/analyze/status/${jobId}`);
      } catch {
        clearInterval(pollIntervalRef.current!);
        pollIntervalRef.current = null;
        sessionStorage.removeItem("activeJobId");
        setError("Network error while checking analysis status.");
        setStatus("error");
        setHistory((h) =>
          h.map((item) => (item.pending ? { ...item, error: "Network error" } : item))
        );
        return;
      }

      const pollData = await pollRes.json().catch(() => null);

      if (!pollRes.ok || pollData?.status === "failed") {
        clearInterval(pollIntervalRef.current!);
        pollIntervalRef.current = null;
        sessionStorage.removeItem("activeJobId");
        const msg: string = pollData?.error ?? "Analysis failed.";
        setError(msg);
        setStatus("error");
        setHistory((h) =>
          h.map((item) => (item.pending ? { ...item, error: msg } : item))
        );
        return;
      }

      if (pollData?.status === "done") {
        clearInterval(pollIntervalRef.current!);
        pollIntervalRef.current = null;
        sessionStorage.removeItem("activeJobId");
        window.dispatchEvent(new Event("credits-updated"));

        setHistory((h) =>
          h.map((item) =>
            item.pending ? { ...pollData.result, pending: false, isNew: true } : item
          )
        );

        setStatus("idle");
        fetchHistory();
      }
    }, 3000);
  }, [fetchHistory]);

  // On mount: restore in-progress job from sessionStorage if any.
  useEffect(() => {
    const savedJobId = sessionStorage.getItem("activeJobId");
    if (!savedJobId) return;

    setStatus("loading");
    setHistory((h) => {
      if (h.some((i) => i.pending)) return h;
      return [
        {
          id: "__pending__",
          video_id: "",
          video_title: "",
          video_thumbnail_url: "",
          provider: "",
          model: "",
          summary: "",
          created_at: new Date().toISOString(),
          pending: true,
        },
        ...h,
      ];
    });
    startPolling(savedJobId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentSuccess(true);
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => {
        window.dispatchEvent(new Event("credits-updated"));
      }, 3000);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    setStatus("loading");
    setError("");

    // Show placeholder immediately so the skeleton card appears right away.
    setHistory((h) => [
      {
        id: "__pending__",
        video_id: "",
        video_title: "",
        video_thumbnail_url: "",
        provider: "",
        model: "",
        summary: "",
        created_at: new Date().toISOString(),
        pending: true,
      },
      ...h.filter((item) => !item.pending),
    ]);

    let res: Response;
    try {
      res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: url.trim() }),
      });
    } catch {
      setError("Network error — could not reach the server.");
      setStatus("error");
      setHistory((h) => h.filter((item) => !item.pending));
      return;
    }

    const data = await res.json().catch(() => null);

    if (res.status === 503) {
      setError("Server is busy, please try again in a moment.");
      setStatus("error");
      setHistory((h) => h.filter((item) => !item.pending));
      return;
    }

    if (res.status === 402) {
      const needed = data?.required
        ? ` This video needs ${data.required} credit${data.required !== 1 ? "s" : ""}.`
        : "";
      setError(`Not enough credits.${needed}`);
      setStatus("error");
      setHistory((h) => h.filter((item) => !item.pending));
      return;
    }

    if (!res.ok) {
      setError(data?.error ?? `Error ${res.status}`);
      setStatus("error");
      setHistory((h) => h.filter((item) => !item.pending));
      return;
    }

    const jobId: string | undefined = data?.job_id;
    if (!jobId) {
      setError("Unexpected response from server.");
      setStatus("error");
      setHistory((h) => h.filter((item) => !item.pending));
      return;
    }

    sessionStorage.setItem("activeJobId", jobId);
    startPolling(jobId);
  }

  const pendingItems = history.filter((i) => i.pending);
  const realItems = history.filter((i) => !i.pending);
  const displayItems = [...pendingItems, ...realItems].slice(0, 5);
  const showViewAll = realItems.length > 5 - pendingItems.length;

  return (
    <main className="min-h-screen">

      {/* Payment success banner */}
      {paymentSuccess && (
        <div className="mx-auto max-w-7xl px-6 pt-4">
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>Payment successful — your credits will appear shortly.</span>
            <button
              onClick={() => setPaymentSuccess(false)}
              className="ml-4 text-emerald-500 hover:text-emerald-700"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hero — full-width indigo gradient section */}
      <section className="bg-gradient-to-b from-indigo-50/70 to-white px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-500">
            YouTube Comment Intelligence
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            What is your audience{" "}
            <em className="italic text-indigo-600">really</em> saying?
          </h1>
          <p className="mt-4 text-base text-gray-500">
            Paste any YouTube URL and get AI-powered insights from the comments in seconds.
          </p>

          {/* Signed-out prompt */}
          {authStatus !== "loading" && !session && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Sign in with Google to analyze YouTube comments.
            </div>
          )}

          {/* Input form */}
          <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={status === "loading"}
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading" || !url.trim()}
              className="cursor-pointer whitespace-nowrap rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? "Analyzing…" : "Analyze →"}
            </button>
          </form>
          <p className="mt-2 text-left text-xs text-gray-400">
            Top 300 most-liked comments · 1 credit per analysis
          </p>

          {/* Error state */}
          {status === "error" && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-left">
              <span className="font-semibold">Error: </span>{error}
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Recent analyses */}
      {session && (historyLoading || displayItems.length > 0) && (
        <section className="px-8 py-12">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent analyses</h2>
              {showViewAll && (
                <Link href="/history" className="text-sm text-indigo-600 hover:underline">
                  View all →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {displayItems.map((item) => (
                <VideoCard
                  key={item.id}
                  item={item}
                  onClick={() => {
                    if (!item.pending) router.push(`/analysis/${item.id}`);
                  }}
                />
              ))}
              {historyLoading &&
                Array.from({ length: Math.max(0, 5 - displayItems.length) }).map((_, i) => (
                  <VideoCardSkeleton key={`__skeleton__${i}`} />
                ))}
            </div>
          </div>
        </section>
      )}

    </main>
  );
}
