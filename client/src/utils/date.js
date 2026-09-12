const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MONTH_YEAR_PATTERN = /^(\d{2})[-/](\d{2})[-/](\d{4})$/;

export const parseDateValue = (value) => {
  if (value instanceof Date) return value;
  if (value === null || value === undefined || value === '') return null;

  const text = String(value).trim();
  if (!text) return null;

  const dateOnly = text.match(DATE_ONLY_PATTERN);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  const dayMonthYear = text.match(DAY_MONTH_YEAR_PATTERN);
  if (dayMonthYear) {
    return new Date(Number(dayMonthYear[3]), Number(dayMonthYear[2]) - 1, Number(dayMonthYear[1]));
  }

  if (typeof value === 'number' || /^\d+$/.test(text)) {
    const timestamp = Number(value);
    return new Date(timestamp < 100000000000 ? timestamp * 1000 : timestamp);
  }

  return new Date(text);
};

const pad = (value) => String(value).padStart(2, '0');

export const formatDate = (value, fallback = '—') => {
  const date = parseDateValue(value);
  if (!date || Number.isNaN(date.getTime())) return fallback;
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
};

export const formatDateTime = (value, fallback = '—') => {
  const date = parseDateValue(value);
  if (!date || Number.isNaN(date.getTime())) return fallback;
  return `${formatDate(date, fallback)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const dateInputValue = (value) => {
  const date = parseDateValue(value);
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
