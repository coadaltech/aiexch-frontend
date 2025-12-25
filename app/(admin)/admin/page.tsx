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
  useAdminUsers,
  usePromotions,
  useTransactions,
  useKycDocuments,
} from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import {
  DashboardStatsSkeleton,
  DashboardActivitySkeleton,
} from "@/components/admin/skeletons";

export default function AdminDashboard() {
  const router = useRouter();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: promotions = [], isLoading: promotionsLoading } =
    usePromotions();
  const { data: transactions = [], isLoading: transactionsLoading } =
    useTransactions();
  const { data: kycDocuments = [], isLoading: kycLoading } = useKycDocuments();

  const isLoading =
    usersLoading || promotionsLoading || transactionsLoading || kycLoading;

  // Calculate real stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const activePromotions = promotions.filter(
    (p) => p.status === "active"
  ).length;
  const pendingKyc = kycDocuments.filter((k) => k.status === "pending").length;
  const todayTransactions = transactions.filter((t) => {
    const today = new Date().toDateString();
    return new Date(t.createdAt).toDateString() === today;
  });
  const todayVolume = todayTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amount || "0"),
    0
  );
  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending"
  ).length;
  const completedTransactions = transactions.filter(
    (t) => t.status === "completed"
  ).length;
  const totalVolume = transactions.reduce(
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
      change: `${todayTransactions.length} transactions`,
      color: "text-purple-500",
    },
    {
      title: "Total Volume",
      value: `$${totalVolume.toLocaleString()}`,
      icon: TrendingUp,
      change: `${transactions.length} total`,
      color: "text-emerald-500",
    },
    {
      title: "Pending Transactions",
      value: pendingTransactions.toString(),
      icon: CreditCard,
      change: `${completedTransactions} completed`,
      color: "text-orange-500",
    },
  ];

  // Recent activities from real data
  const recentActivities = [
    ...users.slice(-3).map((u) => ({
      icon: Users,
      color: "text-blue-500",
      message: `New user registered: ${u.username}`,
      time: new Date(u.createdAt).toLocaleDateString(),
    })),
    ...kycDocuments
      .filter((k) => k.status === "pending")
      .slice(-2)
      .map((k) => ({
        icon: Shield,
        color: "text-yellow-500",
        message: `KYC document submitted (ID: ${k.id})`,
        time: new Date(k.createdAt).toLocaleDateString(),
      })),
    ...transactions
      .filter((t) => t.status === "pending")
      .slice(-2)
      .map((t) => ({
        icon: CreditCard,
        color: "text-orange-500",
        message: `${t.type} request: $${t.amount}`,
        time: new Date(t.createdAt).toLocaleDateString(),
      })),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Welcome to the admin panel</p>
      </div>

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
              onClick={() => router.push("/admin/promotions")}
              className="w-full text-left p-3 rounded-lg bg-muted hover:bg-primary hover:text-black text-foreground transition-colors flex items-center gap-2"
            >
              <Gift className="h-4 w-4" />
              Manage Promotions
            </button>
            <button
              onClick={() => router.push("/admin/kyc")}
              className="w-full text-left p-3 rounded-lg bg-muted hover:bg-primary hover:text-black text-foreground transition-colors flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Review KYC ({pendingKyc})
            </button>
            <button
              onClick={() => router.push("/admin/transactions")}
              className="w-full text-left p-3 rounded-lg bg-muted hover:bg-primary hover:text-black text-foreground transition-colors flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Transactions ({pendingTransactions})
            </button>
            <button
              onClick={() => router.push("/admin/users")}
              className="w-full text-left p-3 rounded-lg bg-muted hover:bg-primary hover:text-black text-foreground transition-colors flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Manage Users
            </button>
            <button
              onClick={() => router.push("/admin/settings")}
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
                  {transactions
                    .filter((t) => t.status === "pending")
                    .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="text-blue-500 font-semibold">
                  {transactions.length > 0
                    ? Math.round(
                        (completedTransactions / transactions.length) * 100
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
