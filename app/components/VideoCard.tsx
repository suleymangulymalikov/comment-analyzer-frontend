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
  video_like_count?: number;
  video_comment_count?: number;
  stats?: {
    total_comments_analyzed?: number;
    sentiment_breakdown?: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  pending?: boolean;
  isNew?: boolean;
  error?: string;
}

export function VideoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="aspect-video w-full animate-pulse bg-gray-200" />
      <div className="p-4">
        <div className="space-y-1.5">
          <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="mt-2.5 h-2 w-full animate-pulse rounded-full bg-gray-200" />
        <div className="mt-2.5 space-y-1.5">
          <div className="h-2.5 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-2.5 w-4/6 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function VideoCard({
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
    return <VideoCardSkeleton />;
  }

  const sentiment = item.stats?.sentiment_breakdown;
  const hasSentiment = sentiment !== undefined;

  return (
    <button
      onClick={onClick}
      className="group w-full cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition hover:shadow-md"
    >
      {/* Thumbnail */}
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
        {item.isNew && (
          <span className="absolute left-2 top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
            New
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-indigo-600">
          {item.video_title}
        </p>

        <div className="mt-2">
          <div className="flex h-2 w-full overflow-hidden rounded-full">
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
          {hasSentiment && sentiment && (
            <div className="mt-1 flex gap-x-2 text-[10px] text-gray-400">
              <span className="text-emerald-600">{sentiment.positive}%</span>
              <span>{sentiment.neutral}%</span>
              <span className="text-rose-500">{sentiment.negative}%</span>
            </div>
          )}
        </div>

        {item.summary && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
            {item.summary}
          </p>
        )}
      </div>
    </button>
  );
}
