"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  VideoCard,
  VideoCardSkeleton,
  type AnalysisSummary,
} from "@/app/components/VideoCard";

// ── Demo data (hardcoded — no API calls) ───────────────────────────────────

const DEMO = {
  title:
    "I Tried Every Productivity System For 30 Days (Here's What Actually Works)",
  sentiment: { positive: 74, neutral: 16, negative: 10 },
  summary:
    "Viewers are overwhelmingly positive about the honest, no-BS approach to testing real productivity systems. The GTD and time-blocking sections drove the most engagement and are cited as genuinely practical. Most criticism is about the second half feeling rushed, with strong demand for a 90-day follow-up and deeper dives into each system.",
  topComments: [
    {
      author: "TechWithTim",
      text: "Finally someone who actually tried these instead of just reading about them. The GTD breakdown alone was worth 30 minutes of my time.",
      likes: 4821,
    },
    {
      author: "Sarah_Builds",
      text: "The time-blocking section is the most honest take I've seen. Everyone sells it as magic but you actually showed the failure days too.",
      likes: 3104,
    },
    {
      author: "ProductivityNerd99",
      text: "Came here skeptical, leaving as a convert. Subbed. Please do a 90-day follow-up.",
      likes: 2456,
    },
    {
      author: "JordanMakesStuff",
      text: "This is the video I needed 2 years ago. Would have saved me $400 in courses.",
      likes: 1987,
    },
  ],
  complaints: [
    {
      title: "Second half feels rushed",
      body: "Multiple viewers note the video slows down after the 15-minute mark. The last 3 systems get far less screen time than the first two.",
    },
    {
      title: "No written summary",
      body: "Commenters repeatedly ask for a pinned comment or blog post summarising each system's pros and cons.",
    },
    {
      title: "Missing cost breakdown",
      body: "Several viewers point out that the tools tested (Notion, Things 3, etc.) have varying costs that weren't mentioned.",
    },
  ],
  videoIdeas: [
    {
      title: "90-day follow-up: what stuck?",
      body: "Dozens of comments ask what the creator is still using 3 months later. By far the most requested follow-up.",
    },
    {
      title: "Beginner's guide to GTD",
      body: "The GTD segment drove the most engagement; a dedicated deep-dive is heavily requested by newer viewers.",
    },
    {
      title: "Productivity systems for ADHD",
      body: "A notable subset of commenters mention ADHD and ask for systems that account for executive dysfunction.",
    },
  ],
};

// ── Google icon ────────────────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── YouTube icon ───────────────────────────────────────────────────────────

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// ── Logged-out landing page ────────────────────────────────────────────────

