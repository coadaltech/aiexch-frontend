import axios from "axios";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── First-party cookie helpers ────────────────────────────────────────────────
// Set on the frontend's own domain so Safari accepts them as first-party.

export function getAuthCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setAuthCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  // No Max-Age or Expires → session cookie → cleared when browser closes
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${secure}`;
}

export function clearAuthCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0`;
}

export function storeTokens(accessToken: string, refreshToken?: string) {
  setAuthCookie("accessToken", accessToken);
  if (refreshToken) setAuthCookie("refreshToken", refreshToken);
}

export function clearTokens() {
  clearAuthCookie("accessToken");
  clearAuthCookie("refreshToken");
}

/**
 * Proactive token refresh — call this on a timer before the access token expires.
 * Uses a plain axios instance (no interceptors) to avoid infinite loops.
 */
export async function proactiveRefresh(): Promise<boolean> {
  const storedRefreshToken = getAuthCookie("refreshToken");
  if (!storedRefreshToken) return false;
  try {
    const response = await axios
      .create({ baseURL: API_BASE_URL, withCredentials: true })
      .post("/auth/refresh", { refreshToken: storedRefreshToken });
    if (response.data.success && response.data.accessToken) {
      storeTokens(response.data.accessToken, response.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    // Network error or server error — do NOT clear tokens, just return false
    return false;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach domain header + Authorization header on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.headers["x-whitelabel-domain"] =
      process.env.NEXT_PUBLIC_WHITELABEL_DOMAIN || window.location.host;
    const token = getAuthCookie("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Auto-store tokens returned in any response body (login, refresh, etc.)
    if (typeof window !== "undefined") {
      const { accessToken, refreshToken } = response.data || {};
      if (accessToken) storeTokens(accessToken, refreshToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check for database not found error
    if (
      error.response?.status === 503 &&
      error.response?.data?.error === "DATABASE_NOT_FOUND"
    ) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("database-not-found"));
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const storedRefreshToken = getAuthCookie("refreshToken");
        const refreshResponse = await axios
          .create({ baseURL: API_BASE_URL, withCredentials: true })
          .post("/auth/refresh", storedRefreshToken ? { refreshToken: storedRefreshToken } : undefined);

        if (refreshResponse.data.success) {
          // storeTokens is called automatically by the response interceptor above
          // but since this uses a raw axios instance, store manually
          const { accessToken, refreshToken } = refreshResponse.data;
          if (accessToken) storeTokens(accessToken, refreshToken);
          return api(originalRequest);
        }
      } catch (refreshError: any) {
        // Only clear tokens on actual auth failure (401/403).
        // Network errors, timeouts, 5xx should NOT log the user out.
        const status = refreshError?.response?.status;
        if (typeof window !== "undefined" && (status === 401 || status === 403)) {
          sessionStorage.removeItem("user");
          localStorage.removeItem("loginSessionKey");
          clearTokens();
          // Notify AuthContext so it can update state and redirect
          window.dispatchEvent(new CustomEvent("auth-session-expired"));
        }
      }
    }

    return Promise.reject(error);
  }
);

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  otp: string;
  whitelabelId?: number | null;
  domain?: string;
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
    id: string;
    username: string;
    email: string;
    membership: string;
    balance: string;
    groupId?: number | null;
    currencyId?: string | null;
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

export const ownerApi = {
  // Banners
  getBanners: () => api.get("/owner/banners"),
  createBanner: (data: any) =>
    api.post("/owner/banners", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateBanner: (id: string, data: any) =>
    api.put(`/owner/banners/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteBanner: (id: string) => api.delete(`/owner/banners/${id}`),

  // Whitelabels
  getWhitelabels: () => api.get("/owner/whitelabels"),
  createWhitelabel: (data: any) => api.post("/owner/whitelabels", data),
  updateWhitelabel: (id: string, data: any) =>
    api.put(`/owner/whitelabels/${id}`, data),
  deleteWhitelabel: (id: string) => api.delete(`/owner/whitelabels/${id}`),

  // Promotions
  getPromotions: () => api.get("/owner/promotions"),
  createPromotion: (data: any) =>
    api.post("/owner/promotions", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updatePromotion: (id: string, data: any) =>
    api.put(`/owner/promotions/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deletePromotion: (id: string) => api.delete(`/owner/promotions/${id}`),

  // Users
  getUsers: () => api.get("/owner/users"),
  getUserCreatedUsers: (id: string) => api.get(`/owner/users/${id}/created-users`),
  getUserLedger: (id: string) => api.get(`/owner/users/${id}/ledger`),
  createUser: (data: any) => api.post("/owner/users", data),
  updateUser: (id: string, data: any) => api.put(`/owner/users/${id}`, data),

  // Popups
  getPopups: () => api.get("/owner/popups"),
  createPopup: (data: any) =>
    api.post("/owner/popups", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updatePopup: (id: string, data: any) =>
    api.put(`/owner/popups/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deletePopup: (id: string) => api.delete(`/owner/popups/${id}`),

  // Promocodes
  getPromocodes: () => api.get("/owner/promocodes"),
  createPromocode: (data: any) => api.post("/owner/promocodes", data),
  updatePromocode: (id: string, data: any) =>
    api.put(`/owner/promocodes/${id}`, data),
  deletePromocode: (id: string) => api.delete(`/owner/promocodes/${id}`),

  // Vouchers
  getVouchers: () => api.get("/owner/vouchers"),
  createVoucher: (data: any) => api.post("/owner/vouchers", data),
  updateVoucher: (id: string, data: any) =>
    api.put(`/owner/vouchers/${id}`, data),

  // KYC
  getKycDocuments: () => api.get("/owner/kyc"),
  updateKycStatus: (id: string, data: any) => api.put(`/owner/kyc/${id}`, data),

  // Settings
  getSettings: () => api.get("/owner/settings"),
  updateSettings: (data: any) => api.put("/owner/settings", data),

  // Live Markets
  getLiveMarketsDetails: () => api.get("/owner/live-markets/details"),
  getLiveMarketsSummary: () => api.get("/owner/live-markets/summary"),
  getLiveMarketsPnl: () => api.get("/owner/live-markets/pnl"),
  getLiveMarketsBets: (matchId: string | number) =>
    api.get(`/owner/live-markets/bets?matchId=${matchId}`),
  getLiveMarketsBetLog: (transactionId: string) =>
    api.get(`/owner/live-markets/bets/log?transactionId=${encodeURIComponent(transactionId)}`),

  // Notifications
  getNotifications: () => api.get("/owner/notifications"),
  createNotification: (data: any) => api.post("/owner/notifications", data),
  updateNotification: (id: string, data: any) =>
    api.put(`/owner/notifications/${id}`, data),
  deleteNotification: (id: string) => api.delete(`/owner/notifications/${id}`),

  // QR Codes
  getQrCodes: () => api.get("/owner/qrcodes"),
  createQrCode: (data: any) =>
    api.post("/owner/qrcodes", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateQrCode: (id: string, data: any) =>
    api.put(`/owner/qrcodes/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteQrCode: (id: string) => api.delete(`/owner/qrcodes/${id}`),

  // Sports Games
  getSportsGames: () => api.get("/owner/sports-games"),
  createSportsGame: (data: any) => api.post("/owner/sports-games", data),
  updateSportsGame: (id: string, data: any) =>
    api.put(`/owner/sports-games/${id}`, data),
  deleteSportsGame: (id: string) => api.delete(`/owner/sports-games/${id}`),

  // Sync all competitions from external API
  syncCompetitions: () => api.post("/owner/sports-games/sync-competitions"),

  // Bulk reorder sports (drag-and-drop)
  reorderSports: (sportsList: Array<{ sportId: number; sortOrder: number }>) =>
    api.put("/owner/sports-games/reorder", { sports: sportsList }),

  // Competitions (per-sport, role + whitelabel aware)
  getCompetitions: (sportId: string) =>
    api.get(`/owner/sports-games/competitions/${sportId}`),
  updateCompetitionStatus: (sportId: string, data: { competitions: Array<{ id: string; isActive: boolean }> }) =>
    api.post(`/owner/sports-games/competitions/${sportId}/update-status`, data),

  // Events (per-competition)
  getCompetitionEvents: (competitionId: string) =>
    api.get(`/owner/sports-games/events/${competitionId}`),
  updateEventStatus: (competitionId: string, data: { events: Array<{ id: string; isActive: boolean }> }) =>
    api.post(`/owner/sports-games/events/${competitionId}/update-status`, data),

  // Home Sections
  getHomeSections: () => api.get("/owner/home-sections"),
  createHomeSection: (data: any) => api.post("/owner/home-sections", data),
  updateHomeSection: (id: string, data: any) =>
    api.put(`/owner/home-sections/${id}`, data),
  deleteHomeSection: (id: string) => api.delete(`/owner/home-sections/${id}`),

  // Section Games
  getSectionGames: (sectionId: string) =>
    api.get(`/owner/home-sections/${sectionId}/games`),
  createSectionGame: (sectionId: string, data: any) =>
    api.post(`/owner/home-sections/${sectionId}/games`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateSectionGame: (gameId: string, data: any) => {
    // Extract body if data is wrapped in an object
    const actualData = data?.body || data;

    return api.put(`/owner/home-sections/games/${gameId}`, actualData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteSectionGame: (gameId: string) =>
    api.delete(`/owner/home-sections/games/${gameId}`),

  // Withdrawal Methods
  getWithdrawalMethods: () => api.get("/owner/withdrawal-methods"),
  createWithdrawalMethod: (data: any) =>
    api.post("/owner/withdrawal-methods", data),
  updateWithdrawalMethod: (id: string, data: any) =>
    api.put(`/owner/withdrawal-methods/${id}`, data),
  deleteWithdrawalMethod: (id: string) =>
    api.delete(`/owner/withdrawal-methods/${id}`),

  // Domains
  getDomains: () => api.get("/owner/domains"),
  createDomain: (data: any) => api.post("/owner/domains", data),
  updateDomain: (id: string, data: any) =>
    api.put(`/owner/domains/${id}`, data),
  deleteDomain: (id: string) => api.delete(`/owner/domains/${id}`),

  // Currencies (owner-only)
  getAvailableCurrencies: () => api.get("/owner/currencies/available"),
  getCurrencies: () => api.get("/owner/currencies"),
  createCurrency: (data: { code: string; name: string; countryName: string; value: string | number }) =>
    api.post("/owner/currencies", data),
  updateCurrency: (id: string, data: { value: string | number }) =>
    api.put(`/owner/currencies/${id}`, data),
  getCurrencyHistory: (id: string) => api.get(`/owner/currencies/${id}/history`),

  // Market Management
  searchEvents: (q: string) =>
    api.get(`/owner/market-management/events/search?q=${encodeURIComponent(q)}`),
  getEventSettings: (eventId: string) =>
    api.get(`/owner/market-management/events/${eventId}`),
  updateEventSettings: (eventId: string, data: any) =>
    api.put(`/owner/market-management/events/${eventId}`, data),
  getMarketsByEvent: (eventId?: string) =>
    api.get(`/owner/market-management/markets${eventId ? `?eventId=${eventId}` : ""}`),
  getMarketSettings: (marketId: string) =>
    api.get(`/owner/market-management/markets/${marketId}`),
  updateMarketSettings: (marketId: string, data: any) =>
    api.put(`/owner/market-management/markets/${marketId}`, data),
  listCustomMarkets: (params?: { search?: string; status?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.status) query.append("status", params.status);
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.offset) query.append("offset", String(params.offset));
    return api.get(`/owner/market-management/custom-markets?${query}`);
  },
  createCustomMarket: (data: any) =>
    api.post("/owner/market-management/custom-markets", data),
  updateCustomMarketDetails: (marketId: string, data: any) =>
    api.put(`/owner/market-management/custom-markets/${marketId}`, data),
  updateCustomOdds: (marketId: string, data: any) =>
    api.put(`/owner/market-management/custom-markets/${marketId}/odds`, data),
  getCustomMarketDetails: (marketId: string) =>
    api.get(`/owner/market-management/custom-markets/${marketId}`),
  deleteCustomMarket: (marketId: string) =>
    api.delete(`/owner/market-management/custom-markets/${marketId}`),
  getOddsHistory: (params: { marketId?: string; eventId?: string; from?: string; to?: string; limit?: string }) => {
    const query = new URLSearchParams();
    if (params.marketId) query.append("marketId", params.marketId);
    if (params.eventId) query.append("eventId", params.eventId);
    if (params.from) query.append("from", params.from);
    if (params.to) query.append("to", params.to);
    if (params.limit) query.append("limit", params.limit);
    return api.get(`/owner/market-management/odds-history?${query}`);
  },

  // Account Statement (owner uses capital account, others use own ID)
  getAccountStatement: (params: { fromDate: string; toDate: string }) =>
    api.get(`/owner/account-statement?fromDate=${params.fromDate}&toDate=${params.toDate}`),
  getBetDetails: (marketId: string) =>
    api.get(`/owner/account-statement/bet-details?marketId=${encodeURIComponent(marketId)}`),

  // Matka Shifts
  getMatkaShifts: (date?: string) =>
    api.get(`/owner/matka/shifts${date ? `?date=${date}` : ""}`),
  createMatkaShift: (data: any) => api.post("/owner/matka/shifts", data),
  updateMatkaShift: (id: string, data: any) =>
    api.put(`/owner/matka/shifts/${id}`, data),
  deleteMatkaShift: (id: string) => api.delete(`/owner/matka/shifts/${id}`),
  setMatkaResult: (id: string, result: number) =>
    api.post(`/owner/matka/shifts/${id}/result`, { result }),
  getMatkaJantri: (shiftId: string) =>
    api.get(`/owner/matka/shifts/${shiftId}/jantri`),
  reorderMatkaShifts: (orders: { id: string; shiftOrder: number }[]) =>
    api.put("/owner/matka/shifts/reorder", { orders }),

  // Matka Live Prediction
  getMatkaLivePrediction: (shiftId: string) =>
    api.get(`/owner/matka/live-prediction/${shiftId}`),
  getMatkaLivePredictionWhitelabels: (shiftId: string, nums: number) =>
    api.get(`/owner/matka/live-prediction/${shiftId}/whitelabels?nums=${nums}`),
  getMatkaLivePredictionJantri: (shiftId: string, whitelabelId: string) =>
    api.get(
      `/owner/matka/live-prediction/${shiftId}/jantri?whitelabelId=${encodeURIComponent(
        whitelabelId
      )}`
    ),
  getMatkaAgentSale: (shiftId: string, nums: number) =>
    api.get(`/owner/matka/live-prediction/${shiftId}/agent-sale?nums=${nums}`),
  declareMatkaResult: (shiftId: string, result: number) =>
    api.post(`/owner/matka/live-prediction/${shiftId}/declare`, { result }),
  getMatkaDeclaredHistory: (limit = 50) =>
    api.get(`/owner/matka/live-prediction/declared-history?limit=${limit}`),
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
  getLedgerInfo: () => api.get("/betting/ledger-info"),

  // Account ledger statement
  getAccountStatement: (params: { fromDate: string; toDate: string }) =>
    api.get(`/profile/account-statement?fromDate=${params.fromDate}&toDate=${params.toDate}`),

  getBetDetails: (marketId: string, voucherId?: string | null) =>
    api.get(
      `/profile/account-statement/bet-details?marketId=${encodeURIComponent(marketId)}` +
      (voucherId ? `&voucherId=${encodeURIComponent(voucherId)}` : ""),
    ),

  // Stake settings
  getStakeSettings: () => api.get("/profile/stake-settings"),
  saveStakeSettings: (stakes: { label: string; value: number }[]) =>
    api.put("/profile/stake-settings", { stakes }),
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
  getWhitelabelInfo: () => api.get("/public/whitelabel-info"),
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
  getSeries: (eventTypeId: string) => api.get(`/api/sports/getAllSeries/${eventTypeId}`),
  getMatches: (eventTypeId: string, competitionId: string) =>
    api.get(`/sports/matches/${eventTypeId}/${competitionId}`),
  getMarkets: (eventTypeId: string, eventId: string) =>
    api.get(`/sports/markets/${eventTypeId}/${eventId}`),
  getMarketsWithOdds: (eventTypeId: string, eventId: string) =>
    api.get(`/sports/markets-with-odds/${eventTypeId}/${eventId}`),
  getBetCounts: (matchIds: string[]) =>
    api.get(`/sports/bet-counts?matchIds=${matchIds.join(",")}`),
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
  getNewResult: (eventId: string) =>
    api.get(`/sports/new-result/${eventId}`),
};

export const matkaApi = {
  getShifts: (date?: string) =>
    api.get(`/matka/shifts${date ? `?date=${date}` : ""}`),
  getShift: (id: string) => api.get(`/matka/shifts/${id}`),
  getJantri: (shiftId: string) => api.get(`/matka/shifts/${shiftId}/jantri`),
  placeBet: (data: {
    shiftId: string;
    bets: { number: string; numberType: number; amount: number }[];
    copyReferenceShiftId?: string;
    whitelabelId?: string;
  }) => api.post("/matka/place", data),
  getMyBets: (params?: { shiftId?: string; status?: "active" | "inactive" }) => {
    const qs = new URLSearchParams();
    if (params?.shiftId) qs.set("shiftId", params.shiftId);
    if (params?.status) qs.set("status", params.status);
    const query = qs.toString();
    return api.get(`/matka/my-bets${query ? `?${query}` : ""}`);
  },
  getTransaction: (id: string) => api.get(`/matka/transactions/${id}`),
  deleteTransaction: (id: string) => api.delete(`/matka/transactions/${id}`),
  updateTransaction: (id: string, data: { bets: { number: string; numberType: number; amount: number }[] }) =>
    api.put(`/matka/transactions/${id}`, data),
  getJantriConsolidated: (shiftId: string, date: string) =>
    api.get(`/matka/shifts/${shiftId}/jantri?date=${date}`),
  getUserLivePrediction: (shiftId: string) =>
    api.get(`/matka/live-prediction/${shiftId}`),
  getDeclaredHistory: (limit = 50) =>
    api.get(`/matka/declared-history?limit=${limit}`),
};
