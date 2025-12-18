import { Skeleton } from "@/components/ui/skeleton";

export function SportsEventsSkeleton() {
  return (
    <div className="bg-card/40 backdrop-blur-2xl rounded-md border-border">
      <div className="p-4">
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-5 w-8" />
          </div>
        </div>

        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-muted/40 border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SportsMatchesSkeleton() {
  return (
    <div className="bg-card/40 backdrop-blur-2xl rounded-md border-border">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-8 w-32" />
        </div>

        <div className="mb-6 p-4 bg-muted/40 backdrop-blur-2xl border border-border rounded-md">
          <Skeleton className="h-8 w-64 mb-2" />
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-8" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-8" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-8" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-muted/40 border border-border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton className="w-5 h-4" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SportsMatchDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-card/40 backdrop-blur-2xl rounded-md border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 w-32" />
        </div>
        
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-muted/60 rounded-lg p-4">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card/40 backdrop-blur-2xl rounded-md border-border p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="bg-muted/60 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}