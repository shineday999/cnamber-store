/**
 * Locale-aware price formatter with currency conversion.
 *
 * The D1 product_prices table stores raw currency (USD/MYR/IDR/AED/SAR).
 * On each frontend locale we display a familiar native currency:
 *   zh-Hans -> CNY (人民币 ¥)
 *   en      -> USD ($)
 *   ms-MY   -> MYR (RM)
 *   id-ID   -> IDR (Rp)
 *
 * Conversion uses hard-coded USD-base rates (refresh as needed).
 * Falls back to raw "CUR amount" if Intl.NumberFormat rejects the locale.
 */

const RATES_FROM_USD: Record<string, number> = {
  USD: 1,
  CNY: 7.2,
  MYR: 4.6,
  IDR: 15700,
  AED: 3.67,
  SAR: 3.75,
  TWD: 32,
};

const LOCALE_CURRENCY: Record<string, string> = {
  "zh-Hans": "CNY",
  zh: "CNY",
  en: "USD",
  "ms-MY": "MYR",
  ms: "MYR",
  "id-ID": "IDR",
  id: "IDR",
};

export function formatPrice(
  amountCents: number,
  fromCurrency: string,
  locale: string,
): string {
  const targetCurrency = LOCALE_CURRENCY[locale] ?? "USD";
  const fromRate = RATES_FROM_USD[fromCurrency] ?? 1;
  const targetRate = RATES_FROM_USD[targetCurrency] ?? 1;
  const amount = (amountCents / 100) * (targetRate / fromRate);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: targetCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${targetCurrency} ${Math.round(amount)}`;
  }
}
