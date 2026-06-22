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
  stats?: {
    total_comments_analyzed?: number;
    sentiment_breakdown?: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
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
        <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="flex aspect-video w-full items-center justify-center bg-red-100">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="p-4">
            <p className="text-sm font-bold text-red-700">Analysis failed</p>
            <p className="mt-0.5 truncate text-xs text-red-400">{item.error}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-sm">
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2">
          <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-xs text-gray-400">Analyzing…</p>
        </div>
      </div>
    );
  }

  const sentiment = item.stats?.sentiment_breakdown;
  const hasSentiment = sentiment !== undefined;

  return (
    <button
      onClick={onClick}
      className="group w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:shadow-md"
    >
      {/* Thumbnail — flush, 16:9, no padding */}
      <div className="relative w-full overflow-hidden">
        {item.video_thumbnail_url ? (
          <img
            src={item.video_thumbnail_url}
            alt={item.video_title}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="aspect-video w-full bg-gray-100" />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <p className="line-clamp-2 font-bold leading-snug text-gray-900 transition-colors group-hover:text-indigo-600">
          {item.video_title}
        </p>

        {/* Sentiment bar — always shown; flat gray placeholder when data is absent */}
        <div className="mt-3">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full">
            {hasSentiment && sentiment ? (
              <>
                <div className="bg-emerald-500" style={{ width: `${sentiment.positive}%` }} />
                <div className="bg-gray-300" style={{ width: `${sentiment.neutral}%` }} />
                <div className="bg-rose-500" style={{ width: `${sentiment.negative}%` }} />
              </>
            ) : (
              <div className="w-full bg-gray-200" />
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs">
            <span className="text-emerald-600">
              ● Positive {sentiment ? `${sentiment.positive}%` : "—"}
            </span>
            <span className="text-gray-400">
              ● Neutral {sentiment ? `${sentiment.neutral}%` : "—"}
            </span>
            <span className="text-rose-500">
              ● Negative {sentiment ? `${sentiment.negative}%` : "—"}
            </span>
          </div>
        </div>

        {/* Summary */}
        {item.summary && (
          <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-gray-500">
            {item.summary}
          </p>
        )}
      </div>
    </button>
  );
}
