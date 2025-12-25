import { Skeleton } from "@/components/ui/skeleton";

export function PromotionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide -mr-4 pr-4 pb-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[280px] h-[200px] shrink-0 rounded-md border border-border p-4 flex flex-col justify-end">
          <Skeleton className="h-6 w-20 mb-2 rounded" />
          <Skeleton className="h-5 w-3/4 mb-1" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
