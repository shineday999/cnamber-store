/// <reference path="../.astro/types.d.ts" />

type RuntimeEnv = {
  DB: D1Database;
  PRODUCT_IMAGES: R2Bucket;
  I18N: KVNamespace;
  ASSETS: Fetcher;
};

declare namespace App {
  interface Locals {
    locale: 'zh-Hans' | 'en' | 'ms-MY' | 'id-ID';
    messages: Record<string, unknown>;
    admin?: {
      email: string;
      role: 'super_admin' | 'editor' | 'viewer';
      displayName?: string;
    };
    runtime?: {
      env: RuntimeEnv;
      ctx?: ExecutionContext;
    };
  }
}