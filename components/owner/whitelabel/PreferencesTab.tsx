import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Whitelabel } from "../types";
import { useCurrencies } from "@/hooks/useOwner";
import { Loader2 } from "lucide-react";

interface PreferencesTabProps {
  formData: Whitelabel;
  setFormData: (data: Whitelabel) => void;
}

export function PreferencesTab({ formData, setFormData }: PreferencesTabProps) {
  const { data: currencies = [], isLoading: currenciesLoading } = useCurrencies();

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
            disabled={currenciesLoading}
          >
            <SelectTrigger className="bg-input border text-foreground min-w-[160px]">
              {currenciesLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select currency" />
              )}
            </SelectTrigger>
            <SelectContent className="bg-card border">
              {currencies.map((currency: any) => (
                <SelectItem key={currency.id} value={currency.code}>
                  {currency.code} - {currency.name}
                </SelectItem>
              ))}
              {!currenciesLoading && currencies.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No currencies created yet
                </div>
              )}
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
