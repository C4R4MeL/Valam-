import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Shared shell: top offset for fixed navbar */
function Shell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'min-h-screen bg-zinc-50 pt-16 md:pt-20 pb-24 md:pb-12',
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Memuat konten"
    >
      <span className="sr-only">Memuat konten…</span>
      {children}
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-5 w-[85%]" />
        <Skeleton className="h-4 w-[60%]" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function MarketplaceSkeleton() {
  return (
    <Shell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-[280px] shrink-0 space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </aside>
          <div className="flex-1 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-9 w-36 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <Shell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-16 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-9 w-[90%]" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function CartSkeleton() {
  return (
    <Shell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-11 w-full max-w-md rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-zinc-200 p-4 flex gap-4"
              >
                <Skeleton className="h-24 w-24 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-[70%]" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4 h-fit">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function CheckoutSkeleton() {
  return (
    <Shell className="pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="flex gap-2 mb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-2 flex-1 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 h-fit">
            <Skeleton className="h-6 w-36" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function DashboardSkeleton() {
  return (
    <div
      className="p-4 sm:p-6 lg:p-8 space-y-6"
      role="status"
      aria-busy="true"
      aria-label="Memuat dashboard"
    >
      <span className="sr-only">Memuat dashboard…</span>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TablePageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="p-4 sm:p-6 lg:p-8 space-y-5"
      role="status"
      aria-busy="true"
      aria-label="Memuat data"
    >
      <span className="sr-only">Memuat data…</span>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="border-b border-zinc-100 px-4 py-3 flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-4 border-b border-zinc-50 last:border-0 flex gap-4 items-center"
          >
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20 hidden sm:block" />
            <Skeleton className="h-4 w-24 hidden md:block" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function FormPageSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div
      className="p-4 sm:p-6 lg:p-8 max-w-3xl space-y-6"
      role="status"
      aria-busy="true"
      aria-label="Memuat formulir"
    >
      <span className="sr-only">Memuat formulir…</span>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-72" />
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <Shell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <FormPageSkeleton fields={5} />
      </div>
    </Shell>
  )
}

export function ArticleDetailSkeleton() {
  return (
    <Shell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-[80%]" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </Shell>
  )
}

export function MatchingSkeleton() {
  return (
    <Shell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="space-y-2 text-center max-w-xl mx-auto">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3"
              >
                <div className="flex gap-3">
                  <Skeleton className="h-16 w-16 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-[70%]" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-8 w-14 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function ChatSkeleton() {
  return (
    <Shell className="pb-4">
      <div className="max-w-4xl mx-auto px-4 h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-200">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex-1 py-6 space-y-4">
          <Skeleton className="h-16 w-[70%] rounded-2xl" />
          <Skeleton className="h-12 w-[55%] rounded-2xl ml-auto" />
          <Skeleton className="h-20 w-[65%] rounded-2xl" />
          <Skeleton className="h-10 w-[40%] rounded-2xl ml-auto" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </Shell>
  )
}

export function TraceabilitySkeleton() {
  return (
    <Shell className="pt-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}

export function AuthSkeleton() {
  return (
    <div
      className="min-h-screen bg-zinc-50 flex items-center justify-center p-4"
      role="status"
      aria-busy="true"
      aria-label="Memuat formulir"
    >
      <span className="sr-only">Memuat formulir…</span>
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 p-8 space-y-5">
        <Skeleton className="h-10 w-32 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function OrdersSkeleton({ embedded = false }: { embedded?: boolean }) {
  const body = (
    <div className={embedded ? 'space-y-5' : 'max-w-5xl mx-auto px-4 sm:px-6 space-y-5'}>
      {!embedded && <Skeleton className="h-8 w-48" />}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3"
        >
          <div className="flex justify-between gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-56" />
          <div className="flex gap-3 pt-1">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[70%]" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  if (embedded) {
    return (
      <div role="status" aria-busy="true" aria-label="Memuat pesanan">
        <span className="sr-only">Memuat pesanan…</span>
        {body}
      </div>
    )
  }

  return <Shell>{body}</Shell>
}

export function SupplierProfileSkeleton() {
  return (
    <Shell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="flex items-end gap-4 -mt-12 px-4 relative z-10">
          <Skeleton className="h-20 w-20 rounded-2xl border-4 border-white" />
          <div className="space-y-2 pb-2 flex-1">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <ProductGridSkeleton count={3} />
      </div>
    </Shell>
  )
}

export function ArticleListSkeleton() {
  return (
    <Shell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="w-full h-[320px] md:h-[420px] rounded-3xl border border-zinc-200 overflow-hidden flex flex-col md:flex-row">
          <Skeleton className="w-full md:w-[60%] h-48 md:h-full rounded-none" />
          <div className="p-6 md:p-8 flex-1 space-y-4 bg-white">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-[80%]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-zinc-200 overflow-hidden"
            >
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-[90%]" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}

export function SessionSkeleton() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-50/90 backdrop-blur-sm"
      role="status"
      aria-busy="true"
      aria-label="Memverifikasi sesi"
    >
      <div className="w-full max-w-sm mx-4 space-y-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </div>
        <p className="text-center text-xs font-medium text-zinc-500">
          Memverifikasi sesi…
        </p>
      </div>
    </div>
  )
}
