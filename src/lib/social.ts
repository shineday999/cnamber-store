// 社群連結（單一來源）：聯絡頁、更多頁、頁尾共用
export const XIAOHONGSHU_HANDLE = "一般牛马不一般";

// 小紅書個人主頁（國際版網域 rednote.com）。
// xsec_token / xsec_source 是平台要求的簽章參數；分享時附帶的個人追蹤參數（appuid、share_id 等）已拿掉。
// 若日後連結失效（token 過期）：到小紅書 App「分享個人主頁 → 複製連結」，只保留 xsec_token 與 xsec_source 兩個參數。
export const XIAOHONGSHU_URL =
  "https://www.rednote.com/user/profile/5b26583d4eacab3e7ef2a7aa?xsec_token=YBzrqnEiER73LkXvcTelX9WhJLQLnbh84d7c0mJI1uQRg=&xsec_source=app_share";

// 其他大陆常用平台：拿到网址后填在这里即可（空字串 = 还没设定，页尾与「更多」页不会显示）。
// 微信没有网址可链接，若要放公众号或客服微信，建议放在「写信」页。
export const DOUYIN_URL = "";
export const WEIBO_URL = "";

export const SOCIAL_LINKS: { labelKey: string; href: string }[] = [
  { labelKey: "footer.social_xiaohongshu", href: XIAOHONGSHU_URL },
  { labelKey: "footer.social_douyin", href: DOUYIN_URL },
  { labelKey: "footer.social_weibo", href: WEIBO_URL },
].filter((l) => l.href);
