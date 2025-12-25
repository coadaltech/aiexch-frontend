import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Whitelabel } from "../types";

interface PermissionsTabProps {
  formData: Whitelabel;
  setFormData: (data: Whitelabel) => void;
}

export function PermissionsTab({ formData, setFormData }: PermissionsTabProps) {
  const permissions = [
    { key: "casino", label: "Casino Games", description: "Access to casino games section" },
    { key: "sports", label: "Sports Betting", description: "Access to sports betting section" },
    { key: "liveCasino", label: "Live Casino", description: "Access to live dealer games" },
    { key: "promotions", label: "Promotions", description: "Access to promotions and bonuses" },
    { key: "transactions", label: "Transactions", description: "View and manage transactions" },
    { key: "userManagement", label: "User Management", description: "Manage user accounts" },
    { key: "reports", label: "Reports", description: "Access to analytics and reports" },
    { key: "settings", label: "Settings", description: "Access to system settings" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground mb-3">Module Permissions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {permissions.map(({ key, label, description }) => (
          <div key={key} className="flex items-start space-x-3 p-3 border rounded-lg">
            <Switch
              checked={formData.permissions?.[key as keyof typeof formData.permissions]}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, permissions: { ...formData.permissions!, [key]: checked } })
              }
            />
            <div>
              <Label className="text-foreground font-medium">{label}</Label>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
