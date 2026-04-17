"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, UserCog } from "lucide-react";
import { api } from "@/lib/api";
import { useUpdateUser } from "@/hooks/useOwner";
import { toast } from "sonner";

type EditUser = {
  id: string;
  username: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  country?: string | null;
};

export function EditProfileModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: EditUser | null;
}) {
  const queryClient = useQueryClient();
  const updateUser = useUpdateUser();
  const updateProfile = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/owner/users/${id}/profile`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-users"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    },
  });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      setPassword("");
      setConfirmPassword("");
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPhone(user.phone ?? "");
      setCountry(user.country ?? "");
      setError(null);
    }
  }, [open, user]);

  const isSaving = updateUser.isPending || updateProfile.isPending;

  const handleSave = async () => {
    if (!user?.id) return;
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(null);

    const profileChanged =
      firstName !== (user.firstName ?? "") ||
      lastName  !== (user.lastName  ?? "") ||
      phone     !== (user.phone     ?? "") ||
      country   !== (user.country   ?? "");

    try {
      const jobs: Promise<any>[] = [];
      if (password) {
        jobs.push(updateUser.mutateAsync({ id: user.id, password }));
      }
      if (profileChanged) {
        jobs.push(updateProfile.mutateAsync({
          id: user.id,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          country: country || null,
        }));
      }
      if (jobs.length === 0) {
        onClose();
        return;
      }
      await Promise.all(jobs);
      toast.success("User details updated");
      onClose();
    } catch {
      // mutation onError already toasts
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border max-w-xl w-[95vw] sm:w-full p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-foreground text-xl font-semibold flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Edit User Details
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            {user ? (
              <>
                Update password and profile info for{" "}
                <span className="font-semibold text-foreground">{user.username}</span>.
                {user.email && <span className="text-muted-foreground"> ({user.email})</span>}
              </>
            ) : "Update user details."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-5">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
          )}

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Password</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">New Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border text-foreground h-10 w-full"
                  placeholder="Leave blank to keep current"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-input border text-foreground h-10 w-full"
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  disabled={!password}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Profile</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">First Name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-input border text-foreground h-10 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-input border text-foreground h-10 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-input border text-foreground h-10 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Country</Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="bg-input border text-foreground h-10 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t bg-muted/30">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
            className="text-foreground h-10 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
