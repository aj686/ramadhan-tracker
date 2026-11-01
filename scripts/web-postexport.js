const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');
const HEADERS_PATH = path.join(DIST_DIR, '_headers');
const SERVICE_WORKER_PATH = path.join(DIST_DIR, 'sw.js');
const HOST_PLACEHOLDER = '<ref>.supabase.co';

function fail(message) {
  console.error(`web-postexport: ${message}`);
  process.exit(1);
}

function requireEnv(name) {
  const value = (process.env[name] || '').trim();
  if (!value) fail(`${name} is not set.`);
  return value;
}

function readDistFile(filePath) {
  if (!fs.existsSync(filePath)) fail(`dist/${path.basename(filePath)} is missing.`);
  return fs.readFileSync(filePath, 'utf8');
}

function getSupabaseHost() {
  const supabaseUrl = requireEnv('EXPO_PUBLIC_SUPABASE_URL');
  requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return fail('EXPO_PUBLIC_SUPABASE_URL is not a valid URL.');
  }
}

function fillHeaders() {
  const host = getSupabaseHost();
  const headers = readDistFile(HEADERS_PATH);
  if (!headers.includes(HOST_PLACEHOLDER)) fail('dist/_headers has no Supabase host placeholder.');

  const filled = headers.split(HOST_PLACEHOLDER).join(host);
  if (filled.includes('<ref>')) fail('dist/_headers still has a placeholder.');
  fs.writeFileSync(HEADERS_PATH, filled);
}

function writeBuildId() {
  const html = readDistFile(INDEX_PATH);
  if (!html.includes('</head>')) fail('dist/index.html has no </head>.');

  const buildIdTag = `<meta name="build-id" content="${new Date().toISOString()}">`;
  fs.writeFileSync(INDEX_PATH, html.replace('</head>', `${buildIdTag}\n</head>`));
}

function verifyServiceWorker() {
  const html = readDistFile(INDEX_PATH);
  const entryBundle = html.match(/_expo\/static\/js\/web\/entry-[^"']+\.js/);
  if (!entryBundle) fail('dist/index.html does not reference an entry bundle.');

  const serviceWorker = readDistFile(SERVICE_WORKER_PATH);
  if (!serviceWorker.includes(entryBundle[0])) fail('dist/sw.js does not list the entry bundle.');
  if (!/Ionicons\.[^"']+\.ttf/.test(serviceWorker)) fail('dist/sw.js does not list the Ionicons font.');
  if (serviceWorker.includes('supabase')) fail('dist/sw.js must not reference Supabase.');
}

if (process.argv.includes('--verify')) {
  verifyServiceWorker();
} else {
  fillHeaders();
  writeBuildId();
}
