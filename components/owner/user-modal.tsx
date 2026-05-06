"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { User, UserModalProps } from "./types";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRole } from "@/types/enums";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { useCurrencies, useOwnerUsers } from "@/hooks/useOwner";
import { decode_payload_from_token } from "@/lib/token-utils";
import {
  User as UserIcon,
  UserCircle,
  Lock,
  DollarSign,
  Shield,
  Crown,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

// Helper function to get available roles based on current user's role
const getAvailableRoles = (currentUserRole: string | undefined): string[] => {
  // alert(currentUserRole)
  if (!currentUserRole) return ["user"];

  switch (currentUserRole) {
    case "owner":
      return ["admin"]; // Owner can create any type but only show admin
    case "admin":
      return ["super", "master", "agent", "user"];
    case "super":
      return ["master", "agent", "user"];
    case "master":
      return ["agent", "user"];
    case "agent":
      return ["user"];
    default:
      return ["user"];
  }
};

export function UserModal({
  open,
  onClose,
  user,
  onSave,
  isUpdating,
  isUpdatingProfile,
}: UserModalProps) {
  const { user: currentUser } = useAuth();
  const { data: whitelabelInfo } = useWhitelabelInfo();
  const { data: currencies = [] } = useCurrencies();
  const isB2C = String(whitelabelInfo?.whitelabelType ?? "").toUpperCase() === "B2C";
  console.log(currentUser)

  const { data: allUsers = [] } = useOwnerUsers();

  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>(currentUser?.role);

  // Resolve role from context first, then from token (e.g. when context not yet hydrated)
  useEffect(() => {
    if (currentUser?.role) {
      setCurrentUserRole(currentUser.role);
      return;
    }
    if (!currentUserRole && typeof window !== "undefined") {
      const cookies = document.cookie.split("; ");
      const accessToken = cookies.find((c) => c.startsWith("accessToken="))?.split("=")[1];
      if (accessToken) {
        const decoded = decode_payload_from_token(accessToken);
        if (decoded.success && decoded.payload?.role != null) {
          setCurrentUserRole(normalizeRole(decoded.payload.role));
        }
      }
    }
  }, [currentUser, currentUserRole]);

  // When modal opens for create, ensure we have the current user's role so role dropdown is correct
  useEffect(() => {
    if (open && !user && currentUser?.role) {
      setCurrentUserRole(currentUser.role);
    }
  }, [open, user, currentUser?.role]);

  // Memoize so dependency in effect below is stable and role list doesn't reset.
  // When whitelabel type is B2C, only "user" role can be created (not super, master, agent, admin).
  const availableRoles = useMemo(() => {
    if (isB2C) return ["user"];
    return getAvailableRoles(currentUserRole);
  }, [currentUserRole, isB2C]);

  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<User>(
    user || {
      username: "",
      email: "",
      role: availableRoles[availableRoles.length - 1] || "user",
      membership: "bronze",
      accountStatus: true,
      betStatus: true,
      upline: "0.00",
      downline: "0.00",
      currencyId: null,
      firstName: "",
      lastName: "",
      phone: "",
      country: "",
      password: "",
      transactionLimit: "0",
    }
  );

  // Real-time username availability check (debounced)
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    if (user) return; // skip check in edit mode
    const trimmed = formData.username?.trim().toLowerCase() || "";
    if (!trimmed || trimmed.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const timer = setTimeout(() => {
      const exists = allUsers.some(
        (u: any) => u.username?.toLowerCase() === trimmed
      );
      setUsernameStatus(exists ? "taken" : "available");
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.username, allUsers, user]);

  // Sync form when modal opens with a user (edit mode)
  useEffect(() => {
    if (open && user) {
      setFormData({
        ...user,
        balance: user.balance ?? "0.00",
        upline: user.upline != null ? String(user.upline) : "0.00",
        downline: user.downline != null ? String(user.downline) : "0.00",
        accountStatus: user.accountStatus ?? true,
        betStatus: user.betStatus ?? true,
        password: "",
        transactionLimit: user.transactionLimit != null ? String(user.transactionLimit) : "0",
      });
    }
  }, [open, user]);

  // Update formData role when availableRoles change
  useEffect(() => {
    if (!user && availableRoles.length > 0) {
      const defaultRole = availableRoles[availableRoles.length - 1];
      if (!availableRoles.includes(formData.role || "")) {
        setFormData((prev) => ({ ...prev, role: defaultRole }));
      }
    }
  }, [availableRoles, user]);

  // When opening for create, set upline/downline by role: admin => upline 100; others => upline = creator's downline
  useEffect(() => {
    if (!open || user) return;
    const defaultRole = availableRoles[availableRoles.length - 1] || "user";
    setFormData((prev) => ({
      ...prev,
      role: prev.role || defaultRole,
      upline: defaultRole === "admin" ? "100" : (currentUser?.downline ?? "0.00"),
      downline: "0.00",
    }));
  }, [open, user]);

  // Upline always comes from parent (100% for admin/user, parent's downline for others). Only downline is editable; downline ≤ upline.
  const isCreatingAdmin = !user && formData.role === "admin";
  const isCreatingUserRole = !user && formData.role === "user";
  const creatorDownlineNum = parseFloat(String(currentUser?.downline ?? "0")) || 0;
  const maxDownlineCreate = (isCreatingAdmin || isCreatingUserRole) ? 100 : creatorDownlineNum;
  const uplineNum = parseFloat(String(formData.upline ?? "0")) || 0;
  const maxDownlineAllowed = user ? uplineNum : maxDownlineCreate;

  // When role changes in create mode, set upline (from parent) and clamp downline to ≤ upline
  useEffect(() => {
    if (!open || user) return;
    // For "user" role: both upline and downline are fixed at 100%
    if (formData.role === "user") {
      setFormData((prev) => ({ ...prev, upline: "100", downline: "100" }));
      return;
    }
    const uplineForRole = formData.role === "admin" ? "100" : (currentUser?.downline ?? "0.00");
    const maxD = formData.role === "admin" ? 100 : creatorDownlineNum;
    const currentDownline = parseFloat(String(formData.downline ?? "0")) || 0;
    setFormData((prev) => {
      const next = { ...prev, upline: uplineForRole };
      if (currentDownline > maxD) next.downline = maxD.toFixed(2);
      return next;
    });
  }, [open, user, formData.role, currentUser?.downline]);

  const validateForm = () => {
    if (!formData.username?.trim()) return "Username is required";
    if (!user && usernameStatus === "taken") return "Username is already taken";
    if (!formData.email?.trim()) return "Email is required";
    if (!formData.role?.trim()) return "Role is required";
    if (!formData.membership?.trim()) return "Membership is required";
    if (!user && !formData.password?.trim()) return "Password is required";
    if (!user && formData.password && formData.password.length < 6)
      return "Password must be at least 6 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return "Invalid email format";
    // Downline must always be ≤ upline (upline comes from parent)
    const uplineVal = parseFloat(String(formData.upline ?? "0")) || 0;
    const downlineVal = parseFloat(String(formData.downline ?? "0")) || 0;
    if (downlineVal > uplineVal)
      return `Downline commission cannot exceed upline (${uplineVal}%)`;
    return null;
  };

  const handleSaveUserInfo = () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      toast.error(error);
      return;
    }
    setFormError(null);
    const payload: User & { type?: "user" | "profile" } = {
      ...formData,
      type: "user",
    };
    if (formData.accountStatus !== undefined) payload.accountStatus = formData.accountStatus;
    if (formData.betStatus !== undefined) payload.betStatus = formData.betStatus;
    onSave(payload);
  };

  const handleSaveProfileInfo = () => {
    setFormError(null);
    onSave({
      ...formData,
      type: "profile",
    });
  };

  const handleCreateUser = () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      toast.error(error);
      return;
    }
    setFormError(null);
    onSave({
      ...formData,
      currencyId: formData.currencyId ?? currentUser.currencyId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setFormError(null); onClose(); }}>
      <DialogContent className="bg-card border max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 text-sm">
        {/* Header — kept compact so the modal fits 720p laptop screens. */}
        <DialogHeader className="px-4 py-2 sm:px-5 sm:py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-primary/10 shrink-0">
                {user ? (
                  <UserCircle className="h-4 w-4 text-primary" />
                ) : (
                  <UserIcon className="h-4 w-4 text-primary" />
                )}
              </div>
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                {user ? "Edit User" : "Create New User"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {user
                  ? "Update user account and profile information"
                  : "Fill in the details to create a new user account"}
              </DialogDescription>
            </div>
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button> */}
          </div>
        </DialogHeader>

        {/* Scrollable Content — paddings/gaps stay small even on desktop so
            the form fits a typical 720p laptop without inner scroll. */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
            {/* Account Information */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="h-3.5 w-3.5 text-blue-500" />
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Account
                </h3>
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Username
                  </Label>
                  <div className="relative">
                    <Input
                      value={formData.username}
                      onChange={(e) =>
                        // Usernames are stored lowercase so login is
                        // case-insensitive — coerce here as the user types.
                        setFormData({ ...formData, username: e.target.value.toLowerCase() })
                      }
                      className={`bg-background border-input text-foreground h-9 focus:ring-2 focus:ring-primary/20 pr-9 ${
                        !user && usernameStatus === "taken"
                          ? "border-red-500 focus:ring-red-500/20"
                          : !user && usernameStatus === "available"
                          ? "border-green-500 focus:ring-green-500/20"
                          : ""
                      }`}
                      placeholder="Enter username"
                      required
                      disabled={!!user}
                    />
                    {!user && usernameStatus === "checking" && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!user && usernameStatus === "available" && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                    {!user && usernameStatus === "taken" && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {!user && usernameStatus === "taken" && (
                    <p className="text-xs text-red-500">Username is already taken</p>
                  )}
                  {!user && usernameStatus === "available" && (
                    <p className="text-xs text-green-500">Username is available</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-background border-input text-foreground h-9 focus:ring-2 focus:ring-primary/20"
                    placeholder="user@example.com"
                    required
                    disabled={!!user}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    {user ? "Change Password" : "Password"}
                  </Label>
                  <Input
                    type="text"
                    value={formData.password || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="bg-background border-input text-foreground h-9 focus:ring-2 focus:ring-primary/20"
                    placeholder={user ? "Leave empty to keep current" : "Minimum 6 characters"}
                    required={!user}
                    minLength={6}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      Role
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value })
                      }
                      required
                    >
                      <SelectTrigger className="bg-background border-input text-foreground h-9 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border">
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role} className="hover:bg-muted">
                            <span className="capitalize">{role}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Crown className="h-3.5 w-3.5 text-muted-foreground" />
                      Membership
                    </Label>
                    <Select
                      value={formData.membership}
                      onValueChange={(value) =>
                        setFormData({ ...formData, membership: value })
                      }
                      required
                    >
                      <SelectTrigger className="bg-background border-input text-foreground h-9 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border">
                        <SelectItem value="bronze" className="hover:bg-muted">
                          <span className="capitalize">Bronze</span>
                        </SelectItem>
                        <SelectItem value="silver" className="hover:bg-muted">
                          <span className="capitalize">Silver</span>
                        </SelectItem>
                        <SelectItem value="gold" className="hover:bg-muted">
                          <span className="capitalize">Gold</span>
                        </SelectItem>
                        <SelectItem value="platinum" className="hover:bg-muted">
                          <span className="capitalize">Platinum</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {user && currentUser?.id != null && user.addedBy != null && String(user.addedBy) === String(currentUser.id) && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">
                        Account status
                      </Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.accountStatus ?? true}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, accountStatus: checked })
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.accountStatus ? "Can login" : "Cannot login"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">
                        Bet status
                      </Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.betStatus ?? true}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, betStatus: checked })
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.betStatus ? "Can place bets" : "Cannot place bets"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction limit only applies to leaf-level "user" accounts.
                    Admins/agents/masters etc. don't place bets, so the field is
                    hidden entirely for those roles. */}
                {!user && formData.role === "user" && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      Transaction Limit
                    </Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={String(formData.transactionLimit ?? "0")}
                      onChange={(e) =>
                        setFormData({ ...formData, transactionLimit: e.target.value })
                      }
                      className="bg-background border-input text-foreground h-9 focus:ring-2 focus:ring-primary/20"
                      placeholder="0 (no per-bet cap)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Max stake the user can place on a single bet. 0 = no per-bet cap.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Personal Info + Partnership */}
            <div className="space-y-3 sm:space-y-5 flex flex-col">
              {/* Personal Information */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <UserCircle className="h-3.5 w-3.5 text-purple-500" />
                  <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Personal
                  </h3>
                </div>

                <div className="space-y-2 sm:space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">
                        First Name
                      </Label>
                      <Input
                        value={formData.firstName || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="bg-background border-input text-foreground h-9 focus:ring-2 focus:ring-primary/20"
                        placeholder="John"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">
                        Last Name
                      </Label>
                      <Input
                        value={formData.lastName || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="bg-background border-input text-foreground h-9 focus:ring-2 focus:ring-primary/20"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Phone Number
                    </Label>
                    <Input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="bg-background border-input text-foreground h-9 focus:ring-2 focus:ring-primary/20"
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        Currency
                      </Label>
                      {currentUserRole === "owner" ? (
                        <Select
                          value={formData.currencyId || ""}
                          onValueChange={(value) =>
                            setFormData({ ...formData, currencyId: value || null })
                          }
                        >
                          <SelectTrigger className="bg-background border-input text-foreground h-9">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {(currencies as any[]).map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.code} — {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          readOnly
                          value={
                            (() => {
                              const effectiveCurrencyId = formData.currencyId ?? currentUser?.currencyId;
                              if (!effectiveCurrencyId) return "—";
                              const cur = (currencies as any[]).find((c: any) => String(c.id) === String(effectiveCurrencyId));
                              return cur ? `${cur.code} — ${cur.name}` : "—";
                            })()
                          }
                          className="bg-muted border-input text-foreground h-9 cursor-not-allowed"
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        Country
                      </Label>
                      <Input
                        value={formData.country || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                        className="bg-background border-input text-foreground h-9 focus:ring-2 focus:ring-primary/20"
                        placeholder="United States"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upline / Downline — plain row, no section chrome. */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Upline (%)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.upline ?? "0.00"}
                    readOnly
                    className="bg-muted border-input text-foreground h-9 cursor-not-allowed"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Downline (%)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={maxDownlineAllowed}
                    value={formData.downline ?? "0.00"}
                    readOnly={isCreatingUserRole}
                    onChange={(e) => {
                      if (isCreatingUserRole) return;
                      const v = e.target.value;
                      const num = parseFloat(v) || 0;
                      const clamped = v === "" ? "" : (num > maxDownlineAllowed ? String(maxDownlineAllowed) : v);
                      setFormData({ ...formData, downline: clamped });
                    }}
                    className={isCreatingUserRole ? "bg-muted border-input text-foreground h-9 cursor-not-allowed" : "bg-background border-input text-foreground h-9 focus:ring-2 focus:ring-primary/20"}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border px-4 py-2 sm:px-5 sm:py-2.5 bg-muted/30">
          {formError && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-2.5 py-1.5 mb-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {formError}
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-9 px-3 sm:px-6"
              disabled={isUpdating || isUpdatingProfile}
            >
              Cancel
            </Button>
            {user ? (
              <>
                <Button
                  onClick={handleSaveProfileInfo}
                  disabled={isUpdatingProfile}
                  className="h-9 px-3 sm:px-6 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSaveUserInfo}
                  disabled={isUpdating}
                  className="h-9 px-3 sm:px-6 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Account
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCreateUser}
                disabled={isUpdating}
                className="h-9 px-3 sm:px-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserIcon className="h-4 w-4 mr-2" />
                    Create User
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
