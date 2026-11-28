// 訂閱流程回到頁面後顯示的提示(?subscribed=pending|confirmed|already|invalid)
export type NewsletterNotice = { ok: boolean; text: string };

const MESSAGES: Record<string, Record<string, NewsletterNotice>> = {
  "zh-Hans": {
    pending: {
      ok: true,
      text: "确认信已寄出,请到信箱点击确认连结,订阅才算完成(没收到请看垃圾邮件匣)。",
    },
    confirmed: { ok: true, text: "订阅已确认,谢谢!欢迎信已寄到您的信箱。" },
    already: { ok: true, text: "这个邮箱已经订阅了,谢谢!" },
    invalid: { ok: false, text: "确认连结无效或已过期,请重新订阅。" },
  },
  en: {
    pending: {
      ok: true,
      text: "Confirmation email sent. Please click the link in it to finish subscribing (check your spam folder if you don't see it).",
    },
    confirmed: {
      ok: true,
      text: "Subscription confirmed — thank you! A welcome email is on its way.",
    },
    already: { ok: true, text: "This email is already subscribed. Thank you!" },
    invalid: {
      ok: false,
      text: "This confirmation link is invalid or has expired. Please subscribe again.",
    },
  },
  "ms-MY": {
    pending: {
      ok: true,
      text: "E-mel pengesahan telah dihantar. Sila klik pautan di dalamnya untuk melengkapkan langganan (semak folder spam jika tidak nampak).",
    },
    confirmed: {
      ok: true,
      text: "Langganan disahkan — terima kasih! E-mel alu-aluan sedang dihantar.",
    },
    already: { ok: true, text: "E-mel ini sudah melanggan. Terima kasih!" },
    invalid: {
      ok: false,
      text: "Pautan pengesahan tidak sah atau telah tamat tempoh. Sila langgan semula.",
    },
  },
  "id-ID": {
    pending: {
      ok: true,
      text: "Email konfirmasi telah dikirim. Klik tautan di dalamnya untuk menyelesaikan langganan (periksa folder spam jika tidak terlihat).",
    },
    confirmed: {
      ok: true,
      text: "Langganan dikonfirmasi — terima kasih! Email sambutan sedang dikirim.",
    },
    already: { ok: true, text: "Email ini sudah berlangganan. Terima kasih!" },
    invalid: {
      ok: false,
      text: "Tautan konfirmasi tidak valid atau sudah kedaluwarsa. Silakan berlangganan lagi.",
    },
  },
};

export function getNewsletterNotice(
  status: string | null,
  locale: string,
): NewsletterNotice | null {
  if (!status) return null;
  const byLocale = MESSAGES[locale] ?? MESSAGES["zh-Hans"];
  return byLocale?.[status] ?? null;
}
