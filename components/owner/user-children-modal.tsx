"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useUserCreatedUsers } from "@/hooks/useOwner";
import { Loader2 } from "lucide-react";

interface UserChildrenModalProps {
  open: boolean;
  onClose: () => void;
  user: { id: string; username: string } | null;
}

export function UserChildrenModal({
  open,
  onClose,
  user,
}: UserChildrenModalProps) {
  const { data: createdUsers = [], isLoading } = useUserCreatedUsers(
    open && user ? user.id : null
  );

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border max-w-2xl p-0 gap-0 max-h-[80vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            Users created by{" "}
            <span className="text-primary">{user?.username}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : createdUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No users created by this user
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground text-sm">
                    Username
                  </th>
                  <th className="text-left py-2 px-2 text-muted-foreground text-sm">
                    Role
                  </th>
                  <th className="text-left py-2 px-2 text-muted-foreground text-sm">
                    Membership
                  </th>
                  <th className="text-left py-2 px-2 text-muted-foreground text-sm">
                    Status
                  </th>
                  <th className="text-left py-2 px-2 text-muted-foreground text-sm">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {createdUsers.map((u: any) => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-2 px-2">
                      <div>
                        <div className="font-medium text-foreground text-sm">
                          {u.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <Badge
                        variant={
                          u.role === "admin"
                            ? "destructive"
                            : u.role === "vip"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">
                      <Badge
                        variant={
                          u.membership === "platinum"
                            ? "destructive"
                            : u.membership === "gold"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {u.membership}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">
                      <Badge
                        variant={
                          u.accountStatus !== false &&
                          u.parentAccountStatus !== false
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {u.accountStatus !== false &&
                        u.parentAccountStatus !== false
                          ? "Active"
                          : "Suspended"}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-foreground font-medium text-sm">
                      ₹{u.balance || "0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
