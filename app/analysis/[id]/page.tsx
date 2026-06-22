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

// ── Skeleton ───────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-6 h-4 w-16 animate-pulse rounded bg-gray-200" />
        {/* Hero */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="aspect-video w-full animate-pulse bg-gray-200" />
          <div className="p-6 space-y-3">
            <div className="h-7 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-7 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        {/* Summary */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-l-4 border-gray-200 p-6 space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        {/* Stats */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="h-12 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-full animate-pulse rounded-full bg-gray-200" />
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        </div>
        {/* Insight skeletons */}
        <div className="mt-8 space-y-8">
          {[1, 2, 3].map((s) => (
            <div key={s}>
              <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200" />
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2].map((c) => (
                  <div key={c} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ── Sentiment bar ──────────────────────────────────────────────────────────

function SentimentBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        <div className="bg-emerald-500" style={{ width: `${positive}%` }} />
        <div className="bg-gray-200" style={{ width: `${neutral}%` }} />
        <div className="bg-rose-500" style={{ width: `${negative}%` }} />
      </div>
      <div className="mt-2.5 flex gap-5 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Positive {positive}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-300" />
          Neutral {neutral}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
          Negative {negative}%
        </span>
      </div>
    </div>
  );
}

// ── Insight card ───────────────────────────────────────────────────────────

function InsightCard({ item, accentClass }: { item: InsightItem; accentClass: string }) {
  const body = item.description ?? item.reason ?? "";
  return (
    <div className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm border-l-4 ${accentClass}`}>
      <p className="font-semibold text-gray-900">{item.title}</p>
      {body && <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{body}</p>}
    </div>
  );
}

// ── Insight section config ─────────────────────────────────────────────────

const INSIGHT_SECTIONS: {
  key: keyof AnalysisResult["insights"];
  label: string;
  accentClass: string;
  headerColor: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "complaints",
    label: "Complaints",
    accentClass: "border-l-rose-400",
    headerColor: "text-rose-500",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    key: "confusion_points",
    label: "Confusion Points",
    accentClass: "border-l-amber-400",
    headerColor: "text-amber-500",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    key: "content_requests",
    label: "Content Requests",
    accentClass: "border-l-blue-400",
    headerColor: "text-blue-500",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
  },
  {
    key: "audience_struggles",
    label: "Audience Struggles",
    accentClass: "border-l-purple-400",
    headerColor: "text-purple-500",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    key: "content_gaps",
    label: "Content Gaps",
    accentClass: "border-l-teal-400",
    headerColor: "text-teal-500",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    key: "video_ideas",
    label: "Video Ideas",
    accentClass: "border-l-indigo-400",
    headerColor: "text-indigo-500",
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

  if (loading) return <PageSkeleton />;

  if (error || !data) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-5xl px-8 py-10">
          <button onClick={() => router.back()} className="cursor-pointer text-sm text-indigo-600 hover:underline">
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
      <div className="mx-auto max-w-5xl px-8 py-10">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="mb-6 cursor-pointer text-sm text-indigo-600 hover:underline"
        >
          ← Back
        </button>

        {/* Hero — thumbnail + title */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {data.video_thumbnail_url && (
            <img
              src={data.video_thumbnail_url}
              alt={data.video_title}
              className="aspect-video w-full object-cover"
            />
          )}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-extrabold leading-snug text-gray-900 sm:text-3xl">
                {data.video_title}
              </h1>
              {data.video_id && (
                <a
                  href={`https://www.youtube.com/watch?v=${data.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex-shrink-0 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                  title="Watch on YouTube"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
            </div>
            <div className="mt-3">
              <span className="text-sm text-gray-400">{date}</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50 shadow-sm">
          <div className="border-l-4 border-indigo-500 p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-500">
              Summary
            </p>
            <p className="text-base leading-relaxed text-gray-800">{data.summary}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Comment count */}
          <div className="mb-5 flex items-end gap-3">
            <span className="text-5xl font-extrabold tracking-tight text-gray-900">
              {stats.total_comments_analyzed.toLocaleString()}
            </span>
            <span className="mb-1.5 text-sm leading-tight text-gray-400">
              comments<br />analyzed
            </span>
          </div>

          <SentimentBar positive={s.positive} neutral={s.neutral} negative={s.negative} />

        </div>

        {/* Top liked comments */}
        {stats.top_liked_comments?.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              <h2 className="text-base font-bold text-gray-900">Top Liked Comments</h2>
            </div>
            <ol className="space-y-3">
              {stats.top_liked_comments.map((c, i) => {
                const avatarColors = [
                  "bg-violet-500", "bg-orange-400", "bg-emerald-500",
                  "bg-purple-500", "bg-teal-500", "bg-blue-500", "bg-rose-500",
                ];
                const letter = c.text.trim()[0]?.toUpperCase() ?? "#";
                return (
                  <li key={i} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColors[i % avatarColors.length]}`}>
                      {letter}
                    </span>
                    <span className="flex-1 text-sm leading-relaxed text-gray-700">{c.text}</span>
                    <span className="flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-rose-500">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                      {c.likes.toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Insight sections */}
        <div className="mt-8 space-y-8">
          {INSIGHT_SECTIONS.map(({ key, label, icon, accentClass, headerColor }) => {
            const items = insights[key];
            if (!items?.length) return null;

            if (key === "video_ideas") {
              return (
                <section key={key}>
                  <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 shadow-md">
                    <div className="mb-1 flex items-center gap-2 text-white">
                      {icon}
                      <h2 className="text-lg font-bold">Video Ideas</h2>
                    </div>
                    <p className="mb-5 text-sm text-indigo-200">
                      AI-generated ideas synthesized from every insight above
                    </p>
                    <div className="flex flex-col gap-3">
                      {items.map((item, i) => {
                        const body = item.description ?? item.reason ?? "";
                        return (
                          <div key={i} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/20">
                            <p className="font-semibold text-white">{item.title}</p>
                            {body && <p className="mt-1.5 text-sm leading-relaxed text-indigo-100">{body}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            }

            return (
              <section key={key}>
                <div className={`mb-4 flex items-center gap-2 ${headerColor}`}>
                  {icon}
                  <h2 className="text-lg font-bold">{label}</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {items.map((item, i) => (
                    <InsightCard key={i} item={item} accentClass={accentClass} />
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
