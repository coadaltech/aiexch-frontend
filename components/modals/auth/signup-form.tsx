"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthFormData } from "@/types";
import { countries } from "@/data/countries";

interface SignupFormProps {
  formData: AuthFormData;
  onFormChange: (data: AuthFormData) => void;
}

export function SignupForm({ formData, onFormChange }: SignupFormProps) {
  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
        className="h-12"
        required
      />

      <Select
        value={formData.country}
        onValueChange={(value) => onFormChange({ ...formData, country: value })}
      >
        <SelectTrigger className="h-12">
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="tel"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => onFormChange({ ...formData, phone: e.target.value })}
        className="h-12"
        required
      />

      <Input
        type="text"
        placeholder="Enter Referral / Promo Code"
        value={formData.referralCode}
        onChange={(e) => onFormChange({ ...formData, referralCode: e.target.value })}
        className="h-12"
      />

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={formData.agreeTerms}
            onCheckedChange={(checked) =>
              onFormChange({ ...formData, agreeTerms: checked as boolean })
            }
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
            I agree to the{" "}
            <span className="text-primary font-medium">User Agreement</span>{" "}
            & confirm I am at least 18 years old
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="marketing"
            checked={formData.agreeMarketing}
            onCheckedChange={(checked) =>
              onFormChange({ ...formData, agreeMarketing: checked as boolean })
            }
            className="mt-1"
          />
          <label htmlFor="marketing" className="text-sm text-muted-foreground leading-relaxed">
            I agree to receive marketing promotions from AIEXCH.
          </label>
        </div>
      </div>
    </div>
  );
}