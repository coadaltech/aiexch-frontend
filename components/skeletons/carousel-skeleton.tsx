import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CarouselSkeleton({ 
  itemCount = 3, 
  className 
}: { 
  itemCount?: number; 
  className?: string;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  );
}
