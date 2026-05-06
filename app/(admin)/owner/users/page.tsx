"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search } from "lucide-react";
import { useOwnerUsers } from "@/hooks/useOwner";
import { useAuth } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { UserModal } from "@/components/owner/user-modal";
import { QuickVoucherModal } from "@/components/owner/quick-voucher-modal";
import { EditProfileModal } from "@/components/owner/edit-profile-modal";
import { ChangeStatusModal, type ChangeStatusModalUser } from "@/components/owner/change-status-modal";
import { TransactionLimitModal, type TransactionLimitModalUser } from "@/components/owner/transaction-limit-modal";
import { UserChildrenModal } from "@/components/owner/user-children-modal";
import { useModal } from "@/hooks/useModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { useUpdateUser } from "@/hooks/useOwner";

function fmt(n: any) {
  const v = parseFloat(n ?? 0);
  if (isNaN(v)) return "0";
  return v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function roleLabel(role: string | number | undefined): string {
  const r = String(role ?? "").toLowerCase();
  switch (r) {
    case "0": case "owner":   return "Owner";
    case "3": case "admin":   return "Admin";
    case "4": case "super":   return "Super Master";
    case "5": case "master":  return "Master";
    case "6": case "agent":   return "Agent";
    case "7": case "user":    return "User";
    default: return role ? String(role) : "—";
  }
}

// Small status pill: green check when active, red X when disabled.
// Clickable so the user can toggle the status (password-confirmed).
function StatusDot({
  active,
  onClick,
  title,
}: {
  active: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const base = cn(
    "inline-flex items-center justify-center w-5 h-5 rounded text-white text-[11px] font-bold transition-colors",
    active ? "bg-green-600" : "bg-rose-600",
    onClick && "hover:brightness-110 cursor-pointer",
  );
  const label = title ?? (active ? "Active — click to toggle" : "Disabled — click to toggle");
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={base} title={label}>
        {active ? "✓" : "✕"}
      </button>
    );
  }
  return <span className={base} title={label}>{active ? "✓" : "✕"}</span>;
}

