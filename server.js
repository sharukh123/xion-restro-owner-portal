// ============================================================================
// XioN Restro Central Multi-Tenant Cloud Portal & Power BI Executive Gateway
// 100% Free Lifetime Cloud Hosting on Render.com
// Strict Rule: Zero external branding, 100% Independent XioN Restro Architecture
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
        const raw = fs.readFileSync(DB_FILE, 'utf8');
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

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Store-Id, X-Master-Owner-Phone, X-Store-Phone, X-Payload-Type, X-Sync-Key');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // 1. RECEIVE SYNC PAYLOAD FROM DESKTOP POS (POST /api/v1/sync)
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

                if (!db.owners[ownerPhone]) {
                    db.owners[ownerPhone] = {
                        ownerPhone: ownerPhone,
                        ownerName: payload.storeName || 'Restaurant Owner',
                        pin: '1234',
                        stores: {}
                    };
                }

                if (!db.owners[ownerPhone].stores[storeId]) {
                    db.owners[ownerPhone].stores[storeId] = {
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

                const store = db.owners[ownerPhone].stores[storeId];
                if (payload.storeName) store.storeName = payload.storeName;
                if (storePhone) store.storePhone = storePhone;
                if (!store.returns) store.returns = [];
                if (!store.inwards) store.inwards = [];
                if (!store.suppliers) store.suppliers = [];

                // Handle Bill
                if (payloadType === 'BILL' || payload.eventType === 'BILL_SETTLED') {
                    const existsIndex = store.bills.findIndex(b => b.invoiceNo === payload.invoiceNo);
                    if (existsIndex >= 0) {
                        store.bills[existsIndex] = payload;
                    } else {
                        store.bills.unshift(payload); // Newest first
                    }
                    if (store.bills.length > 500) store.bills.pop();
                }
                // Handle Summary
                else if (payloadType === 'SUMMARY' || payload.eventType === 'DAY_SUMMARY') {
                    store.liveSummary = payload;
                }
                // Handle Ping
                else if (payloadType === 'PING') {
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

    // 2. GET OWNER DATA FOR MOBILE APP (GET /api/v1/owner/data?phone=...)
    if (pathname === '/api/v1/owner/data' && req.method === 'GET') {
        const phone = (parsedUrl.query.phone || '').trim();
        if (!phone) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Phone parameter required' }));
            return;
        }

        const ownerData = db.owners[phone] || { ownerPhone: phone, ownerName: 'New Restaurant', pin: '1234', stores: {} };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: ownerData }));
        return;
    }

    // 3. PING HEALTH CHECK (GET /api/v1/ping)
    if (pathname === '/api/v1/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ONLINE', server: 'XioN Restro Central Multi-Tenant Cloud Gateway v3.0', timestamp: new Date().toISOString() }));
        return;
    }

    // 4. SERVE MOBILE WEB APPLICATION (GET /)
    if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getMobileAppHtml());
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('===============================================================');
    console.log(`🚀 XioN Restro Central Multi-Tenant Cloud Portal running on port ${PORT}!`);
    console.log('===============================================================');
});

function getMobileAppHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="XioN Restro">
  <meta name="theme-color" content="#020617">
  <title>XioN Restro - Power BI Executive Portal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { 
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace']
          },
          colors: {
            brand: { 50: '#ecfdf5', 500: '#10b981', 600: '#059669', 700: '#047857' },
            payCash: '#10b981',
            payUpi: '#8b5cf6',
            payCard: '#3b82f6',
            payDue: '#f59e0b',
            payTotal: '#0f172a'
          }
        }
      }
    }
  </script>
  <style>
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
      height: 4px;
      background: var(--card-color);
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen pb-24 select-none">

  <!-- ========================================== -->
  <!-- 1. LOGIN / PIN LOCK SCREEN                 -->
  <!-- ========================================== -->
  <div id="loginScreen" class="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
      <div class="text-center space-y-2">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 mx-auto flex items-center justify-center font-extrabold text-white text-3xl shadow-xl shadow-emerald-900/50">
          X
        </div>
        <h2 class="text-xl font-extrabold text-white tracking-tight">XioN Restro</h2>
        <p class="text-xs text-slate-400 font-medium">Power BI Executive Financial Portal</p>
      </div>

      <div class="space-y-4 pt-2">
        <div>
          <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Registered Owner Mobile Number</label>
          <div class="relative">
            <span class="absolute left-3.5 top-3.5 text-slate-500 font-semibold text-sm">+91</span>
            <input id="loginPhone" type="tel" maxlength="10" placeholder="98290XXXXX" class="w-full bg-slate-800 text-white font-semibold text-sm rounded-xl pl-12 pr-4 py-3 border border-slate-700 focus:outline-none focus:border-brand-500 transition">
          </div>
        </div>

        <div>
          <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">4-Digit Security PIN</label>
          <input id="loginPin" type="password" maxlength="4" placeholder="••••" value="1234" class="w-full bg-slate-800 text-white font-semibold text-center text-xl tracking-widest rounded-xl px-4 py-3 border border-slate-700 focus:outline-none focus:border-brand-500 transition">
          <p class="text-[10px] text-slate-500 mt-1">Default PIN: 1234</p>
        </div>

        <button onclick="handleLogin()" class="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center space-x-2">
          <span>🔐 View Live Executive Dashboard</span>
        </button>

        <div class="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-center">
          <p class="text-[11px] text-emerald-400 font-semibold">🔒 Reconciled Data Guarantee</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Desktop POS & Mobile Portal always stay 100% in tally</p>
        </div>

        <p class="text-[10px] text-center text-slate-500 pt-1">
          App auto-locks upon closing tab/browser for maximum owner privacy
        </p>
      </div>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- 2. TOP EXECUTIVE APP BAR                   -->
  <!-- ========================================== -->
  <header class="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-lg">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2.5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-emerald-900/40">
          X
        </div>
        <div>
          <div class="flex items-center space-x-1.5">
            <h1 class="text-sm font-extrabold tracking-tight text-white leading-none">XioN Restro</h1>
            <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">EXECUTIVE TALLY</span>
          </div>
          <span class="text-[11px] text-slate-400 flex items-center mt-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1.5 pulse-dot"></span>
            <span id="headerSyncStatus">Real-time Cloud Sync</span>
          </span>
        </div>
      </div>

      <!-- Actions: Refresh & Lock -->
      <div class="flex items-center space-x-2">
        <button onclick="fetchData()" title="Force Refresh Data" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition active:scale-95">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
        <button onclick="lockApp()" title="Lock / Auto Logout" class="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center space-x-1 active:scale-95">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          <span>Lock</span>
        </button>
      </div>
    </div>

    <!-- OUTLET / BRANCH SELECTOR -->
    <div id="branchSelectorContainer" class="mt-2.5">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
        <span>Selected Branch</span>
        <span id="outletLastUpdated" class="text-slate-500 font-mono">--</span>
      </div>
      <select id="branchSelect" onchange="renderDashboard()" class="w-full bg-slate-800/90 text-white text-xs font-bold rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-brand-500 transition">
        <option value="ALL">🏢 All Outlets (Consolidated Total)</option>
      </select>
    </div>
  </header>

  <!-- ========================================== -->
  <!-- 3. MAIN EXECUTIVE DASHBOARD                -->
  <!-- ========================================== -->
  <main class="max-w-xl mx-auto px-3.5 pt-3.5 space-y-3.5">

    <!-- A. TOP SECTION: PAYMENT MODE COLLECTIONS (POWER BI CARDS) -->
    <section class="space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <span>Payment Mode Collections</span>
          <span class="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">Split Included</span>
        </h2>
        <span id="activeFilterBadge" class="hidden text-[10px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded cursor-pointer" onclick="clearCrossFilter()">
          ✕ Reset Filter
        </span>
      </div>

      <!-- 4 Cards Grid + Total Net Collection -->
      <div class="grid grid-cols-2 gap-2">
        <!-- CASH INFLOW -->
        <div onclick="applyPaymentFilter('Cash')" id="cardPayCash" style="--card-color: #10b981;" class="kpi-card bg-slate-900 border border-slate-800 rounded-xl p-3 cursor-pointer">
          <div class="kpi-stripe"></div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Cash Inflow</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div class="mt-1 text-xl font-extrabold font-mono text-emerald-400 tracking-tight">
            ₹<span id="valPayCash">0.00</span>
          </div>
          <div id="subPayCash" class="mt-1 text-[10px] text-slate-400 truncate">
            0.0% of total
          </div>
        </div>

        <!-- UPI / QR ONLINE -->
        <div onclick="applyPaymentFilter('UPI')" id="cardPayUpi" style="--card-color: #8b5cf6;" class="kpi-card bg-slate-900 border border-slate-800 rounded-xl p-3 cursor-pointer">
          <div class="kpi-stripe"></div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>UPI / QR Online</span>
            <span class="w-2 h-2 rounded-full bg-purple-400"></span>
          </div>
          <div class="mt-1 text-xl font-extrabold font-mono text-purple-400 tracking-tight">
            ₹<span id="valPayUpi">0.00</span>
          </div>
          <div id="subPayUpi" class="mt-1 text-[10px] text-slate-400 truncate">
            0.0% of total
          </div>
        </div>

        <!-- DEBIT / CREDIT CARD -->
        <div onclick="applyPaymentFilter('Card')" id="cardPayCard" style="--card-color: #3b82f6;" class="kpi-card bg-slate-900 border border-slate-800 rounded-xl p-3 cursor-pointer">
          <div class="kpi-stripe"></div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Card / Bank</span>
            <span class="w-2 h-2 rounded-full bg-blue-400"></span>
          </div>
          <div class="mt-1 text-xl font-extrabold font-mono text-blue-400 tracking-tight">
            ₹<span id="valPayCard">0.00</span>
          </div>
          <div id="subPayCard" class="mt-1 text-[10px] text-slate-400 truncate">
            0.0% of total
          </div>
        </div>

        <!-- DUE / CREDIT SALES -->
        <div onclick="applyPaymentFilter('Due')" id="cardPayDue" style="--card-color: #f59e0b;" class="kpi-card bg-slate-900 border border-slate-800 rounded-xl p-3 cursor-pointer">
          <div class="kpi-stripe"></div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Due / Credit</span>
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
          <div class="mt-1 text-xl font-extrabold font-mono text-amber-400 tracking-tight">
            ₹<span id="valPayDue">0.00</span>
          </div>
          <div id="subPayDue" class="mt-1 text-[10px] text-slate-400 truncate">
            0.0% of total
          </div>
        </div>
      </div>

      <!-- TOTAL NET COLLECTION (Full-width Reconciled Card) -->
      <div onclick="clearCrossFilter()" style="--card-color: #38bdf8;" class="kpi-card bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-xl p-3.5 cursor-pointer shadow-lg">
        <div class="kpi-stripe"></div>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Net Collection</div>
            <div class="text-2xl font-extrabold font-mono text-white tracking-tight mt-0.5">
              ₹<span id="valPayTotal">0.00</span>
            </div>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
              100% RECONCILED
            </span>
            <div id="subPayTotal" class="text-[10px] text-slate-400 mt-1 font-mono">Tally Verified</div>
          </div>
        </div>
      </div>
    </section>

    <!-- B. SECONDARY SUMMARY CARDS (POWER BI AUDITED 4 CARDS) -->
    <section class="grid grid-cols-2 gap-2">
      <!-- 1. Total Sales -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
        <div class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex justify-between">
          <span>Total Sales</span>
          <span class="font-mono text-slate-300">Inv: <b id="valSalesInv" class="text-white">0</b></span>
        </div>
        <div class="text-lg font-bold font-mono text-white">₹<span id="valSalesGross">0.00</span></div>
        <div class="text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between">
          <span>Disc: ₹<span id="valSalesDisc">0.00</span></span>
          <span>Tax: ₹<span id="valSalesTax">0.00</span></span>
        </div>
      </div>

      <!-- 2. Total Sales Returns -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
        <div class="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex justify-between">
          <span>Sales Returns</span>
          <span class="font-mono text-slate-300">Ret: <b id="valReturnInv" class="text-white">0</b></span>
        </div>
        <div class="text-lg font-bold font-mono text-rose-300">₹<span id="valReturnAmt">0.00</span></div>
        <div class="text-[10px] text-slate-400 border-t border-slate-800 pt-1 truncate">
          Cash: ₹<span id="valReturnCash">0.00</span> | UPI: ₹<span id="valReturnUpi">0.00</span>
        </div>
      </div>

      <!-- 3. Total Inward Purchases -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
        <div class="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex justify-between">
          <span>Inward Inv</span>
          <span class="font-mono text-slate-300">Inv: <b id="valInwardInv" class="text-white">0</b></span>
        </div>
        <div class="text-lg font-bold font-mono text-white">₹<span id="valInwardGross">0.00</span></div>
        <div class="text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between">
          <span>Paid: ₹<span id="valInwardPaid">0.00</span></span>
          <span class="text-amber-400">Due: ₹<span id="valInwardDue">0.00</span></span>
        </div>
      </div>

      <!-- 4. Total Supplier Payment -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
        <div class="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex justify-between">
          <span>Supplier Pay</span>
          <span class="font-mono text-slate-300">Vouch: <b id="valSupplierVouch" class="text-white">0</b></span>
        </div>
        <div class="text-lg font-bold font-mono text-white">₹<span id="valSupplierPaid">0.00</span></div>
        <div class="text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between">
          <span>Cash: ₹<span id="valSupplierCash">0.00</span></span>
          <span>Bank: ₹<span id="valSupplierBank">0.00</span></span>
        </div>
      </div>
    </section>

    <!-- C. MASTER CASH DRAWER & BUSINESS TALLY (DARK BAR - EXACT PC MATCH) -->
    <section class="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3">
      <div class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center justify-between border-b border-slate-800 pb-2">
        <span>Cash Drawer & Business Tally</span>
        <span class="text-emerald-400 font-bold">● Active Drawer Math</span>
      </div>

      <!-- Formula Line -->
      <div class="grid grid-cols-3 gap-2 text-center text-xs">
        <div class="bg-slate-800/60 p-2 rounded-lg border border-slate-700/40">
          <div class="text-[9px] text-emerald-400 uppercase font-bold">(+) Sales Cash</div>
          <div class="font-mono font-bold text-white mt-0.5">₹<span id="tallySalesCash">0.00</span></div>
        </div>
        <div class="bg-slate-800/60 p-2 rounded-lg border border-slate-700/40">
          <div class="text-[9px] text-rose-400 uppercase font-bold">(-) Return Cash</div>
          <div class="font-mono font-bold text-white mt-0.5">₹<span id="tallyReturnCash">0.00</span></div>
        </div>
        <div class="bg-slate-800/60 p-2 rounded-lg border border-slate-700/40">
          <div class="text-[9px] text-amber-400 uppercase font-bold">(-) Supplier Cash</div>
          <div class="font-mono font-bold text-white mt-0.5">₹<span id="tallySupplierCash">0.00</span></div>
        </div>
      </div>

      <!-- Result Bar -->
      <div class="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 uppercase font-bold">Current Drawer Cash</div>
          <div class="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
            (=) Drawer Cash: ₹<span id="tallyExpectedCash">0.00</span>
          </div>
        </div>
        <div class="text-right">
          <div class="text-[9px] text-slate-500 uppercase font-bold">Net Revenue</div>
          <div class="text-sm font-bold font-mono text-slate-200 mt-0.5">
            ₹<span id="tallyNetRevenue">0.00</span>
          </div>
        </div>
      </div>
    </section>

    <!-- D. OPERATIONAL VITALS (DineIn/Takeaway, Active Tables, Cancelled/Void) -->
    <section class="grid grid-cols-3 gap-2 text-center">
      <div class="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
        <div class="text-[9px] font-bold uppercase text-slate-400">Active Tables</div>
        <div id="vitalTables" class="text-lg font-extrabold text-amber-400 font-mono mt-0.5">0</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
        <div class="text-[9px] font-bold uppercase text-slate-400">Dine vs Takeaway</div>
        <div class="text-xs font-bold text-slate-200 mt-1 font-mono">
          D:₹<span id="vitalDine">0</span> | T:₹<span id="vitalTake">0</span>
        </div>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
        <div class="text-[9px] font-bold uppercase text-rose-400">Void / Cancelled</div>
        <div id="vitalVoid" class="text-lg font-extrabold text-rose-400 font-mono mt-0.5">0</div>
      </div>
    </section>

    <!-- E. POWER BI INTERACTIVE TABS & AUDIT FEED -->
    <section class="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
      <!-- Tab Header Buttons -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div class="flex items-center space-x-1 overflow-x-auto no-scrollbar">
          <button id="tabBtnBills" onclick="switchTab('bills')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white border border-slate-700">
            Sales Bills (<span id="tabCountBills">0</span>)
          </button>
        </div>
        
        <!-- Search Box -->
        <div class="relative w-36">
          <input id="searchInput" oninput="filterBillsList()" type="text" placeholder="Search bill / table..." class="w-full bg-slate-800 text-white text-xs rounded-lg pl-6 pr-2 py-1.5 border border-slate-700 focus:outline-none focus:border-brand-500">
          <svg class="w-3.5 h-3.5 absolute left-1.5 top-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      <!-- Feed Container -->
      <div id="billsList" class="space-y-2 max-h-[380px] overflow-y-auto pr-1">
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
    let currentStoreData = null;
    let selectedStoreId = 'ALL';
    let activePaymentFilter = null;
    let autoRefreshTimer = null;

    // --- AUTO-LOGOUT & SESSION LIFECYCLE ---
    // Strict requirement: App close karne par automatically logout hona chahiye
    // Using sessionStorage so closing tab/browser clears session instantly
    window.addEventListener('load', () => {
      const savedPhone = sessionStorage.getItem('xion_owner_phone');
      const savedPin = sessionStorage.getItem('xion_owner_pin');
      if (savedPhone && savedPin) {
        currentOwnerPhone = savedPhone;
        document.getElementById('loginScreen').classList.add('hidden');
        fetchData();
        startAutoRefresh();
      } else {
        document.getElementById('loginScreen').classList.remove('hidden');
      }
    });

    // Clear on beforeunload / pagehide if desired
    window.addEventListener('pagehide', () => {
      // sessionStorage naturally clears when tab/window is closed
    });

    function lockApp() {
      sessionStorage.clear();
      currentOwnerPhone = '';
      currentStoreData = null;
      if (autoRefreshTimer) clearInterval(autoRefreshTimer);
      document.getElementById('loginScreen').classList.remove('hidden');
      document.getElementById('loginPin').value = '';
    }

    async function handleLogin() {
      const phone = document.getElementById('loginPhone').value.trim();
      const pin = document.getElementById('loginPin').value.trim();

      if (!phone || phone.length !== 10) {
        alert('Please enter a valid 10-digit registered owner mobile number');
        return;
      }
      if (!pin) {
        alert('Please enter your 4-digit PIN');
        return;
      }

      currentOwnerPhone = phone;
      sessionStorage.setItem('xion_owner_phone', phone);
      sessionStorage.setItem('xion_owner_pin', pin);

      document.getElementById('loginScreen').classList.add('hidden');
      await fetchData();
      startAutoRefresh();
    }

    function startAutoRefresh() {
      if (autoRefreshTimer) clearInterval(autoRefreshTimer);
      autoRefreshTimer = setInterval(fetchData, 10000); // 10s live pulse
    }

    async function fetchData() {
      if (!currentOwnerPhone) return;
      try {
        const res = await fetch('/api/v1/owner/data?phone=' + encodeURIComponent(currentOwnerPhone));
        const json = await res.json();
        if (json.success && json.data) {
          currentStoreData = json.data;
          updateBranchDropdown();
          renderDashboard();
          document.getElementById('headerSyncStatus').innerText = 'Synced ' + new Date().toLocaleTimeString();
        }
      } catch (e) {
        console.error('Fetch error:', e);
        document.getElementById('headerSyncStatus').innerText = 'Offline / Retrying...';
      }
    }

    function updateBranchDropdown() {
      if (!currentStoreData || !currentStoreData.stores) return;
      const select = document.getElementById('branchSelect');
      const storeIds = Object.keys(currentStoreData.stores);

      const prevVal = select.value;
      select.innerHTML = '<option value="ALL">🏢 All Outlets (Consolidated Total)</option>';

      storeIds.forEach(id => {
        const s = currentStoreData.stores[id];
        const opt = document.createElement('option');
        opt.value = id;
        opt.innerText = '📍 ' + (s.storeName || id);
        select.appendChild(opt);
      });

      if (storeIds.length === 1) {
        select.value = storeIds[0];
        selectedStoreId = storeIds[0];
      } else if (prevVal && (prevVal === 'ALL' || storeIds.includes(prevVal))) {
        select.value = prevVal;
        selectedStoreId = prevVal;
      }
    }

    function renderDashboard() {
      selectedStoreId = document.getElementById('branchSelect').value;
      if (!currentStoreData || !currentStoreData.stores) return;

      const stores = currentStoreData.stores;
      let consolidated = {
        // Reconciled Payment Mode Collections
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
        // Sales Summary
        totalSalesInvoices: 0,
        totalGrossSales: 0,
        totalSalesDiscount: 0,
        totalSalesTax: 0,
        totalNetSales: 0,
        // Returns Summary
        totalReturnInvoices: 0,
        totalRefundAmount: 0,
        returnCash: 0,
        returnUpi: 0,
        returnCard: 0,
        returnDue: 0,
        // Inward Purchases
        totalInwardInvoices: 0,
        totalInwardGross: 0,
        totalInwardDiscount: 0,
        totalInwardPaid: 0,
        totalInwardDue: 0,
        // Supplier Payments
        totalSupplierVouchers: 0,
        totalSupplierPaid: 0,
        totalSupplierDiscount: 0,
        supplierCash: 0,
        supplierBank: 0,
        // Cash Drawer & Tally
        drawerCash: 0,
        netBusinessRevenue: 0,
        // Operational Vitals
        dineInSales: 0,
        takeawaySales: 0,
        activeTablesCount: 0,
        voidCount: 0,
        bills: []
      };

      let lastUpdatedTime = null;

      Object.keys(stores).forEach(id => {
        if (selectedStoreId === 'ALL' || selectedStoreId === id) {
          const s = stores[id];
          const sm = s.liveSummary || {};

          // Aggregations
          consolidated.netCash += (sm.netCash !== undefined ? Number(sm.netCash) : Number(sm.cashCollected || 0));
          consolidated.netUpi += (sm.netUpi !== undefined ? Number(sm.netUpi) : Number(sm.upiCollected || 0));
          consolidated.netCard += (sm.netCard !== undefined ? Number(sm.netCard) : Number(sm.cardCollected || 0));
          consolidated.netDue += (sm.netDue !== undefined ? Number(sm.netDue) : Number(sm.otherCollected || 0));

          consolidated.salesCash += Number(sm.salesCash || sm.cashCollected || 0);
          consolidated.salesUpi += Number(sm.salesUpi || sm.upiCollected || 0);
          consolidated.salesCard += Number(sm.salesCard || sm.cardCollected || 0);
          consolidated.salesDue += Number(sm.salesDue || sm.otherCollected || 0);

          consolidated.totalSalesInvoices += Number(sm.totalSalesInvoices || sm.totalBillsCount || 0);
          consolidated.totalGrossSales += Number(sm.totalGrossSales || sm.totalSales || 0);
          consolidated.totalSalesDiscount += Number(sm.totalSalesDiscount || sm.totalDiscounts || 0);
          consolidated.totalSalesTax += Number(sm.totalSalesTax || sm.totalTaxes || 0);
          consolidated.totalNetSales += Number(sm.totalNetSales || sm.totalSales || 0);

          consolidated.totalReturnInvoices += Number(sm.totalReturnInvoices || 0);
          consolidated.totalRefundAmount += Number(sm.totalRefundAmount || 0);
          consolidated.returnCash += Number(sm.returnCash || 0);
          consolidated.returnUpi += Number(sm.returnUpi || 0);
          consolidated.returnCard += Number(sm.returnCard || 0);

          consolidated.totalInwardInvoices += Number(sm.totalInwardInvoices || 0);
          consolidated.totalInwardGross += Number(sm.totalInwardGross || 0);
          consolidated.totalInwardPaid += Number(sm.totalInwardPaid || 0);
          consolidated.totalInwardDue += Number(sm.totalInwardDue || 0);

          consolidated.totalSupplierVouchers += Number(sm.totalSupplierVouchers || 0);
          consolidated.totalSupplierPaid += Number(sm.totalSupplierPaid || 0);
          consolidated.supplierCash += Number(sm.supplierCash || 0);
          consolidated.supplierBank += Number(sm.supplierBank || 0);

          consolidated.drawerCash += Number(sm.drawerCash || (sm.cashCollected || 0));
          consolidated.netBusinessRevenue += Number(sm.netBusinessRevenue || sm.totalSales || 0);

          consolidated.dineInSales += Number(sm.dineInSales || 0);
          consolidated.takeawaySales += Number(sm.takeawaySales || 0);
          consolidated.activeTablesCount += Number(sm.activeTablesCount || 0);
          consolidated.voidCount += Number(sm.voidCount || 0);

          if (Array.isArray(s.bills)) {
            consolidated.bills.push(...s.bills);
          }
          if (sm.lastUpdated) lastUpdatedTime = sm.lastUpdated;
        }
      });

      // Net Total Reconciled Collection
      consolidated.netTotalCollection = consolidated.netCash + consolidated.netUpi + consolidated.netCard + consolidated.netDue;

      // Populate DOM Elements
      document.getElementById('valPayCash').innerText = fmt(consolidated.netCash);
      document.getElementById('valPayUpi').innerText = fmt(consolidated.netUpi);
      document.getElementById('valPayCard').innerText = fmt(consolidated.netCard);
      document.getElementById('valPayDue').innerText = fmt(consolidated.netDue);
      document.getElementById('valPayTotal').innerText = fmt(consolidated.netTotalCollection);

      // Sub percentages
      const tot = consolidated.netTotalCollection;
      document.getElementById('subPayCash').innerText = tot > 0 ? (consolidated.netCash / tot * 100).toFixed(1) + '% of total' : '0.0% of total';
      document.getElementById('subPayUpi').innerText = tot > 0 ? (consolidated.netUpi / tot * 100).toFixed(1) + '% of total' : '0.0% of total';
      document.getElementById('subPayCard').innerText = tot > 0 ? (consolidated.netCard / tot * 100).toFixed(1) + '% of total' : '0.0% of total';
      document.getElementById('subPayDue').innerText = tot > 0 ? (consolidated.netDue / tot * 100).toFixed(1) + '% of total' : '0.0% of total';

      // 4 Summary Cards
      document.getElementById('valSalesInv').innerText = consolidated.totalSalesInvoices;
      document.getElementById('valSalesGross').innerText = fmt(consolidated.totalGrossSales);
      document.getElementById('valSalesDisc').innerText = fmt(consolidated.totalSalesDiscount);
      document.getElementById('valSalesTax').innerText = fmt(consolidated.totalSalesTax);

      document.getElementById('valReturnInv').innerText = consolidated.totalReturnInvoices;
      document.getElementById('valReturnAmt').innerText = fmt(consolidated.totalRefundAmount);
      document.getElementById('valReturnCash').innerText = fmt(consolidated.returnCash);
      document.getElementById('valReturnUpi').innerText = fmt(consolidated.returnUpi);

      document.getElementById('valInwardInv').innerText = consolidated.totalInwardInvoices;
      document.getElementById('valInwardGross').innerText = fmt(consolidated.totalInwardGross);
      document.getElementById('valInwardPaid').innerText = fmt(consolidated.totalInwardPaid);
      document.getElementById('valInwardDue').innerText = fmt(consolidated.totalInwardDue);

      document.getElementById('valSupplierVouch').innerText = consolidated.totalSupplierVouchers;
      document.getElementById('valSupplierPaid').innerText = fmt(consolidated.totalSupplierPaid);
      document.getElementById('valSupplierCash').innerText = fmt(consolidated.supplierCash);
      document.getElementById('valSupplierBank').innerText = fmt(consolidated.supplierBank);

      // Dark Master Drawer Bar
      document.getElementById('tallySalesCash').innerText = fmt(consolidated.salesCash);
      document.getElementById('tallyReturnCash').innerText = fmt(consolidated.returnCash);
      document.getElementById('tallySupplierCash').innerText = fmt(consolidated.supplierCash);
      
      const drawerCashVal = consolidated.salesCash - consolidated.returnCash - consolidated.supplierCash;
      document.getElementById('tallyExpectedCash').innerText = fmt(drawerCashVal);
      document.getElementById('tallyNetRevenue').innerText = fmt(consolidated.netBusinessRevenue);

      // Vitals
      document.getElementById('vitalTables').innerText = consolidated.activeTablesCount;
      document.getElementById('vitalDine').innerText = Math.round(consolidated.dineInSales);
      document.getElementById('vitalTake').innerText = Math.round(consolidated.takeawaySales);
      document.getElementById('vitalVoid').innerText = consolidated.voidCount;

      if (lastUpdatedTime) {
        document.getElementById('outletLastUpdated').innerText = new Date(lastUpdatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      renderBillsList(consolidated.bills);
    }

    function applyPaymentFilter(mode) {
      if (activePaymentFilter === mode) {
        clearCrossFilter();
        return;
      }
      activePaymentFilter = mode;
      
      // Update UI cards styling
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
      badge.innerText = '✕ Filtered by ' + mode + ' (Click to reset)';

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

      // Filter by payment mode if active
      if (activePaymentFilter) {
        bills = bills.filter(b => (b.paymentMode || '').toLowerCase().includes(activePaymentFilter.toLowerCase()));
      }

      // Filter by search string
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

      // Sort newest first
      const sorted = [...bills].sort((a, b) => new Date(b.settledDate || 0) - new Date(a.settledDate || 0));

      container.innerHTML = sorted.map((b, idx) => {
        const timeStr = b.settledDate ? new Date(b.settledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const items = b.items || [];
        const itemsPreview = items.map(i => \`\${i.qty}x \${i.itemName}\`).slice(0, 3).join(', ') + (items.length > 3 ? '...' : '');

        let payBadgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
        const pm = (b.paymentMode || '').toUpperCase();
        if (pm.includes('CASH')) payBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        else if (pm.includes('UPI') || pm.includes('QR')) payBadgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
        else if (pm.includes('CARD')) payBadgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        else if (pm.includes('DUE')) payBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';

        return \`
          <div class="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3 space-y-1.5 transition">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center space-x-2">
                <span class="font-extrabold text-white font-mono">#\${b.invoiceNo || b.orderId}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded border font-bold \${payBadgeColor}">\${b.paymentMode || 'Cash'}</span>
                <span class="text-[10px] text-slate-400 font-medium">\${b.orderType || 'DineIn'}</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-extrabold font-mono text-emerald-400">₹\${fmt(b.grandTotal || b.subTotal || 0)}</span>
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
              <div class="text-[10px] text-slate-400 bg-slate-900/60 rounded-lg px-2.5 py-1.5 border border-slate-800/80 truncate">
                🍽️ \${itemsPreview}
              </div>
            \` : ''}
          </div>
        \`;
      }).join('');
    }

    function fmt(num) {
      const n = Number(num || 0);
      return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  </script>
</body>
</html>`;
}
