import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(value: number): string {
  return "$" + Math.round(value).toLocaleString("en-US");
}

export function compact(value: number): string {
  if (value >= 1_000_000) return "$" + (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return "$" + Math.round(value / 1_000) + "k";
  return "$" + Math.round(value);
}