// Action button for the D/W/L/C/P/S column. Solid dark square with single letter.
function ActionBtn({
  letter,
  title,
  onClick,
  disabled,
}: {
  letter: string;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "w-6 h-6 rounded text-white text-[11px] font-bold flex items-center justify-center transition-colors",
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-[#2d3e4e] hover:bg-[#1f2d3a]",
      )}
    >
      {letter}
    </button>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, error } = useOwnerUsers();
  const { data: whitelabelInfo } = useWhitelabelInfo();
  const updateUserMutation = useUpdateUser();
  const queryClient = useQueryClient();
  const userModal = useModal<any>();
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300).toLowerCase();

  const [voucherState, setVoucherState] = useState<
    | { user: { id: string; username: string; email?: string | null }; type: "deposit" | "withdraw" | "limit" }
    | null
  >(null);
  const [profileEditUser, setProfileEditUser] = useState<any | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<ChangeStatusModalUser | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [txLimitUser, setTxLimitUser] = useState<TransactionLimitModalUser | null>(null);
  const [updatingTxLimitId, setUpdatingTxLimitId] = useState<string | null>(null);
  const [childrenUser, setChildrenUser] = useState<{ id: string; username: string } | null>(null);

  // Only show users directly created by the current logged-in user
  const myUsers = useMemo(
    () => currentUser?.id ? users.filter((u: any) => (u.createdBy ?? u.addedBy) === currentUser.id) : users,
    [users, currentUser?.id],
  );

  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) return myUsers;
    return myUsers.filter((u: any) =>
      String(u.username ?? "").toLowerCase().includes(debouncedSearch) ||
      String(u.email ?? "").toLowerCase().includes(debouncedSearch),
    );
  }, [myUsers, debouncedSearch]);

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/owner/users/${id}/profile`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-users"] });
      toast.success("Profile updated successfully");
      userModal.close();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update profile");
    },
  });

  const handleSaveUser = async (userData: any) => {
    if (userModal.data?.id) {
      if (userData.type === "user") {
        const original = userModal.data;
        const body: any = {
          role: userData.role,
          membership: userData.membership,
          balance: userData.balance,
          upline: userData.upline ?? "0.00",
          downline: userData.downline ?? "0.00",
          currencyId: userData.currencyId || null,
        };
        const accountChanged = userData.accountStatus !== undefined && userData.accountStatus !== (original.accountStatus ?? true);
        const betChanged     = userData.betStatus     !== undefined && userData.betStatus     !== (original.betStatus ?? true);
        if (accountChanged) body.accountStatus = userData.accountStatus;
        if (betChanged)     body.betStatus     = userData.betStatus;
        if (userData.password?.trim()) body.password = userData.password;
        updateUserMutation.mutate({ id: userModal.data.id, ...body }, { onSuccess: () => userModal.close() });
      } else if (userData.type === "profile") {
        updateProfileMutation.mutate({
          id: userModal.data.id,
          firstName: userData.firstName,
          lastName:  userData.lastName,
          phone:     userData.phone,
          country:   userData.country,
        });
      }
    } else {
      setIsCreatingUser(true);
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
          // Only leaf-level "user" accounts have a per-bet cap. For any other
          // role we always send 0 so a stale value from the form (if the role
          // was switched after typing) can't sneak through.
          transactionLimit: userData.role === "user"
            ? String(userData.transactionLimit ?? "0")
            : "0",
          ...(whitelabelInfo?.id != null && { whitelabelId: whitelabelInfo.id }),
          ...(typeof window !== "undefined" && window.location?.host && { domain: window.location.host }),
        };
        await api.post("/owner/users", newUserData);
        queryClient.invalidateQueries({ queryKey: ["owner-users"] });
        toast.success("User created successfully");
        userModal.close();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to create user");
      } finally {
        setIsCreatingUser(false);
      }
    }
  };

  const handleOpenChangeStatus = (u: any) => {
    setStatusModalUser({
      id: u.id,
      username: u.username,
      accountStatus: u.accountStatus !== false && u.parentAccountStatus !== false,
      betStatus:     u.betStatus     !== false && u.parentBetStatus     !== false,
    });
  };

  const handleTxLimitConfirm = ({ transactionLimit }: { transactionLimit: string }) => {
    if (!txLimitUser) return;
    setUpdatingTxLimitId(txLimitUser.id);
    updateUserMutation.mutate(
      { id: txLimitUser.id, transactionLimit },
      {
        onSuccess: async () => {
          // The shared useUpdateUser hook calls invalidateQueries fire-and-
          // forget. For this flow we want the new value visible *before* the
          // modal closes, so wait for the owner-users list to refetch.
          await queryClient.refetchQueries({ queryKey: ["owner-users"] });
          setTxLimitUser(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to update transaction limit");
        },
        onSettled: () => setUpdatingTxLimitId(null),
      },
    );
  };

  const handleChangeStatusConfirm = (data: {
    accountStatus: boolean;
    betStatus: boolean;
    currentUserPassword: string;
  }) => {
    if (!statusModalUser) return;
    setUpdatingStatusId(statusModalUser.id);
    updateUserMutation.mutate(
      {
        id: statusModalUser.id,
        accountStatus: data.accountStatus,
        betStatus: data.betStatus,
        currentUserPassword: data.currentUserPassword,
      },
      {
        onSuccess: () => setStatusModalUser(null),
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to update status");
        },
        onSettled: () => setUpdatingStatusId(null),
      },
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading users: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground text-sm">
            Your downline ({filteredUsers.length}{filteredUsers.length !== myUsers.length ? ` of ${myUsers.length}` : ""})
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border h-9"
            />
          </div>
          <Button
            onClick={() => userModal.open(undefined)}
            className="bg-primary text-primary-foreground h-9"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[16px] border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-[14px] font-bold uppercase tracking-wide border-b border-gray-200">
                <th className="px-3 py-2 text-left">User Name</th>
                <th className="px-3 py-2 text-right">Credit Reference</th>
                <th className="px-3 py-2 text-right">Client (P/L)</th>
                <th className="px-3 py-2 text-right">Balance</th>
                <th className="px-3 py-2 text-right">Exposure</th>
                <th className="px-3 py-2 text-right">Available Balance</th>
                <th className="px-3 py-2 text-center">U st</th>
                <th className="px-3 py-2 text-center">B st</th>
                <th className="px-3 py-2 text-right">Transaction Limit</th>
                <th className="px-3 py-2 text-left">Account Type</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={11} className="py-10 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
                  </td>
                </tr>
              )}

              {!isLoading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}

              {!isLoading && filteredUsers.map((u: any) => {
                const fixLimit        = u.fixLimit        ?? "0";
                const finalLimit      = u.finalLimit      ?? "0";
                const limitConsumed   = u.limitConsumed   ?? "0";
                const userBalance     = u.balance         ?? u.userBalance ?? "0";
                const transactionLimit = u.transactionLimit ?? "0";

                // Client P/L = finalLimit - fixLimit (positive = profit, negative = loss).
                // Balance shown to the user is CR - Client P/L (= 2·CR − finalLimit).
                const fixLimitNum = parseFloat(fixLimit);
                const clientPnl = parseFloat(userBalance);
                const computedBalance = fixLimitNum + clientPnl;

                const uActive = u.accountStatus !== false && u.parentAccountStatus !== false;
                const bActive = u.betStatus     !== false && u.parentBetStatus     !== false;

                // Per-bet transaction limit only applies to leaf-level "user"
                // accounts (admins/agents/masters etc. don't place bets), so
                // the C action button is disabled for everyone else.
                const isLeafUser = String(u.role ?? "").toLowerCase() === "user";

                const quickUser = { id: u.id, username: u.username, email: u.email };

                return (
                  <tr
                    key={u.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <button
                        onClick={() =>
                          setChildrenUser({ id: u.id, username: u.username || u.name })
                        }
                        className="font-semibold text-[var(--header-primary)] hover:underline text-left"
                        title="View this user's downline"
                      >
                        {u.username}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {fmt(fixLimit)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-semibold whitespace-nowrap",
                        clientPnl > 0
                          ? "text-emerald-600"
                          : clientPnl < 0
                            ? "text-rose-600"
                            : "text-gray-800",
                      )}
                      title={clientPnl < 0 ? "Loss" : clientPnl > 0 ? "Profit" : "Breakeven"}
                    >
                      {clientPnl > 0 ? "+" : ""}{fmt(clientPnl)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {fmt(computedBalance)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {fmt(limitConsumed)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {fmt(finalLimit)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusDot
                        active={uActive}
                        title={uActive ? "User active" : "User disabled"}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusDot
                        active={bActive}
                        title={bActive ? "Betting active" : "Betting disabled"}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {fmt(transactionLimit)}
                    </td>
                    <td className="px-3 py-2 text-left text-gray-800 whitespace-nowrap">
                      {roleLabel(u.role)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <ActionBtn
                          letter="D"
                          title="Deposit voucher"
                          onClick={() => setVoucherState({ user: quickUser, type: "deposit" })}
                        />
                        <ActionBtn
                          letter="W"
                          title="Withdraw voucher"
                          onClick={() => setVoucherState({ user: quickUser, type: "withdraw" })}
                        />
                        <ActionBtn
                          letter="L"
                          title="Limit voucher"
                          onClick={() => setVoucherState({ user: quickUser, type: "limit" })}
                        />
                        <ActionBtn
                          letter="TL"
                          title={
                            isLeafUser
                              ? "Update transaction limit"
                              : "Transaction limit only applies to user accounts"
                          }
                          disabled={!isLeafUser}
                          onClick={() =>
                            setTxLimitUser({
                              id: u.id,
                              username: u.username,
                              transactionLimit: u.transactionLimit ?? "0",
                            })
                          }
                        />
                        <ActionBtn
                          letter="P"
                          title="Password & profile"
                          onClick={() => setProfileEditUser(u)}
                        />
                        <ActionBtn
                          letter="S"
                          title="Change status (account / betting)"
                          onClick={() => handleOpenChangeStatus(u)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal
        key={userModal.data?.id || "new"}
        open={userModal.isOpen}
        onClose={userModal.close}
        user={userModal.data}
        onSave={handleSaveUser}
        isUpdating={updateUserMutation.isPending || isCreatingUser}
        isUpdatingProfile={updateProfileMutation.isPending}
      />

      <QuickVoucherModal
        open={voucherState !== null}
        onClose={() => setVoucherState(null)}
        user={voucherState?.user ?? null}
        type={voucherState?.type ?? "deposit"}
      />

      <TransactionLimitModal
        open={txLimitUser !== null}
        onClose={() => setTxLimitUser(null)}
        user={txLimitUser}
        onConfirm={handleTxLimitConfirm}
        isLoading={updatingTxLimitId !== null}
      />

      <EditProfileModal
        open={profileEditUser !== null}
        onClose={() => setProfileEditUser(null)}
        user={profileEditUser}
      />

      <ChangeStatusModal
        open={statusModalUser !== null}
        onClose={() => setStatusModalUser(null)}
        user={statusModalUser}
        onConfirm={handleChangeStatusConfirm}
        isLoading={updatingStatusId !== null}
      />

      <UserChildrenModal
        open={childrenUser !== null}
        onClose={() => setChildrenUser(null)}
        user={childrenUser}
      />
    </div>
  );
}
