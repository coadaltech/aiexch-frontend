import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ownerApi, uploadFile, api } from "@/lib/api";
import { toast } from "sonner";

// Promotions
export const usePromotions = () => {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: () => ownerApi.getPromotions().then((res) => res.data.data),
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => ownerApi.createPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion created successfully");
    },
    onError: () => toast.error("Failed to create promotion"),
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: any) => ownerApi.updatePromotion(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion updated successfully");
    },
    onError: () => toast.error("Failed to update promotion"),
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ownerApi.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion deleted successfully");
    },
    onError: () => toast.error("Failed to delete promotion"),
  });
};

// Promocodes
export const useOwnerPromocodes = () => {
  return useQuery({
    queryKey: ["owner-promocodes"],
    queryFn: () => ownerApi.getPromocodes().then((res) => res.data.data),
  });
};

export const useCreatePromocode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => ownerApi.createPromocode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-promocodes"] });
      toast.success("Promocode created successfully");
    },
    onError: () => toast.error("Failed to create promocode"),
  });
};

export const useUpdatePromocode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => ownerApi.updatePromocode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-promocodes"] });
      toast.success("Promocode updated successfully");
    },
    onError: () => toast.error("Failed to update promocode"),
  });
};

export const useDeletePromocode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ownerApi.deletePromocode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-promocodes"] });
      toast.success("Promocode deleted successfully");
    },
    onError: () => toast.error("Failed to delete promocode"),
  });
};

// Banners
export const useBanners = () => {
  return useQuery({
    queryKey: ["banners"],
    queryFn: () => ownerApi.getBanners().then((res) => res.data.data),
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await ownerApi.createBanner(data);
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner created successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.message ||
        error.response?.data?.error ||
        "Failed to create banner"
      );
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: any) => {
      const response = await ownerApi.updateBanner(id, formData);
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.message ||
        error.response?.data?.error ||
        "Failed to update banner"
      );
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ownerApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner deleted successfully");
    },
    onError: () => toast.error("Failed to delete banner"),
  });
};

// Popups
export const usePopups = () => {
  return useQuery({
    queryKey: ["popups"],
    queryFn: () => ownerApi.getPopups().then((res) => res.data.data),
  });
};

export const useCreatePopup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await ownerApi.createPopup(data);
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
      toast.success("Popup created successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.message || error.response?.data?.error || "Failed to create popup"
      );
    },
  });
};

export const useUpdatePopup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: any) => {
      const response = await ownerApi.updatePopup(id, formData);
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
      toast.success("Popup updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.message || error.response?.data?.error || "Failed to update popup"
      );
    },
  });
};

export const useDeletePopup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ownerApi.deletePopup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
      toast.success("Popup deleted successfully");
    },
    onError: () => toast.error("Failed to delete popup"),
  });
};

// Whitelabels
export const useWhitelabels = () => {
  return useQuery({
    queryKey: ["whitelabels"],
    queryFn: () => ownerApi.getWhitelabels().then((res) => res.data.data),
  });
};

export const useWhitelabel = (id: string) => {
  return useQuery({
    queryKey: ["whitelabel", id],
    queryFn: () =>
      ownerApi
        .getWhitelabels()
        .then((res) => res.data.data.find((w: any) => w.id === id)),
    enabled: !!id,
  });
};

export const useCreateWhitelabel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => ownerApi.createWhitelabel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelabels"] });
      toast.success("Whitelabel created successfully");
    },
    onError: () => toast.error("Failed to create whitelabel"),
  });
};

export const useUpdateWhitelabel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => ownerApi.updateWhitelabel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelabels"] });
      toast.success("Whitelabel updated successfully");
    },
    onError: () => toast.error("Failed to update whitelabel"),
  });
};

export const useDeleteWhitelabel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ownerApi.deleteWhitelabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelabels"] });
      toast.success("Whitelabel deleted successfully");
    },
    onError: () => toast.error("Failed to delete whitelabel"),
  });
};

// Users
export const useOwnerUsers = () => {
  return useQuery({
    queryKey: ["owner-users"],
    queryFn: () => ownerApi.getUsers().then((res) => res.data.data),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => ownerApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-users"] });
      toast.success("User updated successfully");
    },
    onError: () => toast.error("Failed to update user"),
  });
};

// Vouchers
export const useVouchers = () => {
  return useQuery({
    queryKey: ["vouchers"],
    queryFn: () => ownerApi.getVouchers().then((res) => res.data.data),
  });
};

export const useUpdateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => ownerApi.updateVoucher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success("Voucher updated successfully");
    },
    onError: () => toast.error("Failed to update voucher"),
  });
};

export const useCreateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => ownerApi.createVoucher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success("Voucher created successfully");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to create voucher";
      toast.error(errorMessage);
      console.error("Create voucher error:", error);
    },
  });
};

// KYC
export const useKycDocuments = () => {
  return useQuery({
    queryKey: ["kyc-documents"],
    queryFn: () => ownerApi.getKycDocuments().then((res) => res.data.data),
  });
};

