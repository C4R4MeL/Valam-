'use client';

export function ArticleSkeleton() {
  return (
    <div className="space-y-12">
      {/* Self-contained CSS for Shimmer effect */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { background-position: -200% 0 }
          100% { background-position: 200% 0 }
        }
        .shimmer-element {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}} />

      {/* 1. Featured Article Skeleton */}
      <div className="w-full h-[420px] rounded-3xl border border-zinc-200 overflow-hidden flex flex-col md:flex-row relative">
        <div className="w-full md:w-[60%] h-60 md:h-full shimmer-element" />
        <div className="p-8 flex-1 flex flex-col justify-between bg-zinc-50/50">
          <div className="space-y-4">
            <div className="h-6 w-24 rounded-full shimmer-element" />
            <div className="h-10 w-full rounded-xl shimmer-element" />
            <div className="h-10 w-[80%] rounded-xl shimmer-element" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded shimmer-element" />
              <div className="h-4 w-[60%] rounded shimmer-element" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full shimmer-element" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded shimmer-element" />
              <div className="h-3 w-20 rounded shimmer-element" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid Articles Skeletons (6 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-zinc-200 overflow-hidden flex flex-col h-[400px]">
            {/* Top image block */}
            <div className="h-48 w-full shimmer-element" />
            {/* Body block */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-6 w-4/5 rounded shimmer-element" />
                <div className="h-6 w-full rounded shimmer-element" />
                <div className="space-y-1.5 pt-2">
                  <div className="h-4 w-full rounded shimmer-element" />
                  <div className="h-4 w-5/6 rounded shimmer-element" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
                <div className="w-8 h-8 rounded-full shimmer-element" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 rounded shimmer-element" />
                  <div className="h-3 w-16 rounded shimmer-element" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
