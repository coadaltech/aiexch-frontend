import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Whitelabel } from "../types";

interface LayoutTabProps {
  formData: Whitelabel;
  setFormData: (data: Whitelabel) => void;
}

export function LayoutTab({ formData, setFormData }: LayoutTabProps) {
  return (
    <div className="flex flex-wrap  gap-4">
      <div>
        <Label className="text-muted-foreground">Sidebar Type</Label>
        <Select
          value={formData.layout?.sidebarType}
          onValueChange={(value) =>
            setFormData({ ...formData, layout: { ...formData.layout!, sidebarType: value } })
          }
        >
          <SelectTrigger className="bg-input border text-foreground">
            <SelectValue placeholder="Select sidebar type" />
          </SelectTrigger>
          <SelectContent className="bg-card border">
            <SelectItem value="sidebar-1">Sidebar 1 (Default)</SelectItem>
            <SelectItem value="sidebar-2">Sidebar 2 (Compact)</SelectItem>
            <SelectItem value="sidebar-3">Sidebar 3 (Expanded)</SelectItem>
            <SelectItem value="sidebar-4">Sidebar 4 (Floating)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-muted-foreground">Banner Type</Label>
        <Select
          value={formData.layout?.bannerType}
          onValueChange={(value) =>
            setFormData({ ...formData, layout: { ...formData.layout!, bannerType: value } })
          }
        >
          <SelectTrigger className="bg-input border text-foreground">
            <SelectValue placeholder="Select banner type" />
          </SelectTrigger>
          <SelectContent className="bg-card border">
            <SelectItem value="banner-1">Banner 1 (Carousel)</SelectItem>
            <SelectItem value="banner-2">Banner 2 (Static)</SelectItem>
            <SelectItem value="banner-3">Banner 3 (Video)</SelectItem>
            <SelectItem value="banner-4">Banner 4 (Slider)</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