function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-indigo-50/70 to-white px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-indigo-500">
            YouTube Comment Intelligence
          </p>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl leading-tight">
            Know exactly what your audience
            <br />
            <em className="italic text-indigo-600">really wants</em>
          </h1>
          <p className="mt-6 text-lg text-gray-500">
            Paste any YouTube URL and get AI-powered insights from the top 300
            comments in seconds
          </p>

          <div className="mt-10 flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <YouTubeIcon className="h-5 w-5 text-red-500" />
              </div>
              <input
                type="url"
                readOnly
                onClick={() => signIn("google")}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={() => signIn("google")}
              className="cursor-pointer whitespace-nowrap rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Analyze →
            </button>
          </div>
          <p className="mt-2 text-left text-xs text-gray-400">
            Top 300 most-liked comments · 1 credit per analysis
          </p>
        </div>
      </section>

      {/* Demo report */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">
            Here&apos;s what a real report looks like
          </h2>

          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
            {/* Report content — capped height so fade lands in the insights */}
            <div className="max-h-[820px] overflow-hidden">
              <div className="p-6 sm:p-8">
                {/* Video header */}
                <div className="flex flex-col gap-4 sm:flex-row">
                  {/* Thumbnail placeholder */}
                  <div className="h-28 w-full flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-900 to-indigo-600 sm:w-48 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                      <YouTubeIcon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug">
                      {DEMO.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                      {DEMO.summary}
                    </p>
                  </div>
                </div>

                {/* Sentiment bar */}
                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Comment Sentiment
                  </p>
                  <div className="flex h-3 overflow-hidden rounded-full">
                    <div
                      className="bg-emerald-400 transition-all"
                      style={{ width: `${DEMO.sentiment.positive}%` }}
                    />
                    <div
                      className="bg-amber-300 transition-all"
                      style={{ width: `${DEMO.sentiment.neutral}%` }}
                    />
                    <div
                      className="bg-red-400 transition-all"
                      style={{ width: `${DEMO.sentiment.negative}%` }}
                    />
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Positive {DEMO.sentiment.positive}%
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-300" />
                      Neutral {DEMO.sentiment.neutral}%
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-400" />
                      Negative {DEMO.sentiment.negative}%
                    </span>
                  </div>
                </div>

                {/* Top comments */}
                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Top Liked Comments
                  </p>
                  <div className="space-y-3">
                    {DEMO.topComments.map((c, i) => (
                      <div
                        key={i}
                        className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                          {c.author[0]}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">
                            {c.author}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-600">
                            {c.text}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            👍 {c.likes.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insight sections */}
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Complaints
                    </p>
                    <div className="space-y-3">
                      {DEMO.complaints.map((c, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3"
                        >
                          <p className="text-sm font-semibold text-gray-800">
                            {c.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">{c.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Video Ideas
                    </p>
                    <div className="space-y-3">
                      {DEMO.videoIdeas.map((v, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3"
                        >
                          <p className="text-sm font-semibold text-gray-800">
                            {v.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">{v.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fade overlay + CTA */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end gap-3 bg-gradient-to-t from-white via-white/95 to-transparent pb-10 pt-32">
              <p className="text-sm text-gray-600">
                Sign in to see the full report and analyze any video
              </p>
              <button
                onClick={() => signIn("google")}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <GoogleIcon className="h-4 w-4" />
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900">
            How it works
          </h2>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {[
              {
                icon: "🔗",
                step: "1",
                title: "Paste any YouTube URL",
                desc: "Drop in a link and hit Analyze.",
              },
              {
                icon: "🤖",
                step: "2",
                title: "AI analyzes the top 300 comments",
                desc: "We fetch the most-liked comments and run them through our AI pipeline.",
              },
              {
                icon: "📊",
                step: "3",
                title: "Get a full report",
                desc: "Sentiment, complaints, content gaps, and video ideas. All in one place.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
                  {s.icon}
                </div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-500">
                  Step {s.step}
                </p>
                <p className="text-base font-bold text-gray-900">{s.title}</p>
                <p className="mt-1.5 text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">
            What you get
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                icon: "😤",
                title: "What your viewers are complaining about",
                desc: "Surface recurring pain points before they damage your channel.",
              },
              {
                icon: "💡",
                title: "Video topics your audience is begging for",
                desc: "Turn comment requests into your next viral video idea.",
              },
              {
                icon: "📈",
                title: "How positive or negative the comment section really is",
                desc: "An at-a-glance sentiment bar across all 300 top comments.",
              },
              {
                icon: "🏆",
                title: "The most liked comments at a glance",
                desc: "See exactly which opinions are resonating most with your audience.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-indigo-50 px-6 py-16">
        <div className="mx-auto max-w-xs text-center">
          <h2 className="mb-1 text-2xl font-bold text-gray-900">
            Simple pricing
          </h2>
          <p className="mb-8 text-sm text-gray-500">
            No subscription required.
          </p>
          <div className="rounded-2xl border border-indigo-200 bg-white p-8 shadow-sm">
            <p className="text-5xl font-extrabold text-gray-900">$7.99</p>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              10 credits · One-time · No subscription
            </p>
            <button
              onClick={() => signIn("google")}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Buy credits
            </button>
            <p className="mt-3 text-xs text-gray-400">
              1 credit per analysis · Credits never expire
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Ready to know what your audience{" "}
            <em className="italic text-indigo-600">really</em> thinks?
          </h2>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => signIn("google")}
              className="flex items-center gap-2.5 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <GoogleIcon className="h-5 w-5" />
              Sign in with Google
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            No credit card required to sign in
          </p>
        </div>
      </section>
    </main>
  );
}

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
        const pending = current.filter((i) => i.pending);
        const hasActiveJob = sessionStorage.getItem("activeJobId") !== null;
        const placeholder: AnalysisSummary[] =
          pending.length === 0 && hasActiveJob
            ? [
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
              ]
            : pending;
        return [...placeholder, ...data];
      });
    }
    setHistoryLoading(false);
  }, [session]);

  const startPolling = useCallback(
    (jobId: string) => {
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
            h.map((item) =>
              item.pending ? { ...item, error: "Network error" } : item,
            ),
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
            h.map((item) => (item.pending ? { ...item, error: msg } : item)),
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
              item.pending
                ? { ...pollData.result, pending: false, isNew: true }
                : item,
            ),
          );

          setStatus("idle");
          fetchHistory();
        }
      }, 3000);
    },
    [fetchHistory],
  );

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

  // Show marketing page for logged-out users (and during auth loading)
  if (authStatus !== "authenticated") {
    return <LandingPage />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    setStatus("loading");
    setError("");

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
            Paste any YouTube URL and get AI-powered insights from the comments
            in seconds.
          </p>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <YouTubeIcon className="h-5 w-5 text-red-500" />
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
              <span className="font-semibold">Error: </span>
              {error}
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
              <h2 className="text-lg font-bold text-gray-900">
                Recent analyses
              </h2>
              {showViewAll && (
                <Link
                  href="/history"
                  className="text-sm text-indigo-600 hover:underline"
                >
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
                Array.from({
                  length: Math.max(0, 5 - displayItems.length),
                }).map((_, i) => (
                  <VideoCardSkeleton key={`__skeleton__${i}`} />
                ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
