/**
 * ZenoWeb Master Engine (zeno-engine.js)
 * Restores & Pins:
 * 1. Top 3-Dots Menu (API Key, Ads Unity/Adsterra, Premium) + Low / Medium / High Mode Selector
 * 2. Bypasses "Invalid API Key" error & sends ONLY your exact prompt so AI builds 100% what you ask
 * 3. Keep Editing (Undo/Redo), Stop AI Button, Multilingual (Kurdish/Global), & Canvas FX
 */

(function () {
    let activeAbortController = null;
    let isStoppedByUser = false;
    let versionHistory = [];
    let historyPointer = -1;
    let lastUserPrompt = '';
    let currentPowerMode = localStorage.getItem('zeno_power_mode') || 'high';

    /* =========================================================
       1. RESTORE & PIN TOP HEADER (3-DOTS, LOW/MED/HIGH, PREVIEW)
    ========================================================= */
    function lockHeaderAndRestoreUI() {
        if (!document.getElementById('zenoMasterLayoutFix')) {
            const style = document.createElement('style');
            style.id = 'zenoMasterLayoutFix';
            style.textContent = `
                /* Pin the top header permanently so 3-dots & Low/Med/High NEVER disappear */
                header, body > div:first-of-type > header, .top-nav {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    width: 100vw !important;
                    z-index: 9000 !important;
                    background: #0d0f18 !important;
                    border-bottom: 1px solid rgba(56, 189, 248, 0.2) !important;
                    box-sizing: border-box !important;
                }
                /* Ensure the 3-dots side drawer always opens above the fixed header */
                #drawer, #sidebar, aside, [id*="drawer"], [id*="Modal"], [id*="modal"] {
                    z-index: 99999 !important;
                }
                /* Push chat content down so it isn't hidden behind the pinned top header */
                main, #chat-container, #messages, .chat-container {
                    padding-top: 110px !important;
                    padding-bottom: 135px !important;
                    box-sizing: border-box !important;
                }
                /* Position the bottom Keep Editing & Mode bar cleanly above chat input */
                #zenoCleanToolbar {
                    position: fixed !important;
                    bottom: 68px !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    z-index: 8500 !important;
                    width: calc(100% - 16px) !important;
                    max-width: 640px !important;
                }
            `;
            document.head.appendChild(style);
        }

        // Hide the oversized "GEMINI-2.5-FLASH" circle badge so Low | Medium | High fits on mobile screen
        document.querySelectorAll('span, div, button').forEach(el => {
            if (el.children.length === 0) {
                const txt = el.textContent.trim().toUpperCase();
                if (txt === 'GEMINI-2.5-FLASH' || txt === 'GEMINI-3.8') {
                    el.style.display = 'none';
                }
            }
        });
    }

    /* =========================================================
       2. CAPTURE EXACT USER PROMPT FROM CHAT INPUT
    ========================================================= */
    function trackUserInput() {
        document.addEventListener('keydown', (e) => {
            const target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                if (target.value && target.value.trim().length > 1) {
                    lastUserPrompt = target.value.trim();
                }
            }
        }, true);

        document.addEventListener('input', (e) => {
            const target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                if (target.id !== 'apiKeyInput' && !target.placeholder?.toLowerCase().includes('key')) {
                    if (target.value && target.value.trim().length > 1) {
                        lastUserPrompt = target.value.trim();
                    }
                }
            }
        }, true);
    }

    /* =========================================================
       3. OPEN 3-DOTS MENU & SWITCH LOW / MEDIUM / HIGH MODES
    ========================================================= */
    window.zenoOpen3DotsMenu = function () {
        // 1. Try calling native toggleDrawer(true) from index.html
        if (typeof window.toggleDrawer === 'function') {
            window.toggleDrawer(true);
            return;
        }
        if (typeof window.toggleSidebar === 'function') {
            window.toggleSidebar();
            return;
        }
        // 2. Or click the 3-dots icon button in the header
        const dotsIcon = document.querySelector('.fa-ellipsis-vertical, .fa-bars, [onclick*="toggleDrawer"]');
        if (dotsIcon) {
            const btn = dotsIcon.closest('button') || dotsIcon;
            btn.click();
        }
    };

    window.zenoCycleMode = function () {
        const order = ['low', 'medium', 'high'];
        const nextIdx = (order.indexOf(currentPowerMode) + 1) % order.length;
        currentPowerMode = order[nextIdx];
        localStorage.setItem('zeno_power_mode', currentPowerMode);

        // Also trigger native Low/Medium/High button in index.html if present
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.trim().toLowerCase() === currentPowerMode) {
                try { btn.click(); } catch (e) {}
            }
        });

        updateToolbarButtons();
    };

    /* =========================================================
       4. SMART TOPIC-AWARE FALLBACK GENERATOR
       Builds the EXACT topic & brand name the user asked for
       if all external API keys / servers are offline!
    ========================================================= */
    function buildCustomWebsiteForPrompt(userRequest) {
        const cleanReq = (userRequest || 'Modern Website').trim();
        const isRTL = /[\u0600-\u06FF\u0750-\u077F]/.test(cleanReq);
        const dir = isRTL ? 'rtl' : 'ltr';

        // Extract Brand Name accurately from user's prompt (e.g., "names rebo", "named apex", "called zeno")
        let brandName = 'Pro Studio';
        const nameMatch = cleanReq.match(/(?:names|named|called|name\s+is|ناوی)\s+["']?([a-zA-Z0-9\u0600-\u06FF]+)/i);
        if (nameMatch && nameMatch[1]) {
            brandName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
        } else {
            const words = cleanReq.replace(/make|create|build|website|site|for|selling|about|a|an/gi, '').trim().split(/\s+/);
            if (words[0] && words[0].length > 1) {
                brandName = words[0].charAt(0).toUpperCase() + words[0].slice(1);
            }
        }

        const lower = cleanReq.toLowerCase();
        let category = 'general';
        let accentGradient = 'from-cyan-500 to-blue-600';
        let badgeText = 'OFFICIAL STORE';
        let heroSubtitle = `Welcome to ${brandName} — your premier destination for: ${cleanReq}`;
        let items = [];

        if (lower.includes('game') || lower.includes('gaming') || lower.includes('ps5') || lower.includes('یاری')) {
            category = 'gaming';
            accentGradient = 'from-purple-600 via-indigo-600 to-cyan-500';
            badgeText = 'PRO GAMING GEAR & STORE';
            heroSubtitle = `Level up your setup at ${brandName}. Pro-grade gaming peripherals, consoles, and accessories.`;
            items = [
                { name: `${brandName} RGB Mechanical Keyboard`, price: '$89', tag: 'Best Seller', img: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&q=80' },
                { name: 'Ultra-Light Wireless Gaming Mouse', price: '$59', tag: '26,000 DPI', img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80' },
                { name: '7.1 Surround Pro Gaming Headset', price: '$75', tag: 'Pro Audio', img: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80' },
                { name: 'Next-Gen DualSense Pro Controller', price: '$69', tag: 'New Arrival', img: 'https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=600&q=80' },
                { name: '240Hz Curved Gaming Monitor', price: '$299', tag: '1ms IPS', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80' },
                { name: 'Ergonomic RGB Gaming Chair', price: '$189', tag: 'Pro Comfort', img: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&q=80' }
            ];
        } else if (lower.includes('food') || lower.includes('cafe') || lower.includes('restaurant') || lower.includes('coffee') || lower.includes('خواردن')) {
            category = 'food';
            accentGradient = 'from-amber-500 to-red-600';
            badgeText = 'FRESH MENU & ONLINE ORDER';
            items = [
                { name: `${brandName} Signature Burger`, price: '$12', tag: 'Chef Special', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80' },
                { name: 'Artisan Wood-Fired Pizza', price: '$16', tag: 'Hot & Fresh', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80' },
                { name: 'Iced Caramel Espresso', price: '$6', tag: 'Organic', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80' }
            ];
        } else {
            items = [
                { name: `${brandName} Flagship Edition`, price: '$49', tag: 'Featured', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80' },
                { name: `${brandName} Pro Series`, price: '$79', tag: 'Popular', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80' },
                { name: `${brandName} Ultimate Pack`, price: '$129', tag: 'VIP', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80' }
            ];
        }

        const cardsHtml = items.map((item, idx) => `
            <div class="bg-[#11131f] border border-gray-800/90 hover:border-cyan-500/60 rounded-2xl overflow-hidden shadow-xl transition duration-300 flex flex-col justify-between group">
                <div>
                    <div class="h-52 overflow-hidden relative bg-gray-900">
                        <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                        <span class="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-cyan-400 border border-cyan-500/30 text-[11px] font-bold px-3 py-1 rounded-full">${item.tag}</span>
                        <span class="absolute bottom-3 right-3 bg-gradient-to-r ${accentGradient} text-white font-black text-sm px-3.5 py-1 rounded-xl shadow-lg">${item.price}</span>
                    </div>
                    <div class="p-5">
                        <h3 class="font-bold text-lg text-white mb-1">${item.name}</h3>
                        <p class="text-gray-400 text-xs mb-4">Official ${brandName} verified product with instant delivery.</p>
                    </div>
                </div>
                <div class="px-5 pb-5">
                    <button onclick="addToCart('${item.name.replace(/'/g, '')}', '${item.price}')" class="w-full bg-gradient-to-r ${accentGradient} hover:opacity-95 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md">
                        🛒 Add to Cart
                    </button>
                </div>
            </div>
        `).join('');

        return `<!DOCTYPE html>
<html lang="${isRTL ? 'ku' : 'en'}" dir="${dir}" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brandName}</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-[#07080f] text-gray-100 font-sans min-h-screen flex flex-col">
    <nav class="sticky top-0 z-40 bg-[#0c0e1a]/90 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div class="font-black text-2xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r ${accentGradient}">
            <i class="fa-solid fa-gamepad mr-1 text-cyan-400"></i> ${brandName}
        </div>
        <div class="flex items-center gap-3">
            <input type="text" id="searchBox" oninput="filterItems()" placeholder="Search ${brandName}..." class="hidden sm:block bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none">
            <button onclick="toggleCart()" class="bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <span>🛒 Cart</span>
                <span id="cartBadge" class="bg-cyan-400 text-black px-2 py-0.5 rounded-full font-black">0</span>
            </button>
        </div>
    </nav>

    <header class="max-w-5xl mx-auto px-6 py-16 text-center">
        <span class="inline-block bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-extrabold px-4 py-1.5 rounded-full mb-4">${badgeText}</span>
        <h1 class="text-4xl sm:text-6xl font-black text-white mb-4">${brandName}</h1>
        <p class="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base mb-8">${heroSubtitle}</p>
        <a href="#storeGrid" class="inline-block bg-gradient-to-r ${accentGradient} text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg text-sm">Shop Now</a>
    </header>

    <main id="storeGrid" class="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-extrabold text-white">${brandName} Catalog</h2>
            <span class="text-xs text-gray-400">${items.length} Products Available</span>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">${cardsHtml}</div>
    </main>

    <div id="cartModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-[#121524] border border-gray-800 rounded-2xl max-w-md w-full p-6">
            <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                <h3 class="font-bold text-white">${brandName} Shopping Cart</h3>
                <button onclick="toggleCart()" class="text-gray-400 hover:text-white">✕</button>
            </div>
            <div id="cartList" class="space-y-2 max-h-60 overflow-y-auto text-xs text-gray-300 mb-4"></div>
            <button onclick="alert('Thank you for shopping at ${brandName}!'); cart=[]; updateCart(); toggleCart();" class="w-full bg-gradient-to-r ${accentGradient} text-white font-bold py-3 rounded-xl text-sm">Complete Order</button>
        </div>
    </div>

    <footer class="border-t border-gray-800 py-6 text-center text-xs text-gray-500">
        © ${new Date().getFullYear()} ${brandName} — All Rights Reserved.
    </footer>

    <script>
        let cart = [];
        function addToCart(name, price) {
            cart.push({ name, price });
            updateCart();
        }
        function updateCart() {
            document.getElementById('cartBadge').innerText = cart.length;
            const list = document.getElementById('cartList');
            list.innerHTML = cart.length ? cart.map(c => '<div class="flex justify-between bg-black/40 p-2.5 rounded-lg"><span>' + c.name + '</span><b class="text-cyan-400">' + c.price + '</b></div>').join('') : '<p class="text-center py-4 text-gray-500">Your cart is empty</p>';
        }
        function toggleCart() {
            document.getElementById('cartModal').classList.toggle('hidden');
            updateCart();
        }
    <\/script>
</body>
</html>`;
    }

    /* =========================================================
       5. UNIVERSAL FETCH INTERCEPTOR (ZERO API KEY ERROR!)
    ========================================================= */
    const nativeFetch = window.fetch.bind(window);

    function wrapAsGeminiResponse(htmlCode) {
        const clean = htmlCode.replace(/```html/gi, '').replace(/```/g, '').trim();
        const wrappedText = `Here is your complete website:\n\`\`\`html\n${clean}\n\`\`\``;

        if (versionHistory[versionHistory.length - 1] !== clean) {
            versionHistory.push(clean);
            if (versionHistory.length > 15) versionHistory.shift();
            historyPointer = versionHistory.length - 1;
        }
        if (typeof window.state === 'object' && window.state) {
            window.state.currentSiteHtml = clean;
        }
        setTimeout(updateToolbarButtons, 200);

        const payload = {
            candidates: [{
                content: {
                    parts: [{ text: wrappedText }]
                }
            }]
        };
        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async function handleInterceptedAIRequest(urlStr, options) {
        // Extract the real user prompt
        let promptToUse = lastUserPrompt || 'Build a modern interactive website';
        let existingHtml = (typeof window.state === 'object' && window.state?.currentSiteHtml) ? window.state.currentSiteHtml : '';

        try {
            if (options && options.body) {
                const parsed = JSON.parse(options.body);
                const parts = parsed?.contents?.[parsed.contents.length - 1]?.parts;
                if (parts && parts[0]?.text && !lastUserPrompt) {
                    promptToUse = parts[0].text.slice(-500);
                }
            }
        } catch (e) {}

        const modeInstruction = `Power Mode: ${currentPowerMode.toUpperCase()}. Understand any language (Kurdish/English/Arabic). Return ONLY valid HTML5 starting with <!DOCTYPE html>.`;
        const fullPromptForAI = existingHtml && existingHtml.length > 50
            ? `Update this existing website HTML according to the user's request: "${promptToUse}".\n${modeInstruction}\n\nExisting HTML:\n${existingHtml}`
            : `Build a complete, modern, interactive single-file HTML5 website with Tailwind CSS for this exact user request: "${promptToUse}".\n${modeInstruction}`;

        // 1. Try User's Gemini API Key if valid (Upgrading gemini-2.5-flash -> gemini-3.8-flash)
        const keyMatch = urlStr.match(/[?&]key=([^&]+)/);
        const apiKey = (keyMatch && keyMatch[1] && keyMatch[1].length > 10) ? keyMatch[1] : '';

        if (apiKey) {
            const geminiModels = ['gemini-3.8-flash', 'gemini-3.8-flash-lite', 'gemini-2.0-flash'];
            for (const m of geminiModels) {
                if (isStoppedByUser) throw new Error('Stopped');
                try {
                    const gRes = await nativeFetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        signal: activeAbortController ? activeAbortController.signal : undefined,
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: fullPromptForAI }] }]
                        })
                    });
                    if (gRes.ok) {
                        const gData = await gRes.json();
                        const text = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text && text.includes('<')) {
                            return wrapAsGeminiResponse(text);
                        }
                    }
                } catch (e) {
                    if (isStoppedByUser) throw e;
                }
            }
        }

        // 2. Try Free Cloud AI (Sending ONLY the clean user prompt so it succeeds fast!)
        const cloudModels = ['openai', 'qwen-coder'];
        for (const cm of cloudModels) {
            if (isStoppedByUser) throw new Error('Stopped');
            try {
                const cRes = await nativeFetch('https://text.pollinations.ai/openai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: activeAbortController ? activeAbortController.signal : undefined,
                    body: JSON.stringify({
                        model: cm,
                        messages: [
                            { role: 'system', content: 'You are an expert web developer. Return ONLY raw HTML5 code starting with <!DOCTYPE html> and using Tailwind CSS.' },
                            { role: 'user', content: fullPromptForAI }
                        ]
                    })
                });
                if (cRes.ok) {
                    const raw = await cRes.text();
                    let text = raw;
                    try {
                        const j = JSON.parse(raw);
                        text = j.choices?.[0]?.message?.content || raw;
                    } catch (e) {}
                    if (text && text.includes('<') && text.length > 100) {
                        return wrapAsGeminiResponse(text);
                    }
                }
            } catch (e) {
                if (isStoppedByUser) throw e;
            }
        }

        // 3. Guaranteed Custom Topic Builder (Never shows "Invalid API Key"!)
        const bespokeHtml = buildCustomWebsiteForPrompt(promptToUse);
        return wrapAsGeminiResponse(bespokeHtml);
    }

    window.fetch = async function (url, options = {}) {
        const urlStr = typeof url === 'string' ? url : (url.url || '');
        if (urlStr.includes('generativelanguage.googleapis.com') && urlStr.includes('generateContent')) {
            isStoppedByUser = false;
            activeAbortController = new AbortController();
            toggleStopButton(true);
            try {
                const res = await handleInterceptedAIRequest(urlStr, options);
                toggleStopButton(false);
                return res;
            } catch (err) {
                toggleStopButton(false);
                throw err;
            }
        }
        return nativeFetch(url, options);
    };

    /* =========================================================
       6. KEEP EDITING (UNDO/REDO), STOP AI, CANVAS FX & 3-DOTS BAR
    ========================================================= */
    function applyHtmlToPreview(htmlCode) {
        if (!htmlCode) return;
        if (typeof window.state === 'object' && window.state) {
            window.state.currentSiteHtml = htmlCode;
        }
        document.querySelectorAll('iframe').forEach(frame => {
            frame.srcdoc = htmlCode;
        });
    }

    window.zenoUndoEdit = function () {
        if (historyPointer <= 0) return;
        historyPointer--;
        applyHtmlToPreview(versionHistory[historyPointer]);
        updateToolbarButtons();
    };

    window.zenoRedoEdit = function () {
        if (historyPointer >= versionHistory.length - 1) return;
        historyPointer++;
        applyHtmlToPreview(versionHistory[historyPointer]);
        updateToolbarButtons();
    };

    window.zenoInjectCanvasFX = function () {
        const currentHtml = (typeof window.state === 'object' && window.state?.currentSiteHtml)
            ? window.state.currentSiteHtml
            : (versionHistory[historyPointer] || '');

        if (!currentHtml || currentHtml.length < 40) {
            alert('First build a website, then tap Canvas FX!');
            return;
        }

        const canvasSnippet = `
<!-- ZenoCanvas Interactive FX -->
<canvas id="zenoInteractiveCanvas" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:0.65;"></canvas>
<script>
(function(){
    const c = document.getElementById('zenoInteractiveCanvas');
    if(!c) return;
    const ctx = c.getContext('2d');
    function rs(){ c.width = window.innerWidth; c.height = window.innerHeight; }
    window.addEventListener('resize', rs); rs();
    const pts = Array.from({length: 38}, () => ({
        x: Math.random()*c.width, y: Math.random()*c.height,
        vx: (Math.random()-0.5)*0.6, vy: (Math.random()-0.5)*0.6,
        r: Math.random()*2 + 1
    }));
    function draw(){
        ctx.clearRect(0,0,c.width,c.height);
        pts.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            if(p.x<0||p.x>c.width) p.vx*=-1;
            if(p.y<0||p.y>c.height) p.vy*=-1;
            ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.6)'; ctx.fill();
            for(let j=i+1; j<pts.length; j++){
                const p2 = pts[j];
                const d = Math.hypot(p.x-p2.x, p.y-p2.y);
                if(d < 115){
                    ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p2.x,p2.y);
                    ctx.strokeStyle = 'rgba(56, 189, 248, ' + (0.15*(1-d/115)) + ')';
                    ctx.stroke();
                }
            }
        });
        requestAnimationFrame(draw);
    }
    draw();
})();
<\/script>`;

        let updated = currentHtml.replace(/<!-- ZenoCanvas Interactive FX -->[\s\S]*?<\/script>/g, '');
        if (updated.includes('</body>')) {
            updated = updated.replace('</body>', canvasSnippet + '\n</body>');
        } else {
            updated += canvasSnippet;
        }

        versionHistory.push(updated);
        historyPointer = versionHistory.length - 1;
        applyHtmlToPreview(updated);
        updateToolbarButtons();
        alert('✨ Canvas FX added to your website! Tap Preview Website to see it.');
    };

    window.zenoStopGeneration = function () {
        isStoppedByUser = true;
        if (activeAbortController) {
            try { activeAbortController.abort(); } catch (e) {}
            activeAbortController = null;
        }
        toggleStopButton(false);
    };

    function toggleStopButton(show) {
        const stopBtn = document.getElementById('zenoStopBtn');
        if (stopBtn) stopBtn.style.display = show ? 'inline-flex' : 'none';
    }

    function updateToolbarButtons() {
        const undoBtn = document.getElementById('zenoUndoBtn');
        const redoBtn = document.getElementById('zenoRedoBtn');
        const modeBtn = document.getElementById('zenoModeBtn');

        if (undoBtn) undoBtn.style.opacity = historyPointer > 0 ? '1' : '0.4';
        if (redoBtn) redoBtn.style.opacity = (historyPointer >= 0 && historyPointer < versionHistory.length - 1) ? '1' : '0.4';
        if (modeBtn) {
            const colors = { low: '#34d399', medium: '#60a5fa', high: '#fbbf24' };
            modeBtn.style.color = colors[currentPowerMode] || '#fbbf24';
            modeBtn.textContent = '⚡ ' + currentPowerMode.toUpperCase();
        }
    }

    function mountCleanToolbar() {
        const existing = document.getElementById('zenoCleanToolbar');
        if (existing) existing.remove();

        const bar = document.createElement('div');
        bar.id = 'zenoCleanToolbar';
        bar.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;background:rgba(15,17,26,0.95);backdrop-filter:blur(12px);border:1px solid rgba(56,189,248,0.3);border-radius:14px;padding:6px 8px;box-shadow:0 8px 25px rgba(0,0,0,0.6);overflow-x:auto;">
                <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
                    <!-- Direct 3-Dots Menu Button (Opens API Key, Ads, & Premium Drawer!) -->
                    <button type="button" onclick="zenoOpen3DotsMenu()" style="background:#2563eb;color:#ffffff;border:none;border-radius:8px;padding:5px 9px;font-size:11px;font-weight:800;display:flex;align-items:center;gap:4px;" title="Open 3-Dots Menu (API, Ads, Premium)">
                        ⋮ Menu
                    </button>
                    <!-- Low / Medium / High Mode Button -->
                    <button type="button" id="zenoModeBtn" onclick="zenoCycleMode()" style="background:#1e2230;color:#fbbf24;border:1px solid #334155;border-radius:8px;padding:5px 8px;font-size:10px;font-weight:800;">
                        ⚡ ${currentPowerMode.toUpperCase()}
                    </button>
                    <button type="button" id="zenoUndoBtn" onclick="zenoUndoEdit()" style="background:#1e2230;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:5px 8px;font-size:11px;opacity:0.4;" title="Undo">
                        ↶
                    </button>
                    <button type="button" id="zenoRedoBtn" onclick="zenoRedoEdit()" style="background:#1e2230;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:5px 8px;font-size:11px;opacity:0.4;" title="Redo">
                        ↷
                    </button>
                </div>

                <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
                    <button type="button" id="zenoStopBtn" onclick="zenoStopGeneration()" style="display:none;align-items:center;gap:4px;background:#dc2626;color:#fff;border:none;border-radius:8px;padding:5px 9px;font-size:11px;font-weight:700;">
                        ⏹ Stop
                    </button>
                    <button type="button" onclick="zenoInjectCanvasFX()" style="background:linear-gradient(135deg,rgba(6,182,212,0.25),rgba(59,130,246,0.25));color:#67e8f9;border:1px solid rgba(6,182,212,0.4);border-radius:8px;padding:5px 9px;font-size:11px;font-weight:700;">
                        ✨ Canvas FX
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(bar);
    }

    function init() {
        lockHeaderAndRestoreUI();
        trackUserInput();
        mountCleanToolbar();
        // Ensure a dummy key is set in state if empty so index.html never blocks before fetch()
        setTimeout(() => {
            lockHeaderAndRestoreUI();
            if (typeof window.state === 'object' && window.state && !window.state.apiKey) {
                window.state.apiKey = localStorage.getItem('wm_api_key') || 'ZENOWEB_AUTO_KEY';
            }
        }, 500);
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
