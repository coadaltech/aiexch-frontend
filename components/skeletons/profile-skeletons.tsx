import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ProfileDashboardSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto lg:p-8">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Skeleton className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-muted rounded-full"></div>
              </div>
              <div>
                <Skeleton className="h-8 lg:h-10 w-32 lg:w-40 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Balance Card */}
            <div className="bg-muted/50 border border-border rounded-2xl p-6 min-w-[280px]">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-10 lg:h-12 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Skeleton className="flex-1 h-14 rounded-xl" />
            <Skeleton className="flex-1 h-14 rounded-xl" />
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <Skeleton className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PersonalInfoSkeleton() {
  return (
    <div className="min-h-screen max-w-md mx-auto lg:max-w-6xl">
      <div className="min-h-screen lg:bg-transparent md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4 lg:p-0 lg:mb-6">
          <Skeleton className="w-8 h-8" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Profile Overview Card */}
          <div className="mt-4 lg:mt-0 lg:col-span-1">
            <Card className="bg-card border-border p-6 text-center">
              <Skeleton className="h-6 w-32 mx-auto mb-1" />
              <Skeleton className="h-4 w-24 mx-auto mb-4" />
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                <div>
                  <Skeleton className="h-8 w-12 mx-auto mb-2" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
                <div>
                  <Skeleton className="h-8 w-12 mx-auto mb-2" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              </div>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="mt-4 lg:mt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:col-span-3">
            {/* Account Information */}
            <Card className="bg-card border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Personal Details */}
            <Card className="bg-card border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Address Information */}
            <Card className="bg-card border-border p-6 md:col-span-2">
              <Skeleton className="h-5 w-36 mb-6" />
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={i === 2 ? "md:col-span-2" : ""}>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="bg-card border-border p-6 md:col-span-2">
              <Skeleton className="h-5 w-32 mb-6" />
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  >
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TransactionHistorySkeleton() {
  return (
    <div className="min-h-screen max-w-md mx-auto lg:max-w-6xl">
      <div className="md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4 lg:p-0 lg:mb-6">
          <Skeleton className="w-8 h-8" />
          <Skeleton className="h-6 w-48" />
        </div>

        {/* Filters and Search */}
        <div className="lg:p-0 mt-4 lg:mb-6 space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
          <Skeleton className="w-full h-12" />
        </div>

        {/* Transaction List */}
        <div className="space-y-3 mt-4 lg:p-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-card border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BetHistorySkeleton() {
  return (
    <div className="min-h-screen max-w-md mx-auto lg:max-w-6xl">
      <div className="md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4 lg:p-0 lg:mb-6">
          <Skeleton className="w-8 h-8" />
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Filters */}
        <div className="lg:p-0 mt-4 lg:mb-6">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-16" />
            ))}
          </div>
        </div>

        {/* Bet List */}
        <div className="space-y-3 mt-4 lg:p-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BonusSkeleton() {
  return (
    <div className="min-h-screen max-w-md mx-auto lg:max-w-6xl">
      <div className="md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4 lg:p-0 lg:mb-6">
          <Skeleton className="w-8 h-8" />
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Active Bonuses */}
        <div className="space-y-4 mt-4 lg:p-0">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="bg-card border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </Card>
          ))}
        </div>

        {/* Available Bonuses */}
        <div className="space-y-4 mt-8 lg:p-0">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-card border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-20" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="max-w-md min-h-screen mx-auto lg:max-w-6xl">
      <div className="md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between lg:p-0 lg:mb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-8 h-8" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>

        {/* Filters */}
        <div className="lg:p-0 mt-4 lg:mb-6">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 mt-6 lg:px-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-card border-border p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="w-2 h-2 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="w-8 h-8" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GenericProfileSkeleton() {
  return (
    <div className="min-h-screen max-w-md mx-auto lg:max-w-6xl">
      <div className="md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4 lg:p-0 lg:mb-6">
          <Skeleton className="w-8 h-8" />
          <Skeleton className="h-6 w-40" />
        </div>

        {/* Content */}
        <div className="space-y-4 mt-4 lg:p-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border p-4">
              <Skeleton className="h-5 w-48 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
