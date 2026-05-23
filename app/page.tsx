"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface InsightItem {
  title: string;
  description?: string;
  reason?: string;
}

interface AnalysisResult {
  video_id: string;
  title: string;
  provider: string;
  model: string;
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

function InsightSection({
  heading,
  items,
}: {
  heading: string;
  items: InsightItem[];
}) {
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
        <div
          className="bg-emerald-400"
          style={{ width: `${positive}%` }}
          title={`Positive ${positive}%`}
        />
        <div
          className="bg-gray-300"
          style={{ width: `${neutral}%` }}
          title={`Neutral ${neutral}%`}
        />
        <div
          className="bg-rose-400"
          style={{ width: `${negative}%` }}
          title={`Negative ${negative}%`}
        />
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{data.title}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {data.provider} · {data.model}
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
          Summary
        </h3>
        <p className="text-gray-800 leading-relaxed">{data.summary}</p>
      </div>

      {/* Stats strip */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-4xl font-extrabold text-gray-900">
            {stats.total_comments_analyzed.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 leading-tight">
            comments<br />analyzed
          </span>
        </div>

        <SentimentBar
          positive={s.positive}
          neutral={s.neutral}
          negative={s.negative}
        />

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

      {/* Insights */}
      <div className="space-y-8">
        <h3 className="text-xl font-bold text-gray-900">Insights</h3>
        {insightSections.map((s) => (
          <InsightSection key={s.heading} heading={s.heading} items={s.items} />
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

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

      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`);
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("success");
    } catch {
      setError("Network error — could not reach the server.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Comment Analyzer</h1>
          <p className="mt-1 text-gray-500">Paste a YouTube URL to analyze its comments.</p>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
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
            <svg
              className="h-5 w-5 animate-spin text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
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
      </div>
    </main>
  );
}
