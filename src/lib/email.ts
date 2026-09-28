// Email integration — Resend API
// Phase 5+ 接入:wrangler secret put RESEND_API_KEY
// 沒有 API key 時 graceful fallback(只 console.log,不中斷訂單流程)

interface EmailEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

const DEFAULT_FROM = 'OxHorseCraft <hello@cnamber.ccwu.cc>';

export async function sendEmail(env: EmailEnv, params: EmailParams): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!env.RESEND_API_KEY) {
    // Phase 5 簡化:沒有 API key 時只 log
    console.warn('[email] RESEND_API_KEY not set, skipping send');
    console.log(`[email] To: ${params.to}`);
    console.log(`[email] Subject: ${params.subject}`);
    console.log(`[email] Body: ${params.text ?? params.html.slice(0, 200)}`);
    return { ok: false, error: 'no_api_key' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM ?? DEFAULT_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[email] Resend error ${res.status}: ${body}`);
    return { ok: false, error: `resend_${res.status}` };
  };
  const data = (await res.json()) as { id: string };
  return { ok: true, id: data.id };
}

export function emailEnvFromContext(ctx: { locals: { runtime?: { env?: unknown } } }): EmailEnv {
  const env = ctx.locals.runtime?.env;
  return (env as EmailEnv | undefined) ?? {};
}

// 預製 email templates
export function orderConfirmationEmail(orderId: string, customerName: string, itemsSummary: string): { subject: string; html: string; text: string } {
  const subject = `預訂單確認 #${orderId}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1A2E1A; font-family: Georgia, serif;">感謝您的預訂</h2>
      <p>${customerName} 您好,</p>
      <p>我們已收到您的預訂單 <strong>${orderId}</strong>。</p>
      <p>${itemsSummary}</p>
      <p>客服將在 1-2 個工作天內與您聯繫,確認運費與付款方式。</p>
      <hr style="border: none; border-top: 1px solid #DCE5DC; margin: 24px 0;" />
      <p style="color: #8A938A; font-size: 12px;">
        OxHorseCraft · 森林系手作品牌 · hello@cnamber.ccwu.cc
      </p>
    </div>
  `;
  const text = `感謝您的預訂 #${orderId}。${customerName} 您好,我們已收到您的預訂單。客服將在 1-2 個工作天內與您聯繫。`;
  return { subject, html, text };
}

export function contactNotificationEmail(name: string, email: string, message: string): { subject: string; html: string; text: string } {
  const subject = `新聯絡表單:${name}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1A2E1A;">新訊息</h2>
      <p><strong>${name}</strong> (${email}) 留言:</p>
      <blockquote style="border-left: 3px solid #C9925B; padding-left: 12px; color: #4A5748;">
        ${message.replace(/\n/g, '<br>')}
      </blockquote>
      <p style="color: #8A938A; font-size: 12px;">Reply directly to this email to respond.</p>
    </div>
  `;
  const text = `新訊息 from ${name} (${email}): ${message}`;
  return { subject, html, text };
}