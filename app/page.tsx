"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

interface InsightItem {
  title: string;
  description?: string;
  reason?: string;
}

interface AnalysisResult {
  id: string;
  video_id: string;
  video_title: string;
  video_thumbnail_url: string;
  provider: string;
  model: string;
  prompt_version: number;
  summary: string;
  stats: {
    total_comments_analyzed: number;
    top_liked_comments: { text: string; likes: number }[];
    sentiment_breakdown: { positive: number; neutral: number; negative: number };
  };
  insights: {
    complaints: InsightItem[];
    confusion_points: InsightItem[];
    content_requests: InsightItem[];
    audience_struggles: InsightItem[];
    content_gaps: InsightItem[];
    video_ideas: InsightItem[];
  };
  created_at: string;
  credits_remaining?: number;
}

interface AnalysisSummary {
  id: string;
  video_id: string;
  video_title: string;
  video_thumbnail_url: string;
  provider: string;
  model: string;
  summary: string;
  created_at: string;
  sentiment_positive?: number;
  pending?: boolean;
  error?: string;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function InsightCard({ item }: { item: InsightItem }) {
  const body = item.description ?? item.reason ?? "";
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="font-semibold text-gray-900">{item.title}</p>
      {body && <p className="mt-1 text-sm text-gray-600 leading-relaxed">{body}</p>}
    </div>
  );
}

function InsightSection({ heading, items }: { heading: string; items: InsightItem[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="mb-3 text-lg font-bold text-gray-800">{heading}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <InsightCard key={i} item={item} />
        ))}
      </div>
    </section>
  );
}

function SentimentBar({
  positive,
  neutral,
  negative,
}: {
  positive: number;
  neutral: number;
  negative: number;
}) {
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        <div className="bg-emerald-400" style={{ width: `${positive}%` }} title={`Positive ${positive}%`} />
        <div className="bg-gray-300" style={{ width: `${neutral}%` }} title={`Neutral ${neutral}%`} />
        <div className="bg-rose-400" style={{ width: `${negative}%` }} title={`Negative ${negative}%`} />
      </div>
      <div className="mt-1 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" />
          Positive {positive}%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-300" />
          Neutral {neutral}%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-400" />
          Negative {negative}%
        </span>
      </div>
    </div>
  );
}

