"use client";

import {
  User,
  Lock,
  Edit,
  Save,
  X,
  Shield,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const CARD_CLS =
  "rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 min-w-0 shadow-sm";

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

  const [editingFields, setEditingFields] = useState<Record<string, string>>({});
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
    setEditingFields((prev) => ({
      ...prev,
      [field]: currentValue,
    }));
  };

  const handleSave = (field: string) => {
    const value = editingFields[field];
    if (value === undefined) return;

    const updatedData = { [field]: value };
    updateProfileMutation.mutate(updatedData, {
      onSuccess: () => {
        setUserData((prev) => ({ ...prev, [field]: value }));
        setEditingFields((prev) => {
          const newFields = { ...prev };
          delete newFields[field];
          return newFields;
        });
      },
    });
  };

  const handleSaveAll = () => {
    const fieldsToSave = Object.keys(editingFields);
    if (fieldsToSave.length === 0) return;

    const updatedData: Record<string, string> = {};
    fieldsToSave.forEach((field) => {
      updatedData[field] = editingFields[field];
    });

    updateProfileMutation.mutate(updatedData, {
      onSuccess: () => {
        setUserData((prev) => ({
          ...prev,
          ...editingFields,
        }));
        setEditingFields({});
      },
    });
  };

  const handleCancel = (field?: string) => {
    if (field) {
      setEditingFields((prev) => {
        const newFields = { ...prev };
        delete newFields[field];
        return newFields;
      });
    } else {
      setEditingFields({});
    }
  };

  const hasUnsavedChanges = Object.keys(editingFields).length > 0;

  return (
    <div className="w-full min-w-0 px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* ── Hero header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="shrink-0 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-900 sm:h-10 sm:w-10">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg lg:text-2xl">
              Personal Information
            </h1>
            <p className="hidden truncate text-xs text-gray-500 sm:block">
              Manage your account details
            </p>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              onClick={() => handleCancel()}
              variant="outline"
              size="sm"
              className="border-gray-300 bg-transparent text-gray-800 hover:bg-gray-100"
            >
              Cancel<span className="hidden sm:inline"> All</span>
            </Button>
            <Button
              onClick={handleSaveAll}
              size="sm"
              disabled={updateProfileMutation.isPending}
              className="bg-[var(--header-primary)] text-white hover:bg-[var(--header-primary)]/90"
            >
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                Save All ({Object.keys(editingFields).length})
              </span>
              <span className="sm:hidden">{Object.keys(editingFields).length}</span>
            </Button>
          </div>
        )}
      </div>

      {/* ── Details ── */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        {/* Account Information */}
        <div className={CARD_CLS}>
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 sm:mb-6 sm:text-lg">
            <Shield className="h-5 w-5 text-[var(--header-primary)]" />
            Account Information
          </h3>

          <div className="space-y-4">
            <ProfileField
              label="Username"
              value={userData.username}
              field="username"
              locked
              editingFields={editingFields}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
            />
            <ProfileField
              label="Email Address"
              value={userData.email}
              field="email"
              locked
              editingFields={editingFields}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>

        {/* Personal Details */}
        <div className={CARD_CLS}>
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 sm:mb-6 sm:text-lg">
            <User className="h-5 w-5 text-[var(--header-primary)]" />
            Personal Details
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField
              label="First Name"
              value={userData.firstName}
              field="firstName"
              editingFields={editingFields}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
            />
            <ProfileField
              label="Last Name"
              value={userData.lastName}
              field="lastName"
              editingFields={editingFields}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
            />
            <ProfileField
              label="Birth Date"
              value={userData.birthDate}
              field="birthDate"
              type="date"
              editingFields={editingFields}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
            />
            <ProfileField
              label="Phone Number"
              value={userData.phone}
              field="phone"
              editingFields={editingFields}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>

        {/* Address Information (full width) */}
        <div className={`${CARD_CLS} md:col-span-2`}>
          <h3 className="mb-4 text-base font-semibold text-gray-900 sm:mb-6 sm:text-lg">
            Address Information
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField
              label="Country"
              value={userData.country}
              field="country"
              editingFields={editingFields}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
            />
            <ProfileField
              label="City"
              value={userData.city}
              field="city"
              editingFields={editingFields}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
            />
            <div className="sm:col-span-2">
              <ProfileField
                label="Home Address"
                value={userData.address}
                field="address"
                editingFields={editingFields}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>

        {/* Security Settings (full width) */}
        <div className={`${CARD_CLS} md:col-span-2`}>
          <h3 className="mb-4 text-base font-semibold text-gray-900 sm:mb-6 sm:text-lg">
            Security Settings
          </h3>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="min-w-0">
                <div className="font-medium text-gray-900">Password</div>
                <div className="text-sm text-gray-500">
                  Last changed 30 days ago
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordModal(true)}
                className="w-full shrink-0 border-gray-300 bg-transparent text-gray-800 hover:bg-gray-100 sm:w-auto"
              >
                Change Password
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="min-w-0">
                <div className="font-medium text-gray-900">
                  Two-Factor Authentication
                </div>
                <div className="text-sm text-gray-500">
                  Add an extra layer of security
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full shrink-0 border-gray-300 bg-transparent text-gray-800 hover:bg-gray-100 sm:w-auto"
              >
                Enable 2FA
              </Button>
            </div>
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
                  className="bg-white"
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
                  className="bg-white"
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
                  className="bg-white"
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
          <div className="mt-6 flex gap-3">
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
  editingFields,
  onEdit,
  onSave,
  onCancel,
}: {
  label: string;
  value: string;
  field: string;
  locked?: boolean;
  type?: string;
  editingFields: Record<string, string>;
  onEdit: (field: string, value: string) => void;
  onSave: (field: string) => void;
  onCancel: (field?: string) => void;
}) {
  const isEditing = field in editingFields;
  const tempValue = editingFields[field] ?? value;

  const handleChange = (newValue: string) => {
    onEdit(field, newValue);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-600">{label}</Label>

      {isEditing ? (
        <div className="space-y-2">
          <Input
            type={type}
            value={tempValue}
            onChange={(e) => handleChange(e.target.value)}
            autoFocus
            className="border-gray-300 bg-white text-gray-900"
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => onSave(field)}
              size="sm"
              className="bg-[var(--header-primary)] text-white hover:bg-[var(--header-primary)]/90"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onCancel(field)}
              variant="outline"
              size="sm"
              className="border-gray-300 bg-transparent text-gray-800 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
          <span className="min-w-0 flex-1 truncate pr-2 text-gray-900">
            {value || "—"}
          </span>
          <div className="flex flex-shrink-0 items-center gap-2">
            {locked ? (
              <Lock className="h-4 w-4 text-gray-400" />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(field, value)}
                className="text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
