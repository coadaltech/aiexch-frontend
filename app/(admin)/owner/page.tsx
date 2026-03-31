"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Gift,
  Shield,
  CreditCard,
  TrendingUp,
  Loader2,
  DollarSign,
  Activity,
  UserCheck,
  Globe,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  useOwnerUsers,
  usePromotions,
  useVouchers,
  useKycDocuments,
} from "@/hooks/useOwner";
import { useRouter } from "next/navigation";
import {
  DashboardStatsSkeleton,
  DashboardActivitySkeleton,
} from "@/components/owner/skeletons";
import { useAuth } from "@/contexts/AuthContext";
import { usePanelPrefix } from "@/hooks/usePanelPrefix";

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const panelPrefix = usePanelPrefix();
  const { data: users = [], isLoading: usersLoading } = useOwnerUsers();
  const { data: promotions = [], isLoading: promotionsLoading } =
    usePromotions();
  const { data: vouchers = [], isLoading: vouchersLoading } =
    useVouchers();
  const { data: kycDocuments = [], isLoading: kycLoading } = useKycDocuments();

  const isLoading =
    usersLoading || promotionsLoading || vouchersLoading || kycLoading;

  // Role hierarchy - each role can see roles below it
  const roleHierarchy = ["owner", "admin", "super", "master", "agent", "user"];
  const currentRoleIndex = roleHierarchy.indexOf(user?.role || "user");

  // Calculate user counts by role, filtered by hierarchy
  const allRoleCounts = [
    { role: "Admin", key: "admin", count: users.filter((u: any) => u.role === "admin").length, color: "text-blue-600" },
    { role: "Super", key: "super", count: users.filter((u: any) => u.role === "super").length, color: "text-purple-600" },
    { role: "Master", key: "master", count: users.filter((u: any) => u.role === "master").length, color: "text-orange-600" },
    { role: "Agent", key: "agent", count: users.filter((u: any) => u.role === "agent").length, color: "text-green-600" },
    { role: "User", key: "user", count: users.filter((u: any) => u.role === "user").length, color: "text-gray-600" },
  ];

  // Filter: only show roles below the current user's role
  const roleCounts = allRoleCounts.filter(
    (r) => roleHierarchy.indexOf(r.key) > currentRoleIndex
  );

  // Calculate real stats
  const totalUsers = users.length;
  const activeUsers = users.filter(
    (u) => (u.accountStatus ?? true) && (u.parentAccountStatus ?? true)
  ).length;
  const activePromotions = promotions.filter(
    (p) => p.status === "active"
  ).length;
  const pendingKyc = kycDocuments.filter((k) => k.status === "pending").length;
  const todayVouchers = vouchers.filter((t) => {
    const today = new Date().toDateString();
    return new Date(t.addedDate).toDateString() === today;
  });
  const todayVolume = todayVouchers.reduce(
    (sum, t) => sum + parseFloat(t.amount || "0"),
    0
  );
  const pendingVouchers = vouchers.filter(
    (t) => t.status === "pending"
  ).length;
  const completedVouchers = vouchers.filter(
    (t) => t.status === "completed"
  ).length;
  const totalVolume = vouchers.reduce(
    (sum, t) => sum + parseFloat(t.amount || "0"),
    0
  );

  const stats = [
    {
      title: "Total Users",
      value: totalUsers.toString(),
      icon: Users,
      change: `${activeUsers} active`,
      color: "text-blue-500",
    },
    {
      title: "Active Promotions",
      value: activePromotions.toString(),
      icon: Gift,
      change: `${promotions.length} total`,
      color: "text-green-500",
    },
    {
      title: "Pending KYC",
      value: pendingKyc.toString(),
      icon: Shield,
      change: `${kycDocuments.length} total`,
      color: "text-yellow-500",
    },
    {
      title: "Today's Volume",
      value: `$${todayVolume.toLocaleString()}`,
      icon: DollarSign,
      change: `${todayVouchers.length} vouchers`,
      color: "text-purple-500",
    },
    {
      title: "Total Volume",
      value: `$${totalVolume.toLocaleString()}`,
      icon: TrendingUp,
      change: `${vouchers.length} total`,
      color: "text-emerald-500",
    },
    {
      title: "Pending Vouchers",
      value: pendingVouchers.toString(),
      icon: CreditCard,
      change: `${completedVouchers} completed`,
      color: "text-orange-500",
    },
  ];

  // Recent activities from real data
  const recentActivities = [
    ...users.slice(-3).map((u) => ({
      icon: Users,
      color: "text-blue-500",
      message: `New user registered: ${u.username}`,
      time: new Date(u.addedDate).toLocaleDateString(),
    })),
    ...kycDocuments
      .filter((k) => k.status === "pending")
      .slice(-2)
      .map((k) => ({
        icon: Shield,
        color: "text-yellow-500",
        message: `KYC document submitted (ID: ${k.id})`,
        time: new Date(k.addedDate).toLocaleDateString(),
      })),
    ...vouchers
      .filter((t) => t.status === "pending")
      .slice(-2)
      .map((t) => ({
        icon: CreditCard,
        color: "text-orange-500",
        message: `${t.type} request: $${t.amount}`,
        time: new Date(t.addedDate).toLocaleDateString(),
      })),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Dashboard 
        </h1>
        <p className="text-muted-foreground">Welcome to the owner panel</p>
      </div>

      {/* Users by Role */}
      {isLoading ? (
        <DashboardActivitySkeleton />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="font-medium">Users:</span>
          </div>
          {roleCounts.map((item) => (
            <div
              key={item.role}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 text-sm"
            >
              <span className={`font-medium ${item.color}`}>{item.role}</span>
              <span className="font-bold text-foreground">{item.count}</span>
            </div>
          ))}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-sm">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-bold text-foreground">
              {roleCounts.reduce((sum, r) => sum + r.count, 0)}
            </span>
          </div>
        </div>
      )}

      {isLoading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat: any, i: number) => {
            const IconComponent = stat.icon;
            return (
              <Card
                key={i}
                className="bg-card border hover:border-primary/50 transition-colors"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <IconComponent className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-4 w-4 bg-muted rounded mt-0.5 animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity: any, index: number) => {
                const ActivityIcon = activity.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <ActivityIcon
                      className={`h-4 w-4 mt-0.5 ${activity.color}`}
                    />
                    <div className="flex-1">
                      <span className="text-sm text-foreground">
                        {activity.message}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No recent activities
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => router.push(`${panelPrefix}/promotions`)}
              className="w-full text-left p-3 rounded-lg bg-muted hover:bg-primary hover:text-black text-foreground transition-colors flex items-center gap-2"
            >
              <Gift className="h-4 w-4" />
              Manage Promotions
            </button>
            <button
              onClick={() => router.push(`${panelPrefix}/kyc`)}
              className="w-full text-left p-3 rounded-lg bg-muted hover:bg-primary hover:text-black text-foreground transition-colors flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Review KYC ({pendingKyc})
            </button>
            <button
              onClick={() => router.push(`${panelPrefix}/vouchers`)}
              className="w-full text-left p-3 rounded-lg bg-muted hover:bg-primary hover:text-black text-foreground transition-colors flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Vouchers ({pendingVouchers})
            </button>
            <button
              onClick={() => router.push(`${panelPrefix}/users`)}
              className="w-full text-left p-3 rounded-lg bg-muted hover:bg-primary hover:text-black text-foreground transition-colors flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Manage Users
            </button>
            <button
              onClick={() => router.push(`${panelPrefix}/settings`)}
              className="w-full text-left p-3 rounded-lg bg-muted hover:bg-primary hover:text-black text-foreground transition-colors flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              System Settings
            </button>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Database</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-500">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-500">Healthy</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Backup</span>
              <span className="text-sm text-foreground">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Uptime</span>
              <span className="text-sm text-foreground">99.9%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              User Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Total Registrations
                </span>
                <span className="text-foreground font-semibold">
                  {totalUsers}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Users</span>
                <span className="text-green-500 font-semibold">
                  {activeUsers}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Verified Users</span>
                <span className="text-blue-500 font-semibold">
                  {kycDocuments.filter((k) => k.status === "verified").length}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
                    }%`,
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-center">
                {totalUsers > 0
                  ? Math.round((activeUsers / totalUsers) * 100)
                  : 0}
                % Active Rate
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Volume</span>
                <span className="text-foreground font-semibold">
                  ${totalVolume.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Today's Volume</span>
                <span className="text-green-500 font-semibold">
                  ${todayVolume.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pending Amount</span>
                <span className="text-yellow-500 font-semibold">
                  $
                  {vouchers
                    .filter((t) => t.status === "pending")
                    .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="text-blue-500 font-semibold">
                  {vouchers.length > 0
                    ? Math.round(
                        (completedVouchers / vouchers.length) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
