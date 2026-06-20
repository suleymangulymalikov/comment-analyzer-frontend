"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

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
}

const PRICING_PLANS = [
  { key: "pack_standard", label: "Starter Pack", price: "$7.99", credits: 10, type: "One-time" },
  { key: "sub_starter", label: "Starter", price: "$9.99/mo", credits: 15, type: "Monthly" },
  { key: "sub_pro", label: "Pro", price: "$19.99/mo", credits: 40, type: "Monthly" },
] as const;

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

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
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

function HistoryItem({
  item,
  onClick,
}: {
  item: AnalysisSummary;
  onClick: () => void;
}) {
  const date = new Date(item.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm hover:bg-gray-50 transition"
    >
      {item.video_thumbnail_url && (
        <img
          src={item.video_thumbnail_url}
          alt={item.video_title}
          className="h-12 w-20 flex-shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{item.video_title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{item.provider} · {date}</p>
      </div>
    </button>
  );
}

function PricingSection({
  onCheckout,
  loadingKey,
}: {
  onCheckout: (priceKey: string) => void;
  loadingKey: string | null;
}) {
  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-bold text-gray-900">Buy credits</h2>
      <p className="mb-5 text-sm text-gray-500">
        Credits are consumed per analysis based on comment count.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <div key={plan.key} className="flex flex-col rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700">{plan.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{plan.price}</p>
            <p className="text-xs text-gray-400">{plan.type}</p>
            <p className="mt-3 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">{plan.credits}</span>{" "}
              {plan.type === "Monthly" ? "credits/mo" : "credits"}
            </p>
            <button
              onClick={() => onCheckout(plan.key)}
              disabled={loadingKey !== null}
              className="mt-auto pt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingKey === plan.key ? "Redirecting…" : "Buy"}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-400">
        1 credit per analysis
      </p>
    </div>
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
  const [credits, setCredits] = useState<number | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!session) return;
    const res = await fetch("/api/analyses").catch(() => null);
    if (res?.ok) {
      const data = await res.json().catch(() => []);
      setHistory(data);
    }
  }, [session]);

  const fetchCredits = useCallback(async () => {
    if (!session) return;
    const res = await fetch("/api/credits").catch(() => null);
    if (res?.ok) {
      const data = await res.json().catch(() => null);
      if (data?.balance !== undefined) setCredits(data.balance);
    }
  }, [session]);

  useEffect(() => {
    fetchHistory();
    fetchCredits();
  }, [fetchHistory, fetchCredits]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: url.trim() }),
      });

      const data = await res.json();

      if (res.status === 402) {
        const needed = data.required
          ? ` This video needs ${data.required} credit${data.required !== 1 ? "s" : ""}.`
          : "";
        setError(`Not enough credits.${needed}`);
        setShowPricing(true);
        setStatus("error");
        return;
      }

      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`);
        setStatus("error");
        return;
      }

      if (data.credits_remaining !== undefined) setCredits(data.credits_remaining);
      setResult(data);
      setStatus("success");
      fetchHistory();
    } catch {
      setError("Network error — could not reach the server.");
      setStatus("error");
    }
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

  async function handleCheckout(priceKey: string) {
    setCheckoutLoading(priceKey);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_key: priceKey,
          success_url: `${window.location.origin}/?payment=success`,
          cancel_url: window.location.href,
        }),
      });
      const data = await res.json();
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.error ?? "Could not start checkout.");
      }
    } catch {
      setError("Network error — could not start checkout.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Title + auth header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Comment Analyzer</h1>
            <p className="mt-1 text-gray-500">Paste a YouTube URL to analyze its comments.</p>
          </div>

          {authStatus === "loading" ? null : session ? (
            <div className="flex flex-wrap items-center justify-end gap-2 flex-shrink-0">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "User avatar"}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className="hidden sm:block text-sm text-gray-700 max-w-[140px] truncate">
                {session.user?.name ?? session.user?.email}
              </span>
              {credits !== null && (
                <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {credits} credit{credits !== 1 ? "s" : ""}
                </span>
              )}
              <button
                onClick={() => setShowPricing((v) => !v)}
                className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 transition"
              >
                {showPricing ? "Hide pricing" : "Buy credits"}
              </button>
              <button
                onClick={() => signOut()}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition flex-shrink-0"
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

        {/* Pricing section */}
        {session && showPricing && (
          <PricingSection onCheckout={handleCheckout} loadingKey={checkoutLoading} />
        )}

        {/* Signed-out prompt */}
        {authStatus !== "loading" && !session && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Sign in with Google to analyze YouTube comments.
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={status === "loading"}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "loading" || !url.trim()}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Analyzing…" : "Analyze"}
          </button>
        </form>

        {/* Loading state */}
        {status === "loading" && (
          <div className="mt-8 flex items-center gap-3 text-gray-500">
            <svg className="h-5 w-5 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Fetching and analyzing comments — this can take 30–60 seconds…</span>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span className="font-semibold">Error: </span>{error}
          </div>
        )}

        {/* Success state */}
        {status === "success" && result && <Report data={result} />}

        {/* Past analyses */}
        {session && history.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Past analyses</h2>
            <div className="space-y-2">
              {history.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onClick={() => handleHistoryClick(item.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