export const useUpdateKyc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => ownerApi.updateKycStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-documents"] });
      toast.success("KYC status updated successfully");
    },
    onError: () => toast.error("Failed to update KYC status"),
  });
};

// Dashboard Stats
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => ownerApi.getUsers().then((res) => res.data.data),
  });
};

export const useRecentActivities = () => {
  return useQuery({
    queryKey: ["recent-activities"],
    queryFn: () => ownerApi.getUsers().then((res) => res.data.data),
  });
};

// Settings
export const useSettings = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => ownerApi.getSettings().then((res) => res.data.data),
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      // Check if we have files to upload
      const hasFiles = Object.values(data).some(
        (value) => value instanceof File
      );

      if (hasFiles) {
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
          if (data[key] instanceof File) {
            formData.append(key, data[key]);
          } else if (data[key] !== undefined && data[key] !== null) {
            formData.append(key, data[key]);
          }
        });
        return api.put("/owner/settings", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Use JSON for non-file updates to preserve data types
        return ownerApi.updateSettings(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings updated successfully");
    },
    onError: (error: any) => {
      console.error("Settings update error:", error);
      toast.error(error.response?.data?.message || "Failed to update settings");
    },
  });
};

// Notifications
export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => ownerApi.getNotifications().then((res) => res.data.data),
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => ownerApi.createNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification created successfully");
    },
    onError: () => toast.error("Failed to create notification"),
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      console.log("Deleting notification with ID:", id, typeof id);
      return ownerApi.deleteNotification(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted successfully");
    },
    onError: (error: any) => {
      console.error("Delete notification error:", error);
      const message =
        error.response?.data?.message || "Failed to delete notification";
      toast.error(message);
    },
  });
};

// QR Codes
export const useQrCodes = () => {
  return useQuery({
    queryKey: ["owner-qrcodes"],
    queryFn: () => ownerApi.getQrCodes(),
    select: (data) => data.data.data || [],
  });
};

export const useCreateQrCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => ownerApi.createQrCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-qrcodes"] });
      toast.success("QR code created successfully");
    },
    onError: () => toast.error("Failed to create QR code"),
  });
};

export const useUpdateQrCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: any) => ownerApi.updateQrCode(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-qrcodes"] });
      toast.success("QR code updated successfully");
    },
    onError: () => toast.error("Failed to update QR code"),
  });
};

export const useDeleteQrCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ownerApi.deleteQrCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-qrcodes"] });
      toast.success("QR code deleted successfully");
    },
    onError: () => toast.error("Failed to delete QR code"),
  });
};

// Sports Games
export const useSportsGames = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["sports-games"],
    queryFn: () => ownerApi.getSportsGames().then((res) => res.data.data),
  });

  const createGame = useMutation({
    mutationFn: (data: any) => ownerApi.createSportsGame(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports-games"] });
      toast.success("Sports game created successfully");
    },
    onError: () => toast.error("Failed to create sports game"),
  });

  const updateGame = useMutation({
    mutationFn: ({ id, ...data }: any) => ownerApi.updateSportsGame(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports-games"] });
      toast.success("Sports game updated successfully");
    },
    onError: () => toast.error("Failed to update sports game"),
  });

  const deleteGame = useMutation({
    mutationFn: (id: string) => ownerApi.deleteSportsGame(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports-games"] });
      toast.success("Sports game deleted successfully");
    },
    onError: () => toast.error("Failed to delete sports game"),
  });

  return {
    ...query,
    createGame,
    updateGame,
    deleteGame,
  };
};

// Home Sections
export const useHomeSections = () => {
  return useQuery({
    queryKey: ["home-sections"],
    queryFn: () => ownerApi.getHomeSections().then((res) => res.data.data),
  });
};

export const useCreateHomeSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => ownerApi.createHomeSection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-sections"] });
      toast.success("Home section created successfully");
    },
    onError: () => toast.error("Failed to create home section"),
  });
};

export const useUpdateHomeSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => ownerApi.updateHomeSection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-sections"] });
      toast.success("Home section updated successfully");
    },
    onError: () => toast.error("Failed to update home section"),
  });
};

export const useDeleteHomeSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ownerApi.deleteHomeSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-sections"] });
      toast.success("Home section deleted successfully");
    },
    onError: () => toast.error("Failed to delete home section"),
  });
};

export const useSectionGames = (sectionId: string) => {
  return useQuery({
    queryKey: ["section-games", sectionId],
    queryFn: () =>
      ownerApi.getSectionGames(sectionId).then((res) => res.data.data),
    enabled: !!sectionId,
  });
};

export const useCreateSectionGame = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, body }: any) =>
      ownerApi.createSectionGame(sectionId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["section-games", variables.sectionId],
      });
      toast.success("Game added successfully");
    },
    onError: () => toast.error("Failed to add game"),
  });
};

export const useUpdateSectionGame = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: any) =>
      ownerApi.updateSectionGame(params.gameId, params.body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["section-games", variables.sectionId],
      });
      toast.success("Game updated successfully");
    },
    onError: () => toast.error("Failed to update game"),
  });
};

