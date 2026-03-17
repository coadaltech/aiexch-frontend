"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Edit,
  ChevronUp,
  ChevronDown,
  User2Icon,
} from "lucide-react";
import { UserModal } from "@/components/owner/user-modal";
import { ChangeStatusModal, type ChangeStatusModalUser } from "@/components/owner/change-status-modal";
import { Pagination } from "@/components/owner/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOwnerUsers, useUpdateUser } from "@/hooks/useOwner";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useFilters } from "@/hooks/useFilters";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/owner/skeletons";
import { useModal } from "@/hooks/useModal";
import { useMemo, useState } from "react";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const userModal = useModal<any>();
  const [statusModalUser, setStatusModalUser] = useState<ChangeStatusModalUser | null>(null);

  const { data: users = [], isLoading, error } = useOwnerUsers();
  const updateUserMutation = useUpdateUser();
  const queryClient = useQueryClient();
  const { data: whitelabelInfo } = useWhitelabelInfo();
  const { user: currentUser } = useAuth();

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Derive status for filtering (active = account + parent account both active)
  const usersWithFilterStatus = useMemo(
    () =>
      users.map((u) => ({
        ...u,
        status:
          (u.accountStatus !== false && u.parentAccountStatus !== false)
            ? "active"
            : "suspended",
      })),
    [users]
  );

  const { filters, filteredData, updateFilter } = useFilters({
    data: usersWithFilterStatus,
    initialFilters: {
      search: debouncedSearch,
      status: "all",
      role: "all",
      membership: "all",
    },
  });

  const { sortedData, requestSort, getSortIcon } = useTableSort({
    data: filteredData,
    initialSort: { key: "addedDate", direction: "desc" },
  });

  const {
    items: paginatedUsers,
    totalPages,
    currentPage,
    goToPage,
  } = usePagination({
    data: sortedData,
    itemsPerPage: 10,
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, ...data }: any) =>
      api.put(`/owner/users/${id}/profile`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-users"] });
      toast.success("Profile updated successfully");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const handleCreateUser = () => {
    userModal.open(undefined);
  };

  const handleEditUser = (user: any) => {
    userModal.open({
      ...user,
      username: user.username || user.name,
    });
  };

  const handleSaveUser = async (userData: any) => {
    if (userModal.data && userModal.data.id) {
      // Edit existing user
      if (userData.type === "user") {
        const userUpdateData: any = {
          role: userData.role,
          membership: userData.membership,
          balance: userData.balance,
          upline: userData.upline ?? "0.00",
          downline: userData.downline ?? "0.00",
          currencyId: userData.currencyId || null,
        };
        if (userData.accountStatus !== undefined) userUpdateData.accountStatus = userData.accountStatus;
        if (userData.betStatus !== undefined) userUpdateData.betStatus = userData.betStatus;

        if (userData.password && userData.password.trim()) {
          userUpdateData.password = userData.password;
        }

        updateUserMutation.mutate({ id: userModal.data.id, ...userUpdateData });
      } else if (userData.type === "profile") {
        updateProfileMutation.mutate({
          id: userModal.data.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          country: userData.country,
        });
      }
    } else {
      // Create new user
      try {
        const newUserData = {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          membership: userData.membership,
          balance: userData.balance,
          upline: userData.upline ?? "0.00",
          downline: userData.downline ?? "0.00",
          currencyId: userData.currencyId || null,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          country: userData.country,
          ...(whitelabelInfo?.id != null && { whitelabelId: whitelabelInfo.id }),
          ...(typeof window !== "undefined" && window.location?.host && { domain: window.location.host }),
        };

        await api.post("/owner/users", newUserData);
        queryClient.invalidateQueries({ queryKey: ["owner-users"] });
        toast.success("User created successfully");
        userModal.close();
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to create user";
        toast.error(errorMessage);
        console.error("Create user error:", error);
      }
    }
  };

  const handleOpenChangeStatus = (user: any) => {
    setStatusModalUser({
      id: user.id,
      username: user.username,
      accountStatus: user.accountStatus !== false,
      betStatus: user.betStatus !== false,
    });
  };

  const handleChangeStatusConfirm = (data: {
    accountStatus: boolean;
    betStatus: boolean;
    currentUserPassword: string;
  }) => {
    if (!statusModalUser) return;
    setUpdatingUserId(statusModalUser.id ? Number(statusModalUser.id) : null);
    updateUserMutation.mutate(
      {
        id: statusModalUser.id,
        accountStatus: data.accountStatus,
        betStatus: data.betStatus,
        currentUserPassword: data.currentUserPassword,
      },
      {
        onSuccess: () => {
          setStatusModalUser(null);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || "Failed to update status";
          toast.error(msg);
        },
        onSettled: () => {
          setUpdatingUserId(null);
        },
      }
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading users: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Users
          </h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button
          onClick={handleCreateUser}
          className="bg-primary text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <CardTitle className="text-foreground">User Management</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex gap-2">
                <Select
                  value={filters.status}
                  onValueChange={(value) => updateFilter("status", value)}
                >
                  <SelectTrigger className="w-full sm:w-32 bg-background border text-foreground hover:bg-muted">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border text-black">
                    <SelectItem
                      value="all"
                      className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                    >
                      All Status
                    </SelectItem>
                    <SelectItem
                      value="active"
                      className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                    >
                      Active
                    </SelectItem>
                    <SelectItem
                      value="suspended"
                      className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                    >
                      Suspended
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.role}
                  onValueChange={(value) => updateFilter("role", value)}
                >
                  <SelectTrigger className="w-full sm:w-32 bg-background border text-foreground hover:bg-muted">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border text-black">
                    <SelectItem
                      value="all"
                      className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                    >
                      All Roles
                    </SelectItem>
                    <SelectItem
                      value="user"
                      className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                    >
                      User
                    </SelectItem>
                    <SelectItem
                      value="admin"
                      className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                    >
                      Admin
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.membership}
                  onValueChange={(value) => updateFilter("membership", value)}
                >
                  <SelectTrigger className="w-full sm:w-32 bg-background border text-foreground hover:bg-muted">
                    <SelectValue placeholder="Membership" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border text-black">
                    <SelectItem
                      value="all"
                      className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                    >
                      All Tiers
                    </SelectItem>
                    <SelectItem
                      value="bronze"
                      className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                    >
                      Bronze
                    </SelectItem>
                    <SelectItem
                      value="silver"
                      className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                    >
                      Silver
                    </SelectItem>
                    <SelectItem
                      value="gold"
                      className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                    >
                      Gold
                    </SelectItem>
                    <SelectItem
                      value="platinum"
                      className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                    >
                      Platinum
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th
                    className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("username")}
                  >
                    <div className="flex items-center gap-1">
                      User
                      {getSortIcon("username") === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {getSortIcon("username") === "desc" && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell">
                    Profile
                  </th>
                  <th
                    className="text-left py-3 px-2 text-muted-foreground text-sm hidden md:table-cell cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("role")}
                  >
                    <div className="flex items-center gap-1">
                      Role
                      {getSortIcon("role") === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {getSortIcon("role") === "desc" && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-2 text-muted-foreground text-sm hidden lg:table-cell cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("membership")}
                  >
                    <div className="flex items-center gap-1">
                      Membership
                      {getSortIcon("membership") === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {getSortIcon("membership") === "desc" && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden lg:table-cell">
                    Created By
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden lg:table-cell">
                    Whitelabel
                  </th>
                  <th
                    className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("balance")}
                  >
                    <div className="flex items-center gap-1">
                      Balance
                      {getSortIcon("balance") === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {getSortIcon("balance") === "desc" && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-2 text-muted-foreground text-sm hidden xl:table-cell cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("lastLoginAt")}
                  >
                    <div className="flex items-center gap-1">
                      Last Login
                      {getSortIcon("lastLoginAt") === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {getSortIcon("lastLoginAt") === "desc" && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton columns={9} />
              ) : paginatedUsers.length > 0 ? (
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium text-foreground text-sm">
                            {user.username}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                          <div className="sm:hidden mt-1 flex gap-1">
                            <Badge
                              variant={
                                user.role === "admin"
                                  ? "destructive"
                                  : user.role === "vip"
                                    ? "default"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {user.role}
                            </Badge>
                            <Badge
                              variant={
                                user.membership === "platinum"
                                  ? "destructive"
                                  : user.membership === "gold"
                                    ? "default"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {user.membership}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <div className="text-sm">
                          <div className="text-foreground">
                            {user.firstName || user.lastName
                              ? `${user.firstName || ""} ${user.lastName || ""
                                }`.trim()
                              : "N/A"}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {user.phone || "No phone"}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell">
                        <Badge
                          variant={
                            user.role === "admin"
                              ? "destructive"
                              : user.role === "vip"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 hidden lg:table-cell">
                        <Badge
                          variant={
                            user.membership === "platinum"
                              ? "destructive"
                              : user.membership === "gold"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {user.membership}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 hidden lg:table-cell text-sm text-muted-foreground">
                        {(user as { addedByUsername?: string | null }).addedByUsername ?? "Owner"}
                      </td>
                      <td className="py-3 px-2 hidden lg:table-cell text-sm text-muted-foreground">
                        {(user as { whitelabelName?: string | null }).whitelabelName ?? "—"}
                      </td>
                      <td className="py-3 px-2 text-foreground font-medium text-sm">
                        ₹{user.balance || "0.00"}
                      </td>
                      <td className="py-3 px-2 hidden xl:table-cell">
                        <div className="text-sm">
                          <div className="text-muted-foreground text-xs">
                            {user.lastLoginIp || "Never"}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            // variant="outline"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChangeStatus(user);
                            }}
                            disabled={updatingUserId === user.id}
                            title="Change status (User Active / Bet Active)"
                            aria-label="Change status"
                            className="h-8 px-2 gap-1"
                          >
                            <User2Icon className="h-3 w-3" />
                            {/* <span className="test-xs">Status</span> */}
                            {/* {(user.accountStatus !== false && user.parentAccountStatus !== false) ? ( */}
                            {/*   <> */}
                            {/*     <Ban className="h-3 w-3" /> */}
                            {/*     <span className="text-xs">Suspend</span> */}
                            {/*   </> */}
                            {/* ) : ( */}
                            {/*   <> */}
                            {/*     <CheckCircle className="h-3 w-3" /> */}
                            {/*     <span className="text-xs">Activate</span> */}
                            {/*   </> */}
                            {/* )} */}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditUser(user);
                            }}
                            title="Edit User"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td
                      colSpan={9}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No users found
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        </CardContent>
      </Card>

      <ChangeStatusModal
        open={statusModalUser != null}
        onClose={() => setStatusModalUser(null)}
        user={statusModalUser}
        onConfirm={handleChangeStatusConfirm}
        isLoading={updatingUserId != null}
      />

      <UserModal
        key={userModal.data?.id || "new"}
        open={userModal.isOpen}
        onClose={userModal.close}
        user={userModal.data}
        onSave={handleSaveUser}
        isUpdating={updateUserMutation.isPending}
        isUpdatingProfile={updateProfileMutation.isPending}
      />
    </div>
  );
}
