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
  video_view_count?: number;
  video_comment_count?: number;
  video_like_count?: number;
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

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
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

        {/* Stats row — always shown, "—" when data is absent */}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {item.video_view_count !== undefined ? formatCount(item.video_view_count) : "—"}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            {item.video_comment_count !== undefined ? formatCount(item.video_comment_count) : "—"}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.729c.11.727-.234 1.271-.964 1.271H4.057c-.54 0-1.002-.28-1.206-.72a11.943 11.943 0 01-.976-4.51c0-.617.5-1.115 1.117-1.115h4.912M12 6.75v.75" />
            </svg>
            {item.video_like_count !== undefined ? formatCount(item.video_like_count) : "—"}
          </span>
        </div>

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
