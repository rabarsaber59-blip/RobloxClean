/**
 * ZenoWeb Universal Engine + AI Canvas Model (zeno-engine.js)
 * Works on ANY index.html without modifying it!
 * Features:
 * 1. Universal Fetch Interceptor (100% Zero-Error Guarantee for Gemini/OpenAI)
 * 2. ZenoCanvas Model (Auto-Beautify with interactive HTML5 Canvas FX, Shaders & Live Visual Click-to-Edit)
 * 3. Real Stop Button, Keep Editing (Undo/Redo), Low/Med/High Power Modes & All Languages (Kurdish RTL + Global)
 */

(function () {
    let activeAbortController = null;
    let isStoppedByUser = false;
    let zenoPowerMode = localStorage.getItem('zeno_power_mode') || 'high';
    let canvasModelActive = true;
    let visualEditActive = false;
    let versionHistory = [];
    let historyPointer = -1;

    /* =========================================================
       1. LANGUAGE DETECTOR & CANVAS MODEL PROMPT INJECTOR
    ========================================================= */
    function isKurdishOrRTL(text) {
        if (!text) return false;
        return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
    }

    function getCanvasAndModeInstructions(userText) {
        const rtl = isKurdishOrRTL(userText);
        const modeRules = {
            low: "POWER MODE: LOW (Fast & Clean). Build a lightweight, fast-loading modern layout.",
            medium: "POWER MODE: MEDIUM (Balanced Interactive). Build a complete multi-section layout with working navigation, cards, and modals.",
            high: "POWER MODE: HIGH (Ultra-Pro Full-Stack). Build a masterpiece website with working shopping cart/interactive logic, search filtering, glassmorphism, and micro-animations."
        };

        const canvasRules = canvasModelActive
            ? `CANVAS BEAUTIFIER MODEL ACTIVE:
- Include an interactive HTML5 <canvas> background or hero visual effect (e.g., glowing floating particles, interactive constellation nodes, or smooth aurora waves using requestAnimationFrame).
- Apply ultra-sleek glassmorphism (backdrop-blur-xl, bg-white/5, subtle glowing borders), smooth hover transitions, gradient typography, and modern spacing so the website looks like a $10,000 agency design.`
            : '';

        const langRules = `UNIVERSAL LANGUAGE SUPPORT:
- Understand all languages (Kurdish Sorani/Kurmanji, English, Arabic, Turkish, Persian, etc.).
- ${rtl ? 'The user wrote in Kurdish/RTL! You MUST set dir="rtl" on <html>, use Google Font Vazirmatn, and write all UI text in natural Kurdish.' : 'Match the language requested by the user.'}`;

        return `\n\n[ZENOWEB ENGINE DIRECTIVES]\n${modeRules[zenoPowerMode]}\n${canvasRules}\n${langRules}\nReturn ONLY raw HTML5 starting with <!DOCTYPE html>. Never use markdown backticks.\n`;
    }

    /* =========================================================
       2. BUILT-IN CANVAS NEURAL GENERATOR (FALLBACK ENGINE)
       Guarantees a stunning website even if API quota is 0!
    ========================================================= */
    function synthesizeCanvasWebsite(promptText) {
        const rtl = isKurdishOrRTL(promptText);
        const dir = rtl ? 'rtl' : 'ltr';
        const cleanTitle = (promptText.match(/(?:named|for|about|ناوی)\s+["']?([A-Za-z0-9\u0600-\u06FF\s]{2,22})/i)?.[1] || 'ZenoCanvas Studio').trim();

        return `<!DOCTYPE html>
<html lang="${rtl ? 'ku' : 'en'}" dir="${dir}" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cleanTitle}</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: ${rtl ? "'Vazirmatn', sans-serif" : "'Inter', sans-serif"}; background: #05060b; color: #f8fafc; overflow-x: hidden; }
        .glass-card { background: rgba(17, 20, 34, 0.72); backdrop-filter: blur(16px); border: 1px solid rgba(56, 189, 248, 0.2); }
        .neon-glow:hover { box-shadow: 0 0 30px rgba(6, 182, 212, 0.35); transform: translateY(-4px); }
    </style>
</head>
<body class="min-h-screen flex flex-col relative">
    <canvas id="zenoBgCanvas" class="fixed inset-0 w-full h-full pointer-events-none z-0"></canvas>

    <nav class="sticky top-0 z-30 glass-card px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2 font-black text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-300">
            <i class="fa-solid fa-wand-magic-sparkles text-cyan-400"></i> ${cleanTitle}
        </div>
        <div class="flex items-center gap-3">
            <button onclick="document.getElementById('cartDrawer').classList.remove('hidden')" class="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition">
                <i class="fa-solid fa-bag-shopping"></i>
                <span>${rtl ? 'سەبەتە' : 'Cart'}</span>
                <span id="cBadge" class="bg-cyan-400 text-black px-2 py-0.5 rounded-full font-black">0</span>
            </button>
        </div>
    </nav>

    <header class="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-6">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>${rtl ? 'دیزاینکراو بە مۆدێلی ZenoCanvas' : 'Powered by ZenoCanvas Interactive Engine'}</span>
        </div>
        <h1 class="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-blue-400">
            ${rtl ? 'بەخێربێن بۆ پلاتفۆرمی ' + cleanTitle : 'Experience Next-Gen Quality with ' + cleanTitle}
        </h1>
        <p class="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base mb-8 leading-relaxed">
            ${promptText.substring(0, 180)}
        </p>
        <div class="flex flex-wrap justify-center gap-4">
            <a href="#featured" class="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-cyan-500/25 transition">
                ${rtl ? 'ئێستا دەستپێبکە' : 'Explore Collection'}
            </a>
        </div>
    </header>

    <main id="featured" class="relative z-10 max-w-6xl mx-auto px-6 py-10 flex-1 w-full">
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" id="itemsGrid"></div>
    </main>

    <div id="cartDrawer" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="glass-card rounded-2xl max-w-md w-full p-6">
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-800">
                <h3 class="font-bold text-lg text-white">${rtl ? 'سەبەتەی کڕین' : 'Your Cart'}</h3>
                <button onclick="document.getElementById('cartDrawer').classList.add('hidden')" class="text-gray-400 hover:text-white">✕</button>
            </div>
            <div id="cartList" class="space-y-2 max-h-60 overflow-y-auto text-xs text-gray-300 mb-4"></div>
            <button onclick="alert('${rtl ? 'داواکارییەکەت بە سەرکەوتوویی تۆمارکرا!' : 'Order placed successfully!'}'); cart=[]; renderCart(); document.getElementById('cartDrawer').classList.add('hidden');" class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 rounded-xl text-sm">
                ${rtl ? 'تەواوکردنی کڕین' : 'Complete Checkout'}
            </button>
        </div>
    </div>

    <footer class="relative z-10 border-t border-gray-800/80 py-6 text-center text-xs text-gray-500">
        © ${new Date().getFullYear()} ${cleanTitle} — Crafted with ZenoCanvas AI
    </footer>

    <script>
        const products = [
            { title: "${rtl ? 'پاکێجی پڕۆفیشناڵ' : 'Pro Studio Edition'}", price: "$29", icon: "fa-gem", color: "from-cyan-500 to-blue-600" },
            { title: "${rtl ? 'وەشانی تایبەتی VIP' : 'VIP Luxury Suite'}", price: "$59", icon: "fa-crown", color: "from-amber-500 to-orange-600" },
            { title: "${rtl ? 'سیستەمی زیرەکی تەواو' : 'Ultimate AI Bundle'}", price: "$99", icon: "fa-rocket", color: "from-purple-500 to-indigo-600" }
        ];
        let cart = [];
        const grid = document.getElementById('itemsGrid');
        grid.innerHTML = products.map((p, i) => \`
            <div class="glass-card neon-glow rounded-2xl p-6 transition duration-300 flex flex-col justify-between">
                <div>
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br \${p.color} flex items-center justify-center text-white text-2xl mb-5 shadow-lg">
                        <i class="fa-solid \${p.icon}"></i>
                    </div>
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold text-lg text-white">\${p.title}</h3>
                        <span class="text-cyan-400 font-black text-base">\${p.price}</span>
                    </div>
                    <p class="text-gray-400 text-xs mb-6 leading-relaxed">${rtl ? 'کوالێتی بەرز و دیزاینی مۆدێرن بە خێرایی سەرسوڕهێنەر.' : 'High-performance interactive experience with instant access.'}</p>
                </div>
                <button onclick="addItem(\${i})" class="w-full bg-white/10 hover:bg-cyan-500 hover:text-black border border-white/15 font-bold py-2.5 rounded-xl text-xs transition">
                    ${rtl ? 'زیادکردن بۆ سەبەتە' : 'Add to Cart'}
                </button>
            </div>
        \`).join('');

        function addItem(idx) {
            cart.push(products[idx]);
            renderCart();
        }
        function renderCart() {
            document.getElementById('cBadge').innerText = cart.length;
            const list = document.getElementById('cartList');
            list.innerHTML = cart.length ? cart.map(c => \`<div class="flex justify-between bg-white/5 p-2.5 rounded-lg"><span>\${c.title}</span><b class="text-cyan-400">\${c.price}</b></div>\`).join('') : '<p class="text-center py-4 text-gray-500">Empty</p>';
        }

        // Interactive HTML5 Canvas Particle Network
        const canvas = document.getElementById('zenoBgCanvas');
        const ctx = canvas.getContext('2d');
        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        window.addEventListener('resize', resize); resize();
        const dots = Array.from({length: 50}, () => ({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.7, vy: (Math.random() - 0.5) * 0.7,
            r: Math.random() * 2 + 1
        }));
        function drawCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < dots.length; i++) {
                const d = dots[i];
                d.x += d.vx; d.y += d.vy;
                if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
                if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
                ctx.fill();
                for (let j = i + 1; j < dots.length; j++) {
                    const d2 = dots[j];
                    const dist = Math.hypot(d.x - d2.x, d.y - d2.y);
                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.moveTo(d.x, d.y); ctx.lineTo(d2.x, d2.y);
                        ctx.strokeStyle = \`rgba(56, 189, 248, \${0.18 * (1 - dist/130)})\`;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(drawCanvas);
        }
        drawCanvas();
    <\/script>
</body>
</html>`;
    }

    /* =========================================================
       3. UNIVERSAL FETCH INTERCEPTOR (ZERO-ERROR SHIELD)
       Intercepts ANY AI call from index.html and heals errors!
    ========================================================= */
    const nativeFetch = window.fetch.bind(window);

    async function fetchBackupCloudAI(userPromptText) {
        const enrichedPrompt = userPromptText + getCanvasAndModeInstructions(userPromptText);
        const models = ['openai', 'qwen-coder', 'mistral'];

        for (const m of models) {
            if (isStoppedByUser) throw new Error('Stopped');
            try {
                const res = await nativeFetch('https://text.pollinations.ai/openai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: activeAbortController ? activeAbortController.signal : undefined,
                    body: JSON.stringify({
                        model: m,
                        messages: [
                            { role: 'system', content: 'You are ZenoCanvas AI. Return ONLY raw HTML5 starting with <!DOCTYPE html>. No markdown backticks.' },
                            { role: 'user', content: enrichedPrompt }
                        ]
                    })
                });
                if (res.ok) {
                    const raw = await res.text();
                    let html = raw;
                    try {
                        const j = JSON.parse(raw);
                        html = j.choices?.[0]?.message?.content || raw;
                    } catch (e) {}
                    if (html && html.includes('<')) return html;
                }
            } catch (e) {
                if (isStoppedByUser) throw e;
            }
        }
        return synthesizeCanvasWebsite(userPromptText);
    }

    window.fetch = async function (url, options = {}) {
        const urlStr = typeof url === 'string' ? url : (url.url || '');

        // Check if this is an AI generation call from index.html
        const isGeminiCall = urlStr.includes('generativelanguage.googleapis.com') && urlStr.includes('generateContent');
        const isOpenAICall = urlStr.includes('api.openai.com') || urlStr.includes('pollinations.ai');

        if (isGeminiCall || isOpenAICall) {
            isStoppedByUser = false;
            activeAbortController = new AbortController();
            options.signal = activeAbortController.signal;
            showStopButtonBanner(true);

            let extractedPrompt = 'Modern Website';
            try {
                if (options.body) {
                    const bodyObj = JSON.parse(options.body);
                    if (bodyObj.contents) {
                        const parts = bodyObj.contents[bodyObj.contents.length - 1]?.parts;
                        if (parts && parts[0]?.text) {
                            extractedPrompt = parts[0].text;
                            parts[0].text += getCanvasAndModeInstructions(extractedPrompt);
                            options.body = JSON.stringify(bodyObj);
                        }
                    } else if (bodyObj.messages) {
                        const lastMsg = bodyObj.messages[bodyObj.messages.length - 1];
                        if (lastMsg && typeof lastMsg.content === 'string') {
                            extractedPrompt = lastMsg.content;
                            lastMsg.content += getCanvasAndModeInstructions(extractedPrompt);
                            options.body = JSON.stringify(bodyObj);
                        }
                    }
                }
            } catch (e) {}

            try {
                const response = await nativeFetch(url, options);
                if (response.ok) {
                    const clone = response.clone();
                    const data = await clone.json().catch(() => null);
                    // Verify it doesn't contain an API error inside JSON
                    if (data && !data.error) {
                        showStopButtonBanner(false);
                        setTimeout(captureAndEnhanceGeneratedSite, 400);
                        return response;
                    }
                }
                // If Gemini returned 429 Quota, 404 Model, or 503 Busy -> Heal automatically!
                const healedHtml = await fetchBackupCloudAI(extractedPrompt);
                showStopButtonBanner(false);
                setTimeout(captureAndEnhanceGeneratedSite, 400);

                // Return a synthetic 200 OK Response in Gemini's exact format so index.html succeeds!
                const fakeGeminiPayload = {
                    candidates: [{ content: { parts: [{ text: healedHtml }] } }],
                    choices: [{ message: { content: healedHtml } }]
                };
                return new Response(JSON.stringify(fakeGeminiPayload), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            } catch (err) {
                showStopButtonBanner(false);
                if (isStoppedByUser || err.name === 'AbortError') {
                    throw err;
                }
                // Network error ("Failed to fetch") -> Heal automatically!
                const fallbackHtml = await fetchBackupCloudAI(extractedPrompt);
                setTimeout(captureAndEnhanceGeneratedSite, 400);
                const fakeGeminiPayload = {
                    candidates: [{ content: { parts: [{ text: fallbackHtml }] } }],
                    choices: [{ message: { content: fallbackHtml } }]
                };
                return new Response(JSON.stringify(fakeGeminiPayload), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return nativeFetch(url, options);
    };

    /* =========================================================
       4. ZENOCANVAS BEAUTIFIER & LIVE VISUAL EDITOR
    ========================================================= */
    function getActivePreviewIframe() {
        return document.getElementById('previewFrame') ||
               document.querySelector('iframe#preview-frame') ||
               document.querySelector('iframe');
    }

    function getCurrentSiteHTML() {
        if (typeof window.state === 'object' && window.state && window.state.currentSiteHtml) {
            return window.state.currentSiteHtml;
        }
        const iframe = getActivePreviewIframe();
        if (iframe && iframe.srcdoc) return iframe.srcdoc;
        return '';
    }

    function updateSiteHTML(newHtml, recordHistory = true) {
        if (!newHtml) return;
        if (recordHistory) {
            if (historyPointer < versionHistory.length - 1) {
                versionHistory = versionHistory.slice(0, historyPointer + 1);
            }
            versionHistory.push(newHtml);
            if (versionHistory.length > 15) versionHistory.shift();
            historyPointer = versionHistory.length - 1;
        }

        if (typeof window.state === 'object' && window.state) {
            window.state.currentSiteHtml = newHtml;
        }
        if (typeof window.projects !== 'undefined' && typeof window.currentProjectId !== 'undefined') {
            const p = window.projects.find(x => x.id === window.currentProjectId);
            if (p) {
                p.code = newHtml;
                if (typeof window.saveToStorage === 'function') window.saveToStorage();
            }
        }
        const iframe = getActivePreviewIframe();
        if (iframe) iframe.srcdoc = newHtml;
        const editor = document.getElementById('codeEditor');
        if (editor) editor.value = newHtml;
    }

    function captureAndEnhanceGeneratedSite() {
        const html = getCurrentSiteHTML();
        if (html && html.length > 50) {
            if (versionHistory.length === 0 || versionHistory[versionHistory.length - 1] !== html) {
                versionHistory.push(html);
                historyPointer = versionHistory.length - 1;
            }
        }
    }

    // Inject Interactive Canvas Particle FX & Neon Glass Beautifier into any existing website!
    window.applyZenoCanvasBeautifier = function (theme = 'cyber') {
        let html = getCurrentSiteHTML();
        if (!html || html.length < 30) {
            html = synthesizeCanvasWebsite('ZenoCanvas Interactive Studio');
        }

        const palettes = {
            cyber: { color: '56, 189, 248', accent: '#00f2fe', bg: 'radial-gradient(circle at 50% 0%, rgba(14,165,233,0.18), transparent 70%)' },
            gold: { color: '245, 158, 11', accent: '#fbbf24', bg: 'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.18), transparent 70%)' },
            emerald: { color: '16, 185, 129', accent: '#34d399', bg: 'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.18), transparent 70%)' }
        };
        const pal = palettes[theme] || palettes.cyber;

        const canvasInjection = `
<!-- ZenoCanvas Beautifier FX -->
<style id="zenoCanvasStyle">
    body { background-image: ${pal.bg} !important; scroll-behavior: smooth; }
    button, a, .rounded-xl, .rounded-2xl { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
    button:hover, a:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(${pal.color}, 0.28) !important; }
</style>
<canvas id="zenoLiveCanvasOverlay" style="position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:1;opacity:0.75;"></canvas>
<script>
(function(){
    const c = document.getElementById('zenoLiveCanvasOverlay');
    if(!c) return;
    const ctx = c.getContext('2d');
    function rs(){ c.width = window.innerWidth; c.height = window.innerHeight; }
    window.addEventListener('resize', rs); rs();
    const pts = Array.from({length: 42}, () => ({
        x: Math.random()*c.width, y: Math.random()*c.height,
        vx: (Math.random()-0.5)*0.6, vy: (Math.random()-0.5)*0.6,
        r: Math.random()*2.2 + 0.8
    }));
    function anim(){
        ctx.clearRect(0,0,c.width,c.height);
        pts.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            if(p.x<0||p.x>c.width) p.vx*=-1;
            if(p.y<0||p.y>c.height) p.vy*=-1;
            ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
            ctx.fillStyle = 'rgba(${pal.color}, 0.65)'; ctx.fill();
            for(let j=i+1; j<pts.length; j++){
                const p2 = pts[j];
                const d = Math.hypot(p.x-p2.x, p.y-p2.y);
                if(d < 120){
                    ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p2.x,p2.y);
                    ctx.strokeStyle = 'rgba(${pal.color}, ' + (0.16*(1-d/120)) + ')';
                    ctx.stroke();
                }
            }
        });
        requestAnimationFrame(anim);
    }
    anim();
})();
<\/script>`;

        // Remove previous injection if exists
        html = html.replace(/<!-- ZenoCanvas Beautifier FX -->[\s\S]*?<\/script>/g, '');
        if (html.includes('</body>')) {
            html = html.replace('</body>', canvasInjection + '\n</body>');
        } else {
            html += canvasInjection;
        }
        updateSiteHTML(html, true);
    };

    // Toggle Live Visual Canvas Editing (Click any text/element inside preview to edit directly!)
    window.toggleVisualCanvasEdit = function () {
        const iframe = getActivePreviewIframe();
        if (!iframe || !iframe.contentDocument) return;
        visualEditActive = !visualEditActive;

        const doc = iframe.contentDocument;
        const btn = document.getElementById('zenoVisualEditBtn');

        if (visualEditActive) {
            doc.body.contentEditable = "true";
            doc.designMode = "on";
            if (btn) {
                btn.classList.add('bg-emerald-600', 'text-white');
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Save Visual';
            }
        } else {
            doc.body.contentEditable = "false";
            doc.designMode = "off";
            if (btn) {
                btn.classList.remove('bg-emerald-600', 'text-white');
                btn.innerHTML = '<i class="fa-solid fa-wand-sparkles"></i> Touch Edit';
            }
            const updatedHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
            updateSiteHTML(updatedHtml, true);
        }
    };

    /* =========================================================
       5. STOP BUTTON, UNDO/REDO & FLOATING CONTROL BAR UI
    ========================================================= */
    function showStopButtonBanner(show) {
        let stopBanner = document.getElementById('zenoGlobalStopBanner');
        if (!stopBanner) {
            stopBanner = document.createElement('div');
            stopBanner.id = 'zenoGlobalStopBanner';
            stopBanner.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-[250] hidden';
            stopBanner.innerHTML = `
                <button type="button" onclick="window.triggerZenoStop()" class="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold px-5 py-2.5 rounded-full text-xs shadow-[0_0_25px_rgba(220,38,38,0.6)] flex items-center gap-2 border border-red-400">
                    <i class="fa-solid fa-stop"></i> Stop AI Generation
                </button>
            `;
            document.body.appendChild(stopBanner);
        }
        stopBanner.classList.toggle('hidden', !show);
    }

    window.triggerZenoStop = function () {
        isStoppedByUser = true;
        if (activeAbortController) {
            try { activeAbortController.abort(); } catch (e) {}
            activeAbortController = null;
        }
        showStopButtonBanner(false);
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('hidden');
    };

    window.zenoHistoryStep = function (dir) {
        const target = historyPointer + dir;
        if (target < 0 || target >= versionHistory.length) return;
        historyPointer = target;
        updateSiteHTML(versionHistory[historyPointer], false);
    };

    window.cycleZenoPower = function () {
        zenoPowerMode = zenoPowerMode === 'low' ? 'medium' : (zenoPowerMode === 'medium' ? 'high' : 'low');
        localStorage.setItem('zeno_power_mode', zenoPowerMode);
        const btn = document.getElementById('zenoPowerPill');
        if (btn) {
            const colors = { low: 'text-emerald-400', medium: 'text-blue-400', high: 'text-amber-400' };
            btn.className = `px-2.5 py-1 rounded-lg bg-[#1e1e2d] border border-gray-700 text-[10px] font-extrabold uppercase ${colors[zenoPowerMode]} flex items-center gap-1`;
            btn.innerHTML = `<i class="fa-solid fa-gauge-high"></i> ${zenoPowerMode}`;
        }
        if (typeof window.setBuildQuality === 'function') window.setBuildQuality(zenoPowerMode);
    };

    function mountZenoFloatingDock() {
        if (document.getElementById('zenoCanvasDock')) return;

        const dock = document.createElement('div');
        dock.id = 'zenoCanvasDock';
        dock.className = 'fixed bottom-[72px] left-1/2 -translate-x-1/2 z-[45] w-[95%] max-w-2xl pointer-events-auto';
        dock.innerHTML = `
            <div class="bg-[#11121a]/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl px-2.5 py-1.5 shadow-2xl flex items-center justify-between gap-1.5 overflow-x-auto">
                <!-- Left: Power Mode & Keep Editing Undo/Redo -->
                <div class="flex items-center gap-1 shrink-0">
                    <button type="button" id="zenoPowerPill" onclick="cycleZenoPower()" class="px-2.5 py-1 rounded-lg bg-[#1e1e2d] border border-gray-700 text-[10px] font-extrabold uppercase text-amber-400 flex items-center gap-1" title="Switch Low / Medium / High Mode">
                        <i class="fa-solid fa-gauge-high"></i> ${zenoPowerMode}
                    </button>
                    <button type="button" onclick="zenoHistoryStep(-1)" class="px-2 py-1 rounded-lg bg-[#1e1e2d] hover:bg-gray-700 text-gray-300 text-[11px]" title="Undo (Keep Editing)">
                        <i class="fa-solid fa-rotate-left"></i>
                    </button>
                    <button type="button" onclick="zenoHistoryStep(1)" class="px-2 py-1 rounded-lg bg-[#1e1e2d] hover:bg-gray-700 text-gray-300 text-[11px]" title="Redo">
                        <i class="fa-solid fa-rotate-right"></i>
                    </button>
                </div>

                <!-- Right: ZenoCanvas Beautifier & Touch Visual Editor -->
                <div class="flex items-center gap-1 shrink-0">
                    <button type="button" onclick="applyZenoCanvasBeautifier('cyber')" class="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Canvas FX
                    </button>
                    <button type="button" onclick="applyZenoCanvasBeautifier('gold')" class="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 text-[10px] font-bold whitespace-nowrap" title="Gold PS5 Canvas Theme">
                        ✨ Gold
                    </button>
                    <button type="button" id="zenoVisualEditBtn" onclick="toggleVisualCanvasEdit()" class="px-2.5 py-1 rounded-lg bg-[#1e1e2d] hover:bg-gray-700 border border-gray-700 text-gray-200 text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                        <i class="fa-solid fa-wand-sparkles"></i> Touch Edit
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(dock);
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', mountZenoFloatingDock);
    } else {
        mountZenoFloatingDock();
    }
})();
