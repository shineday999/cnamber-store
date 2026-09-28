import { defineMiddleware } from 'astro:middleware';
import { defaultLocale, isLocale, locales, localeFromPath, type Locale } from './i18n/config';
import { loadMessages } from './i18n/loader';
import { getAdminFromContext } from './lib/auth';

const LOCALE_COOKIE = 'cnamber_locale';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;

  // 1. Locale detection
  let locale = localeFromPath(url.pathname);

  if (!locale) {
    const cookieLocale = context.cookies.get(LOCALE_COOKIE)?.value;
    if (isLocale(cookieLocale)) {
      locale = cookieLocale;
    }
  }

  if (!locale) {
    const acceptLanguage = context.request.headers.get('accept-language') ?? '';
    locale = detectLocaleFromHeader(acceptLanguage);
  }

  if (!locale) {
    locale = defaultLocale;
  }

  context.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
  });

  const messages = await loadMessages(locale);
  context.locals.locale = locale;
  context.locals.messages = messages;

  // 2. Admin auth check (only for /admin/* paths)
  if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login')) {
    const admin = getAdminFromContext(context);
    if (!admin) {
      return new Response(
        'Unauthorized — please configure Cloudflare Access (see docs/PHASE1-ACCESS-SETUP.md).\n' +
          'For local dev, set cookie: cnamber_dev_admin=' +
          Buffer.from('shineday999@gmail.com').toString('base64'),
        { status: 401, headers: { 'Content-Type': 'text/plain' } },
      );
    }
    context.locals.admin = admin;
  }

  return next();
});

function detectLocaleFromHeader(header: string): Locale | null {
  const parts = header
    .split(',')
    .map((p) => {
      const [tag, qPart] = p.trim().split(';');
      const q = qPart?.startsWith('q=') ? parseFloat(qPart.slice(2)) : 1;
      return { tag: (tag ?? '').toLowerCase(), q: Number.isNaN(q) ? 1 : q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    if (tag === 'zh-hans' || tag === 'zh-cn' || tag.startsWith('zh-cn')) return 'zh-Hans';
    if (tag === 'zh-hant' || tag === 'zh-tw' || tag === 'zh-hk') return 'zh-Hans';
    if (tag === 'ms-my') return 'ms-MY';
    if (tag === 'id' || tag === 'id-id') return 'id-ID';
    if (tag === 'en' || tag.startsWith('en-')) return 'en';
  }
  return null;
}

void locales;