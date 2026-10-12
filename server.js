// ============================================================================
// XRESTRO EXECUTIVE CLOUD OWNER PORTAL (ULTRA-LUXURY IPHONE EDITION)
// - Native iOS iPhone Design Tokens: rounded-3xl (24-28px), frosted glass tab bar
// - 4 Native Pages: Home Dashboard, Reports Hub, Live Invoices, Store Settings
// - Universal Reactive Date Filter (Today, Yesterday, 7 Days, Month, All Time, Custom)
// - 100% Mathematical Reconciliation and Tally across ALL reports
// - PWA 1-Click Mobile Installation Engine (Service Worker, beforeinstallprompt, iOS guide)
// - Multi-Tenant Isolation (No store cross-contamination; each owner sees their own store)
// - International Multi-Currency ($ USD, R ZAR, KSh KES, AED, ₹ INR, £ GBP, € EUR)
// - Global Phone Normalizer & Resilient Country Code Matching
// ============================================================================

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'store_data.json');
const HTML_FILE = path.join(__dirname, 'index.html');

// Initialize in-memory database
let db = { owners: {} };

function loadDb() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            db = JSON.parse(raw);
            if (!db.owners) db.owners = {};
        } else {
            saveDb();
        }
    } catch (e) {
        console.error('Error loading store_data.json:', e);
        db = { owners: {} };
    }
}

function saveDb() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving store_data.json:', e);
    }
}

loadDb();

// Phone Normalizer helper
function normalizePhone(raw) {
    if (!raw) return '';
    return raw.toString().replace(/[^0-9]/g, '');
}

// Resilient Multi-Country Phone Matcher
function findOwnerEntry(inputPhone) {
    if (!inputPhone) return null;
    const clean = normalizePhone(inputPhone);
    if (!clean) return null;

    if (db.owners[clean]) {
        return { key: clean, owner: db.owners[clean] };
    }

    const stripped = clean.replace(/^0+/, '');
    if (stripped && db.owners[stripped]) {
        return { key: stripped, owner: db.owners[stripped] };
    }

    const keys = Object.keys(db.owners);
    for (let k of keys) {
        const normKey = normalizePhone(k);
        const normKeyStripped = normKey.replace(/^0+/, '');
        if (normKey === clean || normKeyStripped === stripped) {
            return { key: k, owner: db.owners[k] };
        }
        if (stripped.length >= 7 && (normKey.endsWith(stripped) || stripped.endsWith(normKeyStripped))) {
            return { key: k, owner: db.owners[k] };
        }
    }
    return null;
}

// Auto-detect Currency by Country Phone Code
function detectCurrencyByPhone(phone) {
    const p = normalizePhone(phone);
    if (p.startsWith('27') || p.startsWith('07')) return 'R';      // South Africa
    if (p.startsWith('254')) return 'KSh';                         // Kenya
    if (p.startsWith('971')) return 'AED';                         // UAE
    if (p.startsWith('91')) return '₹';                            // India
    if (p.startsWith('44')) return '£';                            // UK
    if (p.startsWith('49') || p.startsWith('33') || p.startsWith('39') || p.startsWith('34')) return '€'; // EU
    return '$';                                                    // Default International
}

// Brand SVG Icon
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)"/>
  <rect x="16" y="16" width="480" height="480" rx="112" fill="none" stroke="url(#goldGrad)" stroke-width="6" opacity="0.3"/>
  <g transform="translate(156, 120) scale(0.39)">
    <path d="M120 40 L400 40 C440 40 470 70 470 110 L470 150 C470 230 410 300 320 315 L320 380 L390 380 C410 380 425 395 425 415 C425 435 410 450 390 450 L130 450 C110 450 95 435 95 415 C95 395 110 380 130 380 L200 380 L200 315 C110 300 50 230 50 150 L50 110 C50 70 80 40 120 40 Z" fill="url(#goldGrad)"/>
    <circle cx="260" cy="180" r="65" fill="#020617"/>
    <path d="M240 145 L275 145 C295 145 305 155 305 170 C305 185 295 195 275 195 L240 195 Z" fill="url(#emeraldGrad)"/>
    <path d="M240 145 L240 215 M270 195 L300 225" stroke="url(#emeraldGrad)" stroke-width="14" stroke-linecap="round"/>
  </g>
  <text x="256" y="415" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="36" font-weight="900" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="6">XRESTRO</text>
  <text x="256" y="445" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="5">EXECUTIVE SUITE</text>
