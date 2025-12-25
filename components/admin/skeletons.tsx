import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="bg-card border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardActivitySkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="bg-card border">
          <CardContent className="space-y-3 pt-6">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-start gap-3">
                <Skeleton className="h-4 w-4 rounded mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tbody>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-border/50">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="py-4">
              <Skeleton className="h-4 w-24" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function NotificationListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 bg-muted rounded-lg border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}