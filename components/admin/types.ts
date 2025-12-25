import { Game, HomeSection } from "@/types";

export interface GameModalProps {
  open: boolean;
  onClose: () => void;
  game?: Game;
  onSave: (gameData: any) => void;
  isLoading?: boolean;
}

export interface HomeSectionModalProps {
  open: boolean;
  onClose: () => void;
  section?: HomeSection;
  onSave?: () => void;
}

export interface KYCDocument {
  id: string;
  user: string;
  email: string;
  documentType: string;
  status: string;
  submittedDate: string;
  documents: string[];
  notes?: string;
}

export interface KYCModalProps {
  open: boolean;
  onClose: () => void;
  kycData: KYCDocument;
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, notes: string) => void;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface Popup {
  id?: number;
  title: string;
  imageUrl: string;
  targetPage: string;
  status: string;
}

export interface PopupModalProps {
  open: boolean;
  onClose: () => void;
  popup?: Popup;
  onSave: () => void;
}

export interface Promocode {
  id?: number;
  code: string;
  type: string;
  value: string;
  usageLimit?: number;
  validFrom?: string;
  validTo?: string;
  status: string;
}

export interface PromoCodeModalProps {
  open: boolean;
  onClose: () => void;
  promocode?: Promocode;
  onSave: (promocode: Promocode) => void;
}

export interface Promotion {
  id?: number;
  title: string;
  description?: string;
  type: string;
  imageUrl: string | File ;
  status: string;
}

export interface PromotionModalProps {
  open: boolean;
  onClose: () => void;
  promotion?: Promotion;
  onSave: () => void;
}

export interface QrCodeModalProps {
  open: boolean;
  onClose: () => void;
  qrCode?: any;
}

export interface TransactionEditModalProps {
  open: boolean;
  onClose: () => void;
  transaction: any;
  onSave: (data: any) => void;
}

export interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: any) => void;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  role: string;
  membership: string;
  status: string;
  balance?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  password?: string;
}

export interface UserModalProps {
  open: boolean;
  onClose: () => void;
  user?: User;
  onSave: (user: User) => void;
  isUpdating?: boolean;
  isUpdatingProfile?: boolean;
}

export interface WhitelabelTheme {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  popover: string;
  popoverForeground: string;
  success: string;
  error: string;
  info: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  radius: string;
  fontFamily: string;
}

export interface Whitelabel {
  id?: number;
  name: string;
  domain: string;
  title?: string;
  description?: string;
  status: string;
  contactEmail?: string;
  logo?: string;
  favicon?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    telegram?: string;
    whatsapp?: string;
  };
  theme: WhitelabelTheme;
  layout?: {
    sidebarType: string;
    bannerType: string;
  };
  config?: {
    dbName: string;
    s3FolderName: string;
  };
  preferences?: {
    language: string;
    currency: string;
    timezone: string;
    dateFormat: string;
    enableLiveChat: boolean;
    enableNotifications: boolean;
    maintenanceMode: boolean;
  };
  permissions?: {
    casino: boolean;
    sports: boolean;
    liveCasino: boolean;
    promotions: boolean;
    transactions: boolean;
    userManagement: boolean;
    reports: boolean;
    settings: boolean;
  };
}

export interface WhitelabelModalProps {
  open: boolean;
  onClose: () => void;
  whitelabel?: Whitelabel;
  onSave: (whitelabel: Whitelabel) => void;
}

export interface WithdrawalMethodModalProps {
  open: boolean;
  onClose: () => void;
  method?: any;
}
