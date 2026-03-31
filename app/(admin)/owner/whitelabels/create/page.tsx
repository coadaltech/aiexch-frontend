"use client";

import { useRouter } from "next/navigation";
import { useCreateWhitelabel } from "@/hooks/useOwner";
import { WhitelabelPage } from "@/components/owner/whitelabel-page";
import { Whitelabel } from "@/components/owner/types";
import { usePanelPrefix } from "@/hooks/usePanelPrefix";

export default function CreateWhitelabelPage() {
  const router = useRouter();
  const panelPrefix = usePanelPrefix();
  const createMutation = useCreateWhitelabel();

  const handleSave = async (formData: Whitelabel) => {
    const formDataToSend = new FormData();
    formDataToSend.append('userId', formData.userId);
    formDataToSend.append('whitelabelType', formData.whitelabelType);
    formDataToSend.append('name', formData.name);
    formDataToSend.append('domain', formData.domain);
    if (formData.title) formDataToSend.append('title', formData.title);
    if (formData.description) formDataToSend.append('description', formData.description);
    formDataToSend.append('status', formData.status);
    if (formData.contactEmail) formDataToSend.append('contactEmail', formData.contactEmail);
    if (formData.logo) {
      if (formData.logo instanceof File) {
        formDataToSend.append('logo', formData.logo);
      } else {
        formDataToSend.append('logoUrl', formData.logo);
      }
    }
    if (formData.favicon) {
      if (formData.favicon instanceof File) {
        formDataToSend.append('favicon', formData.favicon);
      } else {
        formDataToSend.append('faviconUrl', formData.favicon);
      }
    }
    if (formData.socialLinks) formDataToSend.append('socialLinks', JSON.stringify(formData.socialLinks));
    if (formData.theme) formDataToSend.append('theme', JSON.stringify(formData.theme));
    if (formData.layout) formDataToSend.append('layout', JSON.stringify(formData.layout));
    if (formData.config) formDataToSend.append('config', JSON.stringify(formData.config));
    if (formData.preferences) formDataToSend.append('preferences', JSON.stringify(formData.preferences));
    if (formData.permissions) formDataToSend.append('permissions', JSON.stringify(formData.permissions));

    createMutation.mutate(formDataToSend, {
      onSuccess: () => {
        router.push(`${panelPrefix}/whitelabels`);
      },
    });
  };

  return (
    <WhitelabelPage
      title="Create New White Label"
      onSave={handleSave}
      isLoading={createMutation.isPending}
    />
  );
}