export const useDeleteSectionGame = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gameId, sectionId }: any) =>
      ownerApi.deleteSectionGame(gameId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["section-games", variables.sectionId],
      });
      toast.success("Game deleted successfully");
    },
    onError: () => toast.error("Failed to delete game"),
  });
};

// Withdrawal Methods
export const useWithdrawalMethods = () => {
  return useQuery({
    queryKey: ["withdrawal-methods"],
    queryFn: () => ownerApi.getWithdrawalMethods().then((res) => res.data.data),
  });
};

export const useCreateWithdrawalMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => ownerApi.createWithdrawalMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawal-methods"] });
      toast.success("Withdrawal method created successfully");
    },
    onError: () => toast.error("Failed to create withdrawal method"),
  });
};

export const useUpdateWithdrawalMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      ownerApi.updateWithdrawalMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawal-methods"] });
      toast.success("Withdrawal method updated successfully");
    },
    onError: () => toast.error("Failed to update withdrawal method"),
  });
};

export const useDeleteWithdrawalMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ownerApi.deleteWithdrawalMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawal-methods"] });
      toast.success("Withdrawal method deleted successfully");
    },
    onError: () => toast.error("Failed to delete withdrawal method"),
  });
};

// Currencies (owner-only)
export const useAvailableCurrencies = () => {
  return useQuery({
    queryKey: ["owner-currencies-available"],
    queryFn: () => ownerApi.getAvailableCurrencies().then((res) => res.data.data),
  });
};

export const useCurrencies = () => {
  return useQuery({
    queryKey: ["owner-currencies"],
    queryFn: () => ownerApi.getCurrencies().then((res) => res.data.data),
  });
};

export const useCreateCurrency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string; name: string; countryName: string; value: string | number }) =>
      ownerApi.createCurrency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-currencies"] });
      toast.success("Currency added successfully");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to add currency"),
  });
};

export const useUpdateCurrency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: string | number }) =>
      ownerApi.updateCurrency(id, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-currencies"] });
      toast.success("Currency value updated successfully");
    },
    onError: () => toast.error("Failed to update currency"),
  });
};

export const useCurrencyHistory = (currencyId: string | null) => {
  return useQuery({
    queryKey: ["owner-currency-history", currencyId],
    queryFn: () => ownerApi.getCurrencyHistory(currencyId!).then((res) => res.data.data),
    enabled: !!currencyId,
  });
};

// ═══════════════════════════════════════════════════════════
//  Market Management
// ═══════════════════════════════════════════════════════════

export const useSearchEvents = (query: string) => {
  return useQuery({
    queryKey: ["search-events", query],
    queryFn: () =>
      ownerApi.searchEvents(query).then((res) => res.data.data),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
};

export const useEventSettings = (eventId: string | null) => {
  return useQuery({
    queryKey: ["event-settings", eventId],
    queryFn: () =>
      ownerApi.getEventSettings(eventId!).then((res) => res.data.data),
    enabled: !!eventId,
  });
};

export const useUpdateEventSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ...data }: any) =>
      ownerApi.updateEventSettings(eventId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["event-settings", variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: ["market-settings"] });
      toast.success("Event settings updated");
    },
    onError: () => toast.error("Failed to update event settings"),
  });
};

export const useMarketsByEvent = (eventId: string | null) => {
  return useQuery({
    queryKey: ["market-settings", eventId],
    queryFn: () =>
      ownerApi
        .getMarketsByEvent(eventId || undefined)
        .then((res) => res.data.data),
    enabled: !!eventId,
  });
};

export const useUpdateMarketSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ marketId, ...data }: any) =>
      ownerApi.updateMarketSettings(marketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-settings"] });
      toast.success("Market settings updated");
    },
    onError: () => toast.error("Failed to update market settings"),
  });
};

export const useCreateCustomMarket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => ownerApi.createCustomMarket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-settings"] });
      toast.success("Custom market created");
    },
    onError: () => toast.error("Failed to create custom market"),
  });
};

export const useCustomMarketDetails = (marketId: string | null) => {
  return useQuery({
    queryKey: ["custom-market-details", marketId],
    queryFn: () =>
      ownerApi.getCustomMarketDetails(marketId!).then((res) => res.data.data),
    enabled: !!marketId,
  });
};

export const useUpdateCustomOdds = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ marketId, ...data }: any) =>
      ownerApi.updateCustomOdds(marketId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["market-settings"] });
      queryClient.invalidateQueries({
        queryKey: ["custom-market-details", variables.marketId],
      });
      toast.success("Custom odds updated");
    },
    onError: () => toast.error("Failed to update custom odds"),
  });
};

export const useDeleteCustomMarket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (marketId: string) => ownerApi.deleteCustomMarket(marketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-settings"] });
      toast.success("Custom market deleted");
    },
    onError: () => toast.error("Failed to delete custom market"),
  });
};

export const useOddsHistory = (
  params: {
    marketId?: string;
    eventId?: string;
    from?: string;
    to?: string;
    limit?: string;
  } | null
) => {
  return useQuery({
    queryKey: ["odds-history", params],
    queryFn: () =>
      ownerApi.getOddsHistory(params!).then((res) => res.data.data),
    enabled: !!params && !!(params.marketId || params.eventId),
  });
};
