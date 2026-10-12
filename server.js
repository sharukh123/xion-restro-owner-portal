// ============================================================================
// XRestro Central Multi-Tenant Cloud Portal & Smart Executive Owner Suite
// 100% Free Lifetime Cloud Gateway & Reconciled Tally Engine
// App Brand: XRestro
// ============================================================================

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5055;
const DB_FILE = path.join(__dirname, 'store_data.json');

// In-Memory Multi-Tenant Database
let db = {
    owners: {}
};

// Load DB from file if exists
try {
    if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8').replace(/^\uFEFF/, '');
        db = JSON.parse(raw);
    }
} catch (e) {
    console.error('Error loading db file:', e.message);
}

function saveDb() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving db file:', e.message);
    }
}

// ============================================================================
// MULTINATIONAL PHONE NORMALIZER & SMART MATCHER
// ============================================================================
function normalizePhone(p) {
    if (!p) return '';
    return p.toString().replace(/[^0-9]/g, '');
}

function findOwnerEntry(inputPhone) {
    const rawInput = (inputPhone || '').toString().trim();
    if (!rawInput) return null;

    // 1. Direct exact key match
    if (db.owners[rawInput]) {
        return { key: rawInput, owner: db.owners[rawInput] };
    }

    const inputDigits = normalizePhone(rawInput);
    if (!inputDigits) return null;

    // 2. Exact normalized digits match
    for (const key of Object.keys(db.owners)) {
        const keyDigits = normalizePhone(key);
        if (keyDigits && keyDigits === inputDigits) {
            return { key, owner: db.owners[key] };
        }
    }

    // 3. Suffix & International core match (handles country codes +91, +971, +44, +1, 00, and local 0 trunk prefix)
    const cleanInputCore = inputDigits.replace(/^0+/, '');
    if (cleanInputCore.length >= 7) {
        for (const key of Object.keys(db.owners)) {
            const cleanKeyCore = normalizePhone(key).replace(/^0+/, '');
            if (cleanKeyCore.length >= 7) {
                if (cleanKeyCore === cleanInputCore ||
                    cleanKeyCore.endsWith(cleanInputCore) ||
                    cleanInputCore.endsWith(cleanKeyCore)) {
                    return { key, owner: db.owners[key] };
                }
            }
        }
    }

    return null;
}

// ============================================================================
// LUXURY APP ICON (VECTOR SVG - CRISP RETINA ON ALL IPHONES & ANDROID DEVICES)
// ============================================================================
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6ee7b7"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <radialGradient id="glowRad" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Squircle -->
  <rect x="12" y="12" width="488" height="488" rx="112" fill="url(#bgGrad)" stroke="#1e293b" stroke-width="7"/>
  <rect x="22" y="22" width="468" height="468" rx="102" fill="none" stroke="url(#emeraldGrad)" stroke-width="3" opacity="0.6"/>
  <circle cx="256" cy="210" r="170" fill="url(#glowRad)"/>

  <!-- Gourmet Cloche / Dome -->
  <path d="M 186 150 C 186 90, 326 90, 326 150 Z" fill="none" stroke="url(#goldGrad)" stroke-width="8" stroke-linecap="round"/>
  <circle cx="256" cy="90" r="14" fill="url(#goldGrad)" filter="url(#neonGlow)"/>
  <line x1="166" y1="158" x2="346" y2="158" stroke="url(#goldGrad)" stroke-width="8" stroke-linecap="round"/>

  <!-- Monogram XR -->
  <text x="256" y="320" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="142" font-weight="900" fill="url(#emeraldGrad)" text-anchor="middle" filter="url(#neonGlow)" letter-spacing="-3">XR</text>

  <!-- Golden Stars -->
  <text x="256" y="362" font-size="18" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="8">★ ★ ★</text>

  <!-- Brand Typography -->
  <text x="256" y="415" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="36" font-weight="900" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="6">XRESTRO</text>
  <text x="256" y="445" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="5">EXECUTIVE SUITE</text>
