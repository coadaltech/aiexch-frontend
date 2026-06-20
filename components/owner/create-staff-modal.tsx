"use client";

import { useEffect, useState } from "react";
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
import { Check, Loader2, UserPlus, X } from "lucide-react";
import { useCreateStaff } from "@/hooks/useStaff";
import { useOwnerUsers } from "@/hooks/useOwner";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the new staff user's id once create succeeds, so the parent
   *  can immediately open the Manage modal to assign a role. */
  onCreated?: (userId: string) => void;
}

const empty = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
};

export function CreateStaffModal({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({ ...empty });
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateStaff();
  const { data: allUsers = [] } = useOwnerUsers();

  // Real-time username availability check (debounced)
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  useEffect(() => {
    const trimmed = form.username?.trim().toLowerCase() || "";
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
  }, [form.username, allUsers]);

  const submit = async () => {
    setError(null);
    if (form.username.length < 3 || form.password.length < 6 ) {
      setError("Username (≥3) and password (≥6) are required");
      return;
    }
    if (usernameStatus === "taken") {
      setError("Username is already taken");
      return;
    }
    try {
      const res = await createMutation.mutateAsync({
        username: form.username.trim(),
        password: form.password,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
      });
      const newId: string | undefined = res?.data?.data?.id;
      setForm({ ...empty });
      onClose();
      if (newId && onCreated) onCreated(newId);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to create staff");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create staff member
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            The new staff will see exactly the data you see. Their permissions
            start empty — assign a role on the next screen, then tweak grants
            and denies as needed. You can only grant permissions you yourself
            hold.
            {user?.role && (
              <span className="mt-2 block text-xs">
                They'll be created under your account ({user.username}) with
                role <strong className="text-foreground">{user.role}</strong>{" "}
                and flagged as staff.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="staff-username" className="text-foreground">
              Username
            </Label>
            <div className="relative mt-1">
              <Input
                id="staff-username"
                value={form.username}
                onChange={(e) =>
                  // Usernames are stored lowercase so login is case-insensitive.
                  setForm({ ...form, username: e.target.value.toLowerCase() })
                }
                placeholder="e.g. rahul_finance"
                autoComplete="off"
                className={
                  usernameStatus === "taken"
                    ? "border-red-500 pr-9"
                    : usernameStatus === "available"
                    ? "border-green-500 pr-9"
                    : "pr-9"
                }
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === "available" && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {usernameStatus === "taken" && (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </span>
            </div>
            {usernameStatus === "taken" && (
              <p className="mt-1 text-xs text-red-500">
                Username is already taken
              </p>
            )}
            {usernameStatus === "available" && (
              <p className="mt-1 text-xs text-green-500">Username is available</p>
            )}
          </div>
          {/* <div> */}
          {/*   <Label htmlFor="staff-email" className="text-foreground"> */}
          {/*     Email */}
          {/*   </Label> */}
          {/*   <Input */}
          {/*     id="staff-email" */}
          {/*     type="email" */}
          {/*     value={form.email} */}
          {/*     onChange={(e) => setForm({ ...form, email: e.target.value })} */}
          {/*     placeholder="rahul@company.com" */}
          {/*     autoComplete="off" */}
          {/*     className="mt-1" */}
          {/*   /> */}
          {/* </div> */}
          <div>
            <Label htmlFor="staff-password" className="text-foreground">
              Initial password
            </Label>
            <Input
              id="staff-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="staff-fn" className="text-foreground">
                First name
              </Label>
              <Input
                id="staff-fn"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="staff-ln" className="text-foreground">
                Last name
              </Label>
              <Input
                id="staff-ln"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={
              createMutation.isPending ||
              usernameStatus === "taken" ||
              usernameStatus === "checking"
            }
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create staff"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
