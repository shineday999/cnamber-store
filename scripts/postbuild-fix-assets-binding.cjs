// Post-build: prepare dist for Cloudflare Pages deployment.
//
// Astro 7 + @astrojs/cloudflare 14 outputs:
//   dist/server/entry.mjs       — Worker-style entry { fetch: handle }
//   dist/server/wrangler.json   — Worker config (auto-generated)
//
// Pages config validation rejects:
//   - Worker-only fields (main, rules, previews, jsx_*, dev, no_bundle, ...)
//   - The 'assets' field (Pages has internal static asset serving)
//
// Bindings (kv_namespaces, d1_databases, r2_buckets) are read from
// project-root wrangler.toml by wrangler pages deploy, so we strip them
// from the auto-generated wrangler.json to avoid conflicts.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'dist');
const wranglerJsonPath = path.join(root, 'server', 'wrangler.json');

const STRIP_KEYS = [
  // Worker-only fields
  'main', 'rules', 'previews', 'jsx_factory', 'jsx_fragment',
  'triggers', 'exports', 'cloudchamber', 'connect',
  'vectorize', 'ai_search_namespaces', 'ai_search', 'agent_memory',
  'hyperdrive', 'mtls_certificates', 'pipelines', 'k2',
  'secrets_store_secrets', 'artifacts', 'unsafe_hello_world',
  'flagship', 'worker_loaders', 'ratelimits', 'vpc_services',
  'vpc_networks', 'logfwdr', 'python_modules', 'dev',
  'no_bundle', 'definedEnvironments', 'configPath', 'userConfigPath',
  'assets', 'topLevelName',
  // Binding blocks (project-root wrangler.toml provides these)
  'kv_namespaces', 'd1_databases', 'r2_buckets',
  'durable_objects', 'workflows', 'migrations',
  'send_email', 'queues', 'services',
  'analytics_engine_datasets', 'dispatch_namespaces',
];

if (fs.existsSync(wranglerJsonPath)) {
  const cfg = JSON.parse(fs.readFileSync(wranglerJsonPath, 'utf8'));
  const before = Object.keys(cfg).length;
  let stripped = 0;
  for (const k of STRIP_KEYS) {
    if (k in cfg) {
      delete cfg[k];
      stripped++;
    }
  }
  fs.writeFileSync(wranglerJsonPath, JSON.stringify(cfg));
  console.log(`[postbuild] ✓ stripped ${stripped} keys from wrangler.json (${before} → ${Object.keys(cfg).length})`);
  console.log(`[postbuild]   remaining: ${Object.keys(cfg).join(', ')}`);
}

// Write dist/_routes.json — Pages routes config
const routesJsonPath = path.join(root, '_routes.json');
const routesConfig = {
  version: 1,
  include: ['/*'],
  exclude: [
    '/_astro/*',
    '/images/*',
    '/favicon.ico',
    '/favicon.svg',
  ],
};
fs.writeFileSync(routesJsonPath, JSON.stringify(routesConfig, null, 2));
console.log(`[postbuild] ✓ wrote ${routesJsonPath}`);

// Write dist/_worker.js — Pages root worker (re-exports entry.mjs)
const workerPath = path.join(root, '_worker.js');
fs.writeFileSync(workerPath, 'export { default } from "./server/entry.mjs";\n');
console.log(`[postbuild] ✓ wrote ${workerPath}`);

console.log('[postbuild] done.');
