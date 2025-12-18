import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, uploadFile, api } from "@/lib/api";
import { toast } from "sonner";

// Promotions
export const usePromotions = () => {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: () => adminApi.getPromotions().then((res) => res.data.data),
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createPromotion(data),
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
    mutationFn: ({ id, body }: any) => adminApi.updatePromotion(id, body),
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
    mutationFn: (id: number) => adminApi.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion deleted successfully");
    },
    onError: () => toast.error("Failed to delete promotion"),
  });
};

// Promocodes
export const useAdminPromocodes = () => {
  return useQuery({
    queryKey: ["admin-promocodes"],
    queryFn: () => adminApi.getPromocodes().then((res) => res.data.data),
  });
};

export const useCreatePromocode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createPromocode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promocodes"] });
      toast.success("Promocode created successfully");
    },
    onError: () => toast.error("Failed to create promocode"),
  });
};

export const useUpdatePromocode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => adminApi.updatePromocode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promocodes"] });
      toast.success("Promocode updated successfully");
    },
    onError: () => toast.error("Failed to update promocode"),
  });
};

export const useDeletePromocode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deletePromocode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promocodes"] });
      toast.success("Promocode deleted successfully");
    },
    onError: () => toast.error("Failed to delete promocode"),
  });
};

// Banners
export const useBanners = () => {
  return useQuery({
    queryKey: ["banners"],
    queryFn: () => adminApi.getBanners().then((res) => res.data.data),
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await adminApi.createBanner(data);
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
      const response = await adminApi.updateBanner(id, formData);
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
    mutationFn: (id: number) => adminApi.deleteBanner(id),
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
    queryFn: () => adminApi.getPopups().then((res) => res.data.data),
  });
};

export const useCreatePopup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await adminApi.createPopup(data);
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
      const response = await adminApi.updatePopup(id, formData);
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
    mutationFn: (id: number) => adminApi.deletePopup(id),
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
    queryFn: () => adminApi.getWhitelabels().then((res) => res.data.data),
  });
};

export const useWhitelabel = (id: number) => {
  return useQuery({
    queryKey: ["whitelabel", id],
    queryFn: () =>
      adminApi
        .getWhitelabels()
        .then((res) => res.data.data.find((w: any) => w.id === id)),
    enabled: !!id,
  });
};

export const useCreateWhitelabel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createWhitelabel(data),
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
    mutationFn: ({ id, ...data }: any) => adminApi.updateWhitelabel(id, data),
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
    mutationFn: (id: number) => adminApi.deleteWhitelabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelabels"] });
      toast.success("Whitelabel deleted successfully");
    },
    onError: () => toast.error("Failed to delete whitelabel"),
  });
};

export const useGenerateDatabase = () => {
  return useMutation({
    mutationFn: (id: number) => adminApi.generateDatabase(id),
    onSuccess: (response) => {
      toast.success(
        response.data.message || "Database schema generated successfully"
      );
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to generate database schema"
      );
    },
  });
};

export const useMigrateDatabase = () => {
  return useMutation({
    mutationFn: (id: number) => adminApi.migrateDatabase(id),
    onSuccess: (response) => {
      toast.success(
        response.data.message || "Database migration completed successfully"
      );
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to run database migration"
      );
    },
  });
};

// Users
export const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminApi.getUsers().then((res) => res.data.data),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated successfully");
    },
    onError: () => toast.error("Failed to update user"),
  });
};

// Transactions
export const useTransactions = () => {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: () => adminApi.getTransactions().then((res) => res.data.data),
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => adminApi.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction updated successfully");
    },
    onError: () => toast.error("Failed to update transaction"),
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction created successfully");
    },
    onError: () => toast.error("Failed to create transaction"),
  });
};

// KYC
export const useKycDocuments = () => {
  return useQuery({
    queryKey: ["kyc-documents"],
    queryFn: () => adminApi.getKycDocuments().then((res) => res.data.data),
  });
};

export const useUpdateKyc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => adminApi.updateKycStatus(id, data),
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
    queryFn: () => adminApi.getUsers().then((res) => res.data.data),
  });
};

export const useRecentActivities = () => {
  return useQuery({
    queryKey: ["recent-activities"],
    queryFn: () => adminApi.getUsers().then((res) => res.data.data),
  });
};

// Settings
export const useSettings = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => adminApi.getSettings().then((res) => res.data.data),
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
        return api.put("/admin/settings", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Use JSON for non-file updates to preserve data types
        return adminApi.updateSettings(data);
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
    queryFn: () => adminApi.getNotifications().then((res) => res.data.data),
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createNotification(data),
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
    mutationFn: (id: number) => {
      console.log("Deleting notification with ID:", id, typeof id);
      return adminApi.deleteNotification(id);
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
    queryKey: ["admin-qrcodes"],
    queryFn: () => adminApi.getQrCodes(),
    select: (data) => data.data.data || [],
  });
};

export const useCreateQrCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createQrCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-qrcodes"] });
      toast.success("QR code created successfully");
    },
    onError: () => toast.error("Failed to create QR code"),
  });
};

export const useUpdateQrCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: any) => adminApi.updateQrCode(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-qrcodes"] });
      toast.success("QR code updated successfully");
    },
    onError: () => toast.error("Failed to update QR code"),
  });
};

export const useDeleteQrCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteQrCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-qrcodes"] });
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
    queryFn: () => adminApi.getSportsGames().then((res) => res.data.data),
  });

  const createGame = useMutation({
    mutationFn: (data: any) => adminApi.createSportsGame(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports-games"] });
      toast.success("Sports game created successfully");
    },
    onError: () => toast.error("Failed to create sports game"),
  });

  const updateGame = useMutation({
    mutationFn: ({ id, ...data }: any) => adminApi.updateSportsGame(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports-games"] });
      toast.success("Sports game updated successfully");
    },
    onError: () => toast.error("Failed to update sports game"),
  });

  const deleteGame = useMutation({
    mutationFn: (id: number) => adminApi.deleteSportsGame(id),
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
    queryFn: () => adminApi.getHomeSections().then((res) => res.data.data),
  });
};

export const useCreateHomeSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createHomeSection(data),
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
    mutationFn: ({ id, ...data }: any) => adminApi.updateHomeSection(id, data),
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
    mutationFn: (id: number) => adminApi.deleteHomeSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-sections"] });
      toast.success("Home section deleted successfully");
    },
    onError: () => toast.error("Failed to delete home section"),
  });
};

export const useSectionGames = (sectionId: number) => {
  return useQuery({
    queryKey: ["section-games", sectionId],
    queryFn: () =>
      adminApi.getSectionGames(sectionId).then((res) => res.data.data),
    enabled: !!sectionId,
  });
};

export const useCreateSectionGame = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, body }: any) =>
      adminApi.createSectionGame(sectionId, body),
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
      adminApi.updateSectionGame(params.gameId, params.body),
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
      adminApi.deleteSectionGame(gameId),
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
    queryFn: () => adminApi.getWithdrawalMethods().then((res) => res.data.data),
  });
};

export const useCreateWithdrawalMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createWithdrawalMethod(data),
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
      adminApi.updateWithdrawalMethod(id, data),
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
    mutationFn: (id: number) => adminApi.deleteWithdrawalMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawal-methods"] });
      toast.success("Withdrawal method deleted successfully");
    },
    onError: () => toast.error("Failed to delete withdrawal method"),
  });
};
