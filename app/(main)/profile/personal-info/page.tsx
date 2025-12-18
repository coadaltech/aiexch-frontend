"use client";

import {
  User,
  Lock,
  Edit,
  Save,
  X,
  Camera,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PersonalInfoSkeleton } from "@/components/skeletons/profile-skeletons";
import { UserData } from "@/types";

export default function PersonalInfoScreen() {
  const { user } = useAuth();
  const { data: profileData, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const router = useRouter();

  const [userData, setUserData] = useState<UserData>({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    country: "",
    city: "",
    address: "",
    phone: "",
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [isVerified, setIsVerified] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Update userData when profile data loads
  useEffect(() => {
    console.log("Profile data:", profileData); // Debug log
    console.log("User data:", user); // Debug log

    if (user && profileData?.success && profileData?.profile) {
      setUserData({
        username: user.username || "",
        email: user.email || "",
        firstName: profileData.profile.firstName || "",
        lastName: profileData.profile.lastName || "",
        birthDate: profileData.profile.birthDate || "",
        country: profileData.profile.country || "",
        city: profileData.profile.city || "",
        address: profileData.profile.address || "",
        phone: profileData.profile.phone || "",
      });
    } else if (user) {
      // Fallback to user data only
      setUserData((prev) => ({
        ...prev,
        username: user.username || "",
        email: user.email || "",
      }));
    }
  }, [user, profileData]);

  if (isLoading) {
    return <PersonalInfoSkeleton />;
  }

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSave = (field: string) => {
    const updatedData = { [field]: tempValue };
    updateProfileMutation.mutate(updatedData, {
      onSuccess: () => {
        setUserData((prev) => ({ ...prev, [field]: tempValue }));
        setEditingField(null);
        setTempValue("");
        // Refresh user data in AuthContext if needed
        if (field === "firstName" || field === "lastName") {
          // You might want to refresh auth context here
        }
      },
    });
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue("");
  };

  return (
    <div className="min-h-screen max-w-md mx-auto lg:max-w-6xl ">
      <div className="  min-h-screen  lg:bg-transparent md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4  md:p-6 lg:p-0 lg:mb-6  lg:border-0">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-primary" />
            <h1 className="text-foreground font-bold text-lg lg:text-2xl">
              Personal Information
            </h1>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Profile Overview Card */}
          <div className="mt-4 lg:mt-0 lg:col-span-1">
            <Card className="p-6 text-center">
              <h2 className="text-xl font-bold text-foreground mb-1">
                {userData.firstName} {userData.lastName}
              </h2>
              <p className="text-muted-foreground mb-4">@{userData.username}</p>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                <div>
                  <div className="text-2xl font-bold text-primary">85%</div>
                  <div className="text-sm text-muted-foreground">
                    Profile Complete
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">Level 2</div>
                  <div className="text-sm text-muted-foreground">
                    Account Level
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="mt-4 lg:mt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:col-span-3">
            {/* Account Information */}
            <Card className="shrink-0 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Account Information
              </h3>

              <div className="space-y-4">
                <ProfileField
                  label="Username"
                  value={userData.username}
                  field="username"
                  locked
                  editingField={editingField}
                  tempValue={tempValue}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  setTempValue={setTempValue}
                />
                <ProfileField
                  label="Email Address"
                  value={userData.email}
                  field="email"
                  locked
                  editingField={editingField}
                  tempValue={tempValue}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  setTempValue={setTempValue}
                />
              </div>
            </Card>

            {/* Personal Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Details
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <ProfileField
                  label="First Name"
                  value={userData.firstName}
                  field="firstName"
                  editingField={editingField}
                  tempValue={tempValue}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  setTempValue={setTempValue}
                />
                <ProfileField
                  label="Last Name"
                  value={userData.lastName}
                  field="lastName"
                  editingField={editingField}
                  tempValue={tempValue}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  setTempValue={setTempValue}
                />
                <ProfileField
                  label="Birth Date"
                  value={userData.birthDate}
                  field="birthDate"
                  type="date"
                  editingField={editingField}
                  tempValue={tempValue}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  setTempValue={setTempValue}
                />
                <ProfileField
                  label="Phone Number"
                  value={userData.phone}
                  field="phone"
                  editingField={editingField}
                  tempValue={tempValue}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  setTempValue={setTempValue}
                />
              </div>
            </Card>

            {/* Address Information (full width) */}
            <Card className="p-6 md:col-span-2 lg:col-span-2">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Address Information
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <ProfileField
                  label="Country"
                  value={userData.country}
                  field="country"
                  editingField={editingField}
                  tempValue={tempValue}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  setTempValue={setTempValue}
                />
                <ProfileField
                  label="City"
                  value={userData.city}
                  field="city"
                  editingField={editingField}
                  tempValue={tempValue}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  setTempValue={setTempValue}
                />
                <div className="md:col-span-2">
                  <ProfileField
                    label="Home Address"
                    value={userData.address}
                    field="address"
                    editingField={editingField}
                    tempValue={tempValue}
                    onEdit={handleEdit}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    setTempValue={setTempValue}
                  />
                </div>
              </div>
            </Card>

            {/* Security Settings (full width) */}
            <Card className="p-6 md:col-span-2 lg:col-span-2">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Security Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-card rounded-lg">
                  <div>
                    <div className="text-foreground font-medium">Password</div>
                    <div className="text-muted-foreground text-sm">
                      Last changed 30 days ago
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-card rounded-lg">
                  <div>
                    <div className="text-foreground font-medium">
                      Two-Factor Authentication
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Add an extra layer of security
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      current: !showPasswords.current,
                    })
                  }
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      new: !showPasswords.new,
                    })
                  }
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      confirm: !showPasswords.confirm,
                    })
                  }
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              onClick={async () => {
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                  toast.error("Passwords don't match");
                  return;
                }
                if (passwordData.newPassword.length < 8) {
                  toast.error("New password must be at least 8 characters");
                  return;
                }

                try {
                  await authApi.changePassword({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                  });
                  toast.success("Password changed successfully");
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                } catch (error: any) {
                  const errorMessage =
                    error.response?.data?.message ||
                    "Failed to change password";
                  toast.error(errorMessage);
                }
              }}
              className="flex-1"
            >
              Update Password
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileField({
  label,
  value,
  field,
  locked = false,
  type = "text",
  editingField,
  tempValue,
  onEdit,
  onSave,
  onCancel,
  setTempValue,
}: {
  label: string;
  value: string;
  field: string;
  locked?: boolean;
  type?: string;
  editingField: string | null;
  tempValue: string;
  onEdit: (field: string, value: string) => void;
  onSave: (field: string) => void;
  onCancel: () => void;
  setTempValue: (value: string) => void;
}) {
  const isEditing = editingField === field;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>

      {isEditing ? (
        <div className="space-y-2">
          <Input
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={() => onSave(field)} size="sm">
              <Save className="w-4 h-4" />
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-muted rounded-md border">
          <span className="text-foreground flex-1 min-w-0 truncate pr-2">
            {value || "—"}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {locked ? (
              <Lock className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(field, value)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
