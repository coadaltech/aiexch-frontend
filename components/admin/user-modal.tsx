"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { User, UserModalProps } from "./types";

export function UserModal({
  open,
  onClose,
  user,
  onSave,
  isUpdating,
  isUpdatingProfile,
}: UserModalProps) {
  const [formData, setFormData] = useState<User>(
    user || {
      username: "",
      email: "",
      role: "user",
      membership: "bronze",
      status: "active",
      balance: "0.00",
      firstName: "",
      lastName: "",
      phone: "",
      country: "",
      password: "",
    }
  );

  const validateForm = () => {
    if (!formData.username?.trim()) return "Username is required";
    if (!formData.email?.trim()) return "Email is required";
    if (!formData.role?.trim()) return "Role is required";
    if (!formData.membership?.trim()) return "Membership is required";
    if (!formData.status?.trim()) return "Status is required";
    if (!user && !formData.password?.trim()) return "Password is required";
    if (!user && formData.password && formData.password.length < 6)
      return "Password must be at least 6 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return "Invalid email format";
    return null;
  };

  const handleSaveUserInfo = () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }
    onSave({
      ...formData,
      balance: formData.balance.toString(),
      type: "user",
    });
  };

  const handleSaveProfileInfo = () => {
    onSave({
      ...formData,
      type: "profile",
    });
  };

  const handleCreateUser = () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }
    onSave({
      ...formData,
      balance: formData.balance.toString(),
    });

    const handleSave = () => {
      onSave(formData);
      onClose();
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-card border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {user ? "Edit User" : "Create New User"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Account Information
              </h3>
              <div>
                <Label className="text-muted-foreground">Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="bg-input border text-foreground"
                  required
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-input border text-foreground"
                  required
                />
              </div>

              <div>
                <Label className="text-muted-foreground">
                  {user ? "Change Password" : "Password"}
                </Label>
                <Input
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="bg-input border text-foreground"
                  placeholder={user ? "New password" : "Enter password"}
                  required={!user}
                  minLength={6}
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                  required
                >
                  <SelectTrigger className="bg-input border text-foreground">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-muted-foreground">Balance</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.balance || "0.00"}
                  onChange={(e) =>
                    setFormData({ ...formData, balance: e.target.value })
                  }
                  className="bg-input border text-foreground"
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                  required
                >
                  <SelectTrigger className="bg-input border text-foreground">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-muted-foreground">Membership</Label>
                <Select
                  value={formData.membership}
                  onValueChange={(value) =>
                    setFormData({ ...formData, membership: value })
                  }
                  required
                >
                  <SelectTrigger className="bg-input border text-foreground">
                    <SelectValue placeholder="Select membership" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {user ? (
                <Button
                  onClick={() => handleSaveUserInfo()}
                  disabled={isUpdating}
                  size="sm"
                  className="bg-primary text-black w-full"
                >
                  {isUpdating ? "Saving..." : "Save Account Info"}
                </Button>
              ) : (
                <Button
                  onClick={() => handleCreateUser()}
                  disabled={isUpdating}
                  size="sm"
                  className="bg-primary text-black w-full"
                >
                  {isUpdating ? "Creating..." : "Create User"}
                </Button>
              )}
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Personal Information
              </h3>
              <div>
                <Label className="text-muted-foreground">First Name</Label>
                <Input
                  value={formData.firstName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="bg-input border text-foreground"
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Last Name</Label>
                <Input
                  value={formData.lastName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="bg-input border text-foreground"
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="bg-input border text-foreground"
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Country</Label>
                <Input
                  value={formData.country || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="bg-input border text-foreground"
                />
              </div>

              {user && (
                <Button
                  onClick={() => handleSaveProfileInfo()}
                  disabled={isUpdatingProfile}
                  size="sm"
                  className="bg-primary text-black w-full"
                >
                  {isUpdatingProfile ? "Saving..." : "Save Personal Info"}
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-foreground"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
}