function Report({ data }: { data: AnalysisResult }) {
  const { stats, insights } = data;
  const { sentiment_breakdown: s } = stats;

  const insightSections: { heading: string; items: InsightItem[] }[] = [
    { heading: "Complaints", items: insights.complaints },
    { heading: "Confusion Points", items: insights.confusion_points },
    { heading: "Content Requests", items: insights.content_requests },
    { heading: "Audience Struggles", items: insights.audience_struggles },
    { heading: "Content Gaps", items: insights.content_gaps },
    { heading: "Video Ideas", items: insights.video_ideas },
  ];

  return (
    <div className="mt-10 space-y-8">
      <div className="flex gap-4">
        {data.video_thumbnail_url && (
          <img
            src={data.video_thumbnail_url}
            alt={data.video_title}
            className="h-20 w-36 flex-shrink-0 rounded-lg object-cover shadow-sm"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{data.video_title}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {data.provider} · {data.model}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Summary
        </h3>
        <p className="text-gray-800 leading-relaxed">{data.summary}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-4xl font-extrabold text-gray-900">
            {stats.total_comments_analyzed.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 leading-tight">
            comments<br />analyzed
          </span>
        </div>

        <SentimentBar positive={s.positive} neutral={s.neutral} negative={s.negative} />

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">Top liked comments</p>
          <ol className="space-y-2">
            {stats.top_liked_comments.map((c, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 font-mono text-gray-400 w-6">{i + 1}.</span>
                <span className="text-gray-700 flex-1">{c.text}</span>
                <span className="flex-shrink-0 text-gray-400 tabular-nums">
                  ♥ {c.likes.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="text-xl font-bold text-gray-900">Insights</h3>
        {insightSections.map((s) => (
          <InsightSection key={s.heading} heading={s.heading} items={s.items} />
        ))}
      </div>
    </div>
  );
}

function HistoryCard({
  item,
  onClick,
}: {
  item: AnalysisSummary;
  onClick: () => void;
}) {
  if (item.pending) {
    if (item.error) {
      return (
        <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
          <div className="flex h-32 items-center justify-center bg-red-100">
            <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="p-3">
            <p className="text-sm font-medium text-red-700">Analysis failed</p>
            <p className="mt-0.5 truncate text-xs text-red-400">{item.error}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
        <div className="flex h-32 flex-col items-center justify-center gap-2">
          <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-xs text-gray-400">Analyzing…</p>
        </div>
      </div>
    );
  }

  const date = new Date(item.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition hover:shadow-md"
    >
      <div className="relative">
        {item.video_thumbnail_url ? (
          <img
            src={item.video_thumbnail_url}
            alt={item.video_title}
            className="h-32 w-full object-cover"
          />
        ) : (
          <div className="h-32 bg-gray-100" />
        )}
        {item.sentiment_positive !== undefined && (
          <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
            ↑ {item.sentiment_positive}%
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors group-hover:text-indigo-600">
          {item.video_title}
        </p>
        <p className="mt-1 text-xs text-gray-400">{item.provider} · {date}</p>
      </div>
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisSummary[]>([]);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!session) return;
    const res = await fetch("/api/analyses").catch(() => null);
    if (res?.ok) {
      const data = await res.json().catch(() => []);
      setHistory(data);
    }
  }, [session]);

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
    setResult(null);

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
      return;
    }

    const data = await res.json().catch(() => null);

    if (res.status === 503) {
      setError("Server is busy, please try again in a moment.");
      setStatus("error");
      return;
    }

    if (res.status === 402) {
      const needed = data?.required
        ? ` This video needs ${data.required} credit${data.required !== 1 ? "s" : ""}.`
        : "";
      setError(`Not enough credits.${needed}`);
      setStatus("error");
      return;
    }

    if (!res.ok) {
      setError(data?.error ?? `Error ${res.status}`);
      setStatus("error");
      return;
    }

    const jobId: string | undefined = data?.job_id;
    if (!jobId) {
      setError("Unexpected response from server.");
      setStatus("error");
      return;
    }

    setHistory((h) => [
      { id: "__pending__", video_id: "", video_title: "Analyzing...", video_thumbnail_url: "", provider: "", model: "", summary: "", created_at: new Date().toISOString(), pending: true },
      ...h.filter((item) => !item.pending),
    ]);

    pollIntervalRef.current = setInterval(async () => {
      let pollRes: Response;
      try {
        pollRes = await fetch(`/api/analyze/status/${jobId}`);
      } catch {
        clearInterval(pollIntervalRef.current!);
        pollIntervalRef.current = null;
        setError("Network error while checking analysis status.");
        setStatus("error");
        setHistory((h) => h.map((item) => item.pending ? { ...item, error: "Network error" } : item));
        return;
      }

      const pollData = await pollRes.json().catch(() => null);

      if (!pollRes.ok || pollData?.status === "failed") {
        clearInterval(pollIntervalRef.current!);
        pollIntervalRef.current = null;
        const msg: string = pollData?.error ?? "Analysis failed.";
        setError(msg);
        setStatus("error");
        setHistory((h) => h.map((item) => item.pending ? { ...item, error: msg } : item));
        return;
      }

      if (pollData?.status === "done") {
        clearInterval(pollIntervalRef.current!);
        pollIntervalRef.current = null;
        const fullResult: AnalysisResult = pollData.result;
        setResult(fullResult);
        setStatus("success");
        fetchHistory();
        window.dispatchEvent(new Event("credits-updated"));
      }
    }, 3000);
  }

  async function handleHistoryClick(id: string) {
    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/analyses/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`);
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error — could not load analysis.");
      setStatus("error");
    }
  }

  const pendingItems = history.filter((i) => i.pending);
  const realItems = history.filter((i) => !i.pending);
  const displayItems = [...pendingItems, ...realItems].slice(0, 3);
  const showViewAll = realItems.length > 3 - pendingItems.length;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10">

        {/* Payment success banner */}
        {paymentSuccess && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>Payment successful — your credits will appear shortly.</span>
            <button
              onClick={() => setPaymentSuccess(false)}
              className="ml-4 text-emerald-500 hover:text-emerald-700"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero */}
        <div className="mb-10 text-center">
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
        </div>

        {/* Signed-out prompt */}
        {authStatus !== "loading" && !session && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Sign in with Google to analyze YouTube comments.
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
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
            className="whitespace-nowrap rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? "Analyzing…" : "Analyze →"}
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-400">
          Top 300 most-liked comments · 1 credit per analysis
        </p>

        {/* Loading state */}
        {status === "loading" && (
          <div className="mt-8 flex items-center gap-3 text-gray-500">
            <svg className="h-5 w-5 animate-spin text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Fetching and analyzing comments — this can take 30–60 seconds…</span>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span className="font-semibold">Error: </span>{error}
          </div>
        )}

        {/* Success state */}
        {status === "success" && result && <Report data={result} />}

        {/* Past analyses */}
        {session && displayItems.length > 0 && (
          <div className="mt-16">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent analyses</h2>
              {showViewAll && (
                <Link href="/history" className="text-sm text-indigo-600 hover:underline">
                  View all →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {displayItems.map((item) => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  onClick={() => { if (!item.pending) handleHistoryClick(item.id); }}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
