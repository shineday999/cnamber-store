type Messages = Record<string, unknown>;
export type Translator = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export function createT(messages: Messages): Translator {
  return function t(key: string, params?: Record<string, string | number>): string {
    const parts = key.split('.');
    let cur: unknown = messages;
    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        if (typeof console !== 'undefined') {
          console.warn(`[i18n] missing key: ${key}`);
        }
        return key;
      }
    }

    if (typeof cur !== 'string') return key;

    if (!params) return cur;

    return (cur as string).replace(/\{(\w+)\}/g, (match, name) => {
      if (name in (params as Record<string, string | number>)) {
        return String((params as Record<string, string | number>)[name]);
      }
      return match;
    });
  };
}