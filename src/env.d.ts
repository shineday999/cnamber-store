/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    locale: 'zh-Hans' | 'en' | 'ms-MY' | 'id-ID';
    messages: Record<string, unknown>;
  }
}