import { formatInTimeZone } from "date-fns-tz";
import { COUNTRY_TIMEZONE } from "./country-timezone";

const FALLBACK_TZ = "Asia/Kolkata";
const TZ_STORAGE_KEY = "userTimezone";

let runtimeTimezone: string | null = null;

const detectBrowserTimezone = (): string => {
  if (typeof Intl !== "undefined") {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) return tz;
    } catch {
      // fall through
    }
  }
  return FALLBACK_TZ;
};

const readPersistedTimezone = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TZ_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const getUserTimezone = (): string => {
  if (runtimeTimezone) return runtimeTimezone;
  const persisted = readPersistedTimezone();
  if (persisted) {
    runtimeTimezone = persisted;
    return persisted;
  }
  if (typeof window !== "undefined") {
    runtimeTimezone = detectBrowserTimezone();
    return runtimeTimezone;
  }
  return FALLBACK_TZ;
};

export const setUserTimezone = (tz: string | null | undefined) => {
  if (!tz) return;
  runtimeTimezone = tz;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(TZ_STORAGE_KEY, tz);
    } catch {
      // ignore
    }
  }
};

export const setUserCountry = (country: string | null | undefined) => {
  if (!country) return;
  const code = country.trim().toUpperCase();
  const tz = COUNTRY_TIMEZONE[code];
  if (tz) setUserTimezone(tz);
};

export const getUserLocale = (): string => {
  if (typeof Intl !== "undefined") {
    try {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      if (locale) return locale;
    } catch {
      // ignore
    }
  }
  return "en-GB";
};

export const formatLocal = (
  date: string | Date,
  formatStr: string = "dd MMM, hh:mm a",
) => formatInTimeZone(new Date(date), getUserTimezone(), formatStr);

export const formatLocalLong = (date: string | Date) =>
  formatInTimeZone(new Date(date), getUserTimezone(), "dd MMM yyyy, hh:mm a");

export const formatLocalDate = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
) =>
  new Date(date).toLocaleDateString(getUserLocale(), {
    timeZone: getUserTimezone(),
    ...options,
  });

export const formatLocalTime = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  },
) =>
  new Date(date).toLocaleTimeString(getUserLocale(), {
    timeZone: getUserTimezone(),
    ...options,
  });

export const formatLocalDateTime = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  },
) =>
  new Date(date).toLocaleString(getUserLocale(), {
    timeZone: getUserTimezone(),
    ...options,
  });

export const formatToIST = formatLocal;
export const formatToISTLong = formatLocalLong;
