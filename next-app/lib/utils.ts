import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatCurrency(value: number) {
  return `${formatNumber(value)} đ`;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MONTH_YEAR_PATTERN = /^(\d{2})[-/](\d{2})[-/](\d{4})$/;

export function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (value === null || value === undefined || value === "") return null;

  const text = String(value).trim();
  const dateOnly = text.match(DATE_ONLY_PATTERN);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  const dayMonthYear = text.match(DAY_MONTH_YEAR_PATTERN);
  if (dayMonthYear) {
    return new Date(Number(dayMonthYear[3]), Number(dayMonthYear[2]) - 1, Number(dayMonthYear[1]));
  }

  if (typeof value === "number" || /^\d+$/.test(text)) {
    const timestamp = Number(value);
    return new Date(timestamp < 100000000000 ? timestamp * 1000 : timestamp);
  }

  return new Date(text);
}

const padDatePart = (value: number) => String(value).padStart(2, "0");

export function formatDate(value: unknown, fallback = "-") {
  const date = parseDateValue(value);
  if (!date || Number.isNaN(date.getTime())) return fallback;
  return `${padDatePart(date.getDate())}-${padDatePart(date.getMonth() + 1)}-${date.getFullYear()}`;
}

export function formatDateTime(value: unknown, fallback = "-") {
  const date = parseDateValue(value);
  if (!date || Number.isNaN(date.getTime())) return fallback;
  return `${formatDate(date, fallback)} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

export function dateInputValue(value: unknown) {
  const date = parseDateValue(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}
