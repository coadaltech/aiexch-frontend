import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Whitelabel } from "../types";

interface PreferencesTabProps {
  formData: Whitelabel;
  setFormData: (data: Whitelabel) => void;
}

export function PreferencesTab({ formData, setFormData }: PreferencesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div>
          <Label className="text-muted-foreground">Language</Label>
          <Select
            value={formData.preferences?.language}
            onValueChange={(value) =>
              setFormData({ ...formData, preferences: { ...formData.preferences!, language: value } })
            }
          >
            <SelectTrigger className="bg-input border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border">
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-muted-foreground">Currency</Label>
          <Select
            value={formData.preferences?.currency}
            onValueChange={(value) =>
              setFormData({ ...formData, preferences: { ...formData.preferences!, currency: value } })
            }
          >
            <SelectTrigger className="bg-input border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border">
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="BTC">BTC (₿)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-muted-foreground">Timezone</Label>
          <Select
            value={formData.preferences?.timezone}
            onValueChange={(value) =>
              setFormData({ ...formData, preferences: { ...formData.preferences!, timezone: value } })
            }
          >
            <SelectTrigger className="bg-input border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border">
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="EST">EST</SelectItem>
              <SelectItem value="PST">PST</SelectItem>
              <SelectItem value="GMT">GMT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-muted-foreground">Date Format</Label>
          <Select
            value={formData.preferences?.dateFormat}
            onValueChange={(value) =>
              setFormData({ ...formData, preferences: { ...formData.preferences!, dateFormat: value } })
            }
          >
            <SelectTrigger className="bg-input border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border">
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { key: "enableLiveChat", label: "Enable Live Chat" },
          { key: "enableNotifications", label: "Enable Notifications" },
          { key: "maintenanceMode", label: "Maintenance Mode" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-2">
            <Switch
              checked={Boolean(formData.preferences?.[key as keyof typeof formData.preferences])}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, preferences: { ...formData.preferences!, [key]: checked } })
              }
            />
            <Label className="text-muted-foreground">{label}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}
