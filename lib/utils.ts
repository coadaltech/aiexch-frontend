import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return "TBD";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "TBD";
    
    return date.toISOString().replace('T', ' ').slice(0, 19);
  } catch {
    return "TBD";
  }
}
