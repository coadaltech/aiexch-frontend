import { LucideIcon } from "lucide-react";

export interface FAQ {
  question: string;
  answer: string;
}

export interface FAQCategory {
  category: string;
  questions: FAQ[];
}

export interface GameProvider {
  id: number;
  name: string;
  logo: string;
}

export interface GameCategory {
  id: string;
  name: string;
  icon: LucideIcon;
}

export interface Winner {
  name: string;
  game: string;
  amount: string;
}

export interface CasinoStat {
  icon: LucideIcon;
  label: string;
  value: string;
}

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export interface AuthFormData {
  email: string;
  password: string;
  referralCode: string;
  name: string;
  country: string;
  phone: string;
  agreeTerms: boolean;
  agreeMarketing: boolean;
}

export interface Game {
  id?: number;
  name: string;
  image: string;
  link: string;
  popular: boolean;
  hot: boolean;
  order: number;
  status: "active" | "not-active";
}

export type GameType = "casino" | "sports" | "live-casino";

export interface MenuItem {
  title: string;
  icon: LucideIcon;
  link?: string;
  subItems?: { title: string; link: string }[];
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "withdraw";
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string | React.ReactNode;
  description: string;
}

export interface MethodSelectionProps {
  isDeposit: boolean;
  selectedMethod: any;
  onMethodSelect: (method: any) => void;
}

export interface TransactionDetailsProps {
  isDeposit: boolean;
  method: any;
  amount: string;
  address: string;
  onAmountChange: (amount: string) => void;
  onAddressChange: (address: string) => void;
  onNext: () => void;
}

export interface TransactionConfirmationProps {
  isDeposit: boolean;
  method: any;
  amount: string;
  address: string;
  onConfirm: (proofImage: File) => void;
}

export interface MaintenancePageProps {
  message?: string;
}

export interface MaintenanceWrapperProps {
  children: React.ReactNode;
}

export type Theme = "dark" | "light" | "system" | "admin-light";

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export interface HomeSection {
  id: number;
  title: string;
  subtitle?: string;
  type: GameType;
  order: number;
  status: "active" | "inactive";
}

export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  status: string;
  order: number;
}

export interface Promotion {
  id: number;
  title: string;
  description?: string;
  type: string;
  imageUrl: string;
  status: string;
}

export interface PromotionCardProps {
  promotion: Promotion;
}

export interface HomePromotionsSectionProps {
  promotions: Promotion[];
}

export interface DocumentUpload {
  id: string;
  name: string;
  type: string;
  status: "pending" | "uploaded" | "verified" | "rejected";
  file?: File;
  required: boolean;
}

export interface Bonus {
  id: string;
  title: string;
  description: string;
  type: "welcome" | "deposit" | "cashback" | "free_spins" | "loyalty";
  amount?: number;
  currency?: string;
  spins?: number;
  status: "available" | "claimed" | "expired" | "locked";
  expiryDate?: string;
  requirements?: string;
  progress?: number;
  maxProgress?: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: "bonus" | "transaction" | "security" | "system" | "promotion";
  createdAt: string;
  isRead: boolean | null;
  readAt: string | null;
  actionUrl?: string;
}

export interface UserData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  avatar?: string;
}

export interface PromoCode {
  id: number;
  code: string;
  title: string;
  description: string;
  type: "percentage" | "fixed" | "bonus";
  value: number;
  currency?: string;
  minDeposit?: number;
  maxBonus?: number;
  validTo: string;
  usageLimit?: number;
  usedCount?: number;
  status: "active" | "expired" | "used";
}
