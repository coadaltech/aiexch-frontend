"use client";

import { useRouter, useParams } from "next/navigation";
import { useWhitelabel, useUpdateWhitelabel } from "@/hooks/useAdmin";
import { WhitelabelPage } from "@/components/admin/whitelabel-page";
import { Whitelabel } from "@/components/admin/types";

export default function EditWhitelabelPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { data: whitelabel, isLoading } = useWhitelabel(parseInt(id));
  const updateMutation = useUpdateWhitelabel();

  const handleSave = async (formData: Whitelabel) => {
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('domain', formData.domain);
    if (formData.title) formDataToSend.append('title', formData.title);
    if (formData.description) formDataToSend.append('description', formData.description);
    formDataToSend.append('status', formData.status);
    if (formData.contactEmail) formDataToSend.append('contactEmail', formData.contactEmail);
    if (formData.logo instanceof File) {
      formDataToSend.append('logo', formData.logo);
    } else if (formData.logo) {
      formDataToSend.append('logoUrl', formData.logo);
    }
    if (formData.favicon instanceof File) {
      formDataToSend.append('favicon', formData.favicon);
    } else if (formData.favicon) {
      formDataToSend.append('faviconUrl', formData.favicon);
    }
    if (formData.socialLinks) formDataToSend.append('socialLinks', JSON.stringify(formData.socialLinks));
    formDataToSend.append('theme', JSON.stringify(formData.theme));
    formDataToSend.append('layout', JSON.stringify(formData.layout));
    formDataToSend.append('config', JSON.stringify(formData.config));
    formDataToSend.append('preferences', JSON.stringify(formData.preferences));
    formDataToSend.append('permissions', JSON.stringify(formData.permissions));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/whitelabels/${id}`, {
        method: 'PUT',
        body: formDataToSend,
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        router.push("/admin/whitelabels");
      }
    } catch (error) {
      console.error('Failed to update whitelabel:', error);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <WhitelabelPage
      title="Edit White Label"
      whitelabel={whitelabel}
      onSave={handleSave}
      isLoading={updateMutation.isPending}
    />
  );
}