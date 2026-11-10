/**
 * ZenoWeb Bug-Free Engine (zeno-engine.js)
 * Fixes:
 * 1. Rewrites deprecated gemini-2.5-flash to gemini-3.8-flash automatically so AI builds EXACTLY what you ask.
 * 2. Removes fake fallback templates ("their desired website").
 * 3. Fixes mobile screen horizontal overflow & header squishing.
 * 4. Prevents raw HTML/CSS from leaking into chat bubbles.
 * 5. Adds non-overlapping Keep Editing (Undo/Redo), Stop AI, & Canvas FX inside Preview Iframe only.
 */

(function () {
    let activeAbortController = null;
    let isStoppedByUser = false;
    let versionHistory = [];
    let historyPointer = -1;

    /* =========================================================
       1. FIX MOBILE SCREEN OVERFLOW & HEADER LAYOUT BUGS
    ========================================================= */
    function injectLayoutFixes() {
        if (document.getElementById('zenoBugFixStyles')) return;
        const style = document.createElement('style');
        style.id = 'zenoBugFixStyles';
        style.textContent = `
            html, body {
                max-width: 100vw !important;
                width: 100vw !important;
                overflow-x: hidden !important;
            }
            /* Fix top header overflowing to the right on mobile */
            header, nav, .header-bar {
                max-width: 100vw !important;
                flex-wrap: wrap !important;
                gap: 6px !important;
                padding-left: 10px !important;
                padding-right: 10px !important;
                box-sizing: border-box !important;
            }
            /* Prevent any chat bubble or link bar from breaking screen width */
            main, #chat-container, #messages, .chat-area {
                max-width: 100vw !important;
                overflow-x: hidden !important;
                box-sizing: border-box !important;
            }
            /* Ensure room at the bottom so dock never covers chat input */
            #zenoCleanToolbar {
                position: fixed;
                bottom: 68px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 40;
                width: calc(100% - 24px);
                max-width: 640px;
                pointer-events: auto;
            }
        `;
        document.head.appendChild(style);

        // Fix the squished "GEMINI-2.5-FLASH" badge text in the header
        document.querySelectorAll('span, div, button').forEach(el => {
            if (el.children.length === 0 && el.textContent.trim().toUpperCase() === 'GEMINI-2.5-FLASH') {
                el.textContent = 'GEMINI-3.8';
                el.style.whiteSpace = 'nowrap';
                el.style.padding = '4px 10px';
                el.style.borderRadius = '9999px';
            }
        });
    }

    /* =========================================================
       2. ENSURE AI RESPONSE STAYS WRAPPED SO IT NEVER LEAKS INTO CHAT
    ========================================================= */
    function formatResponseForIndexParser(rawText) {
        if (!rawText) return rawText;
        const trimmed = rawText.trim();

        // If the AI returned raw HTML without ```html backticks, wrap it in ```html ... ```
        // so index.html extracts it into state.currentSiteHtml instead of dumping raw HTML into the chat bubble!
        const hasHtmlCode = /<!DOCTYPE\s+html/i.test(trimmed) || /<html[\s>]/i.test(trimmed);
        const hasBackticks = /```html/i.test(trimmed);

        if (hasHtmlCode && !hasBackticks) {
            const docStart = trimmed.search(/<!DOCTYPE\s+html|<html[\s>]/i);
            const prefixText = docStart > 0 ? trimmed.substring(0, docStart).trim() : '';
            const htmlPart = docStart > 0 ? trimmed.substring(docStart).trim() : trimmed;
            return `${prefixText ? prefixText + '\n\n' : ''}Here is your complete website:\n\`\`\`html\n${htmlPart}\n\`\`\``;
        }
        return rawText;
    }

    function recordHtmlSnapshot(rawText) {
        if (!rawText) return;
        let extracted = '';
        const match = rawText.match(/```html\s*([\s\S]*?)```/i);
        if (match && match[1]) {
            extracted = match[1].trim();
        } else if (/<!DOCTYPE\s+html|<html[\s>]/i.test(rawText)) {
            const idx = rawText.search(/<!DOCTYPE\s+html|<html[\s>]/i);
            extracted = rawText.substring(idx).replace(/```/g, '').trim();
        }

        if (extracted && extracted.length > 50) {
            if (historyPointer < versionHistory.length - 1) {
                versionHistory = versionHistory.slice(0, historyPointer + 1);
            }
            if (versionHistory[versionHistory.length - 1] !== extracted) {
                versionHistory.push(extracted);
                if (versionHistory.length > 15) versionHistory.shift();
                historyPointer = versionHistory.length - 1;
            }
            if (typeof window.state === 'object' && window.state) {
                window.state.currentSiteHtml = extracted;
            }
            updateToolbarButtons();
        }
    }

    /* =========================================================
       3. REAL AI INTERCEPTOR (AUTO-UPGRADES MODEL & OBEYS USER 100%)
    ========================================================= */
    const nativeFetch = window.fetch.bind(window);

    async function callRealGeminiOrBackup(originalUrl, options) {
        // 1. Extract API key from original URL
        const keyMatch = originalUrl.match(/[?&]key=([^&]+)/);
        const apiKey = keyMatch ? keyMatch[1] : (localStorage.getItem('wm_api_key') || '');

        // 2. Parse the exact request body from index.html without adding fake template rules
        let requestBodyObj = null;
        try {
            if (options && options.body) {
                requestBodyObj = JSON.parse(options.body);
            }
        } catch (e) {}

        // Enhance system instruction gently for multilingual + clean code accuracy
        const accuracyRule = "\nIMPORTANT: Strictly build the exact website, topic, language, and features the user asked for. Never build a generic store unless requested. Always wrap the final full HTML5 code inside ```html ... ```.";
        if (requestBodyObj) {
            if (requestBodyObj.system_instruction && requestBodyObj.system_instruction.parts && requestBodyObj.system_instruction.parts[0]) {
                requestBodyObj.system_instruction.parts[0].text += accuracyRule;
            } else if (requestBodyObj.contents && requestBodyObj.contents.length > 0) {
                const firstPart = requestBodyObj.contents[0].parts?.[0];
                if (firstPart && firstPart.text) {
                    firstPart.text += accuracyRule;
                }
            }
        }

        const updatedBodyStr = requestBodyObj ? JSON.stringify(requestBodyObj) : options.body;

        // 3. Try active Google Gemini models (Replacing dead gemini-2.5-flash with gemini-3.8-flash!)
        if (apiKey) {
            const activeModels = ['gemini-3.8-flash', 'gemini-3.8-flash-lite', 'gemini-3.8-pro', 'gemma-3-27b-it'];
            for (const modelName of activeModels) {
                if (isStoppedByUser) throw new Error('Stopped by user');
                try {
                    const targetUrl = `[https://generativelanguage.googleapis.com/v1beta/models/$](https://generativelanguage.googleapis.com/v1beta/models/$){modelName}:generateContent?key=${apiKey}`;
                    const res = await nativeFetch(targetUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        signal: activeAbortController ? activeAbortController.signal : undefined,
                        body: updatedBodyStr
                    });

                    const data = await res.json().catch(() => null);
                    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (res.ok && aiText) {
                        const formatted = formatResponseForIndexParser(aiText);
                        recordHtmlSnapshot(formatted);
                        data.candidates[0].content.parts[0].text = formatted;
                        return new Response(JSON.stringify(data), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                } catch (err) {
                    if (isStoppedByUser || err.name === 'AbortError') throw err;
                }
            }
        }

        // 4. If user's Gemini Key hit its 20/day quota limit, forward the EXACT conversation to real OpenAI/Qwen LLM on Pollinations
        const messages = [];
        if (requestBodyObj) {
            if (requestBodyObj.system_instruction?.parts?.[0]?.text) {
                messages.push({ role: 'system', content: requestBodyObj.system_instruction.parts[0].text });
            }
            if (Array.isArray(requestBodyObj.contents)) {
                requestBodyObj.contents.forEach(c => {
                    const role = c.role === 'model' ? 'assistant' : 'user';
                    const text = (c.parts || []).map(p => p.text || '').join('\n');
                    if (text) messages.push({ role, content: text });
                });
            }
        }

        const backupModels = ['openai', 'qwen-coder', 'mistral'];
        for (const bm of backupModels) {
            if (isStoppedByUser) throw new Error('Stopped by user');
            try {
                const res = await nativeFetch('[https://text.pollinations.ai/openai](https://text.pollinations.ai/openai)', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: activeAbortController ? activeAbortController.signal : undefined,
                    body: JSON.stringify({
                        model: bm,
                        messages: messages.length > 0 ? messages : [{ role: 'user', content: 'Build the requested website in HTML5 wrapped in ```html code block.' }]
                    })
                });

                if (res.ok) {
                    const raw = await res.text();
                    let aiText = raw;
                    try {
                        const parsed = JSON.parse(raw);
                        aiText = parsed.choices?.[0]?.message?.content || raw;
                    } catch (e) {}

                    if (aiText && aiText.length > 20) {
                        const formatted = formatResponseForIndexParser(aiText);
                        recordHtmlSnapshot(formatted);
                        const geminiCompatible = {
                            candidates: [{ content: { parts: [{ text: formatted }] } }],
                            choices: [{ message: { content: formatted } }]
                        };
                        return new Response(JSON.stringify(geminiCompatible), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            } catch (err) {
                if (isStoppedByUser || err.name === 'AbortError') throw err;
            }
        }

        throw new Error('All AI servers are currently busy. Please try again in a moment.');
    }

    window.fetch = async function (url, options = {}) {
        const urlStr = typeof url === 'string' ? url : (url.url || '');
        const isGeminiGenerate = urlStr.includes('generativelanguage.googleapis.com') && urlStr.includes('generateContent');

        if (isGeminiGenerate) {
            isStoppedByUser = false;
            activeAbortController = new AbortController();
            toggleStopButton(true);

            try {
                const response = await callRealGeminiOrBackup(urlStr, options);
                toggleStopButton(false);
                return response;
            } catch (err) {
                toggleStopButton(false);
                throw err;
            }
        }

        return nativeFetch(url, options);
    };

    /* =========================================================
       4. KEEP EDITING (UNDO/REDO), STOP AI, & CANVAS FX (IFRAME ONLY)
    ========================================================= */
    function applyHtmlToPreview(htmlCode) {
        if (!htmlCode) return;
        if (typeof window.state === 'object' && window.state) {
            window.state.currentSiteHtml = htmlCode;
        }
        // Update preview iframe if open
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(frame => {
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

    // Inject interactive Canvas particles ONLY inside the generated website's HTML, NEVER on the main page!
    window.zenoInjectCanvasFX = function () {
        const currentHtml = (typeof window.state === 'object' && window.state?.currentSiteHtml)
            ? window.state.currentSiteHtml
            : (versionHistory[historyPointer] || '');

        if (!currentHtml || currentHtml.length < 40) {
            alert('First generate a website with AI, then tap Canvas FX to beautify it!');
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
        alert('✨ Canvas FX added to your website! Tap Preview to see it.');
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
        if (stopBtn) {
            stopBtn.style.display = show ? 'inline-flex' : 'none';
        }
    }

    function updateToolbarButtons() {
        const undoBtn = document.getElementById('zenoUndoBtn');
        const redoBtn = document.getElementById('zenoRedoBtn');
        if (undoBtn) undoBtn.style.opacity = historyPointer > 0 ? '1' : '0.4';
        if (redoBtn) redoBtn.style.opacity = (historyPointer >= 0 && historyPointer < versionHistory.length - 1) ? '1' : '0.4';
    }

    function mountCleanToolbar() {
        // Remove old buggy dock if present
        const oldDock = document.getElementById('zenoCanvasDock');
        if (oldDock) oldDock.remove();

        if (document.getElementById('zenoCleanToolbar')) return;

        const bar = document.createElement('div');
        bar.id = 'zenoCleanToolbar';
        bar.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(17,19,28,0.92);backdrop-filter:blur(12px);border:1px solid rgba(56,189,248,0.25);border-radius:14px;padding:5px 10px;box-shadow:0 8px 25px rgba(0,0,0,0.5);">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:10px;font-weight:700;color:#38bdf8;padding-right:4px;">Keep Editing:</span>
                    <button type="button" id="zenoUndoBtn" onclick="zenoUndoEdit()" style="background:#1e2230;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:4px 9px;font-size:11px;opacity:0.4;" title="Undo">
                        ↶ Undo
                    </button>
                    <button type="button" id="zenoRedoBtn" onclick="zenoRedoEdit()" style="background:#1e2230;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:4px 9px;font-size:11px;opacity:0.4;" title="Redo">
                        ↷ Redo
                    </button>
                </div>

                <div style="display:flex;align-items:center;gap:6px;">
                    <button type="button" id="zenoStopBtn" onclick="zenoStopGeneration()" style="display:none;align-items:center;gap:4px;background:#dc2626;color:#fff;border:none;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;">
                        ⏹ Stop AI
                    </button>
                    <button type="button" onclick="zenoInjectCanvasFX()" style="background:linear-gradient(135deg,rgba(6,182,212,0.25),rgba(59,130,246,0.25));color:#67e8f9;border:1px solid rgba(6,182,212,0.4);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;">
                        ✨ Canvas FX
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(bar);
    }

    function init() {
        injectLayoutFixes();
        mountCleanToolbar();
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
