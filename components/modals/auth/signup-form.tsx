"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AuthFormData } from "@/types";
import { countries } from "@/data/countries";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Country code to phone code mapping
const countryPhoneCodes: Record<string, string> = {
  US: "+1",
  UK: "+44",
  CA: "+1",
  AU: "+61",
  DE: "+49",
  FR: "+33",
  IT: "+39",
  ES: "+34",
  NL: "+31",
  SE: "+46",
  NO: "+47",
  DK: "+45",
  FI: "+358",
  CH: "+41",
  AT: "+43",
  BE: "+32",
  IE: "+353",
  PT: "+351",
  GR: "+30",
  PL: "+48",
  CZ: "+420",
  HU: "+36",
  SK: "+421",
  SI: "+386",
  HR: "+385",
  BG: "+359",
  RO: "+40",
  LT: "+370",
  LV: "+371",
  EE: "+372",
  JP: "+81",
  KR: "+82",
  CN: "+86",
  IN: "+91",
  SG: "+65",
  HK: "+852",
  TW: "+886",
  MY: "+60",
  TH: "+66",
  PH: "+63",
  ID: "+62",
  VN: "+84",
  BR: "+55",
  MX: "+52",
  AR: "+54",
  CL: "+56",
  CO: "+57",
  PE: "+51",
  ZA: "+27",
  EG: "+20",
  NG: "+234",
  KE: "+254",
  MA: "+212",
  AE: "+971",
  SA: "+966",
  IL: "+972",
  TR: "+90",
  RU: "+7",
  UA: "+380",
  BY: "+375",
  KZ: "+7",
  UZ: "+998",
  NZ: "+64",
};

interface SignupFormProps {
  formData: AuthFormData;
  onFormChange: (data: AuthFormData) => void;
}

