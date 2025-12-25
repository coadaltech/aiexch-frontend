import axios from "axios";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add domain header dynamically for client-side requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.headers["x-whitelabel-domain"] = window.location.host;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      [404, 401].includes(error.response?.status) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios
          .create({
            baseURL: API_BASE_URL,
            withCredentials: true,
          })
          .post("/auth/refresh");

        console.log("Refresh Response", refreshResponse);

        if (refreshResponse.data.success) {
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Clear auth state and redirect
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
        }
      }
    }

    return Promise.reject(error);
  }
);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  otp: string;
}

export interface Transaction {
  id: string;
  type: "deposit" | "withdraw";
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed";
  method: string;
  date: string;
  txHash?: string;
}

export interface AuthResponse {
  success: boolean;
  user: {
    id: number;
    username: string;
    email: string;
    membership: string;
    balance: string;
  };
}

export const uploadFile = (file: File, type?: string, oldImageUrl?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (type) formData.append("type", type);
  if (oldImageUrl) {
    // Extract key from URL for deletion
    const key = oldImageUrl.split("/").slice(-2).join("/");
    formData.append("oldKey", key);
  }
  return api.post("/upload/file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>("/auth/login", data),
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>("/auth/register", data),
  sendOTP: (data: { email: string; type?: string }) =>
    api.post("/auth/send-otp", data),
  verifyOTP: (email: string, otp: string) =>
    api.post("/auth/verify-otp", { email, otp }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post("/auth/reset-password", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/profile/change-password", data),
  refresh: () => api.post("/auth/refresh"),
};

export const adminApi = {
  // Banners
  getBanners: () => api.get("/admin/banners"),
  createBanner: (data: any) =>
    api.post("/admin/banners", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateBanner: (id: number, data: any) =>
    api.put(`/admin/banners/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteBanner: (id: number) => api.delete(`/admin/banners/${id}`),

  // Whitelabels
  getWhitelabels: () => api.get("/admin/whitelabels"),
  createWhitelabel: (data: any) => api.post("/admin/whitelabels", data),
  updateWhitelabel: (id: number, data: any) =>
    api.put(`/admin/whitelabels/${id}`, data),
  deleteWhitelabel: (id: number) => api.delete(`/admin/whitelabels/${id}`),
  generateDatabase: (id: number) =>
    api.post(`/admin/whitelabels/db/generate/${id}`),
  migrateDatabase: (id: number) =>
    api.post(`/admin/whitelabels/db/migrate/${id}`),

  // Promotions
  getPromotions: () => api.get("/admin/promotions"),
  createPromotion: (data: any) =>
    api.post("/admin/promotions", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updatePromotion: (id: number, data: any) =>
    api.put(`/admin/promotions/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deletePromotion: (id: number) => api.delete(`/admin/promotions/${id}`),

  // Users
  getUsers: () => api.get("/admin/users"),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),

  // Popups
  getPopups: () => api.get("/admin/popups"),
  createPopup: (data: any) =>
    api.post("/admin/popups", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updatePopup: (id: number, data: any) =>
    api.put(`/admin/popups/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deletePopup: (id: number) => api.delete(`/admin/popups/${id}`),

  // Promocodes
  getPromocodes: () => api.get("/admin/promocodes"),
  createPromocode: (data: any) => api.post("/admin/promocodes", data),
  updatePromocode: (id: number, data: any) =>
    api.put(`/admin/promocodes/${id}`, data),
  deletePromocode: (id: number) => api.delete(`/admin/promocodes/${id}`),

  // Transactions
  getTransactions: () => api.get("/admin/transactions"),
  createTransaction: (data: any) => api.post("/admin/transactions", data),
  updateTransaction: (id: number, data: any) =>
    api.put(`/admin/transactions/${id}`, data),

  // KYC
  getKycDocuments: () => api.get("/admin/kyc"),
  updateKycStatus: (id: number, data: any) => api.put(`/admin/kyc/${id}`, data),

  // Settings
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data: any) => api.put("/admin/settings", data),

  // Notifications
  getNotifications: () => api.get("/admin/notifications"),
  createNotification: (data: any) => api.post("/admin/notifications", data),
  updateNotification: (id: number, data: any) =>
    api.put(`/admin/notifications/${id}`, data),
  deleteNotification: (id: number) => api.delete(`/admin/notifications/${id}`),

  // QR Codes
  getQrCodes: () => api.get("/admin/qrcodes"),
  createQrCode: (data: any) =>
    api.post("/admin/qrcodes", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateQrCode: (id: number, data: any) =>
    api.put(`/admin/qrcodes/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteQrCode: (id: number) => api.delete(`/admin/qrcodes/${id}`),

  // Sports Games
  getSportsGames: () => api.get("/admin/sports-games"),
  createSportsGame: (data: any) => api.post("/admin/sports-games", data),
  updateSportsGame: (id: number, data: any) =>
    api.put(`/admin/sports-games/${id}`, data),
  deleteSportsGame: (id: number) => api.delete(`/admin/sports-games/${id}`),

  // Home Sections
  getHomeSections: () => api.get("/admin/home-sections"),
  createHomeSection: (data: any) => api.post("/admin/home-sections", data),
  updateHomeSection: (id: number, data: any) =>
    api.put(`/admin/home-sections/${id}`, data),
  deleteHomeSection: (id: number) => api.delete(`/admin/home-sections/${id}`),

  // Section Games
  getSectionGames: (sectionId: number) =>
    api.get(`/admin/home-sections/${sectionId}/games`),
  createSectionGame: (sectionId: number, data: any) =>
    api.post(`/admin/home-sections/${sectionId}/games`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateSectionGame: (gameId: number, data: any) => {
    // Extract body if data is wrapped in an object
    const actualData = data?.body || data;

    return api.put(`/admin/home-sections/games/${gameId}`, actualData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteSectionGame: (gameId: number) =>
    api.delete(`/admin/home-sections/games/${gameId}`),

  // Withdrawal Methods
  getWithdrawalMethods: () => api.get("/admin/withdrawal-methods"),
  createWithdrawalMethod: (data: any) =>
    api.post("/admin/withdrawal-methods", data),
  updateWithdrawalMethod: (id: number, data: any) =>
    api.put(`/admin/withdrawal-methods/${id}`, data),
  deleteWithdrawalMethod: (id: number) =>
    api.delete(`/admin/withdrawal-methods/${id}`),

  // Domains
  getDomains: () => api.get("/admin/domains"),
  createDomain: (data: any) => api.post("/admin/domains", data),
  updateDomain: (id: number, data: any) =>
    api.put(`/admin/domains/${id}`, data),
  deleteDomain: (id: number) => api.delete(`/admin/domains/${id}`),
};

export interface BetRecord {
  id: string;
  game: string;
  betAmount: number;
  odds: number;
  result: "win" | "loss" | "pending";
  payout?: number;
  date: string;
  type: "single" | "combo";
  sport?: string;
}

export const userApi = {
  getTransactions: (params?: { type?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.type && params.type !== "all")
      queryParams.append("type", params.type);
    if (params?.search) queryParams.append("search", params.search);
    const query = queryParams.toString();
    return api.get(`/profile/transactions${query ? `?${query}` : ""}`);
  },
  getBetHistory: (params?: { result?: string; type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.result && params.result !== "all")
      queryParams.append("result", params.result);
    if (params?.type && params.type !== "all")
      queryParams.append("type", params.type);
    const query = queryParams.toString();
    return api.get(`/profile/bet-history${query ? `?${query}` : ""}`);
  },

  // Notifications
  getNotifications: (userId: number) =>
    api.get(`/profile/notifications/user/${userId}`),
  markNotificationAsRead: (userId: number, notificationId: number) =>
    api.post("/profile/notifications/mark-read", { userId, notificationId }),

  // Promocodes
  getPromocodes: () => api.get("/profile/promocodes"),
  redeemPromocode: (code: string) =>
    api.post("/profile/promocodes/redeem", { code }),

  // Transactions
  createDeposit: (data: {
    amount: string;
    method: string;
    reference?: string;
    proofImage: File;
  }) =>
    api.post("/profile/deposit", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  createWithdrawal: (data: {
    amount: string;
    method: string;
    address: string;
    withdrawalAddress?: string;
  }) => api.post("/profile/withdraw", data),
  getBalance: () => api.get("/profile/balance"),
};

export const publicApi = {
  getPromocodes: () => api.get("/public/promocodes"),
  getBanners: (position?: string) => {
    const params = position ? `?position=${position}` : "";
    return api.get(`/public/banners${params}`);
  },
  getPromotions: (type?: string) => {
    const params = type ? `?type=${type}` : "";
    return api.get(`/public/promotions${params}`);
  },
  getPopups: (page?: string) => {
    const params = page ? `?page=${page}` : "";
    return api.get(`/public/popups${params}`);
  },
  submitWhitelabelRequest: (data: any) =>
    api.post("/public/whitelabel-request", data),
  getSettings: () => api.get("/public/settings"),
  getQrCodes: () => api.get("/public/qrcodes"),
  getWithdrawalMethods: () => api.get("/public/withdrawal-methods"),
  getHomeSections: () => api.get("/public/home-sections"),
  getSectionGames: (sectionId: number) =>
    api.get(`/public/home-sections/${sectionId}/games`),
  getCasinoGames: (expand?: string) => {
    const params = expand ? `?expand=${expand}` : "";
    return api.get(`/casino/games${params}`);
  },
};

export const casinoApi = {
  getGames: (expand?: string, page?: number, per_page?: number) => {
    const params = new URLSearchParams();
    if (expand) params.append("expand", expand);
    if (page) params.append("page", page.toString());
    if (per_page) params.append("per_page", per_page.toString());
    const query = params.toString();
    return api.get(`/casino/games${query ? `?${query}` : ""}`);
  },
  getLobby: (game_uuid: string, currency: string, technology?: string) => {
    const params = new URLSearchParams({ game_uuid, currency });
    if (technology) params.append("technology", technology);
    return api.get(`/casino/lobby?${params}`);
  },
  initGame: (data: Record<string, any>) => api.post("/casino/init", data),
  initDemo: (data: Record<string, any>) => api.post("/casino/init-demo", data),
  getFreespinBets: (game_uuid: string, currency: string) =>
    api.get(
      `/casino/freespins/bets?game_uuid=${game_uuid}&currency=${currency}`
    ),
  setFreespin: (data: Record<string, any>) =>
    api.post("/casino/freespins/set", data),
  getFreespin: (freespin_id: string) =>
    api.get(`/casino/freespins/${freespin_id}`),
  cancelFreespin: (freespin_id: string) =>
    api.post(`/casino/freespins/cancel/${freespin_id}`),
  getLimits: () => api.get("/casino/limits"),
  getFreespinLimits: () => api.get("/casino/limits/freespin"),
  getJackpots: () => api.get("/casino/jackpots"),
  balanceNotify: (balance: number, session_id?: string) =>
    api.post("/casino/balance/notify", { balance, session_id }),
  selfValidate: () => api.post("/casino/self-validate"),
  getGameTags: (expand?: string) => {
    const params = expand ? `?expand=${expand}` : "";
    return api.get(`/casino/game-tags${params}`);
  },
  // Database games with filters
  getGamesFromDb: (params?: {
    provider?: string;
    type?: string;
    technology?: string;
    search?: string;
    page?: string;
    per_page?: string;
    sort_by?: string;
    order?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.provider) queryParams.append("provider", params.provider);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.technology) queryParams.append("technology", params.technology);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.page) queryParams.append("page", params.page);
    if (params?.per_page) queryParams.append("per_page", params.per_page);
    if (params?.sort_by) queryParams.append("sort_by", params.sort_by);
    if (params?.order) queryParams.append("order", params.order);
    const query = queryParams.toString();
    return api.get(`/casino/games${query ? `?${query}` : ""}`);
  },
  // Get unique providers from database
  getProviders: () => api.get("/casino/games/providers"),
  // Get unique types from database
  getTypes: () => api.get("/casino/games/types"),
  // Get providers mapped to their available types
  getProvidersWithTypes: () => api.get("/casino/games/providers-types"),
};

export const sportsApi = {
  getSports: () => api.get("/sports/games"),
  getOdds: (eventTypeId: string, marketId: string) =>
    api.get(`/sports/odds/${eventTypeId}/${marketId}`),
  getBookmakers: (eventTypeId: string, marketId: string) =>
    api.get(`/sports/bookmakers-with-odds/${eventTypeId}/${marketId}`),
  getBookmakersWithOdds: (eventTypeId: string, marketId: string) =>
    api.get(`/sports/bookmakers-with-odds/${eventTypeId}/${marketId}`),
  getSessions: (eventTypeId: string, matchId: string, gtype?: string) => {
    const params = gtype ? `?gtype=${gtype}` : "";
    return api.get(`/sports/sessions/${eventTypeId}/${matchId}${params}`);
  },
  getPremium: (eventTypeId: string, matchId: string) =>
    api.get(`/sports/premium/${eventTypeId}/${matchId}`),
  getScore: (eventTypeId: string, matchId: string) =>
    api.get(`/sports/score/${eventTypeId}/${matchId}`),
  getSeries: (eventTypeId: string) => api.get(`/sports/series/${eventTypeId}`),
  getMatches: (eventTypeId: string, competitionId: string) =>
    api.get(`/sports/matches/${eventTypeId}/${competitionId}`),
  getMarkets: (eventTypeId: string, eventId: string) =>
    api.get(`/sports/markets/${eventTypeId}/${eventId}`),
  getMarketsWithOdds: (eventTypeId: string, eventId: string) =>
    api.get(`/sports/markets-with-odds/${eventTypeId}/${eventId}`),
  getBookmakersList: (eventTypeId: string, eventId: string) =>
    api.get(`/sports/bookmakers-list/${eventTypeId}/${eventId}`),
  getOddsResults: (eventTypeId: string, marketIds: string[]) =>
    api.post("/sports/results/odds", { eventTypeId, marketIds }),
  getBookmakersResults: (eventTypeId: string, marketIds: string[]) =>
    api.post("/sports/results/bookmakers", { eventTypeId, marketIds }),
  getSessionsResults: (eventTypeId: string, marketIds: string[]) =>
    api.post("/sports/results/sessions", { eventTypeId, marketIds }),
  getFancyResults: (eventTypeId: string, marketIds: string[]) =>
    api.post("/sports/results/fancy", { eventTypeId, marketIds }),
  getMatchDetails: (eventTypeId: string, eventId: string) =>
    api.post(`/sports/matchDetails/${eventTypeId}/${eventId}`),
};
