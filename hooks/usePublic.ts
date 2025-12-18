import { useQuery, useMutation } from '@tanstack/react-query';
import { publicApi } from '@/lib/api';
import { toast } from 'sonner';

export const usePublicBanners = (position?: string) => {
  return useQuery({
    queryKey: ['public-banners', position],
    queryFn: () => publicApi.getBanners(position).then(res => res.data.data),
  });
};

export const usePublicPromotions = (type?: string) => {
  return useQuery({
    queryKey: ['public-promotions', type],
    queryFn: () => publicApi.getPromotions(type).then(res => res.data.data),
  });
};

export const usePublicPopups = (page?: string) => {
  return useQuery({
    queryKey: ['public-popups', page],
    queryFn: () => publicApi.getPopups(page).then(res => res.data.data),
  });
};

export const useSubmitWhitelabelRequest = () => {
  return useMutation({
    mutationFn: (data: any) => publicApi.submitWhitelabelRequest(data),
    onSuccess: () => {
      toast.success('Request submitted successfully! We will contact you soon.');
    },
    onError: () => toast.error('Failed to submit request'),
  });
};

export const useSettings = () => {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: () => publicApi.getSettings().then(res => res.data.data),
  });
};

export const useHomeSections = () => {
  return useQuery({
    queryKey: ['home-sections'],
    queryFn: () => publicApi.getHomeSections().then(res => res.data.data),
  });
};

export const useSectionGames = (sectionId: number, enabled = true) => {
  return useQuery({
    queryKey: ['section-games', sectionId],
    queryFn: () => publicApi.getSectionGames(sectionId).then(res => res.data.data),
    enabled,
  });
};

export const usePublicCasinoGames = (expand?: string) => {
  return useQuery({
    queryKey: ['public-casino-games', expand],
    queryFn: () => publicApi.getCasinoGames(expand).then(res => res.data),
  });
};