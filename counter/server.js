// Aer0Knight ana sayfası için ziyaretçi sayacı. Bağımlılık yok, Railway'de çalışır.
//   POST /hit    sayıyı 1 artırır, { count } döner
//   GET  /count  sayıyı okur, { count } döner
//   GET  /health Railway sağlık kontrolü
// Sayı DATA_DIR/count.json içinde durur. IP adresi diske yazılmaz.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8080;
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'count.json');
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://aer0knight0.github.io')
  .split(',').map(s => s.trim()).filter(Boolean);
const RATE_MAX = 20;          // bir IP'den dakikada en fazla bu kadar /hit
const RATE_WINDOW = 60_000;

fs.mkdirSync(DATA_DIR, { recursive: true });
let count = 0;
try { count = Number(JSON.parse(fs.readFileSync(FILE, 'utf8')).count) || 0; } catch (e) {}

// Yazmalar sıraya girer: aynı anda iki istek dosyayı bozmasın, yarım yazılan dosya kalmasın.
let writing = Promise.resolve();
function save() {
  const snapshot = JSON.stringify({ count, updated: new Date().toISOString() });
  writing = writing.then(() => fs.promises.writeFile(FILE + '.tmp', snapshot)
    .then(() => fs.promises.rename(FILE + '.tmp', FILE))
    .catch(e => console.error('save failed:', e.message)));
}

const hits = new Map(); // ip -> { n, reset }, sadece bellekte
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.reset < now) hits.delete(k); }, RATE_WINDOW).unref();
function limited(ip) {
  const now = Date.now();
  let h = hits.get(ip);
  if (!h || h.reset < now) { h = { n: 0, reset: now + RATE_WINDOW }; hits.set(ip, h); }
  return ++h.n > RATE_MAX;
}

// Gerçek ziyaretçi IP'si X-Forwarded-For'un İLK (en soldaki) değeridir. Railway edge'i
// istemcinin gönderdiği X-Forwarded-For'u siler ve kendisi yazar, yani bu değer sahte olamaz.
// SON değeri almaya kalkma: o Railway'in kendi iç/CDN IP'si olur, bütün ziyaretçiler tek IP
// sayılır ve dakikada 20 sınırı tüm siteye uygulanır.
// Kaynak: https://station.railway.com/questions/which-header-should-i-rely-on-for-real-c-d78a6f96
function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
}

function send(res, status, body, origin) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
  if (origin) Object.assign(headers, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
  });
  res.writeHead(status, headers);
  res.end(body == null ? '' : JSON.stringify(body));
}

http.createServer((req, res) => {
  const origin = ORIGINS.includes(req.headers.origin) ? req.headers.origin : null;
  const url = req.url.split('?')[0].replace(/\/+$/, '') || '/';

  if (req.method === 'OPTIONS') return send(res, origin ? 204 : 403, null, origin);
  if (req.method === 'GET' && url === '/health') return send(res, 200, { ok: true });
  // GEÇİCİ: Railway'in sahte X-Forwarded-For'u silip silmediğini test etmek için. Testten sonra kaldırılacak.
  if (req.method === 'GET' && url === '/__ipcheck') return send(res, 200, { ip: clientIp(req), xff: req.headers['x-forwarded-for'] || null });
  if (req.method === 'GET' && url === '/count') return send(res, 200, { count }, origin);
  if (req.method === 'POST' && url === '/hit') {
    if (!origin) return send(res, 403, { error: 'origin' });
    if (limited(clientIp(req))) return send(res, 429, { count }, origin);
    count++;
    save();
    return send(res, 200, { count }, origin);
  }
  send(res, 404, { error: 'not found' }, origin);
}).listen(PORT, () => console.log(`counter on :${PORT}, count=${count}, data=${FILE}, origins=${ORIGINS.join(' ')}`));
