import type { Locale } from './config';

type Messages = Record<string, unknown>;

const messagesImporters: Record<Locale, () => Promise<{ default: Messages }>> = {
  'zh-Hans': () => import('./messages/zh-Hans.json'),
  'en': () => import('./messages/en.json'),
  'ms-MY': () => import('./messages/ms-MY.json'),
  'id-ID': () => import('./messages/id-ID.json'),
};

const cache = new Map<Locale, Messages>();

export async function loadMessages(locale: Locale): Promise<Messages> {
  const cached = cache.get(locale);
  if (cached) return cached;

  const mod = await messagesImporters[locale]();
  const messages = mod.default ?? (mod as unknown as Messages);
  cache.set(locale, messages);
  return messages;
}