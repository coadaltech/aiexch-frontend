import { format, formatInTimeZone } from "date-fns-tz";

export const formatToIST = (date: string | Date, formatStr: string = "dd MMM, hh:mm a") => {
  return formatInTimeZone(new Date(date), "Asia/Kolkata", formatStr);
};

export const formatToISTLong = (date: string | Date) => {
  return formatInTimeZone(new Date(date), "Asia/Kolkata", "dd MMM yyyy, hh:mm a");
};