export function SignupForm({ formData, onFormChange }: SignupFormProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Group countries alphabetically
  const groupedCountries = useMemo(() => {
    const groups: Record<string, typeof countries> = {};
    
    countries.forEach((country) => {
      // Extract country name without emoji and code
      const nameWithoutEmoji = country.name
        .replace(/^[\u{1F300}-\u{1F9FF}]+/u, "")
        .trim()
        .split(" (")[0]
        .trim();
      
      const firstLetter = nameWithoutEmoji.charAt(0).toUpperCase();
      
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(country);
    });

    // Sort countries within each group
    Object.keys(groups).forEach((letter) => {
      groups[letter].sort((a, b) => {
        const nameA = a.name.replace(/^[\u{1F300}-\u{1F9FF}]+/u, "").trim().split(" (")[0].trim();
        const nameB = b.name.replace(/^[\u{1F300}-\u{1F9FF}]+/u, "").trim().split(" (")[0].trim();
        return nameA.localeCompare(nameB);
      });
    });

    return groups;
  }, []);

  // Filter countries based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedCountries;

    const filtered: Record<string, typeof countries> = {};
    const query = searchQuery.toLowerCase();

    Object.keys(groupedCountries).forEach((letter) => {
      const matchingCountries = groupedCountries[letter].filter((country) => {
        const nameWithoutEmoji = country.name
          .replace(/^[\u{1F300}-\u{1F9FF}]+/u, "")
          .trim()
          .toLowerCase();
        return nameWithoutEmoji.includes(query) || country.code.toLowerCase().includes(query);
      });

      if (matchingCountries.length > 0) {
        filtered[letter] = matchingCountries;
      }
    });

    return filtered;
  }, [groupedCountries, searchQuery]);

  const selectedCountry = countries.find((c) => c.code === formData.country);
  const phoneCode = formData.country ? countryPhoneCodes[formData.country] || "" : "";

  // Update phone number when country changes (only when country changes, not on every render)
  useEffect(() => {
    if (formData.country && phoneCode) {
      const phoneWithoutSpaces = formData.phone.replace(/\s/g, "");
      const codeWithoutPlus = phoneCode.replace("+", "");
      
      // Check if phone already starts with this country code
      if (phoneWithoutSpaces.startsWith(codeWithoutPlus)) {
        // Already has correct code, ensure space after code
        const numberPart = phoneWithoutSpaces.substring(codeWithoutPlus.length);
        if (numberPart) {
          const formattedPhone = `${phoneCode} ${numberPart}`;
          if (formData.phone !== formattedPhone) {
            onFormChange({ ...formData, phone: formattedPhone });
          }
        }
        return;
      }
      
      // Check if phone has any other country code
      let hasOtherCountryCode = false;
      let cleanPhone = phoneWithoutSpaces;
      
      for (const code of Object.values(countryPhoneCodes)) {
        const c = code.replace("+", "");
        if (phoneWithoutSpaces.startsWith(c) && c !== codeWithoutPlus) {
          hasOtherCountryCode = true;
          cleanPhone = phoneWithoutSpaces.substring(c.length).trim();
          break;
        }
      }
      
      if (hasOtherCountryCode) {
        // Remove the old country code and add new one with space
        const newPhone = cleanPhone ? `${phoneCode} ${cleanPhone}` : `${phoneCode} `;
        onFormChange({ ...formData, phone: newPhone });
      } else if (formData.phone === "" || formData.phone === phoneCode || formData.phone.trim() === phoneCode.trim()) {
        // Empty or just the code, set to country code with space
        onFormChange({ ...formData, phone: `${phoneCode} ` });
      } else if (phoneWithoutSpaces.length > 0 && !phoneWithoutSpaces.startsWith("+")) {
        // Phone has numbers but no country code, add it with space
        const newPhone = `${phoneCode} ${phoneWithoutSpaces}`;
        onFormChange({ ...formData, phone: newPhone });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.country]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Allow user to type numbers, +, and spaces
    value = value.replace(/[^\d+\s]/g, "");
    
    // If country is selected, handle phone formatting
    if (formData.country && phoneCode) {
      const phoneWithoutSpaces = value.replace(/\s/g, "");
      const codeWithoutPlus = phoneCode.replace("+", "");
      const currentPhoneWithoutSpaces = formData.phone.replace(/\s/g, "");
      
      // Check if current phone already has the correct country code
      const currentHasCode = currentPhoneWithoutSpaces.startsWith(codeWithoutPlus);
      
      // If user is deleting and we're left with just the code or less, keep just the code with space
      if (phoneWithoutSpaces.length <= codeWithoutPlus.length) {
        if (phoneWithoutSpaces === codeWithoutPlus || phoneWithoutSpaces === phoneCode.replace("+", "")) {
          onFormChange({ ...formData, phone: `${phoneCode} ` });
          return;
        }
        // If user deleted the code, restore it with space
        if (!phoneWithoutSpaces.startsWith(codeWithoutPlus)) {
          onFormChange({ ...formData, phone: `${phoneCode} ` });
          return;
        }
      }
      
      // If current phone already has the correct country code, just update the number part
      if (currentHasCode) {
        // Check if new value also has the country code
        if (phoneWithoutSpaces.startsWith(codeWithoutPlus)) {
          // User is typing after the country code, just format with space
          const numberPart = phoneWithoutSpaces.substring(codeWithoutPlus.length);
          value = numberPart ? `${phoneCode} ${numberPart}` : `${phoneCode} `;
        } else {
          // User deleted the country code, restore it with space
          value = phoneWithoutSpaces ? `${phoneCode} ${phoneWithoutSpaces}` : `${phoneCode} `;
        }
      } else {
        // Current phone doesn't have country code
        // Only add country code if phone is completely empty
        if (currentPhoneWithoutSpaces === "") {
          // Check if it has a different country code
          let hasOtherCode = false;
          let numberPart = phoneWithoutSpaces;
          
          for (const code of Object.values(countryPhoneCodes)) {
            const c = code.replace("+", "");
            if (phoneWithoutSpaces.startsWith(c)) {
              hasOtherCode = true;
              numberPart = phoneWithoutSpaces.substring(c.length);
              break;
            }
          }
          
          if (hasOtherCode) {
            // Replace old country code with new one with space
            value = numberPart ? `${phoneCode} ${numberPart}` : `${phoneCode} `;
          } else if (phoneWithoutSpaces.startsWith("+")) {
            // User typed + but wrong code, replace it with space
            const withoutPlus = phoneWithoutSpaces.substring(1);
            value = withoutPlus ? `${phoneCode} ${withoutPlus}` : `${phoneCode} `;
          } else {
            // No country code, add it with space
            value = phoneWithoutSpaces ? `${phoneCode} ${phoneWithoutSpaces}` : `${phoneCode} `;
          }
        } else {
          // Current phone already has digits without country code
          // Don't auto-add country code, preserve user input
          value = value;
        }
      }
    }
    
    onFormChange({ ...formData, phone: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
          className="h-12 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border-blue-700/30 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-2"
          required
        />
      </div>

      <div className="space-y-1">
        <Popover open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setSearchQuery("");
          }
        }}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "h-12 w-full flex items-center justify-between gap-2 rounded-md border bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border-blue-700/30 text-foreground px-3 py-2 text-sm",
                "hover:from-slate-900/90 hover:via-slate-800/90 hover:to-slate-900/90",
                "focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-2",
                "cursor-pointer outline-none transition-colors",
                !formData.country && "text-muted-foreground"
              )}
            >
              <span className="truncate">
                {selectedCountry ? selectedCountry.name : "Select Country"}
              </span>
              <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-blue-700/30"
            align="start"
          >
            <Command className="bg-transparent">
              <CommandInput
                placeholder="Search country..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="h-12 border-b border-blue-700/30 bg-transparent text-foreground placeholder:text-muted-foreground"
              />
              <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden scroll-smooth">
                <CommandEmpty>No country found.</CommandEmpty>
                {Object.keys(filteredGroups)
                  .sort()
                  .map((letter) => (
                    <CommandGroup 
                      key={letter} 
                      heading={letter}
                      className="[&_[cmdk-group-heading]]:text-primary [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                    >
                      {filteredGroups[letter].map((country) => (
                        <CommandItem
                          key={country.code}
                          value={`${country.name} ${country.code}`}
                          onSelect={() => {
                            const newCountryCode = countryPhoneCodes[country.code] || "";
                            const currentPhoneWithoutSpaces = formData.phone.replace(/\s/g, "");
                            
                            // Check if phone has any country code
                            let hasCountryCode = false;
                            let numberPart = currentPhoneWithoutSpaces;
                            
                            for (const code of Object.values(countryPhoneCodes)) {
                              const c = code.replace("+", "");
                              if (currentPhoneWithoutSpaces.startsWith(c)) {
                                hasCountryCode = true;
                                numberPart = currentPhoneWithoutSpaces.substring(c.length).trim();
                                break;
                              }
                            }
                            
                            // Update phone with new country code and space
                            const newPhone = hasCountryCode && numberPart 
                              ? `${newCountryCode} ${numberPart}` 
                              : `${newCountryCode} `;
                            
                            onFormChange({ 
                              ...formData, 
                              country: country.code,
                              phone: newPhone
                            });
                            setOpen(false);
                            setSearchQuery("");
                          }}
                          className="text-foreground focus:bg-primary/20 focus:text-primary cursor-pointer aria-selected:bg-primary/20 aria-selected:text-primary"
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.country === country.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {country.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1">
        <Input
          type="tel"
          placeholder={phoneCode ? `${phoneCode} Phone Number` : "Phone"}
          value={formData.phone}
          onChange={handlePhoneChange}
          className="h-12 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border-blue-700/30 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-2"
          required
        />
      </div>

      <div className="space-y-1">
        <Input
          type="text"
          placeholder="Enter Referral / Promo Code"
          value={formData.referralCode}
          onChange={(e) => onFormChange({ ...formData, referralCode: e.target.value })}
          className="h-12 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border-blue-700/30 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-2"
        />
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-slate-900/60 via-slate-800/60 to-slate-900/60 border border-blue-700/20">
          <Checkbox
            id="terms"
            checked={formData.agreeTerms}
            onCheckedChange={(checked) =>
              onFormChange({ ...formData, agreeTerms: checked as boolean })
            }
            className="mt-0.5 border-primary focus-visible:ring-primary"
          />
          <label 
            htmlFor="terms" 
            className="text-sm text-foreground leading-relaxed cursor-pointer flex-1"
          >
            I agree to the{" "}
            <span className="text-primary font-medium hover:text-amber-400 transition-colors">User Agreement</span>{" "}
            & confirm I am at least 18 years old
          </label>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-slate-900/60 via-slate-800/60 to-slate-900/60 border border-blue-700/20">
          <Checkbox
            id="marketing"
            checked={formData.agreeMarketing}
            onCheckedChange={(checked) =>
              onFormChange({ ...formData, agreeMarketing: checked as boolean })
            }
            className="mt-0.5 border-primary focus-visible:ring-primary"
          />
          <label 
            htmlFor="marketing" 
            className="text-sm text-foreground leading-relaxed cursor-pointer flex-1"
          >
            I agree to receive marketing promotions from AIEXCH.
          </label>
        </div>
      </div>
    </div>
  );
}