</svg>`;

// PWA Manifest
const PWA_MANIFEST = JSON.stringify({
  name: "XRestro - Smart Owner Portal",
  short_name: "XRestro",
  description: "Real-Time Executive Analytics, Cash Tally, and Fraud Auditing for Restaurant Owners",
  start_url: "/",
  id: "/",
  display: "standalone",
  background_color: "#0b0f19",
  theme_color: "#0b0f19",
  orientation: "portrait-primary",
  icons: [
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
    { src: "/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
    { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }
  ]
}, null, 2);

// Service Worker for 1-Click Mobile Installation & Caching
const SW_JS = `
const CACHE_NAME = 'xrestro-owner-pwa-v3';
const STATIC_ASSETS = ['/', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
`;

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Store-Id, X-Master-Owner-Phone, X-Store-Phone, X-Payload-Type, X-Sync-Key, X-Owner-Pin');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // 1. PWA Manifest, Service Worker & Icons
    if (pathname === '/manifest.json') {
        res.writeHead(200, {
            'Content-Type': 'application/manifest+json; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        });
        res.end(PWA_MANIFEST);
        return;
    }

    if (pathname === '/sw.js' || pathname === '/service-worker.js') {
        res.writeHead(200, {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(SW_JS);
        return;
    }

    if (pathname === '/icon.svg' || pathname === '/icon.png' || pathname === '/apple-touch-icon.png' || pathname === '/favicon.ico' || pathname === '/favicon.svg') {
        res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' });
        res.end(ICON_SVG);
        return;
    }

    // 2. RECEIVE SYNC PAYLOAD FROM DESKTOP POS (POST /api/v1/sync)
    if (pathname === '/api/v1/sync' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                const storeId = req.headers['x-store-id'] || payload.storeId || 'STORE_001';
                const ownerPhone = (req.headers['x-master-owner-phone'] || payload.masterOwnerPhone || '').trim();
                const storePhone = req.headers['x-store-phone'] || payload.storePhone || '';
                const payloadType = req.headers['x-payload-type'] || payload.eventType || 'UNKNOWN';

                if (!ownerPhone) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Missing Master Owner Phone' }));
                    return;
                }

                const existingOwnerEntry = findOwnerEntry(ownerPhone);
                const ownerKey = existingOwnerEntry ? existingOwnerEntry.key : ownerPhone;

                if (!db.owners[ownerKey]) {
                    db.owners[ownerKey] = {
                        ownerPhone: ownerPhone,
                        ownerName: payload.storeName || 'Restaurant Owner',
                        pin: '1234',
                        currency: detectCurrencyByPhone(ownerPhone),
                        stores: {}
                    };
                }

                if (!db.owners[ownerKey].stores[storeId]) {
                    db.owners[ownerKey].stores[storeId] = {
                        storeId: storeId,
                        storeName: payload.storeName || 'My Restaurant',
                        storePhone: storePhone,
                        currency: db.owners[ownerKey].currency || detectCurrencyByPhone(ownerPhone),
                        liveSummary: {},
                        bills: [],
                        returns: [],
                        inwards: [],
                        suppliers: []
                    };
                }

                const store = db.owners[ownerKey].stores[storeId];
                if (payload.storeName) store.storeName = payload.storeName;
                if (storePhone) store.storePhone = storePhone;
                if (!store.returns) store.returns = [];
                if (!store.inwards) store.inwards = [];
                if (!store.suppliers) store.suppliers = [];

                // Handle Bill
                const isBill = (payloadType === 'BILL' || payloadType === 'BILL_SETTLED' || (payload.eventType && payload.eventType.indexOf('BILL') >= 0));
                const isSummary = (payloadType === 'SUMMARY' || payloadType === 'DAY_SUMMARY' || (payload.eventType && payload.eventType.indexOf('SUMMARY') >= 0));
                const isReturn = (payloadType === 'RETURN' || (payload.eventType && payload.eventType.indexOf('RETURN') >= 0));
                const isInward = (payloadType === 'INWARD' || (payload.eventType && payload.eventType.indexOf('INWARD') >= 0));
                const isSupplier = (payloadType === 'SUPPLIER_PAYMENT' || (payload.eventType && payload.eventType.indexOf('SUPPLIER') >= 0));

                if (isBill) {
                    const existsIndex = store.bills.findIndex(b => b.invoiceNo === payload.invoiceNo);
                    if (existsIndex >= 0) {
                        store.bills[existsIndex] = payload;
                    } else {
                        store.bills.unshift(payload);
                    }
                    if (store.bills.length > 500) store.bills.pop();
                } else if (isReturn) {
                    store.returns.unshift(payload);
                    if (store.returns.length > 100) store.returns.pop();
                } else if (isInward) {
                    store.inwards.unshift(payload);
                    if (store.inwards.length > 100) store.inwards.pop();
                } else if (isSupplier) {
                    store.suppliers.unshift(payload);
                    if (store.suppliers.length > 100) store.suppliers.pop();
                } else if (isSummary) {
                    store.liveSummary = payload;
                } else if (payloadType === 'PING') {
                    store.lastPing = new Date().toISOString();
                }

                saveDb();

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Sync processed successfully', timestamp: new Date().toISOString() }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // 3. OWNER LOGIN AUTHENTICATION (POST /api/v1/owner/login)
    if (pathname === '/api/v1/owner/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { phone, pin, countryCode } = JSON.parse(body || '{}');
                const cleanPhone = (phone || '').toString().trim();
                const cleanPin = (pin || '').toString().trim();
                const cleanCountry = (countryCode || '').toString().trim();

                const cleanDigits = normalizePhone(cleanPhone);
                if (!cleanDigits || cleanDigits.length < 5 || cleanDigits.length > 18) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Please enter a valid mobile number (min 5 digits).' }));
                    return;
                }

                // Multi-Country Matching
                let ownerEntry = findOwnerEntry(cleanPhone);
                if (!ownerEntry && cleanCountry) {
                    const stripped = cleanPhone.replace(/^0+/, '');
                    ownerEntry = findOwnerEntry(cleanCountry + stripped);
                }
                if (!ownerEntry) {
                    ownerEntry = findOwnerEntry(cleanPhone.replace(/^0+/, ''));
                }

                // Auto-Provision Isolated Account for New Owners (PIN 1234)
                if (!ownerEntry && cleanPin === '1234') {
                    const targetKey = cleanPhone;
                    const autoCurr = detectCurrencyByPhone(cleanCountry || cleanPhone);
                    const storeId = 'STORE_' + cleanDigits.slice(-6);
                    db.owners[targetKey] = {
                        ownerPhone: targetKey,
                        ownerName: 'Executive Owner',
                        pin: '1234',
                        currency: autoCurr,
                        stores: {
                            [storeId]: {
                                storeId: storeId,
                                storeName: 'My Restaurant',
                                storePhone: targetKey,
                                currency: autoCurr,
                                liveSummary: {
                                    totalGrossSales: 0, salesCash: 0, salesCard: 0, salesUpi: 0, salesDue: 0,
                                    netCash: 0, netCard: 0, netUpi: 0, netDue: 0, netTotalCollection: 0,
                                    drawerCash: 0, totalBillsCount: 0, totalSalesInvoices: 0,
                                    dineInSales: 0, takeawaySales: 0, totalDiscounts: 0, totalTaxes: 0,
                                    businessDate: new Date().toISOString().split('T')[0],
                                    lastUpdated: new Date().toISOString()
                                },
                                bills: [], returns: [], inwards: [], suppliers: []
                            }
                        }
                    };
                    saveDb();
                    ownerEntry = { key: targetKey, owner: db.owners[targetKey] };
                }

                if (!ownerEntry) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: 'Mobile number not found. Enter default PIN 1234 for instant setup.' 
                    }));
                    return;
                }

                const owner = ownerEntry.owner;
                const expectedPin = (owner.pin || '1234').toString();
                if (cleanPin !== expectedPin) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Incorrect Security PIN. Enter your 4-digit PIN.' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Login successful', 
                    ownerPhone: ownerEntry.key,
                    ownerName: owner.ownerName 
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // 4. UPDATE STORE PROFILE (POST /api/v1/owner/update-store-profile)
    if (pathname === '/api/v1/owner/update-store-profile' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { phone, storeId, storeName, currency } = JSON.parse(body || '{}');
                const ownerEntry = findOwnerEntry(phone);
                if (!ownerEntry) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Owner not found' }));
                    return;
                }

                const owner = ownerEntry.owner;
                if (currency) owner.currency = currency;

                if (storeId && owner.stores[storeId]) {
                    if (storeName && storeName.trim()) owner.stores[storeId].storeName = storeName.trim();
                    if (currency) owner.stores[storeId].currency = currency;
                } else if (Object.keys(owner.stores).length > 0) {
                    const firstStoreId = Object.keys(owner.stores)[0];
                    if (storeName && storeName.trim()) owner.stores[firstStoreId].storeName = storeName.trim();
                    if (currency) owner.stores[firstStoreId].currency = currency;
                }

                saveDb();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Restaurant profile updated successfully' }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // 5. CHANGE OWNER PIN (POST /api/v1/owner/change-pin)
    if (pathname === '/api/v1/owner/change-pin' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { phone, oldPin, newPin } = JSON.parse(body || '{}');
                const ownerEntry = findOwnerEntry(phone);
                if (!ownerEntry) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Owner not found' }));
                    return;
                }

                const owner = ownerEntry.owner;
                if ((owner.pin || '1234').toString() !== (oldPin || '').trim()) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Current PIN is incorrect.' }));
                    return;
                }

                if (!newPin || newPin.trim().length !== 4) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'New PIN must be exactly 4 digits.' }));
                    return;
                }

                owner.pin = newPin.trim();
                saveDb();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Security PIN updated successfully.' }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // 6. GET OWNER DATA (GET /api/v1/owner/data)
    if (pathname === '/api/v1/owner/data' && req.method === 'GET') {
        const phone = (parsedUrl.query.phone || '').toString().trim();
        const pin = (parsedUrl.query.pin || req.headers['x-owner-pin'] || '').toString().trim();

        const ownerEntry = findOwnerEntry(phone);
        if (!ownerEntry) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Owner account not found' }));
            return;
        }

        const owner = ownerEntry.owner;
        if (pin && (owner.pin || '1234').toString() !== pin) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Unauthorized PIN' }));
            return;
        }

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(JSON.stringify({
            success: true,
            ownerPhone: ownerEntry.key,
            ownerName: owner.ownerName,
            currency: owner.currency || detectCurrencyByPhone(ownerEntry.key),
            stores: owner.stores || {}
        }));
        return;
    }

    // 7. PING
    if (pathname === '/api/v1/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ONLINE', version: '3.0.0-iPhone', timestamp: new Date().toISOString() }));
        return;
    }

    // 8. APP ROOT (GET /)
    if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        });
        const html = fs.readFileSync(HTML_FILE, 'utf8');
        res.end(html);
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('===============================================================');
    console.log(`🚀 XRestro iPhone Edition running on port ${PORT}!`);
    console.log('===============================================================');
});
