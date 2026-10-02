/// <reference path="../.astro/types.d.ts" />

type RuntimeEnv = {
  DB: D1Database;
  PRODUCT_IMAGES: R2Bucket;
  I18N: KVNamespace;
  ASSETS: Fetcher;
};

declare namespace App {
  interface Locals {
    siteSettings?: {
      siteName: Partial<Record<string, string>>;
      theme: Partial<Record<string, string>>;
      subTheme: Partial<Record<string, string>>;
      heroSubtitle: Partial<Record<string, string>>;
    };
    locale: "zh-Hans" | "en" | "ms-MY" | "id-ID";
    messages: Record<string, unknown>;
    admin?: {
      email: string;
      role: "super_admin" | "editor" | "viewer";
      displayName?: string;
    };
    runtime?: {
      env: RuntimeEnv;
      ctx?: ExecutionContext;
    };
  }
}