</svg>`;

// ============================================================================
// PWA WEB APP MANIFEST (Saves directly to home screen as "XRestro")
// ============================================================================
const PWA_MANIFEST = JSON.stringify({
  name: "XRestro - Smart Owner Portal",
  short_name: "XRestro",
  description: "Real-Time Executive Analytics, Cash Tally, and Fraud Auditing for XRestro Owners",
  start_url: "/",
  id: "/",
  display: "standalone",
  background_color: "#020617",
  theme_color: "#020617",
  orientation: "portrait-primary",
  icons: [
    {
      src: "/icon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any maskable"
    },
    {
      src: "/icon.svg",
      sizes: "192x192",
      type: "image/svg+xml",
      purpose: "any maskable"
    },
    {
      src: "/icon.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "any maskable"
    }
  ]
}, null, 2);

const server = http.createServer((req, res) => {
    // Enable CORS
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

    // 1. PWA MANIFEST & ICONS
    if (pathname === '/manifest.json') {
        res.writeHead(200, {
            'Content-Type': 'application/manifest+json; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.end(PWA_MANIFEST);
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
                        ownerName: payload.storeName || 'XRestro Owner',
                        pin: '1234',
                        stores: {}
                    };
                }

                if (!db.owners[ownerKey].stores[storeId]) {
                    db.owners[ownerKey].stores[storeId] = {
                        storeId: storeId,
                        storeName: payload.storeName || storeId,
                        storePhone: storePhone,
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
                        store.bills.unshift(payload); // Newest first
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
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: 'Please enter a valid mobile number (min 5 digits).' 
                    }));
                    return;
                }

                // Multi-Country Resilient Matcher:
                // 1. Direct or normalized match with provided phone
                let ownerEntry = findOwnerEntry(cleanPhone);

                // 2. If country code specified and phone doesn't start with it, test combined
                if (!ownerEntry && cleanCountry) {
                    const stripped = cleanPhone.replace(/^0+/, '');
                    ownerEntry = findOwnerEntry(cleanCountry + stripped);
                }

                // 3. Fallback without leading trunk zeros
                if (!ownerEntry) {
                    ownerEntry = findOwnerEntry(cleanPhone.replace(/^0+/, ''));
                }

                // 4. Instant Onboarding: Auto-provision new owner on default PIN 1234 if not yet synced from POS
                if (!ownerEntry) {
                    const defaultOwnerKey = Object.keys(db.owners)[0];
                    if (defaultOwnerKey && db.owners[defaultOwnerKey] && cleanPin === '1234') {
                        const targetKey = cleanPhone;
                        db.owners[targetKey] = {
                            ownerPhone: targetKey,
                            ownerName: 'XRestro Executive Owner',
                            pin: '1234',
                            stores: JSON.parse(JSON.stringify(db.owners[defaultOwnerKey].stores || {}))
                        };
                        saveDb();
                        ownerEntry = { key: targetKey, owner: db.owners[targetKey] };
                    }
                }

                if (!ownerEntry) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: 'Mobile number not found. Please enter the authorized owner mobile number or default PIN 1234.' 
                    }));
                    return;
                }

                const owner = ownerEntry.owner;
                const expectedPin = (owner.pin || '1234').toString();
                if (cleanPin !== expectedPin) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: 'Incorrect Security PIN. Please enter your correct 4-digit PIN.' 
                    }));
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

    // 4. CHANGE OWNER PIN (POST /api/v1/owner/change-pin)
    if (pathname === '/api/v1/owner/change-pin' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { phone, oldPin, newPin } = JSON.parse(body || '{}');
                const cleanPhone = (phone || '').toString().trim();
                const cleanOldPin = (oldPin || '').toString().trim();
                const cleanNewPin = (newPin || '').toString().trim();

                const ownerEntry = findOwnerEntry(cleanPhone);
                if (!ownerEntry) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Owner account not found' }));
                    return;
                }

                const owner = ownerEntry.owner;
                const expectedPin = (owner.pin || '1234').toString();
                if (cleanOldPin !== expectedPin) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Current PIN is incorrect.' }));
                    return;
                }

                if (!cleanNewPin || cleanNewPin.length !== 4) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'New PIN must be exactly 4 digits.' }));
                    return;
                }

                owner.pin = cleanNewPin;
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

    // 5. GET OWNER DATA FOR MOBILE APP (GET /api/v1/owner/data?phone=...&pin=...)
    if (pathname === '/api/v1/owner/data' && req.method === 'GET') {
        const phone = (parsedUrl.query.phone || '').toString().trim();
        const pin = (parsedUrl.query.pin || req.headers['x-owner-pin'] || '').toString().trim();

        if (!phone) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Phone parameter required' }));
            return;
        }

        const ownerEntry = findOwnerEntry(phone);
        if (!ownerEntry) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Mobile number is not registered.' }));
            return;
        }

        const owner = ownerEntry.owner;
        const expectedPin = (owner.pin || '1234').toString();
        if (pin && pin !== expectedPin) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Incorrect Security PIN.' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: owner, canonicalPhone: ownerEntry.key }));
        return;
    }

    // 6. PING HEALTH CHECK (GET /api/v1/ping)
    if (pathname === '/api/v1/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ONLINE', server: 'XRestro Executive Cloud Gateway v4.0', timestamp: new Date().toISOString() }));
        return;
    }

    // 7. SERVE MOBILE WEB APPLICATION (GET /)
    if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.end(getMobileAppHtml());
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('===============================================================');
    console.log(`🚀 XRestro Executive Cloud Portal running on port ${PORT}!`);
    console.log('===============================================================');
});

// ============================================================================
// MOBILE PWA HTML INTERFACE (ULTRA-ADVANCED, ACCURATE, RECONCILED)
// ============================================================================
function getMobileAppHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="XRestro">
  <meta name="application-name" content="XRestro">
  <meta name="theme-color" content="#020617">
  
  <title>XRestro - Smart Executive Suite</title>
  
  <!-- PWA Manifest & Luxury Icons -->
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/svg+xml" href="/icon.svg">
  <link rel="apple-touch-icon" href="/icon.svg">

  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
  
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { 
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace']
          },
          colors: {
            brand: { 50: '#ecfdf5', 500: '#10b981', 600: '#059669', 700: '#047857' }
          }
        }
      }
    }
  </script>

  <style>
    html, body { 
      overscroll-behavior-y: none; 
      -webkit-overscroll-behavior-y: none; 
    }
    body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
    .pulse-dot { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
    .kpi-card {
      position: relative;
      overflow: hidden;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .kpi-card:active {
      transform: scale(0.98);
    }
    .kpi-card.selected {
      box-shadow: 0 0 0 2px var(--card-color), 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .kpi-stripe {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3.5px;
      background: var(--card-color);
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .gold-shimmer {
      background: linear-gradient(90deg, rgba(250, 204, 21, 0.1) 0%, rgba(250, 204, 21, 0.3) 50%, rgba(250, 204, 21, 0.1) 100%);
      background-size: 200% 100%;
      animation: shimmer 3s infinite linear;
    }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen pb-24 select-none">

  <!-- ========================================== -->
  <!-- 1. STRICT LOGIN / PIN LOCK SCREEN          -->
  <!-- ========================================== -->
  <div id="loginScreen" class="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
      <div class="text-center space-y-2">
        <div class="w-20 h-20 rounded-3xl bg-slate-950 border border-emerald-500/30 mx-auto flex items-center justify-center shadow-xl shadow-emerald-950/60 p-1">
          <img src="/icon.svg" alt="XRestro Logo" class="w-full h-full object-contain">
        </div>
        <h2 class="text-2xl font-black text-white tracking-tight flex items-center justify-center space-x-1">
          <span>XRestro</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/40">PRO</span>
        </h2>
        <p class="text-xs text-slate-400 font-medium">Smart Executive Financial & Audit Suite</p>
      </div>

      <!-- ERROR MESSAGE BANNER -->
      <div id="loginError" class="hidden p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold text-center space-y-1">
      </div>

      <form id="loginForm" onsubmit="event.preventDefault(); handleLogin();" class="space-y-4 pt-1">
        <div>
          <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center justify-between">
            <span>Registered Owner Mobile</span>
            <span class="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
              <span>🌍</span><span>World Access</span>
            </span>
          </label>
          <div class="flex items-center space-x-2">
            <!-- Country Selector Button -->
            <button type="button" id="btnCountrySelect" onclick="openCountryModal()" title="Select Country Code" class="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 active:scale-95 text-white font-bold text-xs rounded-xl px-2.5 py-3 border border-slate-700 hover:border-slate-600 focus:outline-none focus:border-brand-500 transition shrink-0 shadow-inner">
              <span id="selectedCountryFlag" class="text-base leading-none">🌐</span>
              <span id="selectedCountryCode" class="font-mono text-emerald-400 text-xs font-bold leading-none">+</span>
              <span class="text-[8px] text-slate-400 leading-none">▼</span>
            </button>
            <!-- Mobile Number Input -->
            <div class="relative flex-1">
              <input id="loginPhone" type="tel" maxlength="20" placeholder="Enter mobile number" autocomplete="username tel" class="w-full bg-slate-800 text-white font-semibold text-sm rounded-xl px-3.5 py-3 border border-slate-700 focus:outline-none focus:border-brand-500 transition placeholder:text-slate-500">
            </div>
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-500 mt-1">
            <span>Tap flag to change country or type code</span>
            <span id="countrySelectedName" class="text-emerald-400 font-medium truncate max-w-[160px]">Manual Entry</span>
          </div>
        </div>

        <div>
          <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center justify-between">
            <span>4-Digit Security PIN</span>
            <button type="button" id="btnTogglePin" onclick="togglePinVisibility()" class="text-[10px] text-brand-400 hover:text-brand-300 font-bold uppercase">Show PIN</button>
          </label>
          <input id="loginPin" type="password" maxlength="4" placeholder="••••" autocomplete="current-password" class="w-full bg-slate-800 text-white font-semibold text-center text-xl tracking-widest rounded-xl px-4 py-3 border border-slate-700 focus:outline-none focus:border-brand-500 transition">
          <p class="text-[10px] text-slate-500 mt-1">Default Security PIN: 1234</p>
        </div>

        <button id="btnLogin" type="submit" class="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center space-x-2">
          <span>🔐 Verify & Launch XRestro</span>
        </button>

        <div class="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-center">
          <p class="text-[11px] text-emerald-400 font-semibold">🔒 100% Reconciled Tally Guarantee</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Desktop POS & Mobile App stay in instant mathematical balance</p>
        </div>
      </form>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- WORLD COUNTRY PICKER MODAL (ALL NATIONS)   -->
  <!-- ========================================== -->
  <div id="countryModal" class="hidden fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col max-h-[85vh] space-y-3">
      
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div class="flex items-center space-x-2">
          <span class="text-lg">🌍</span>
          <div>
            <h3 class="text-sm font-extrabold text-white">Select Country Code</h3>
            <p class="text-[10px] text-slate-400">Choose country code or enter manually</p>
          </div>
        </div>
        <button type="button" onclick="closeCountryModal()" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition">✕</button>
      </div>

      <!-- Search Box -->
      <div class="relative">
        <span class="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
        <input id="searchCountry" type="text" oninput="filterCountryList()" placeholder="Search country or code (e.g. UAE, 971, UK, +1)..." class="w-full bg-slate-800/90 text-white text-xs rounded-xl pl-8 pr-3 py-2.5 border border-slate-700 focus:outline-none focus:border-brand-500">
      </div>

      <!-- Countries List Container -->
      <div id="countryListContainer" class="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[350px]">
        <!-- Dynamic Country Rows -->
      </div>

    </div>
  </div>

  <!-- ========================================== -->
  <!-- PIN CHANGE MODAL                           -->
  <!-- ========================================== -->
  <div id="pinModal" class="hidden fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="text-sm font-bold text-white">🔑 Change Security PIN</h3>
        <button onclick="closePinModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>
      <div id="pinModalError" class="hidden text-xs text-rose-400 bg-rose-950/60 p-2.5 rounded-lg border border-rose-800/50"></div>
      <div>
        <label class="text-[11px] font-bold text-slate-400 block mb-1">Current PIN</label>
        <input id="currPin" type="password" maxlength="4" class="w-full bg-slate-800 text-white text-center text-lg rounded-xl py-2 border border-slate-700">
      </div>
      <div>
        <label class="text-[11px] font-bold text-slate-400 block mb-1">New 4-Digit PIN</label>
        <input id="newPin1" type="password" maxlength="4" class="w-full bg-slate-800 text-white text-center text-lg rounded-xl py-2 border border-slate-700">
      </div>
      <div>
        <label class="text-[11px] font-bold text-slate-400 block mb-1">Confirm New PIN</label>
        <input id="newPin2" type="password" maxlength="4" class="w-full bg-slate-800 text-white text-center text-lg rounded-xl py-2 border border-slate-700">
      </div>
      <button onclick="submitChangePin()" class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs py-3 rounded-xl transition">
        Update PIN Now
      </button>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- INVOICE DETAIL INSPECTOR MODAL             -->
  <!-- ========================================== -->
  <div id="invoiceModal" class="hidden fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
      
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Tax Invoice Details</span>
            <span id="invModalStatus" class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">PAID</span>
          </div>
          <h3 id="invModalNo" class="text-xl font-black text-white font-mono mt-0.5">#INV000</h3>
        </div>
        <button onclick="closeInvoiceModal()" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition">
          ✕
        </button>
      </div>

      <!-- Scrollable Body -->
      <div class="px-5 py-4 space-y-4 overflow-y-auto flex-1">
        
        <!-- Metadata Grid -->
        <div class="grid grid-cols-2 gap-2.5 text-xs bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-bold">Billed By (Cashier)</span>
            <div id="invModalCashier" class="font-bold text-emerald-400 mt-0.5 flex items-center space-x-1 text-sm">
              <span>👤</span><span id="invModalCashierText">Admin</span>
            </div>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-bold">Steward / Waiter</span>
            <div id="invModalWaiter" class="font-bold text-white mt-0.5 text-sm">--</div>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-bold">Table / Type</span>
            <div id="invModalTable" class="font-bold text-amber-400 mt-0.5 text-sm">Table 01 (DineIn)</div>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-bold">Settled Time</span>
            <div id="invModalTime" class="font-mono text-slate-300 mt-0.5 text-xs">--:--</div>
          </div>
          <div class="col-span-2 pt-1 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold">Customer</span>
              <div id="invModalCustomer" class="font-semibold text-white">Walk-in Guest</div>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-400 uppercase font-bold">Token #</span>
              <div id="invModalToken" class="font-mono font-bold text-brand-400">#1</div>
            </div>
          </div>
        </div>

        <!-- Itemized Order Details -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Items Ordered</span>
            <span id="invModalItemCount" class="text-[10px] text-slate-500 font-mono">0 items</span>
          </div>
          <div id="invModalItemsList" class="space-y-1.5 max-h-56 overflow-y-auto pr-1"></div>
        </div>

        <!-- Bill Financial Breakdown -->
        <div class="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div class="flex justify-between text-slate-400">
            <span>Subtotal (Items Net)</span>
            <span class="font-mono font-bold text-white">₹<span id="invModalSubtotal">0.00</span></span>
          </div>
          <div id="invModalDiscRow" class="flex justify-between text-rose-400">
            <span>Discount Applied</span>
            <span class="font-mono font-bold">-₹<span id="invModalDiscount">0.00</span></span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>GST / Taxes</span>
            <span class="font-mono font-bold text-white">₹<span id="invModalTax">0.00</span></span>
          </div>
          <div class="flex justify-between text-sm font-extrabold border-t border-slate-800 pt-2 text-white">
            <span>Grand Total</span>
            <span class="font-mono text-emerald-400">₹<span id="invModalGrandTotal">0.00</span></span>
          </div>
          <div class="flex justify-between items-center pt-1 border-t border-slate-800/80 text-[11px]">
            <span class="text-slate-400 font-bold uppercase">Payment Mode</span>
            <span id="invModalPayMode" class="font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-brand-400 border border-slate-700">CASH</span>
          </div>
        </div>

        <!-- Quick Share Action -->
        <button id="btnShareWa" onclick="shareBillOnWhatsApp()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center space-x-2">
          <span>📲 Share Bill Copy via WhatsApp</span>
        </button>

      </div>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- SMART INSTALL PROMPT (PWA HOME SCREEN)     -->
  <!-- ========================================== -->
  <div id="pwaBanner" class="hidden max-w-xl mx-auto px-3.5 pt-2">
    <div class="bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between shadow-lg">
      <div class="flex items-center space-x-2.5">
        <img src="/icon.svg" class="w-8 h-8 rounded-xl object-contain">
        <div>
          <div class="text-xs font-black text-white">Install XRestro App</div>
          <div class="text-[10px] text-slate-400">Tap Share ➔ "Add to Home Screen" for instant 1-tap app launch</div>
        </div>
      </div>
      <button onclick="dismissPwaBanner()" class="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        ✕
      </button>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- 2. STICKY EXECUTIVE HEADER BAR             -->
  <!-- ========================================== -->
  <header class="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md">
    <div class="max-w-xl mx-auto flex items-center justify-between">
      
      <!-- Brand & Status -->
      <div class="flex items-center space-x-2.5">
        <div class="w-9 h-9 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-center p-0.5 shadow-md shadow-emerald-950/40">
          <img src="/icon.svg" alt="XRestro" class="w-full h-full object-contain">
        </div>
        <div>
          <div class="flex items-center space-x-1.5">
            <h1 class="font-black text-white text-base tracking-tight leading-none">XRestro</h1>
            <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30">LIVE</span>
          </div>
          <div class="flex items-center space-x-1.5 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></span>
            <span id="headerSyncStatus" class="text-[10px] text-slate-400 font-medium">Connecting...</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-1.5">
        <button onclick="openPinModal()" title="Change PIN" class="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition">
          <span class="text-xs">🔑</span>
        </button>
        <button onclick="fetchData()" title="Manual Refresh" class="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-brand-400 transition">
          <span class="text-xs">🔄</span>
        </button>
        <button onclick="lockApp()" title="Lock App" class="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-400 transition">
          <span class="text-xs">🔒</span>
        </button>
      </div>

    </div>

    <!-- Outlet Name Indicator -->
    <div id="singleBranchContainer" class="max-w-xl mx-auto mt-2 flex items-center justify-between text-xs bg-slate-900/80 rounded-xl px-3 py-1.5 border border-slate-800">
      <div class="flex items-center space-x-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <div id="singleBranchName" class="font-extrabold text-white text-xs">JANTA RESTRO</div>
      </div>
      <div class="text-[10px] text-slate-400 font-mono">100% Balanced With POS</div>
    </div>

    <!-- Multi-Branch Selector (if multiple outlets exist) -->
    <div id="branchSelectorContainer" class="max-w-xl mx-auto mt-2 hidden">
      <select id="branchSelect" onchange="renderDashboard()" class="w-full bg-slate-900 text-white text-xs font-bold rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-brand-500 transition">
        <option value="ALL">🏢 All Outlets (Consolidated)</option>
      </select>
    </div>
  </header>

  <!-- PULL-TO-REFRESH INDICATOR -->
  <div id="ptrIndicator" style="height: 0px; opacity: 0; overflow: hidden;" class="transition-[height,opacity] duration-150 flex items-center justify-center bg-slate-950/90 border-b border-slate-800/60">
    <div class="flex items-center space-x-2 text-slate-400 text-xs py-1">
      <div id="ptrIcon" class="transition-transform duration-200">↓</div>
      <div id="ptrSpinner" class="hidden">
        <svg class="animate-spin h-3.5 w-3.5 text-brand-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
      <span id="ptrText" class="text-xs">Pull down to refresh</span>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- 3. MAIN DASHBOARD CONTENT (ULTRA-ADVANCED) -->
  <!-- ========================================== -->
  <main id="mainContent" class="max-w-xl mx-auto px-3.5 pt-3.5 space-y-3.5">

    <!-- A. MASTER RECONCILED CASH DRAWER (EXACT POS MATCH) -->
    <section class="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
      <div class="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div class="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Reconciled Cash In Drawer</span>
          <div class="text-3xl font-black font-mono text-emerald-400 mt-0.5">
            ₹<span id="tallyExpectedCash">0.00</span>
          </div>
        </div>
        <div class="text-right">
          <span class="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Total Net Collection</span>
          <div class="text-base font-extrabold font-mono text-white mt-0.5">
            ₹<span id="valPayTotal">0.00</span>
          </div>
          <span class="text-[9px] text-emerald-400 font-bold">🔒 100% Balanced</span>
        </div>
      </div>

      <!-- Tally Pipeline Breakdown (Exact POS Match) -->
      <div class="grid grid-cols-3 gap-2 text-center text-xs pt-3">
        <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <div class="text-[9px] text-emerald-400 uppercase font-bold">(+) Sales Cash</div>
          <div class="font-mono font-extrabold text-white mt-0.5">₹<span id="tallySalesCash">0.00</span></div>
        </div>
        <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <div class="text-[9px] text-rose-400 uppercase font-bold">(-) Return Cash</div>
          <div class="font-mono font-extrabold text-white mt-0.5">₹<span id="tallyReturnCash">0.00</span></div>
        </div>
        <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <div class="text-[9px] text-amber-400 uppercase font-bold">(-) Vendor Cash</div>
          <div class="font-mono font-extrabold text-white mt-0.5">₹<span id="tallySupplierCash">0.00</span></div>
        </div>
      </div>
    </section>

    <!-- B. MULTI-PAYMENT CARDS (1-TAP CROSS-FILTER) -->
    <section class="space-y-2">
      <div class="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
        <span>Payment Collections</span>
        <span id="activeFilterBadge" class="hidden text-[10px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded cursor-pointer" onclick="clearCrossFilter()">
          ✕ Reset Filter
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <!-- Cash -->
        <div onclick="applyPaymentFilter('Cash')" id="cardPayCash" style="--card-color: #10b981;" class="kpi-card bg-slate-900 border border-slate-800 rounded-2xl p-3 cursor-pointer">
          <div class="kpi-stripe"></div>
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span class="font-bold flex items-center space-x-1"><span>💵</span><span>Cash</span></span>
            <span class="text-[10px] font-mono text-emerald-400" id="pctPayCash">0%</span>
          </div>
          <div class="text-xl font-black font-mono text-emerald-400 mt-1">₹<span id="valPayCash">0.00</span></div>
          <div id="subPayCash" class="mt-1 text-[10px] text-slate-400 truncate">0 Bills</div>
        </div>

        <!-- UPI -->
        <div onclick="applyPaymentFilter('UPI')" id="cardPayUpi" style="--card-color: #8b5cf6;" class="kpi-card bg-slate-900 border border-slate-800 rounded-2xl p-3 cursor-pointer">
          <div class="kpi-stripe"></div>
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span class="font-bold flex items-center space-x-1"><span>📱</span><span>UPI / QR</span></span>
            <span class="text-[10px] font-mono text-purple-400" id="pctPayUpi">0%</span>
          </div>
          <div class="text-xl font-black font-mono text-purple-400 mt-1">₹<span id="valPayUpi">0.00</span></div>
          <div id="subPayUpi" class="mt-1 text-[10px] text-slate-400 truncate">0 Bills</div>
        </div>

        <!-- Card -->
        <div onclick="applyPaymentFilter('Card')" id="cardPayCard" style="--card-color: #3b82f6;" class="kpi-card bg-slate-900 border border-slate-800 rounded-2xl p-3 cursor-pointer">
          <div class="kpi-stripe"></div>
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span class="font-bold flex items-center space-x-1"><span>💳</span><span>Card / EDC</span></span>
            <span class="text-[10px] font-mono text-blue-400" id="pctPayCard">0%</span>
          </div>
          <div class="text-xl font-black font-mono text-blue-400 mt-1">₹<span id="valPayCard">0.00</span></div>
          <div id="subPayCard" class="mt-1 text-[10px] text-slate-400 truncate">0 Bills</div>
        </div>

        <!-- Due -->
        <div onclick="applyPaymentFilter('Due')" id="cardPayDue" style="--card-color: #f59e0b;" class="kpi-card bg-slate-900 border border-slate-800 rounded-2xl p-3 cursor-pointer">
          <div class="kpi-stripe"></div>
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span class="font-bold flex items-center space-x-1"><span>⏳</span><span>Credit / Due</span></span>
            <span class="text-[10px] font-mono text-amber-400" id="pctPayDue">0%</span>
          </div>
          <div class="text-xl font-black font-mono text-amber-400 mt-1">₹<span id="valPayDue">0.00</span></div>
          <div id="subPayDue" class="mt-1 text-[10px] text-slate-400 truncate">0 Bills</div>
        </div>
      </div>
    </section>

    <!-- C. OPERATIONAL VITALS (Active Tables, Dine vs Takeaway, Voids) -->
    <section class="grid grid-cols-3 gap-2 text-center">
      <div class="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div class="text-[9px] font-bold uppercase text-slate-400">Active Tables</div>
        <div id="vitalTables" class="text-xl font-black text-amber-400 font-mono mt-0.5">0</div>
        <div class="text-[9px] text-slate-500 mt-0.5">Occupied Now</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div class="text-[9px] font-bold uppercase text-slate-400">Dine vs Takeaway</div>
        <div class="text-xs font-bold text-slate-200 mt-1 font-mono">
          D:₹<span id="vitalDine">0</span> | T:₹<span id="vitalTake">0</span>
        </div>
        <div class="text-[9px] text-slate-500 mt-0.5">Channel Sales</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div class="text-[9px] font-bold uppercase text-rose-400">Void / Lost</div>
        <div id="vitalVoid" class="text-xl font-black text-rose-400 font-mono mt-0.5">0</div>
        <div class="text-[9px] text-slate-500 mt-0.5">Cancelled Items</div>
      </div>
    </section>

    <!-- D. HOURLY PEAK RUSH HEATMAP (SMART ANALYTICS) -->
    <section class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
            <span>📊 Hourly Peak Rush Heatmap</span>
          </h3>
          <p class="text-[10px] text-slate-400">Order traffic & rush distribution throughout the day</p>
        </div>
        <span id="peakHourBadge" class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
          🔥 Peak: --
        </span>
      </div>

      <!-- Hourly Bars Container -->
      <div id="hourlyChartContainer" class="flex items-end justify-between h-28 pt-4 pb-1 px-1 border-b border-slate-800">
        <!-- Rendered dynamically -->
      </div>
      <div class="flex justify-between text-[9px] text-slate-500 font-mono px-1">
        <span>10 AM</span>
        <span>1 PM</span>
        <span>4 PM</span>
        <span>7 PM</span>
        <span>10 PM</span>
      </div>
    </section>

    <!-- E. TOP 5 BESTSELLER DISHES TODAY -->
    <section class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
            <span>🏆 Top 5 Bestsellers Today</span>
          </h3>
          <p class="text-[10px] text-slate-400">Highest revenue & volume dish ranking</p>
        </div>
        <span class="text-[10px] text-brand-400 font-bold">Live POS Ranking</span>
      </div>

      <div id="topDishesList" class="space-y-2">
        <div class="text-center text-slate-500 text-xs py-4">No dish items recorded yet today.</div>
      </div>
    </section>

    <!-- F. LIVE BILLS FEED & SEARCH EXPLORER -->
    <section class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-xs font-black uppercase tracking-wider text-white">Live Invoices</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold" id="tabCountBills">0</span>
        </div>
        
        <!-- Search Box -->
        <div class="relative w-40">
          <input id="searchInput" oninput="filterBillsList()" type="text" placeholder="Search bill / table..." class="w-full bg-slate-800 text-white text-xs rounded-xl pl-6 pr-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-brand-500 transition">
          <svg class="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      <!-- Feed Container -->
      <div id="billsList" class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        <div class="py-10 text-center text-slate-500 text-xs">
          Waiting for bills from POS...<br>
          <span class="text-[10px] text-slate-600 mt-1 block">Bills settled in POS will appear here live</span>
        </div>
      </div>
    </section>

  </main>

  <!-- ========================================== -->
  <!-- 4. CLIENT JAVASCRIPT ENGINE                -->
  <!-- ========================================== -->
  <script>
    let currentOwnerPhone = '';
    let currentOwnerPin = '';
    let currentStoreData = null;
    let selectedStoreId = 'ALL';
    let activePaymentFilter = null;
    let autoRefreshTimer = null;

    // ==========================================
    // 🌍 WORLD-WIDE MULTI-COUNTRY REGISTRY
    // ==========================================
    const WORLD_COUNTRIES = [
      { name: "Direct Manual Entry", code: "", flag: "🌐", manual: true },
      { name: "United Arab Emirates", code: "+971", flag: "🇦🇪", popular: true },
      { name: "Saudi Arabia", code: "+966", flag: "🇸🇦", popular: true },
      { name: "India", code: "+91", flag: "🇮🇳", popular: true },
      { name: "United States", code: "+1", flag: "🇺🇸", popular: true },
      { name: "United Kingdom", code: "+44", flag: "🇬🇧", popular: true },
      { name: "Canada", code: "+1", flag: "🇨🇦", popular: true },
      { name: "Oman", code: "+968", flag: "🇴🇲", popular: true },
      { name: "Qatar", code: "+974", flag: "🇶🇦", popular: true },
      { name: "Kuwait", code: "+965", flag: "🇰🇼", popular: true },
      { name: "Bahrain", code: "+973", flag: "🇧🇭", popular: true },
      { name: "Australia", code: "+61", flag: "🇦🇺", popular: true },
      { name: "Singapore", code: "+65", flag: "🇸🇬", popular: true },
      { name: "Germany", code: "+49", flag: "🇩🇪" },
      { name: "France", code: "+33", flag: "🇫🇷" },
      { name: "Italy", code: "+39", flag: "🇮🇹" },
      { name: "Spain", code: "+34", flag: "🇪🇸" },
      { name: "Netherlands", code: "+31", flag: "🇳🇱" },
      { name: "Switzerland", code: "+41", flag: "🇨🇭" },
      { name: "Sweden", code: "+46", flag: "🇸🇪" },
      { name: "Norway", code: "+47", flag: "🇳🇴" },
      { name: "Ireland", code: "+353", flag: "🇮🇪" },
      { name: "New Zealand", code: "+64", flag: "🇳🇿" },
      { name: "South Africa", code: "+27", flag: "🇿🇦" },
      { name: "Malaysia", code: "+60", flag: "🇲🇾" },
      { name: "Indonesia", code: "+62", flag: "🇮🇩" },
      { name: "Thailand", code: "+66", flag: "🇹🇭" },
      { name: "Philippines", code: "+63", flag: "🇵🇭" },
      { name: "Vietnam", code: "+84", flag: "🇻🇳" },
      { name: "Japan", code: "+81", flag: "🇯🇵" },
      { name: "South Korea", code: "+82", flag: "🇰🇷" },
      { name: "China", code: "+86", flag: "🇨🇳" },
      { name: "Hong Kong", code: "+852", flag: "🇭🇰" },
      { name: "Bangladesh", code: "+880", flag: "🇧🇩" },
      { name: "Pakistan", code: "+92", flag: "🇵🇰" },
      { name: "Nepal", code: "+977", flag: "🇳🇵" },
      { name: "Sri Lanka", code: "+94", flag: "🇱🇰" },
      { name: "Egypt", code: "+20", flag: "🇪🇬" },
      { name: "Turkey", code: "+90", flag: "🇹🇷" },
      { name: "Jordan", code: "+962", flag: "🇯🇴" },
      { name: "Lebanon", code: "+961", flag: "🇱🇧" },
      { name: "Iraq", code: "+964", flag: "🇮🇶" },
      { name: "Nigeria", code: "+234", flag: "🇳🇬" },
      { name: "Kenya", code: "+254", flag: "🇰🇪" },
      { name: "Tanzania", code: "+255", flag: "🇹🇿" },
      { name: "Uganda", code: "+256", flag: "🇺🇬" },
      { name: "Ghana", code: "+233", flag: "🇬🇭" },
      { name: "Brazil", code: "+55", flag: "🇧🇷" },
      { name: "Mexico", code: "+52", flag: "🇲🇽" },
      { name: "Argentina", code: "+54", flag: "🇦🇷" },
      { name: "Colombia", code: "+57", flag: "🇨🇴" },
      { name: "Chile", code: "+56", flag: "🇨🇱" },
      { name: "Peru", code: "+51", flag: "🇵🇪" },
      { name: "Poland", code: "+48", flag: "🇵🇱" },
      { name: "Portugal", code: "+351", flag: "🇵🇹" },
      { name: "Greece", code: "+30", flag: "🇬🇷" },
      { name: "Belgium", code: "+32", flag: "🇧🇪" },
      { name: "Austria", code: "+43", flag: "🇦🇹" },
      { name: "Denmark", code: "+45", flag: "🇩🇰" },
      { name: "Finland", code: "+358", flag: "🇫🇮" },
      { name: "Czech Republic", code: "+420", flag: "🇨🇿" },
      { name: "Romania", code: "+40", flag: "🇷🇴" },
      { name: "Hungary", code: "+36", flag: "🇭🇺" },
      { name: "Russia", code: "+7", flag: "🇷🇺" },
      { name: "Kazakhstan", code: "+7", flag: "🇰🇿" },
      { name: "Ukraine", code: "+380", flag: "🇺🇦" },
      { name: "Uzbekistan", code: "+998", flag: "🇺🇿" },
      { name: "Azerbaijan", code: "+994", flag: "🇦🇿" },
      { name: "Georgia", code: "+995", flag: "🇬🇪" },
      { name: "Mauritius", code: "+230", flag: "🇲🇺" },
      { name: "Maldives", code: "+960", flag: "🇲🇻" },
      { name: "Fiji", code: "+679", flag: "🇫🇯" }
    ];

    let selectedCountry = WORLD_COUNTRIES[0]; // default: Direct Manual

    function initCountrySelector() {
      try {
        const saved = localStorage.getItem('xrestro_selected_country');
        if (saved) {
          const parsed = JSON.parse(saved);
          const found = WORLD_COUNTRIES.find(c => c.name === parsed.name || (c.code && c.code === parsed.code));
          if (found) {
            selectCountry(found, false);
            return;
          }
        }
      } catch (e) {}
      selectCountry(WORLD_COUNTRIES[0], false);
    }

    function selectCountry(country, focusInput = true) {
      if (!country) return;
      selectedCountry = country;
      const flagEl = document.getElementById('selectedCountryFlag');
      const codeEl = document.getElementById('selectedCountryCode');
      const nameEl = document.getElementById('countrySelectedName');
      if (flagEl) flagEl.innerText = country.flag;
      if (codeEl) codeEl.innerText = country.code || '+';
      if (nameEl) nameEl.innerText = country.manual ? 'Manual Entry' : (country.name + ' (' + country.code + ')');

      try {
        localStorage.setItem('xrestro_selected_country', JSON.stringify({
          name: country.name,
          code: country.code,
          flag: country.flag
        }));
      } catch (e) {}

      closeCountryModal();
      if (focusInput) {
        const phoneInput = document.getElementById('loginPhone');
        if (phoneInput) phoneInput.focus();
      }
    }

    function openCountryModal() {
      const modal = document.getElementById('countryModal');
      if (!modal) return;
      modal.classList.remove('hidden');
      const search = document.getElementById('searchCountry');
      if (search) {
        search.value = '';
        setTimeout(() => search.focus(), 100);
      }
      renderCountryList('');
    }

    function closeCountryModal() {
      const modal = document.getElementById('countryModal');
      if (modal) modal.classList.add('hidden');
    }

    function filterCountryList() {
      const search = document.getElementById('searchCountry');
      const query = search ? (search.value || '').trim() : '';
      renderCountryList(query);
    }

    function renderCountryList(filterText) {
      const container = document.getElementById('countryListContainer');
      if (!container) return;
      const query = (filterText || '').toLowerCase();

      const filtered = WORLD_COUNTRIES.filter(c => {
        if (!query) return true;
        return c.name.toLowerCase().includes(query) ||
               (c.code && c.code.toLowerCase().includes(query)) ||
               (c.code && c.code.replace('+', '').includes(query));
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div class="p-6 text-center text-xs text-slate-500">No matching country found.<br><button type="button" onclick="selectCountry(WORLD_COUNTRIES[0])" class="mt-2 text-emerald-400 font-bold hover:underline">Use Manual Entry (+)</button></div>';
        return;
      }

      currentFilteredCountries = filtered;
      container.innerHTML = filtered.map(function(c, idx) {
        var isSelected = selectedCountry && selectedCountry.name === c.name;
        var codeDisplay = c.code || 'Manual';
        var selectedClass = isSelected ? 'bg-emerald-950/40 border border-emerald-500/30' : 'border border-transparent';
        var textClass = isSelected ? 'text-emerald-400' : 'text-white';
        var codeClass = isSelected ? 'text-emerald-400' : 'text-slate-400';
        return '<div onclick="selectCountryByIndex(' + idx + ')" class="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-slate-800 transition ' + selectedClass + '">' +
          '<div class="flex items-center space-x-2.5">' +
            '<span class="text-xl">' + c.flag + '</span>' +
            '<span class="text-xs font-semibold ' + textClass + '">' + c.name + '</span>' +
          '</div>' +
          '<span class="font-mono text-xs font-bold ' + codeClass + '">' + codeDisplay + '</span>' +
        '</div>';
      }).join('');
    }

    let currentFilteredCountries = [];
    function selectCountryByIndex(idx) {
      if (currentFilteredCountries && currentFilteredCountries[idx]) {
        selectCountry(currentFilteredCountries[idx]);
      }
    }

    // Check PWA Install Mode & Silent Auto-Login
    window.addEventListener('load', async () => {
      initCountrySelector();

      const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
      if (!isStandalone && !localStorage.getItem('xrestro_pwa_dismissed')) {
        document.getElementById('pwaBanner').classList.remove('hidden');
      }

      // Keyboard & UX smoothness handlers
      const phoneInput = document.getElementById('loginPhone');
      const pinInput = document.getElementById('loginPin');

      if (phoneInput && pinInput) {
        phoneInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            pinInput.focus();
          }
        });

        // Dynamic country detection when user types or pastes with + (e.g. +971 or +44 or +1)
        phoneInput.addEventListener('input', (e) => {
          const val = e.target.value.trim();
          if (val.startsWith('+')) {
            for (let len = 5; len >= 2; len--) {
              const prefix = val.slice(0, len);
              const found = WORLD_COUNTRIES.find(c => c.code === prefix);
              if (found && (!selectedCountry || selectedCountry.name !== found.name)) {
                selectCountry(found, false);
                break;
              }
            }
          }
        });

        pinInput.addEventListener('input', (e) => {
          if (e.target.value.length === 4) {
            handleLogin();
          }
        });
      }

      const savedPhone = localStorage.getItem('xion_owner_phone') || sessionStorage.getItem('xion_owner_phone');
      const savedPin = localStorage.getItem('xion_owner_pin') || sessionStorage.getItem('xion_owner_pin');

      if (savedPhone) {
        phoneInput.value = savedPhone;
      }

      if (savedPhone && savedPin) {
        const ok = await verifyCredentials(savedPhone, savedPin);
        if (ok) {
          currentOwnerPhone = savedPhone;
          currentOwnerPin = savedPin;
          document.getElementById('loginScreen').classList.add('hidden');
          fetchData();
          startAutoRefresh();
          return;
        }
      }

      // If phone exists but PIN needed, focus PIN; else focus phone
      document.getElementById('loginScreen').classList.remove('hidden');
      if (savedPhone) {
        pinInput.focus();
      } else {
        phoneInput.focus();
      }
    });

    function dismissPwaBanner() {
      document.getElementById('pwaBanner').classList.add('hidden');
      localStorage.setItem('xrestro_pwa_dismissed', 'true');
    }

    function togglePinVisibility() {
      const pinInput = document.getElementById('loginPin');
      const toggleBtn = document.getElementById('btnTogglePin');
      if (!pinInput || !toggleBtn) return;
      if (pinInput.type === 'password') {
        pinInput.type = 'text';
        toggleBtn.innerText = 'Hide PIN';
      } else {
        pinInput.type = 'password';
        toggleBtn.innerText = 'Show PIN';
      }
    }

    async function verifyCredentials(phone, pin) {
      try {
        const res = await fetch('/api/v1/owner/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, pin })
        });
        const data = await res.json();
        return data.success === true;
      } catch (e) {
        return false;
      }
    }

    function lockApp() {
      sessionStorage.removeItem('xion_owner_pin');
      localStorage.removeItem('xion_owner_pin'); // Keep phone remembered for fast PIN-only unlock
      currentOwnerPin = '';
      currentStoreData = null;
      if (autoRefreshTimer) clearInterval(autoRefreshTimer);

      const savedPhone = localStorage.getItem('xion_owner_phone') || sessionStorage.getItem('xion_owner_phone') || currentOwnerPhone;
      if (savedPhone) {
        document.getElementById('loginPhone').value = savedPhone;
      }
      document.getElementById('loginPin').value = '';
      hideLoginError();
      document.getElementById('loginScreen').classList.remove('hidden');
      setTimeout(() => {
        const pinInput = document.getElementById('loginPin');
        if (pinInput) pinInput.focus();
      }, 150);
    }

    function showLoginError(msg) {
      const errBox = document.getElementById('loginError');
      errBox.innerHTML = '⚠️ ' + msg;
      errBox.classList.remove('hidden');
    }

    function hideLoginError() {
      const errBox = document.getElementById('loginError');
      errBox.innerText = '';
      errBox.classList.add('hidden');
    }

    async function handleLogin() {
      hideLoginError();
      const phoneInput = document.getElementById('loginPhone');
      const pinInput = document.getElementById('loginPin');
      const rawPhone = phoneInput.value.trim();
      const pin = pinInput.value.trim();

      const digitsOnly = rawPhone.replace(/[^0-9]/g, '');
      if (!digitsOnly || digitsOnly.length < 5 || digitsOnly.length > 18) {
        showLoginError('Please enter a valid owner mobile number (min 5 digits).');
        phoneInput.focus();
        return;
      }
      if (!pin || pin.length !== 4) {
        showLoginError('Please enter your 4-digit security PIN.');
        pinInput.focus();
        return;
      }

      // Combine with Country Code if selected
      let finalPhone = rawPhone;
      const countryCode = selectedCountry && selectedCountry.code ? selectedCountry.code : '';
      if (countryCode && !rawPhone.startsWith('+')) {
        const cleanCodeDigits = countryCode.replace(/[^0-9]/g, '');
        if (!digitsOnly.startsWith(cleanCodeDigits)) {
          const stripped = digitsOnly.replace(/^0+/, '');
          finalPhone = countryCode + stripped;
        } else {
          finalPhone = '+' + digitsOnly;
        }
      }

      const btn = document.getElementById('btnLogin');
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Verifying Credentials...</span>';

      try {
        const res = await fetch('/api/v1/owner/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phone: finalPhone, 
            rawPhone: rawPhone,
            countryCode: countryCode, 
            pin: pin 
          })
        });
        const data = await res.json();

        if (!data.success) {
          showLoginError(data.error || 'Authentication Failed');
          pinInput.value = '';
          pinInput.focus();
          btn.disabled = false;
          btn.innerHTML = '<span>🔐 Verify & Launch XRestro</span>';
          return;
        }

        const canonicalPhone = data.ownerPhone || finalPhone;
        currentOwnerPhone = canonicalPhone;
        currentOwnerPin = pin;

        // Save in both localStorage and sessionStorage for persistent smooth experience
        localStorage.setItem('xion_owner_phone', canonicalPhone);
        localStorage.setItem('xion_owner_pin', pin);
        sessionStorage.setItem('xion_owner_phone', canonicalPhone);
        sessionStorage.setItem('xion_owner_pin', pin);

        document.getElementById('loginScreen').classList.add('hidden');
        await fetchData();
        startAutoRefresh();
      } catch (err) {
        showLoginError('Connection Error: Unable to connect to server. Please check your network.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>🔐 Verify & Launch XRestro</span>';
      }
    }

    function startAutoRefresh() {
      if (autoRefreshTimer) clearInterval(autoRefreshTimer);
      autoRefreshTimer = setInterval(fetchData, 10000); // 10s live pulse
    }

    async function fetchData() {
      if (!currentOwnerPhone || !currentOwnerPin) return;
      try {
        const res = await fetch('/api/v1/owner/data?phone=' + encodeURIComponent(currentOwnerPhone) + '&pin=' + encodeURIComponent(currentOwnerPin));
        const json = await res.json();
        if (json.success && json.data) {
          currentStoreData = json.data;
          updateBranchDropdown();
          renderDashboard();
          document.getElementById('headerSyncStatus').innerText = 'Synced ' + new Date().toLocaleTimeString();
        } else if (res.status === 401 || res.status === 403) {
          lockApp();
        }
      } catch (e) {
        console.error('Fetch error:', e);
        document.getElementById('headerSyncStatus').innerText = 'Offline / Retrying...';
      }
    }

    function updateBranchDropdown() {
      if (!currentStoreData || !currentStoreData.stores) return;
      const select = document.getElementById('branchSelect');
      const container = document.getElementById('branchSelectorContainer');
      const singleContainer = document.getElementById('singleBranchContainer');
      const storeIds = Object.keys(currentStoreData.stores);

      if (storeIds.length <= 1) {
        if (container) container.classList.add('hidden');
        if (singleContainer) {
          singleContainer.classList.remove('hidden');
          const s = storeIds.length === 1 ? currentStoreData.stores[storeIds[0]] : null;
          const nameEl = document.getElementById('singleBranchName');
          if (nameEl && s && s.storeName) nameEl.innerText = s.storeName;
        }
        selectedStoreId = storeIds.length === 1 ? storeIds[0] : 'ALL';
        return;
      }

      if (container) container.classList.remove('hidden');
      if (singleContainer) singleContainer.classList.add('hidden');

      const prevVal = select.value;
      select.innerHTML = '<option value="ALL">🏢 All Outlets (Consolidated)</option>';

      storeIds.forEach(id => {
        const s = currentStoreData.stores[id];
        const opt = document.createElement('option');
        opt.value = id;
        opt.innerText = '📍 ' + (s.storeName || id);
        select.appendChild(opt);
      });

      if (prevVal && (prevVal === 'ALL' || storeIds.includes(prevVal))) {
        select.value = prevVal;
        selectedStoreId = prevVal;
      }
    }

    function renderDashboard() {
      const select = document.getElementById('branchSelect');
      const storeIds = currentStoreData && currentStoreData.stores ? Object.keys(currentStoreData.stores) : [];
      if (storeIds.length === 1) {
        selectedStoreId = storeIds[0];
      } else if (select) {
        selectedStoreId = select.value || 'ALL';
      }
      if (!currentStoreData || !currentStoreData.stores) return;

      const stores = currentStoreData.stores;
      let consolidated = {
        netCash: 0,
        netUpi: 0,
        netCard: 0,
        netDue: 0,
        netTotalCollection: 0,
        salesCash: 0,
        salesUpi: 0,
        salesCard: 0,
        salesDue: 0,
        salesTotalPaid: 0,
        totalSalesInvoices: 0,
        totalGrossSales: 0,
        totalSalesDiscount: 0,
        totalSalesTax: 0,
        totalNetSales: 0,
        totalReturnInvoices: 0,
        totalRefundAmount: 0,
        returnCash: 0,
        returnUpi: 0,
        returnCard: 0,
        returnDue: 0,
        totalInwardPaid: 0,
        totalSupplierPaid: 0,
        supplierCash: 0,
        drawerCash: 0,
        dineInSales: 0,
        takeawaySales: 0,
        activeTablesCount: 0,
        voidCount: 0,
        bills: []
      };

      Object.keys(stores).forEach(id => {
        if (selectedStoreId === 'ALL' || selectedStoreId === id) {
          const s = stores[id];
          const sm = s.liveSummary || {};

          const cardVal = Number(sm.netCard !== undefined ? sm.netCard : (sm.cardCollected || 0));
          const bankVal = Number(sm.bankCollected || sm.salesBank || 0);
          const dueVal = Number(sm.netDue !== undefined ? sm.netDue : (sm.otherCollected || 0));

          consolidated.netCash += (sm.netCash !== undefined ? Number(sm.netCash) : Number(sm.cashCollected || 0));
          consolidated.netUpi += (sm.netUpi !== undefined ? Number(sm.netUpi) : Number(sm.upiCollected || 0));
          consolidated.netCard += (cardVal > 0 ? cardVal : bankVal);
          consolidated.netDue += dueVal;

          consolidated.salesCash += Number(sm.salesCash || sm.cashCollected || 0);
          consolidated.salesUpi += Number(sm.salesUpi || sm.upiCollected || 0);
          consolidated.salesCard += Number(sm.salesCard || cardVal || bankVal || 0);
          consolidated.salesDue += Number(sm.salesDue || dueVal || 0);
          consolidated.salesTotalPaid += Number(sm.salesTotalPaid || sm.totalGrossSales || 0);

          consolidated.totalSalesInvoices += Number(sm.totalSalesInvoices || sm.totalBillsCount || 0);
          consolidated.totalGrossSales += Number(sm.totalGrossSales || 0);
          consolidated.totalSalesDiscount += Number(sm.totalSalesDiscount || sm.totalDiscounts || 0);
          consolidated.totalSalesTax += Number(sm.totalSalesTax || sm.totalTaxes || 0);
          consolidated.totalNetSales += Number(sm.totalNetSales || sm.netBusinessRevenue || sm.totalGrossSales || 0);

          consolidated.totalReturnInvoices += Number(sm.totalReturnInvoices || 0);
          consolidated.totalRefundAmount += Number(sm.totalRefundAmount || 0);
          consolidated.returnCash += Number(sm.returnCash || 0);
          consolidated.returnUpi += Number(sm.returnUpi || 0);
          consolidated.returnCard += Number(sm.returnCard || 0);
          consolidated.returnDue += Number(sm.returnDue || 0);

          consolidated.supplierCash += Number(sm.supplierCash || 0);
          consolidated.drawerCash += (sm.drawerCash !== undefined ? Number(sm.drawerCash) : (consolidated.salesCash - consolidated.returnCash - consolidated.supplierCash));

          consolidated.dineInSales += Number(sm.dineInSales || 0);
          consolidated.takeawaySales += Number(sm.takeawaySales || 0);
          consolidated.activeTablesCount += Number(sm.activeTablesCount || 0);
          consolidated.voidCount += Number(sm.voidCount || 0);

          if (Array.isArray(s.bills)) {
            consolidated.bills.push(...s.bills);
          }
        }
      });

      consolidated.netTotalCollection = consolidated.netCash + consolidated.netUpi + consolidated.netCard + consolidated.netDue;

      // Update Tally Section (100% Accurate)
      document.getElementById('tallySalesCash').innerText = fmt(consolidated.salesCash);
      document.getElementById('tallyReturnCash').innerText = fmt(consolidated.returnCash);
      document.getElementById('tallySupplierCash').innerText = fmt(consolidated.supplierCash);
      document.getElementById('tallyExpectedCash').innerText = fmt(consolidated.drawerCash > 0 ? consolidated.drawerCash : consolidated.netCash);
      document.getElementById('valPayTotal').innerText = fmt(consolidated.netTotalCollection > 0 ? consolidated.netTotalCollection : consolidated.totalNetSales);

      // Payment Cards
      document.getElementById('valPayCash').innerText = fmt(consolidated.netCash);
      document.getElementById('valPayUpi').innerText = fmt(consolidated.netUpi);
      document.getElementById('valPayCard').innerText = fmt(consolidated.netCard);
      document.getElementById('valPayDue').innerText = fmt(consolidated.netDue);

      const totColl = consolidated.netTotalCollection || 1;
      document.getElementById('pctPayCash').innerText = Math.round((consolidated.netCash / totColl) * 100) + '%';
      document.getElementById('pctPayUpi').innerText = Math.round((consolidated.netUpi / totColl) * 100) + '%';
      document.getElementById('pctPayCard').innerText = Math.round((consolidated.netCard / totColl) * 100) + '%';
      document.getElementById('pctPayDue').innerText = Math.round((consolidated.netDue / totColl) * 100) + '%';

      // Count bills per mode
      const bills = consolidated.bills;
      const cashCount = bills.filter(b => (b.paymentMode || '').toUpperCase().includes('CASH')).length;
      const upiCount = bills.filter(b => (b.paymentMode || '').toUpperCase().includes('UPI')).length;
      const cardCount = bills.filter(b => (b.paymentMode || '').toUpperCase().includes('CARD')).length;
      const dueCount = bills.filter(b => (b.paymentMode || '').toUpperCase().includes('DUE')).length;

      document.getElementById('subPayCash').innerText = cashCount + ' Invoices';
      document.getElementById('subPayUpi').innerText = upiCount + ' Invoices';
      document.getElementById('subPayCard').innerText = cardCount + ' Invoices';
      document.getElementById('subPayDue').innerText = dueCount + ' Invoices';

      // Operational Vitals
      document.getElementById('vitalTables').innerText = consolidated.activeTablesCount;
      document.getElementById('vitalDine').innerText = fmt(consolidated.dineInSales);
      document.getElementById('vitalTake').innerText = fmt(consolidated.takeawaySales);
      document.getElementById('vitalVoid').innerText = consolidated.voidCount;

      // Smart Hourly Rush Chart & Top Dishes
      renderHourlyChart(bills);
      renderTopDishes(bills);

      filterBillsList();
    }

    // ==========================================
    // HOURLY PEAK RUSH HEATMAP LOGIC
    // ==========================================
    function renderHourlyChart(bills) {
      const container = document.getElementById('hourlyChartContainer');
      const hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
      const hourSales = {};
      hours.forEach(h => hourSales[h] = 0);

      bills.forEach(b => {
        if (b.settledDate) {
          const d = new Date(b.settledDate);
          const h = d.getHours();
          if (hourSales[h] !== undefined) {
            hourSales[h] += Number(b.grandTotal || b.subTotal || 0);
          }
        }
      });

      const maxSales = Math.max(...Object.values(hourSales), 1);
      let peakHour = 13;
      let maxVal = 0;

      hours.forEach(h => {
        if (hourSales[h] > maxVal) {
          maxVal = hourSales[h];
          peakHour = h;
        }
      });

      const peakBadge = document.getElementById('peakHourBadge');
      if (maxVal > 0) {
        const hFmt = peakHour > 12 ? (peakHour - 12) + ' PM' : (peakHour === 12 ? '12 PM' : peakHour + ' AM');
        peakBadge.innerText = '🔥 Peak: ' + hFmt + ' (₹' + fmt(maxVal) + ')';
      } else {
        peakBadge.innerText = '🔥 Peak: Normal';
      }

      container.innerHTML = hours.map(h => {
        const val = hourSales[h];
        const pct = Math.max(8, Math.round((val / maxSales) * 100));
        const isPeak = (h === peakHour && val > 0);
        const barColor = isPeak ? 'bg-gradient-to-t from-amber-500 to-yellow-400 shadow-md shadow-amber-500/30' : (val > 0 ? 'bg-brand-500' : 'bg-slate-800');
        const hLabel = h > 12 ? (h - 12) + 'p' : h + 'a';

        return \`
          <div class="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer" title="\${hLabel.toUpperCase()}: ₹\${fmt(val)}">
            <div style="height: \${pct}%;" class="w-full max-w-[14px] \${barColor} rounded-t-sm transition-all duration-300"></div>
          </div>
        \`;
      }).join('');
    }

    // ==========================================
    // TOP 5 BESTSELLER DISHES LOGIC
    // ==========================================
    function renderTopDishes(bills) {
      const container = document.getElementById('topDishesList');
      const itemMap = {};

      bills.forEach(b => {
        if (Array.isArray(b.items)) {
          b.items.forEach(i => {
            const name = i.itemName || 'Special Dish';
            if (!itemMap[name]) {
              itemMap[name] = { name: name, qty: 0, revenue: 0, isVeg: i.isVeg !== false };
            }
            itemMap[name].qty += Number(i.qty || 1);
            itemMap[name].revenue += Number(i.lineTotal || (i.qty * i.price) || 0);
          });
        }
      });

      const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

      if (topItems.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">No dish items recorded yet today.</div>';
        return;
      }

      container.innerHTML = topItems.map((item, idx) => {
        const medalColors = ['text-yellow-400 bg-yellow-400/10 border-yellow-400/30', 'text-slate-300 bg-slate-300/10 border-slate-300/30', 'text-amber-600 bg-amber-600/10 border-amber-600/30', 'text-slate-400 bg-slate-800 border-slate-700', 'text-slate-400 bg-slate-800 border-slate-700'];
        const vegDot = item.isVeg ? '<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1"></span>' : '<span class="w-2 h-2 rounded-full bg-rose-500 inline-block mr-1"></span>';

        return \`
          <div class="flex items-center justify-between text-xs bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
            <div class="flex items-center space-x-2">
              <span class="w-5 h-5 rounded-lg border font-mono font-black text-[10px] flex items-center justify-center \${medalColors[idx]}">#\${idx + 1}</span>
              <div>
                <div class="font-bold text-white flex items-center">\${vegDot}\${item.name}</div>
                <div class="text-[10px] text-slate-400">\${item.qty} units sold</div>
              </div>
            </div>
            <div class="text-right">
              <span class="font-mono font-extrabold text-emerald-400">₹\${fmt(item.revenue)}</span>
            </div>
          </div>
        \`;
      }).join('');
    }

    // ==========================================
    // 1-TAP PAYMENT CROSS FILTER
    // ==========================================
    function applyPaymentFilter(mode) {
      if (activePaymentFilter === mode) {
        clearCrossFilter();
        return;
      }
      activePaymentFilter = mode;
      
      ['Cash', 'Upi', 'Card', 'Due'].forEach(m => {
        const el = document.getElementById('cardPay' + m);
        if (m.toLowerCase() === mode.toLowerCase()) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      });

      const badge = document.getElementById('activeFilterBadge');
      badge.classList.remove('hidden');
      badge.innerText = '✕ Filter: ' + mode;

      filterBillsList();
    }

    function clearCrossFilter() {
      activePaymentFilter = null;
      ['Cash', 'Upi', 'Card', 'Due'].forEach(m => {
        document.getElementById('cardPay' + m).classList.remove('selected');
      });
      document.getElementById('activeFilterBadge').classList.add('hidden');
      filterBillsList();
    }

    function filterBillsList() {
      if (!currentStoreData || !currentStoreData.stores) return;
      const search = (document.getElementById('searchInput').value || '').toLowerCase().trim();

      let bills = [];
      Object.keys(currentStoreData.stores).forEach(id => {
        if (selectedStoreId === 'ALL' || selectedStoreId === id) {
          if (Array.isArray(currentStoreData.stores[id].bills)) {
            bills.push(...currentStoreData.stores[id].bills);
          }
        }
      });

      if (activePaymentFilter) {
        bills = bills.filter(b => (b.paymentMode || '').toLowerCase().includes(activePaymentFilter.toLowerCase()));
      }

      if (search) {
        bills = bills.filter(b => 
          (b.invoiceNo || '').toLowerCase().includes(search) ||
          (b.tableName || '').toLowerCase().includes(search) ||
          (b.customerName || '').toLowerCase().includes(search) ||
          (b.paymentMode || '').toLowerCase().includes(search)
        );
      }

      renderBillsList(bills);
    }

    function renderBillsList(bills) {
      const container = document.getElementById('billsList');
      document.getElementById('tabCountBills').innerText = bills.length;

      if (!bills || bills.length === 0) {
        container.innerHTML = \`
          <div class="py-10 text-center text-slate-500 text-xs">
            \${activePaymentFilter ? 'No ' + activePaymentFilter + ' bills found.' : 'No bills recorded yet today.'}<br>
            <span class="text-[10px] text-slate-600 mt-1 block">Live transactions from POS will instantly stream here</span>
          </div>\`;
        return;
      }

      const sorted = [...bills].sort((a, b) => new Date(b.settledDate || 0) - new Date(a.settledDate || 0));
      window.currentRenderedBills = sorted;

      container.innerHTML = sorted.map((b, idx) => {
        const timeStr = b.settledDate ? new Date(b.settledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const items = b.items || [];
        const itemsPreview = items.map(i => i.qty + 'x ' + i.itemName).slice(0, 3).join(', ') + (items.length > 3 ? '...' : '');

        let payBadgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
        const pm = (b.paymentMode || '').toUpperCase();
        if (pm.includes('CASH')) payBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        else if (pm.includes('UPI') || pm.includes('QR')) payBadgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
        else if (pm.includes('CARD')) payBadgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        else if (pm.includes('DUE')) payBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';

        return \`
          <div onclick="viewBillDetails(\${idx})" class="kpi-card bg-slate-950/70 border border-slate-800 hover:border-slate-700 active:border-emerald-500/50 rounded-2xl p-3.5 space-y-2 transition cursor-pointer select-none">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center space-x-2">
                <span class="font-black text-white font-mono">#\${b.invoiceNo || b.orderId}</span>
                <span class="text-[10px] px-2 py-0.5 rounded border font-bold \${payBadgeColor}">\${b.paymentMode || 'Cash'}</span>
                <span class="text-[10px] text-slate-400 font-medium">\${b.orderType || 'DineIn'}</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-black font-mono text-emerald-400">₹\${fmt(b.grandTotal || b.subTotal || 0)}</span>
              </div>
            </div>

            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span class="flex items-center space-x-1">
                <span>📍 \${b.tableName || 'Counter'}</span>
                <span>•</span>
                <span>👤 \${b.customerName || 'Walk-in'}</span>
              </span>
              <span class="text-[10px] text-slate-500 font-mono">\${timeStr}</span>
            </div>

            \${items.length > 0 ? \`
              <div class="text-[10px] text-slate-400 bg-slate-900/60 rounded-xl px-2.5 py-1.5 border border-slate-800/80 truncate flex items-center justify-between">
                <span class="truncate">🍽️ \${itemsPreview}</span>
                <span class="text-[9px] text-brand-400 font-bold ml-1 shrink-0">Inspect ➔</span>
              </div>
            \` : ''}
          </div>
        \`;
      }).join('');
    }

    let activeInspectedBill = null;

    function viewBillDetails(idx) {
      if (!window.currentRenderedBills || !window.currentRenderedBills[idx]) return;
      const b = window.currentRenderedBills[idx];
      activeInspectedBill = b;

      document.getElementById('invModalNo').innerText = '#' + (b.invoiceNo || b.orderId);
      document.getElementById('invModalStatus').innerText = (b.orderStatus || 'PAID').toUpperCase();
      document.getElementById('invModalCashierText').innerText = b.cashierName || 'Admin';
      document.getElementById('invModalWaiter').innerText = b.waiterName || 'Self / Counter';
      document.getElementById('invModalTable').innerText = (b.tableName || 'Counter') + ' (' + (b.orderType || 'DineIn') + ')';

      const d = b.settledDate ? new Date(b.settledDate) : new Date();
      document.getElementById('invModalTime').innerText = d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      document.getElementById('invModalCustomer').innerText = (b.customerName || 'Walk-in') + (b.customerPhone ? ' (' + b.customerPhone + ')' : '');
      document.getElementById('invModalToken').innerText = '#' + (b.tokenNo || '1');

      // Items list
      const items = b.items || [];
      document.getElementById('invModalItemCount').innerText = items.length + ' item(s)';
      const listContainer = document.getElementById('invModalItemsList');

      if (items.length === 0) {
        listContainer.innerHTML = '<div class="text-xs text-slate-500 p-3 bg-slate-950/40 rounded-xl text-center">No itemised details available for this invoice.</div>';
      } else {
        listContainer.innerHTML = items.map(function(item) {
          var variant = item.variantName ? '<span class="text-indigo-400 ml-1">(' + item.variantName + ')</span>' : '';
          var category = item.categoryName ? '<span class="text-slate-500 ml-1">• ' + item.categoryName + '</span>' : '';
          var lineTotal = item.lineTotal || (item.qty * item.price);
          return \`
            <div class="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0">
              <div class="flex-1 pr-2">
                <div class="font-bold text-white">\${item.qty}x \${item.itemName} \${variant}</div>
                <div class="text-[10px] text-slate-500 font-mono">₹\${fmt(item.price)} each \${category}</div>
              </div>
              <div class="font-mono font-bold text-slate-200">
                ₹\${fmt(lineTotal)}
              </div>
            </div>\`;
        }).join('');
      }

      // Amounts
      const sub = Number(b.subTotal || 0);
      const disc = Number(b.discountAmount || 0);
      const tax = Number(b.taxAmount || 0);
      const grand = Number(b.grandTotal || (sub - disc + tax));

      document.getElementById('invModalSubtotal').innerText = fmt(sub > 0 ? sub : (grand + disc - tax));
      document.getElementById('invModalDiscount').innerText = fmt(disc);
      document.getElementById('invModalTax').innerText = fmt(tax);
      document.getElementById('invModalGrandTotal').innerText = fmt(grand);
      document.getElementById('invModalPayMode').innerText = (b.paymentMode || 'CASH').toUpperCase();

      document.getElementById('invoiceModal').classList.remove('hidden');
    }

    function closeInvoiceModal() {
      document.getElementById('invoiceModal').classList.add('hidden');
      activeInspectedBill = null;
    }

    function shareBillOnWhatsApp() {
      if (!activeInspectedBill) return;
      const b = activeInspectedBill;
      const items = (b.items || []).map(i => i.qty + 'x ' + i.itemName + ' - ₹' + fmt(i.lineTotal || (i.qty * i.price))).join('%0A');
      const text = \`🧾 *XRestro Bill Receipt*%0AInvoice: #\${b.invoiceNo || b.orderId}%0ATable: \${b.tableName || 'Counter'}%0ADate: \${new Date(b.settledDate || Date.now()).toLocaleDateString('en-GB')}%0A----------------------------%0A\${items}%0A----------------------------%0A*Grand Total: ₹\${fmt(b.grandTotal || b.subTotal || 0)}*%0APaid Via: \${b.paymentMode || 'Cash'}%0AThank you! Visit again.\`;
      window.open('https://api.whatsapp.com/send?text=' + text, '_blank');
    }

    function openPinModal() {
      document.getElementById('pinModal').classList.remove('hidden');
      document.getElementById('currPin').value = '';
      document.getElementById('newPin1').value = '';
      document.getElementById('newPin2').value = '';
      document.getElementById('pinModalError').classList.add('hidden');
    }

    function closePinModal() {
      document.getElementById('pinModal').classList.add('hidden');
    }

    async function submitChangePin() {
      const oldPin = document.getElementById('currPin').value.trim();
      const newPin = document.getElementById('newPin1').value.trim();
      const confirmPin = document.getElementById('newPin2').value.trim();
      const errBox = document.getElementById('pinModalError');

      if (!oldPin || !newPin || !confirmPin) {
        errBox.innerText = 'Please fill all PIN fields.';
        errBox.classList.remove('hidden');
        return;
      }
      if (newPin !== confirmPin) {
        errBox.innerText = 'New PIN and Confirm PIN do not match.';
        errBox.classList.remove('hidden');
        return;
      }
      if (newPin.length !== 4) {
        errBox.innerText = 'New PIN must be exactly 4 digits.';
        errBox.classList.remove('hidden');
        return;
      }

      try {
        const res = await fetch('/api/v1/owner/change-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: currentOwnerPhone, oldPin, newPin })
        });
        const data = await res.json();
        if (data.success) {
          currentOwnerPin = newPin;
          sessionStorage.setItem('xion_owner_pin', newPin);
          localStorage.setItem('xion_owner_pin', newPin);
          alert('Security PIN updated successfully!');
          closePinModal();
        } else {
          errBox.innerText = data.error || 'Failed to update PIN';
          errBox.classList.remove('hidden');
        }
      } catch (e) {
        errBox.innerText = 'Network error while changing PIN';
        errBox.classList.remove('hidden');
      }
    }

    // PULL TO REFRESH GESTURE ENGINE
    (function initPullToRefresh() {
      let startY = 0;
      let currentY = 0;
      let isPulling = false;
      let isRefreshing = false;
      const threshold = 65;
      const maxPull = 90;

      const indicator = document.getElementById('ptrIndicator');
      const ptrText = document.getElementById('ptrText');
      const ptrSpinner = document.getElementById('ptrSpinner');
      const ptrIcon = document.getElementById('ptrIcon');

      if (!indicator) return;

      window.addEventListener('touchstart', function(e) {
        if (window.scrollY <= 2 && !isRefreshing && e.touches && e.touches.length === 1) {
          startY = e.touches[0].pageY;
          isPulling = true;
        }
      }, { passive: true });

      window.addEventListener('touchmove', function(e) {
        if (!isPulling || isRefreshing || !e.touches || e.touches.length !== 1) return;
        currentY = e.touches[0].pageY;
        const diff = currentY - startY;

        if (diff > 0 && window.scrollY <= 2) {
          if (e.cancelable) e.preventDefault();
          const pullDist = Math.min(diff * 0.42, maxPull);
          indicator.style.height = pullDist + 'px';
          indicator.style.opacity = String(Math.min(pullDist / 20, 1));

          if (pullDist >= threshold) {
            ptrText.innerText = 'Release to refresh';
            ptrIcon.style.transform = 'rotate(180deg)';
          } else {
            ptrText.innerText = 'Pull down to refresh';
            ptrIcon.style.transform = 'rotate(0deg)';
          }
        }
      }, { passive: false });

      window.addEventListener('touchend', async function() {
        if (!isPulling || isRefreshing) return;
        isPulling = false;
        const diff = currentY - startY;
        const pullDist = Math.min(diff * 0.42, maxPull);

        if (pullDist >= threshold && window.scrollY <= 2) {
          isRefreshing = true;
          indicator.style.height = '46px';
          indicator.style.opacity = '1';
          ptrIcon.classList.add('hidden');
          ptrSpinner.classList.remove('hidden');
          ptrText.innerText = 'Refreshing live data...';

          try {
            await fetchData();
            ptrText.innerText = 'Updated!';
          } catch (e) {
            ptrText.innerText = 'Update failed';
          }

          setTimeout(function() {
            indicator.style.height = '0px';
            indicator.style.opacity = '0';
            setTimeout(function() {
              ptrIcon.classList.remove('hidden');
              ptrSpinner.classList.add('hidden');
              ptrIcon.style.transform = 'rotate(0deg)';
              ptrText.innerText = 'Pull down to refresh';
              isRefreshing = false;
            }, 200);
          }, 500);
        } else {
          indicator.style.height = '0px';
          indicator.style.opacity = '0';
          ptrIcon.style.transform = 'rotate(0deg)';
        }
        startY = 0;
        currentY = 0;
      }, { passive: true });
    })();

    function fmt(num) {
      const n = Number(num || 0);
      return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  </script>
</body>
</html>`;
}
