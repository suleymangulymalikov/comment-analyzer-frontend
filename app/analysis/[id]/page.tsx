"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

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
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SentimentBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        <div className="bg-indigo-500" style={{ width: `${positive}%` }} title={`Positive ${positive}%`} />
        <div className="bg-gray-200" style={{ width: `${neutral}%` }} title={`Neutral ${neutral}%`} />
        <div className="bg-rose-400" style={{ width: `${negative}%` }} title={`Negative ${negative}%`} />
      </div>
      <div className="mt-2 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-indigo-500" />
          Positive {positive}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-gray-200" />
          Neutral {neutral}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-rose-400" />
          Negative {negative}%
        </span>
      </div>
    </div>
  );
}

function InsightCard({ item }: { item: InsightItem }) {
  const body = item.description ?? item.reason ?? "";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="font-semibold text-gray-900">{item.title}</p>
      {body && <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{body}</p>}
    </div>
  );
}

const INSIGHT_SECTIONS: {
  key: keyof AnalysisResult["insights"];
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "complaints",
    label: "Complaints",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    key: "confusion_points",
    label: "Confusion Points",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    key: "content_requests",
    label: "Content Requests",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
  },
  {
    key: "audience_struggles",
    label: "Audience Struggles",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    key: "content_gaps",
    label: "Content Gaps",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    key: "video_ideas",
    label: "Video Ideas",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/analyses/${id}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(json?.error ?? `Error ${res.status}`);
        } else {
          setData(json);
        }
      })
      .catch(() => setError("Network error — could not load analysis."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-10">
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

  if (error || !data) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <button onClick={() => router.back()} className="text-sm text-indigo-600 hover:underline">
            ← Back
          </button>
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error || "Analysis not found."}
          </div>
        </div>
      </main>
    );
  }

  const { stats, insights } = data;
  const { sentiment_breakdown: s } = stats;

  const date = new Date(data.created_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* Back */}
        <button onClick={() => router.back()} className="mb-6 text-sm text-indigo-600 hover:underline">
          ← Back
        </button>

        {/* Top section — thumbnail + title */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {data.video_thumbnail_url && (
            <img
              src={data.video_thumbnail_url}
              alt={data.video_title}
              className="h-56 w-full object-cover sm:h-72"
            />
          )}
          <div className="p-6">
            <h1 className="text-2xl font-extrabold leading-snug text-gray-900 sm:text-3xl">
              {data.video_title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>{date}</span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {data.provider} · {data.model}
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-l-4 border-indigo-500 p-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-500">
              Summary
            </p>
            <p className="text-base leading-relaxed text-gray-800">{data.summary}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-end gap-3">
            <span className="text-5xl font-extrabold text-gray-900">
              {stats.total_comments_analyzed.toLocaleString()}
            </span>
            <span className="mb-1 text-sm text-gray-400 leading-tight">
              comments<br />analyzed
            </span>
          </div>

          <SentimentBar positive={s.positive} neutral={s.neutral} negative={s.negative} />

          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-gray-700">Top liked comments</p>
            <ol className="space-y-3">
              {stats.top_liked_comments.map((c, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-5 flex-shrink-0 font-mono text-gray-300">{i + 1}.</span>
                  <span className="flex-1 leading-relaxed text-gray-700">{c.text}</span>
                  <span className="flex-shrink-0 tabular-nums text-gray-400">
                    ♥ {c.likes.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Insight sections */}
        <div className="mt-8 space-y-8">
          {INSIGHT_SECTIONS.map(({ key, label, icon }) => {
            const items = insights[key];
            if (!items?.length) return null;
            return (
              <section key={key}>
                <div className="mb-4 flex items-center gap-2 text-gray-800">
                  <span className="text-indigo-500">{icon}</span>
                  <h2 className="text-lg font-bold">{label}</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((item, i) => (
                    <InsightCard key={i} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

      </div>
    </main>
  );
}
