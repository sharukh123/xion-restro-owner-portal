const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5055;
const DATA_FILE = path.join(__dirname, 'store_data.json');

// In-memory data store with JSON file persistence
let db = {
    owners: {}, // phone -> { name, pin, stores: { storeId: { storeName, storePhone, liveSummary, bills: [] } } }
};

// Load existing data if available
if (fs.existsSync(DATA_FILE)) {
    try {
        db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        console.error('Error loading data file:', e);
    }
}

function saveDb() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving data file:', e);
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
                        bills: []
                    };
                }

                const store = db.owners[ownerPhone].stores[storeId];
                if (payload.storeName) store.storeName = payload.storeName;
                if (storePhone) store.storePhone = storePhone;

                // Handle Bill
                if (payloadType === 'BILL' || payload.eventType === 'BILL_SETTLED') {
                    const existsIndex = store.bills.findIndex(b => b.invoiceNo === payload.invoiceNo);
                    if (existsIndex >= 0) {
                        store.bills[existsIndex] = payload;
                    } else {
                        store.bills.unshift(payload); // Newest first
                    }
                    if (store.bills.length > 300) store.bills.pop(); // Keep recent 300 bills
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
        res.end(JSON.stringify({ status: 'ONLINE', server: 'XioN Restro Central Multi-Tenant Cloud Gateway v2.5', timestamp: new Date().toISOString() }));
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>XioN Restro - Owner Live Portal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['"Plus Jakarta Sans"', 'sans-serif'] },
          colors: {
            brand: { 50: '#ecfdf5', 500: '#10b981', 600: '#059669', 700: '#047857' },
            gold: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' }
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
    .pulse-dot { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen pb-20 select-none">

  <!-- LOGIN MODAL / GATE (SHOWN IF NO OWNER LOGGED IN) -->
  <div id="loginScreen" class="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
      <div class="text-center space-y-2">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 mx-auto flex items-center justify-center font-extrabold text-white text-2xl shadow-xl shadow-emerald-900/50">
          X
        </div>
        <h2 class="text-xl font-extrabold text-white">XioN Restro</h2>
        <p class="text-xs text-slate-400">Owner Live Business Portal</p>
      </div>

      <div class="space-y-3.5 pt-2">
        <div>
          <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Registered Owner Mobile Number</label>
          <div class="relative">
            <span class="absolute left-3.5 top-3 text-slate-500 font-semibold text-sm">+91</span>
            <input id="loginPhone" type="tel" maxlength="10" placeholder="98290XXXXX" class="w-full bg-slate-800 text-white font-semibold text-sm rounded-xl pl-12 pr-4 py-3 border border-slate-700 focus:outline-none focus:border-brand-500 transition">
          </div>
        </div>

        <div>
          <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">4-Digit Security PIN</label>
          <input id="loginPin" type="password" maxlength="4" placeholder="••••" value="1234" class="w-full bg-slate-800 text-white font-semibold text-center text-lg tracking-widest rounded-xl px-4 py-2.5 border border-slate-700 focus:outline-none focus:border-brand-500 transition">
          <p class="text-[10px] text-slate-500 mt-1">Default PIN: 1234</p>
        </div>

        <button onclick="handleLogin()" class="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-brand-500/25 transition">
          🔐 View My Restaurant Live
        </button>

        <p class="text-[10px] text-center text-slate-500 pt-2">
          🔒 Secure 256-Bit Cloud Encryption • Multi-Outlet Ready
        </p>
      </div>
    </div>
  </div>

  <!-- TOP APP BAR -->
  <header class="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-lg">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-emerald-900/40">
          X
        </div>
        <div>
          <div class="flex items-center space-x-1.5">
            <h1 class="text-sm font-bold tracking-tight text-white leading-none">XioN Restro</h1>
            <span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">OWNER</span>
          </div>
          <span class="text-[11px] text-slate-400 flex items-center mt-0.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1.5 pulse-dot"></span>
            Live Cloud Sync
          </span>
        </div>
      </div>

      <!-- Logged in phone & logout -->
      <div class="flex items-center space-x-1.5">
        <span id="currentPhoneDisplay" class="text-xs font-semibold text-slate-300 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">--</span>
        <button onclick="logout()" title="Logout / Switch Account" class="text-xs bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 p-1.5 rounded-lg border border-slate-700 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
      </div>
    </div>

    <!-- BRANCH / OUTLET SELECTOR (AUTO HIDES IF ONLY 1 OUTLET) -->
    <div id="branchSelectorContainer" class="mt-3">
      <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 block">Selected Outlet</label>
      <select id="branchSelect" onchange="renderDashboard()" class="w-full bg-slate-800/90 text-white text-xs font-semibold rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-brand-500 transition">
        <option value="ALL">🏢 All Outlets (Consolidated Total)</option>
      </select>
    </div>
  </header>

  <!-- MAIN DASHBOARD CONTENT -->
  <main class="max-w-md mx-auto px-4 pt-4 space-y-4">

    <!-- HERO TOTAL SALES CARD -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-5 shadow-2xl shadow-black/50">
      <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none"></div>
      
      <div class="flex items-center justify-between text-xs text-slate-400">
        <span class="font-medium tracking-wide">TODAY'S TOTAL SALES</span>
        <span id="liveClock" class="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">LIVE</span>
      </div>

      <div class="mt-2 flex items-baseline space-x-1">
        <span class="text-2xl font-bold text-emerald-400">₹</span>
        <span id="heroTotalSales" class="text-4xl font-extrabold tracking-tight text-white">0.00</span>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-3 gap-2 text-center">
        <div class="bg-slate-800/50 p-2 rounded-xl border border-slate-700/40">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Total Bills</div>
          <div id="statTotalBills" class="text-base font-bold text-white mt-0.5">0</div>
        </div>
        <div class="bg-slate-800/50 p-2 rounded-xl border border-slate-700/40">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Active Tables</div>
          <div id="statActiveTables" class="text-base font-bold text-amber-400 mt-0.5">0</div>
        </div>
        <div class="bg-slate-800/50 p-2 rounded-xl border border-slate-700/40">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Cancelled/Void</div>
          <div id="statVoidCount" class="text-base font-bold text-rose-400 mt-0.5">0</div>
        </div>
      </div>
    </div>

    <!-- PAYMENT COLLECTION BREAKDOWN -->
    <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-300">Payment Breakdown</h2>
        <span class="text-[10px] text-slate-500">Counter Audit</span>
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <!-- Cash -->
        <div class="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <span class="text-xs text-slate-400">💵 Cash in Galle</span>
          <div class="mt-1 text-lg font-bold text-emerald-300">₹ <span id="valCash">0.00</span></div>
        </div>

        <!-- UPI / Online -->
        <div class="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <span class="text-xs text-slate-400">📱 Online / UPI</span>
          <div class="mt-1 text-lg font-bold text-indigo-300">₹ <span id="valUpi">0.00</span></div>
        </div>

        <!-- Card / Bank -->
        <div class="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <span class="text-xs text-slate-400">💳 Card / Bank</span>
          <div class="mt-1 text-lg font-bold text-sky-300">₹ <span id="valCard">0.00</span></div>
        </div>

        <!-- DineIn vs Parcel -->
        <div class="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <span class="text-xs text-slate-400">🍽️ Dine vs Parcel</span>
          <div class="mt-1 text-xs font-bold text-amber-300">
            Dine: ₹<span id="valDineIn">0</span><br>
            Take: ₹<span id="valTakeaway">0</span>
          </div>
        </div>
      </div>
    </div>

    <!-- RECENT LIVE BILLS FEED -->
    <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-300">Recent Live Bills</h2>
          <span id="billsCountBadge" class="text-[10px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full">0</span>
        </div>
        <button onclick="fetchData()" class="text-[11px] text-brand-400 hover:text-brand-300 font-semibold flex items-center space-x-1">
          <span>Refresh</span>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      <div id="billsList" class="space-y-2.5">
        <div class="py-8 text-center text-slate-500 text-xs">
          Waiting for bills from POS...<br>
          <span class="text-[10px] text-slate-600">Settle an invoice in desktop software to view live</span>
        </div>
      </div>
    </div>

  </main>

  <!-- JAVASCRIPT LOGIC -->
  <script>
    let currentOwnerPhone = localStorage.getItem('xion_owner_phone') || '';
    let cachedData = null;

    if (!currentOwnerPhone) {
      document.getElementById('loginScreen').style.display = 'flex';
    } else {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('currentPhoneDisplay').innerText = currentOwnerPhone;
      fetchData();
    }

    function handleLogin() {
      const phoneInput = document.getElementById('loginPhone').value.trim();
      const pinInput = document.getElementById('loginPin').value.trim();

      if (!phoneInput || phoneInput.length < 10) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
      }

      currentOwnerPhone = phoneInput;
      localStorage.setItem('xion_owner_phone', currentOwnerPhone);
      document.getElementById('currentPhoneDisplay').innerText = currentOwnerPhone;
      document.getElementById('loginScreen').style.display = 'none';
      fetchData();
    }

    function logout() {
      if (confirm('Logout from this restaurant account?')) {
        localStorage.removeItem('xion_owner_phone');
        currentOwnerPhone = '';
        document.getElementById('loginPhone').value = '';
        document.getElementById('loginScreen').style.display = 'flex';
      }
    }

    async function fetchData() {
      if (!currentOwnerPhone) return;

      try {
        const res = await fetch('/api/v1/owner/data?phone=' + encodeURIComponent(currentOwnerPhone));
        const json = await res.json();
        if (json.success && json.data) {
          cachedData = json.data;
          updateBranchDropdown();
          renderDashboard();
        }
      } catch (e) {
        console.error('Fetch error:', e);
      }
    }

    function updateBranchDropdown() {
      const select = document.getElementById('branchSelect');
      const curVal = select.value;
      select.innerHTML = '<option value="ALL">🏢 All Outlets (Consolidated Total)</option>';

      if (cachedData && cachedData.stores) {
        const storeKeys = Object.keys(cachedData.stores);
        storeKeys.forEach(sId => {
          const s = cachedData.stores[sId];
          const opt = document.createElement('option');
          opt.value = sId;
          opt.innerText = '📍 ' + (s.storeName || sId);
          select.appendChild(opt);
        });

        // Hide dropdown container if only 1 outlet
        const container = document.getElementById('branchSelectorContainer');
        if (storeKeys.length <= 1) {
          container.style.display = 'none';
        } else {
          container.style.display = 'block';
        }
      }

      if (curVal && [...select.options].some(o => o.value === curVal)) {
        select.value = curVal;
      }
    }

    function renderDashboard() {
      if (!cachedData || !cachedData.stores) return;

      const selectedBranch = document.getElementById('branchSelect').value;

      let totalSales = 0;
      let totalBills = 0;
      let activeTables = 0;
      let voidCount = 0;
      let cash = 0;
      let upi = 0;
      let card = 0;
      let dineIn = 0;
      let takeaway = 0;
      let allBills = [];

      const storesToProcess = (selectedBranch === 'ALL')
        ? Object.values(cachedData.stores)
        : [cachedData.stores[selectedBranch]].filter(Boolean);

      storesToProcess.forEach(s => {
        const sum = s.liveSummary || {};
        totalSales += (sum.totalSales || 0);
        totalBills += (sum.totalBillsCount || 0);
        activeTables += (sum.activeTablesCount || 0);
        voidCount += (sum.voidCount || 0);
        cash += (sum.cashCollected || 0);
        upi += (sum.upiCollected || 0);
        card += (sum.cardCollected || 0);
        dineIn += (sum.dineInSales || 0);
        takeaway += (sum.takeawaySales || 0);

        if (s.bills && s.bills.length > 0) {
          s.bills.forEach(b => {
            allBills.push({ ...b, branchName: s.storeName });
          });
        }
      });

      // Sort bills newest first
      allBills.sort((a, b) => new Date(b.settledDate || b.createdDate) - new Date(a.settledDate || a.createdDate));

      document.getElementById('heroTotalSales').innerText = totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      document.getElementById('statTotalBills').innerText = totalBills;
      document.getElementById('statActiveTables').innerText = activeTables;
      document.getElementById('statVoidCount').innerText = voidCount;

      document.getElementById('valCash').innerText = cash.toLocaleString('en-IN', { minimumFractionDigits: 2 });
      document.getElementById('valUpi').innerText = upi.toLocaleString('en-IN', { minimumFractionDigits: 2 });
      document.getElementById('valCard').innerText = card.toLocaleString('en-IN', { minimumFractionDigits: 2 });
      document.getElementById('valDineIn').innerText = dineIn.toLocaleString('en-IN');
      document.getElementById('valTakeaway').innerText = takeaway.toLocaleString('en-IN');

      // Render Bills
      const listEl = document.getElementById('billsList');
      document.getElementById('billsCountBadge').innerText = allBills.length;

      if (allBills.length === 0) {
        listEl.innerHTML = '<div class="py-8 text-center text-slate-500 text-xs">No bills generated today yet.</div>';
        return;
      }

      listEl.innerHTML = allBills.slice(0, 50).map(b => {
        const timeStr = b.settledDate ? new Date(b.settledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const itemsSummary = (b.items || []).map(i => i.qty + 'x ' + i.itemName).join(', ');

        return \`
          <div class="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 shadow-sm space-y-1.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold text-white">\${b.invoiceNo || 'INV'}</span>
                <span class="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">\${b.orderType || 'DineIn'} \${b.tableName ? '• ' + b.tableName : ''}</span>
              </div>
              <span class="text-sm font-extrabold text-emerald-400">₹ \${(b.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <div class="text-[11px] text-slate-300 truncate font-medium">\${itemsSummary || 'General Food'}</div>

            <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/40">
              <span>💳 \${b.paymentMode || 'Paid'} \${b.customerName ? '• ' + b.customerName : ''}</span>
              <span>\${timeStr}</span>
            </div>
          </div>
        \`;
      }).join('');
    }

    // Auto-poll every 3 seconds for real-time live sync
    setInterval(fetchData, 3000);

    // Live Clock
    setInterval(() => {
      const now = new Date();
      document.getElementById('liveClock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }, 1000);
  </script>
</body>
</html>`;
}
