"use client";

export interface AnalysisSummary {
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

export function HistoryCard({
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
            <svg
              className="h-6 w-6 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
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
          <svg
            className="h-5 w-5 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
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
        <p className="mt-1 text-xs text-gray-400">
          {item.provider} · {date}
        </p>
      </div>
    </button>
  );
}
