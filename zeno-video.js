/**
 * ZENO-VIDEO.JS - AI Code-to-Video Render Engine & MP4 Compiler
 * 1. Top "Generate Video" button activates Video Mode directly above the AI chat bar.
 * 2. No separate Video API keys — uses the user's connected AI engine to write custom JavaScript
 *    Canvas animation code tailored specifically to the user's story, characters, and actions.
 * 3. Sends the generated animation code to the ZoneWeb Render Engine + MP4 Muxer (WebCodecs H.264 MP4
 *    with automatic MediaRecorder fallback) to compile a real 10-second downloadable .mp4 video.
 * 4. Preserves the global UI emoji-to-custom-logo replacer.
 */
(function () {
    const ZenoVideo = {
        videoModeActive: false,
        isGeneratingVideo: false,
        isReplacingEmojis: false,
        emojiObserver: null,
        aspectRatio: '16:9',
        mp4MuxerLoaded: false,

        init() {
            window.ZenoVideo = this;
            this.preloadMp4Muxer();

            const boot = () => {
                this.injectTopGenerateVideoButton();
                this.injectChatVideoPanel();
                this.hookChatSubmissionForVideo();
                this.replaceAllEmojisWithCustomLogos();
                this.startEmojiWatcher();
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', boot);
            } else {
                boot();
            }
        },

        // Loads lightweight pure-JS MP4 Muxer (15KB) for hardware H.264 .mp4 compilation
        preloadMp4Muxer() {
            if (window.Mp4Muxer || document.getElementById('zwMp4MuxerScript')) return;
            const s = document.createElement('script');
            s.id = 'zwMp4MuxerScript';
            s.src = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.min.js';
            s.onload = () => { this.mp4MuxerLoaded = true; };
            document.head.appendChild(s);
        },

        getCustomLogoSvg(sizePx = 14) {
            return `<svg width="${sizePx}" height="${Math.round(sizePx * 1.15)}" viewBox="0 0 120 140" class="inline-block align-middle shrink-0" style="vertical-align:-2px;" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="zwMiniGradA" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#60a5fa"/>
                        <stop offset="50%" stop-color="#6366f1"/>
                        <stop offset="100%" stop-color="#a855f7"/>
                    </linearGradient>
                    <linearGradient id="zwMiniGradB" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stop-color="#3b82f6"/>
                        <stop offset="100%" stop-color="#7e22ce"/>
                    </linearGradient>
                </defs>
                <polygon points="60,4 114,70 60,136 6,70" fill="url(#zwMiniGradA)"/>
                <polygon points="60,16 100,70 20,70" fill="#38bdf8" fill-opacity="0.45"/>
                <polygon points="20,70 100,70 60,124" fill="url(#zwMiniGradB)"/>
            </svg>`;
        },

        getVideoIconSvg(sizeClass = 'w-4 h-4') {
            return `<svg class="${sizeClass} shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="14" height="14" rx="3"></rect>
                <polygon points="16 10 22 6 22 18 16 14 16 10"></polygon>
            </svg>`;
        },

        // =========================================================================
        // 1. GLOBAL UI EMOJI REPLACER
        // =========================================================================
        replaceAllEmojisWithCustomLogos(rootNode = document.body) {
            if (!rootNode || this.isReplacingEmojis) return;
            this.isReplacingEmojis = true;
            try {
                if (document.title) {
                    document.title = document.title.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').trim();
                }
                const emojiRegex = /(?:[\p{Extended_Pictographic}\u2600-\u27BF]+(?:\uFE0F|\u200D[\p{Extended_Pictographic}\u2600-\u27BF]+)*)/gu;
                const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
                    acceptNode(node) {
                        const parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;
                        const tag = parent.tagName;
                        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'CODE' || tag === 'PRE') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (parent.closest('.zw-custom-logo-badge')) return NodeFilter.FILTER_REJECT;
                        return emojiRegex.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    }
                });
                const nodesToReplace = [];
                let current;
                while ((current = walker.nextNode())) nodesToReplace.push(current);

                for (const textNode of nodesToReplace) {
                    const text = textNode.nodeValue;
                    emojiRegex.lastIndex = 0;
                    const parts = text.split(emojiRegex);
                    const matches = text.match(emojiRegex);
                    if (!matches) continue;
                    const frag = document.createDocumentFragment();
                    parts.forEach((part, idx) => {
                        if (part) frag.appendChild(document.createTextNode(part));
                        if (idx < matches.length) {
                            const badge = document.createElement('span');
                            badge.className = 'zw-custom-logo-badge inline-flex items-center justify-center mx-0.5';
                            badge.innerHTML = this.getCustomLogoSvg(14);
                            frag.appendChild(badge);
                        }
                    });
                    if (textNode.parentNode) textNode.parentNode.replaceChild(frag, textNode);
                }
            } catch (e) {
            } finally {
                this.isReplacingEmojis = false;
            }
        },

        startEmojiWatcher() {
            if (this.emojiObserver || !document.body) return;
            this.emojiObserver = new MutationObserver((mutations) => {
                if (this.isReplacingEmojis) return;
                for (const m of mutations) {
                    for (const node of m.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) this.replaceAllEmojisWithCustomLogos(node);
                        else if (node.nodeType === Node.TEXT_NODE && node.parentElement) this.replaceAllEmojisWithCustomLogos(node.parentElement);
                    }
                }
            });
            this.emojiObserver.observe(document.body, { childList: true, subtree: true });
        },

        // =========================================================================
        // 2. TOP "GENERATE VIDEO" BUTTON & VIDEO MODE BAR ON TOP OF AI CHAT
        // =========================================================================
        injectTopGenerateVideoButton() {
            const topPreviewBtn = document.getElementById('topPreviewBtn');
            if (!topPreviewBtn || !topPreviewBtn.parentElement || document.getElementById('topGenerateVideoBtn')) return;

            const btn = document.createElement('button');
            btn.id = 'topGenerateVideoBtn';
            btn.className = "px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition shrink-0";
            btn.innerHTML = `${this.getVideoIconSvg('w-3.5 h-3.5')} <span>Generate Video</span>`;
            btn.onclick = () => this.toggleVideoMode(true);

            topPreviewBtn.parentElement.insertBefore(btn, topPreviewBtn);
        },

        injectChatVideoPanel() {
            const chatCard = document.querySelector('#bottomChatBarContainer .card-bg');
            if (!chatCard || document.getElementById('zenoVideoChatPanel')) return;

            const panel = document.createElement('div');
            panel.id = 'zenoVideoChatPanel';
            panel.className = "hidden mb-2.5 p-3 rounded-2xl bg-gradient-to-r from-fuchsia-950/90 via-indigo-950/90 to-purple-950/90 border border-fuchsia-500/40 shadow-xl space-y-2";
            panel.innerHTML = `
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-fuchsia-600 text-white flex items-center justify-center shadow">
                            ${this.getVideoIconSvg('w-4 h-4')}
                        </span>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-extrabold text-white">Video Mode Active</span>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">AI Code -> MP4 Render Engine</span>
                            </div>
                            <p class="text-[10px] text-gray-300">AI is ready: describe your video scene below to code & render a 10s MP4</p>
                        </div>
                    </div>
                    <button onclick="window.ZenoVideo.toggleVideoMode(false)" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-600 text-gray-200 hover:text-white flex items-center justify-center transition" title="Exit Video Mode">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <div class="flex items-center justify-between gap-2 pt-0.5">
                    <div class="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/15">
                        <button type="button" id="zwRatio169" onclick="window.ZenoVideo.setAspectRatio('16:9')" class="px-2.5 py-1 rounded-md bg-fuchsia-600 text-white text-[10px] font-extrabold">16:9 Landscape</button>
                        <button type="button" id="zwRatio916" onclick="window.ZenoVideo.setAspectRatio('9:16')" class="px-2.5 py-1 rounded-md text-gray-300 text-[10px] font-bold">9:16 Vertical</button>
                    </div>

                    <button type="button" onclick="window.ZenoVideo.triggerInstantVideoFromChat()" class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold shadow transition">
                        Render 10s MP4 Video
                    </button>
                </div>
            `;

            chatCard.insertBefore(panel, chatCard.firstChild);
        },

        setAspectRatio(ratio) {
            this.aspectRatio = ratio;
            const b16 = document.getElementById('zwRatio169');
            const b9 = document.getElementById('zwRatio916');
            if (b16 && b9) {
                b16.className = ratio === '16:9' ? "px-2.5 py-1 rounded-md bg-fuchsia-600 text-white text-[10px] font-extrabold" : "px-2.5 py-1 rounded-md text-gray-300 text-[10px] font-bold";
                b9.className = ratio === '9:16' ? "px-2.5 py-1 rounded-md bg-fuchsia-600 text-white text-[10px] font-extrabold" : "px-2.5 py-1 rounded-md text-gray-300 text-[10px] font-bold";
            }
        },

        toggleVideoMode(enable) {
            this.videoModeActive = enable;
            const panel = document.getElementById('zenoVideoChatPanel');
            const chatInput = document.getElementById('chatInput');
            const topBtn = document.getElementById('topGenerateVideoBtn');

            if (enable) {
                panel?.classList.remove('hidden');
                if (chatInput) {
                    chatInput.placeholder = "Describe the video story, characters & actions you want AI to create...";
                    chatInput.focus();
                }
                topBtn?.classList.add('ring-2', 'ring-fuchsia-300');
            } else {
                panel?.classList.add('hidden');
                if (chatInput) {
                    chatInput.placeholder = "Describe the exact website or feature you want the AI to build...";
                }
                topBtn?.classList.remove('ring-2', 'ring-fuchsia-300');
            }
        },

        triggerInstantVideoFromChat() {
            const chatInput = document.getElementById('chatInput');
            const promptText = (chatInput?.value || '').trim();
            if (!promptText) {
                chatInput?.focus();
                return alert("Please write a description of the video you want to create first!");
            }
            chatInput.value = '';
            this.createVideoFromPrompt(promptText);
        },

        hookChatSubmissionForVideo() {
            const origSend = window.sendUserMessage;
            window.sendUserMessage = async () => {
                const chatInput = document.getElementById('chatInput');
                const text = (chatInput?.value || '').trim();

                if (this.videoModeActive || /\b(generate video|create video|make a video|make video|ڤیدیۆ دروست بکە|ڤیدیۆیەک دروست بکە)\b/i.test(text)) {
                    if (!text) return;
                    chatInput.value = '';
                    await this.createVideoFromPrompt(text);
                    return;
                }

                if (typeof origSend === 'function') {
                    return origSend();
                }
            };
        },

        // =========================================================================
        // 3. STEP 1: AI WRITES CUSTOM ANIMATION CODE -> STEP 2: RENDER ENGINE -> MP4
        // =========================================================================
        async createVideoFromPrompt(userPrompt) {
            if (this.isGeneratingVideo) return;

            // Security check
            if (window.ZenoUltimate && window.ZenoUltimate.forbiddenPattern && window.ZenoUltimate.forbiddenPattern.test(userPrompt)) {
                if (typeof window.appendMessage === 'function') {
                    window.appendMessage('user', userPrompt);
                    window.appendMessage('ai', "Security Alert: Adult, hacking, or malware video generation is not allowed.");
                }
                return;
            }

            this.isGeneratingVideo = true;
            document.getElementById('heroPrompt')?.classList.add('hidden');

            if (typeof window.appendMessage === 'function') {
                window.appendMessage('user', `[Video Mode] ${userPrompt}`);
            }

            const feed = document.getElementById('chatFeed');
            const cardId = 'zw_vid_engine_' + Date.now();
            const startTime = performance.now();

            const cardWrap = document.createElement('div');
            cardWrap.id = cardId;
            cardWrap.className = "flex justify-start w-full my-3";
            cardWrap.innerHTML = `
                <div class="w-full max-w-[92%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center">
                                <i class="fa-solid fa-code fa-beat text-xs"></i>
                            </div>
                            <div>
                                <p id="${cardId}_phase" class="text-xs md:text-sm font-extrabold text-white">Step 1/3: AI is writing custom video code...</p>
                                <p id="${cardId}_detail" class="text-[11px] text-fuchsia-300">Scripting characters, actions & timeline for your prompt...</p>
                            </div>
                        </div>
                        <div class="text-right shrink-0">
                            <span id="${cardId}_pct" class="text-sm font-mono font-black text-emerald-400 block">0%</span>
                            <span id="${cardId}_timer" class="text-[10px] font-mono text-gray-400">0.0s</span>
                        </div>
                    </div>

                    <div class="w-full h-2.5 bg-black/70 rounded-full overflow-hidden border border-white/10">
                        <div id="${cardId}_bar" class="h-full bg-gradient-to-r from-fuchsia-600 via-indigo-500 to-emerald-400 transition-all duration-100" style="width:0%;"></div>
                    </div>

                    <!-- Live Preview Monitor while Render Engine renders frames -->
                    <div id="${cardId}_monitorWrap" class="hidden rounded-xl overflow-hidden border border-white/15 bg-black relative">
                        <canvas id="${cardId}_liveMonitor" class="w-full max-h-48 object-contain mx-auto block"></canvas>
                        <span class="absolute top-2 right-2 px-2 py-0.5 rounded bg-red-600/90 text-white text-[9px] font-black uppercase tracking-wider">LIVE RENDER</span>
                    </div>

                    <div class="grid grid-cols-3 gap-1.5 text-[10px] font-bold text-center">
                        <div id="${cardId}_s1" class="py-1 px-2 rounded-lg bg-fuchsia-600/30 border border-fuchsia-500/50 text-white">1. AI Video Code</div>
                        <div id="${cardId}_s2" class="py-1 px-2 rounded-lg bg-white/5 border border-white/10 text-gray-400">2. Render Engine</div>
                        <div id="${cardId}_s3" class="py-1 px-2 rounded-lg bg-white/5 border border-white/10 text-gray-400">3. MP4 Compiler</div>
                    </div>
                </div>
            `;
            feed?.appendChild(cardWrap);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

            const timerInterval = setInterval(() => {
                const tEl = document.getElementById(`${cardId}_timer`);
                if (tEl) tEl.innerText = `${((performance.now() - startTime) / 1000).toFixed(1)}s`;
            }, 100);

            const updateStatus = (pct, phaseText, detailText, stepNum) => {
                const pEl = document.getElementById(`${cardId}_pct`);
                const bEl = document.getElementById(`${cardId}_bar`);
                const phEl = document.getElementById(`${cardId}_phase`);
                const dtEl = document.getElementById(`${cardId}_detail`);
                if (pEl) pEl.innerText = `${Math.min(100, Math.round(pct))}%`;
                if (bEl) bEl.style.width = `${Math.min(100, Math.round(pct))}%`;
                if (phEl && phaseText) phEl.innerText = phaseText;
                if (dtEl && detailText) dtEl.innerText = detailText;

                for (let s = 1; s <= 3; s++) {
                    const box = document.getElementById(`${cardId}_s${s}`);
                    if (!box) continue;
                    if (s < stepNum) box.className = "py-1 px-2 rounded-lg bg-emerald-600/30 border border-emerald-500/50 text-emerald-300";
                    else if (s === stepNum) box.className = "py-1 px-2 rounded-lg bg-fuchsia-600/35 border border-fuchsia-400 text-white animate-pulse";
                    else box.className = "py-1 px-2 rounded-lg bg-white/5 border border-white/10 text-gray-400";
                }
            };

            try {
                // STEP 1: Ask the AI Engine to write custom JS Canvas animation code for this exact prompt
                updateStatus(10, "Step 1/3: AI is writing custom animation code...", "Generating scene choreography & character actions...", 1);
                const generatedJsBody = await this.generateCustomVideoCodeFromAI(userPrompt, (p) => {
                    updateStatus(p, "Step 1/3: AI is writing custom animation code...", "Compiling custom JavaScript scene functions...", 1);
                });

                // Compile & verify the AI-written animation function
                const renderFn = this.compileSafeRenderFunction(generatedJsBody, userPrompt);

                // STEP 2 & 3: Send compiled code to Render Engine + MP4 Muxer
                updateStatus(35, "Step 2/3: Sending code to Render Engine...", "Initializing 30 FPS HD Canvas & MP4 Encoder...", 2);
                const monitorWrap = document.getElementById(`${cardId}_monitorWrap`);
                const monitorCanvas = document.getElementById(`${cardId}_liveMonitor`);
                if (monitorWrap) monitorWrap.classList.remove('hidden');

                const { blob, extension, formatLabel } = await this.executeRenderEngineToMp4(
                    renderFn,
                    userPrompt,
                    monitorCanvas,
                    (frame, totalFrames, stage) => {
                        if (stage === 'rendering') {
                            const pct = 35 + Math.round((frame / totalFrames) * 55);
                            updateStatus(pct, "Step 2/3: Render Engine Active...", `Rendering Frame ${frame} / ${totalFrames} (${(frame / 30).toFixed(1)}s / 10.0s)`, 2);
                        } else {
                            updateStatus(95, "Step 3/3: MP4 Compiler Packaging Video...", "Finalizing MP4 video container & streams...", 3);
                        }
                    }
                );

                clearInterval(timerInterval);
                const videoUrl = URL.createObjectURL(blob);
                this.renderCompletedVideoCard(cardWrap, videoUrl, userPrompt, extension, formatLabel, generatedJsBody);

            } catch (err) {
                clearInterval(timerInterval);
                cardWrap.innerHTML = `
                    <div class="w-full max-w-[92%] rounded-2xl p-4 card-bg border border-red-500/40 text-xs text-red-300 space-y-2">
                        <p class="font-bold">Render Engine Notice: ${err.message}</p>
                        <button onclick="window.ZenoVideo.createVideoFromPrompt(\`${userPrompt.replace(/`/g, '')}\`)" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold">Retry Render</button>
                    </div>
                `;
            } finally {
                this.isGeneratingVideo = false;
                this.toggleVideoMode(false);
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        },

        // =========================================================================
        // AI CODE GENERATOR FOR VIDEO ANIMATION (Uses User's Connected AI Engine)
        // =========================================================================
        async generateCustomVideoCodeFromAI(userPrompt, onProgress) {
            const systemInstruction = `You are an expert HTML5 Canvas 2D Animator & Video Director.
Write the JavaScript body for a function:
function renderFrame(ctx, w, h, t, helpers)
that renders a rich, dynamic, multi-act 10-second animated video (where t goes from 0.0 to 10.0 seconds) depicting the EXACT story, characters, objects, and actions requested by the user.

AVAILABLE BUILT-IN HELPERS (Use them heavily for expressive characters & scenes!):
- helpers.lerp(a, b, alpha) -> linear interpolation
- helpers.clamp(val, min, max) -> clamp value
- helpers.smoothstep(edge0, edge1, x) -> smooth 0..1 transition
- helpers.drawSky(ctx, w, h, topColor, bottomColor, starsOpacity) -> draws gradient sky & stars
- helpers.drawGround(ctx, w, h, groundY, topColor, bottomColor) -> draws ground/street/floor
- helpers.drawCity(ctx, w, h, groundY, buildingColor, windowColor) -> draws city skyline
- helpers.drawCharacter(ctx, { x, y, scale, shirtColor, pantsColor, skinColor, hairColor, expression, pose, facing, holding, speech })
  * expression: 'neutral' | 'happy' | 'laughing' | 'sad' | 'angry' | 'shocked'
  * pose: 'idle' | 'walk' | 'beg' | 'point' | 'celebrate' | 'fall'
  * facing: 1 (right) or -1 (left)
  * holding: 'none' | 'money' | 'gold_bag' | 'crown' | 'sword' | 'phone' | 'gift'
  * speech: string (optional floating speech bubble above character's head!)
- helpers.drawRobot(ctx, { x, y, scale, color, eyeColor, laserActive, targetX, targetY }) -> draws giant mecha robot
- helpers.drawMonster(ctx, { x, y, scale, color, roar, fireActive, targetX, targetY }) -> draws giant kaiju monster
- helpers.drawVehicle(ctx, { x, y, scale, color, type }) -> type: 'car' | 'rocket' | 'police'
- helpers.drawExplosion(ctx, x, y, radius, progress) -> progress 0..1
- helpers.drawParticles(ctx, w, h, t, color, count, direction) -> direction: 'up' | 'down' | 'right'
- helpers.drawSubtitle(ctx, text) -> draws clean cinematic subtitle at bottom

CRITICAL RULES:
1. Script a clear 3-Act story across t = 0..3.3s (Act 1), t = 3.3..6.7s (Act 2), and t = 6.7..10.0s (Act 3) matching the user's exact request!
2. Animate positions (x, y), poses, expressions, speech bubbles, and effects smoothly using t.
3. Output ONLY raw JavaScript statements for the inside of renderFrame(ctx, w, h, t, helpers) wrapped in \`\`\`javascript ... \`\`\`. Do NOT wrap in function declaration headers and do NOT use external image URLs.`;

            const rawKey = (window.state?.apiKey || localStorage.getItem('zw_api_key') || '').replace(/[\s"'`]/g, '').trim();
            let rawAiReply = '';

            // 1. Try User's Connected Gemini API Key
            if (rawKey.startsWith('AIza')) {
                const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];
                for (const m of models) {
                    try {
                        if (onProgress) onProgress(18);
                        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(rawKey)}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: `${systemInstruction}\n\nUSER VIDEO PROMPT: "${userPrompt}"` }] }],
                                generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
                            })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            if (txt.length > 40) {
                                rawAiReply = txt;
                                break;
                            }
                        }
                    } catch (e) {}
                }
            }
            // 2. Try User's OpenAI / Groq Key if connected
            else if (rawKey.startsWith('sk-') || rawKey.startsWith('gsk_')) {
                try {
                    if (onProgress) onProgress(18);
                    const isGroq = rawKey.startsWith('gsk_');
                    const url = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
                    const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${rawKey}` },
                        body: JSON.stringify({
                            model,
                            messages: [
                                { role: 'system', content: systemInstruction },
                                { role: 'user', content: `USER VIDEO PROMPT: "${userPrompt}"` }
                            ]
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        rawAiReply = data.choices?.[0]?.message?.content || '';
                    }
                } catch (e) {}
            }

            // 3. Cloud Coding AI Fallback if user has no key or rate-limited
            if (!rawAiReply) {
                try {
                    if (onProgress) onProgress(22);
                    const res = await fetch('https://text.pollinations.ai/openai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'qwen-coder',
                            messages: [
                                { role: 'system', content: systemInstruction },
                                { role: 'user', content: `USER VIDEO PROMPT: "${userPrompt}"` }
                            ]
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        rawAiReply = data.choices?.[0]?.message?.content || '';
                    }
                } catch (e) {}
            }

            const cleanedCode = this.extractCleanJsBody(rawAiReply);
            if (cleanedCode && cleanedCode.length > 35) {
                return cleanedCode;
            }

            // 4. Smart Dynamic Procedural Fallback tailored to keywords in the user's prompt
            return this.buildDynamicKeywordCode(userPrompt);
        },

        extractCleanJsBody(rawText) {
            if (!rawText) return '';
            let code = rawText;
            const fenceMatch = rawText.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i);
            if (fenceMatch && fenceMatch[1]) {
                code = fenceMatch[1].trim();
            }
            // Strip function wrapper if the LLM included `function renderFrame(...) { ... }`
            code = code.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, '');
            if (code.endsWith('}') && (code.match(/\{/g) || []).length < (code.match(/\}/g) || []).length) {
                code = code.slice(0, -1);
            }
            return code.trim();
        },

        // Compiles the AI's JS code and tests it on sample timestamps so it NEVER crashes during rendering
        compileSafeRenderFunction(jsBody, fallbackPrompt) {
            const helpers = this.createCanvasHelpers();
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 320;
            testCanvas.height = 180;
            const testCtx = testCanvas.getContext('2d');

            const tryBuild = (codeStr) => {
                const fn = new Function('ctx', 'w', 'h', 't', 'helpers', codeStr);
                // Dry-run across Act 1, Act 2, Act 3 to verify zero runtime exceptions
                fn(testCtx, 320, 180, 0.5, helpers);
                fn(testCtx, 320, 180, 5.0, helpers);
                fn(testCtx, 320, 180, 9.2, helpers);
                return fn;
            };

            try {
                return tryBuild(jsBody);
            } catch (err) {
                console.warn("Auto-healing AI animation code syntax:", err.message);
                const safeFallbackCode = this.buildDynamicKeywordCode(fallbackPrompt);
                return tryBuild(safeFallbackCode);
            }
        },

        // Tailored procedural animation generator if offline or AI code had a syntax glitch
        buildDynamicKeywordCode(promptText) {
            const p = (promptText || '').toLowerCase();
            const safeSub = (promptText || '').replace(/'/g, "\\'").slice(0, 68);

            if (/(robot|monster|fight|battle|kaiju|war)/i.test(p)) {
                return `
                helpers.drawSky(ctx, w, h, '#090d1f', '#3b0764', 0.8);
                helpers.drawCity(ctx, w, h, h * 0.82, '#090a0f', 'rgba(250,204,21,0.35)');
                helpers.drawGround(ctx, w, h, h * 0.82, '#1e293b', '#020617');
                const robX = helpers.lerp(w * 0.15, w * 0.34, helpers.smoothstep(0, 3, t));
                const monX = helpers.lerp(w * 0.85, w * 0.66, helpers.smoothstep(0, 3, t));
                const clash = t > 3.2 && t < 7.5;
                helpers.drawRobot(ctx, { x: robX, y: h * 0.82, scale: 1.1, color: '#3b82f6', eyeColor: '#38bdf8', laserActive: clash, targetX: monX, targetY: h * 0.55 });
                if (t < 8.2) {
                    helpers.drawMonster(ctx, { x: monX, y: h * 0.82, scale: 1.15, color: '#166534', roar: true, fireActive: clash, targetX: robX, targetY: h * 0.55 });
                }
                if (t >= 7.2) {
                    helpers.drawExplosion(ctx, monX, h * 0.6, 140, helpers.clamp((t - 7.2) / 2.2, 0, 1));
                }
                helpers.drawParticles(ctx, w, h, t, '#f97316', 35, 'up');
                helpers.drawSubtitle(ctx, '${safeSub}');`;
            }

            if (/(car|race|racing|drive|police|street)/i.test(p)) {
                return `
                helpers.drawSky(ctx, w, h, '#050816', '#1e1b4b', 0.9);
                helpers.drawCity(ctx, w, h, h * 0.78, '#0f172a', 'rgba(56,189,248,0.4)');
                helpers.drawGround(ctx, w, h, h * 0.78, '#1e293b', '#090a0f');
                const car1X = helpers.lerp(w * 0.12, w * 0.78, t / 10);
                const car2X = helpers.lerp(w * 0.02, w * 0.62, t / 10);
                helpers.drawVehicle(ctx, { x: car1X, y: h * 0.78, scale: 1.15, color: '#ef4444', type: 'car' });
                helpers.drawVehicle(ctx, { x: car2X, y: h * 0.84, scale: 1.1, color: '#3b82f6', type: 'police' });
                helpers.drawParticles(ctx, w, h, t, '#38bdf8', 30, 'right');
                helpers.drawSubtitle(ctx, '${safeSub}');`;
            }

            if (/(rocket|space|planet|mars|moon|star)/i.test(p)) {
                return `
                helpers.drawSky(ctx, w, h, '#02040a', '#1e1038', 1.0);
                const ry = helpers.lerp(h * 0.82, h * 0.18, helpers.smoothstep(0, 9, t));
                helpers.drawVehicle(ctx, { x: w * 0.5, y: ry, scale: 1.2, color: '#f8fafc', type: 'rocket' });
                helpers.drawParticles(ctx, w, h, t, '#fbbf24', 45, 'down');
                helpers.drawSubtitle(ctx, '${safeSub}');`;
            }

            // Default expressive 2-character story animation
            return `
            helpers.drawSky(ctx, w, h, '#0f172a', '#1e3a8a', 0.4);
            helpers.drawCity(ctx, w, h, h * 0.82, '#1e293b', 'rgba(253,224,71,0.25)');
            helpers.drawGround(ctx, w, h, h * 0.82, '#334155', '#0f172a');
            const p1X = helpers.lerp(w * 0.22, w * 0.38, helpers.smoothstep(0, 2.5, t));
            const p2X = helpers.lerp(w * 0.78, w * 0.62, helpers.smoothstep(0, 2.5, t));
            const act = t < 3.5 ? 1 : (t < 7.0 ? 2 : 3);
            helpers.drawCharacter(ctx, {
                x: p1X, y: h * 0.82, scale: 1.1,
                shirtColor: act === 3 ? '#f59e0b' : '#64748b',
                pantsColor: '#1e293b',
                expression: act === 1 ? 'sad' : (act === 2 ? 'shocked' : 'happy'),
                pose: act === 1 ? 'beg' : (act === 3 ? 'celebrate' : 'idle'),
                facing: 1,
                holding: act === 3 ? 'gold_bag' : 'none',
                speech: act === 1 ? 'Please help...' : (act === 3 ? 'My turn now!' : '')
            });
            helpers.drawCharacter(ctx, {
                x: p2X, y: h * 0.82, scale: 0.92,
                shirtColor: '#ef4444',
                pantsColor: '#0f172a',
                expression: act === 2 ? 'laughing' : (act === 3 ? 'shocked' : 'neutral'),
                pose: act === 2 ? 'point' : (act === 3 ? 'fall' : 'idle'),
                facing: -1,
                holding: act < 3 ? 'money' : 'none',
                speech: act === 2 ? 'Haha! No way!' : (act === 3 ? 'Oh no!' : '')
            });
            helpers.drawSubtitle(ctx, '${safeSub}');`;
        },

        // Rich Canvas 2D Helper Toolkit injected into every AI-generated animation
        createCanvasHelpers() {
            return {
                lerp: (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t)),
                clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
                smoothstep: (e0, e1, x) => {
                    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0 || 1)));
                    return t * t * (3 - 2 * t);
                },

                drawSky(ctx, w, h, topCol = '#090d1f', botCol = '#1e3a8a', starsAlpha = 0.6) {
                    const g = ctx.createLinearGradient(0, 0, 0, h);
                    g.addColorStop(0, topCol);
                    g.addColorStop(1, botCol);
                    ctx.fillStyle = g;
                    ctx.fillRect(0, 0, w, h);

                    if (starsAlpha > 0) {
                        ctx.fillStyle = `rgba(255,255,255,${starsAlpha})`;
                        for (let i = 0; i < 45; i++) {
                            const sx = (i * 197) % w;
                            const sy = (i * 89) % (h * 0.65);
                            ctx.beginPath();
                            ctx.arc(sx, sy, (i % 2) + 0.8, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                },

                drawGround(ctx, w, h, groundY, topCol = '#1e293b', botCol = '#090a0f') {
                    const g = ctx.createLinearGradient(0, groundY, 0, h);
                    g.addColorStop(0, topCol);
                    g.addColorStop(1, botCol);
                    ctx.fillStyle = g;
                    ctx.fillRect(0, groundY, w, h - groundY);
                },

                drawCity(ctx, w, h, groundY, bCol = '#0b0f19', winCol = 'rgba(253,224,71,0.3)') {
                    const cols = 14;
                    const bw = w / cols;
                    for (let i = 0; i < cols; i++) {
                        const bh = h * (0.2 + ((i * 29) % 26) / 100);
                        ctx.fillStyle = bCol;
                        ctx.fillRect(i * bw + 2, groundY - bh, bw - 4, bh);
                        ctx.fillStyle = winCol;
                        for (let wy = groundY - bh + 12; wy < groundY - 14; wy += 16) {
                            if ((i + wy) % 2 === 0) ctx.fillRect(i * bw + 8, wy, 5, 7);
                        }
                    }
                },

                drawCharacter(ctx, opts = {}) {
                    const {
                        x = 200, y = 380, scale = 1,
                        shirtColor = '#3b82f6', pantsColor = '#1e293b',
                        skinColor = '#fcd34d', hairColor = '#1f2937',
                        expression = 'neutral', pose = 'idle',
                        facing = 1, holding = 'none', speech = ''
                    } = opts;

                    ctx.save();
                    ctx.translate(x, y);
                    if (pose === 'fall') {
                        ctx.rotate(facing * 0.45);
                    }
                    ctx.scale(scale * facing, scale);

                    const walkSwing = pose === 'walk' ? Math.sin(Date.now() * 0.015) * 14 : 0;

                    // Legs
                    ctx.strokeStyle = pantsColor;
                    ctx.lineWidth = 10;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(-8, -55);
                    ctx.lineTo(-10 - walkSwing, 0);
                    ctx.moveTo(8, -55);
                    ctx.lineTo(10 + walkSwing, 0);
                    ctx.stroke();

                    // Torso
                    ctx.fillStyle = shirtColor;
                    ctx.beginPath();
                    ctx.roundRect ? ctx.roundRect(-18, -112, 36, 60, 10) : ctx.fillRect(-18, -112, 36, 60);
                    ctx.fill();

                    // Arms
                    ctx.strokeStyle = skinColor;
                    ctx.lineWidth = 8;
                    ctx.beginPath();
                    if (pose === 'beg' || pose === 'point') {
                        ctx.moveTo(12, -100);
                        ctx.lineTo(42, -88);
                    } else if (pose === 'celebrate') {
                        ctx.moveTo(-14, -102);
                        ctx.lineTo(-32, -142);
                        ctx.moveTo(14, -102);
                        ctx.lineTo(32, -142);
                    } else {
                        ctx.moveTo(-14, -100);
                        ctx.lineTo(-20 + walkSwing * 0.5, -62);
                        ctx.moveTo(14, -100);
                        ctx.lineTo(22 - walkSwing * 0.5, -62);
                    }
                    ctx.stroke();

                    // Held Object
                    if (holding === 'money') {
                        ctx.fillStyle = '#22c55e';
                        ctx.fillRect(36, -98, 22, 12);
                    } else if (holding === 'gold_bag') {
                        ctx.fillStyle = '#eab308';
                        ctx.beginPath();
                        ctx.arc(34, -82, 14, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (holding === 'sword') {
                        ctx.strokeStyle = '#e2e8f0';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.moveTo(35, -85);
                        ctx.lineTo(75, -125);
                        ctx.stroke();
                    }

                    // Head
                    ctx.fillStyle = skinColor;
                    ctx.beginPath();
                    ctx.arc(0, -134, 21, 0, Math.PI * 2);
                    ctx.fill();

                    // Hair / Crown
                    if (holding === 'crown') {
                        ctx.fillStyle = '#facc15';
                        ctx.beginPath();
                        ctx.moveTo(-16, -150);
                        ctx.lineTo(-10, -168);
                        ctx.lineTo(0, -155);
                        ctx.lineTo(10, -168);
                        ctx.lineTo(16, -150);
                        ctx.closePath();
                        ctx.fill();
                    } else {
                        ctx.fillStyle = hairColor;
                        ctx.beginPath();
                        ctx.arc(0, -138, 21, Math.PI, Math.PI * 2);
                        ctx.fill();
                    }

                    // Eyes & Expression
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath();
                    ctx.arc(7, -136, 2.5, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = '#0f172a';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    if (expression === 'happy' || expression === 'laughing') {
                        ctx.arc(6, -128, 7, 0, Math.PI);
                    } else if (expression === 'sad' || expression === 'angry') {
                        ctx.arc(6, -121, 6, Math.PI, Math.PI * 2);
                    } else if (expression === 'shocked') {
                        ctx.arc(7, -125, 4.5, 0, Math.PI * 2);
                    } else {
                        ctx.moveTo(2, -126);
                        ctx.lineTo(12, -126);
                    }
                    ctx.stroke();

                    ctx.restore();

                    // Floating Speech Bubble (always readable, un-mirrored)
                    if (speech) {
                        ctx.save();
                        ctx.font = 'bold 13px Segoe UI, sans-serif';
                        const tw = ctx.measureText(speech).width + 20;
                        const bx = x - tw / 2;
                        const by = y - 195 * scale;
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.roundRect ? ctx.roundRect(bx, by, tw, 28, 10) : ctx.fillRect(bx, by, tw, 28);
                        ctx.fill();
                        ctx.fillStyle = '#0f172a';
                        ctx.textAlign = 'center';
                        ctx.fillText(speech, x, by + 18);
                        ctx.restore();
                    }
                },

                drawRobot(ctx, opts = {}) {
                    const { x = 250, y = 400, scale = 1, color = '#3b82f6', eyeColor = '#38bdf8', laserActive = false, targetX = 600, targetY = 260 } = opts;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.scale(scale, scale);

                    // Legs
                    ctx.fillStyle = '#334155';
                    ctx.fillRect(-34, -75, 24, 75);
                    ctx.fillRect(10, -75, 24, 75);
                    // Armor Torso
                    ctx.fillStyle = color;
                    ctx.fillRect(-46, -165, 92, 92);
                    // Shoulders
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(-62, -165, 20, 45);
                    ctx.fillRect(42, -165, 20, 45);
                    // Head & Visor
                    ctx.fillStyle = '#475569';
                    ctx.fillRect(-24, -202, 48, 36);
                    ctx.fillStyle = eyeColor;
                    ctx.fillRect(-14, -190, 32, 9);
                    ctx.restore();

                    if (laserActive) {
                        ctx.save();
                        ctx.strokeStyle = eyeColor;
                        ctx.lineWidth = 7;
                        ctx.shadowBlur = 18;
                        ctx.shadowColor = eyeColor;
                        ctx.beginPath();
                        ctx.moveTo(x + 15 * scale, y - 185 * scale);
                        ctx.lineTo(targetX, targetY);
                        ctx.stroke();
                        ctx.restore();
                    }
                },

                drawMonster(ctx, opts = {}) {
                    const { x = 680, y = 400, scale = 1, color = '#15803d', fireActive = false, targetX = 280, targetY = 260 } = opts;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.scale(scale, scale);

                    // Dorsal Spikes
                    ctx.fillStyle = '#a855f7';
                    for (let i = 0; i < 4; i++) {
                        ctx.beginPath();
                        ctx.moveTo(25, -170 + i * 35);
                        ctx.lineTo(58, -155 + i * 35);
                        ctx.lineTo(25, -140 + i * 35);
                        ctx.fill();
                    }
                    // Monster Body
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(-45, 0);
                    ctx.lineTo(-35, -180);
                    ctx.lineTo(15, -205);
                    ctx.lineTo(45, -140);
                    ctx.lineTo(40, 0);
                    ctx.closePath();
                    ctx.fill();
                    // Glowing Eye
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(-16, -175, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();

                    if (fireActive) {
                        ctx.save();
                        ctx.strokeStyle = '#f97316';
                        ctx.lineWidth = 9;
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = '#ef4444';
                        ctx.beginPath();
                        ctx.moveTo(x - 25 * scale, y - 165 * scale);
                        ctx.lineTo(targetX, targetY);
                        ctx.stroke();
                        ctx.restore();
                    }
                },

                drawVehicle(ctx, opts = {}) {
                    const { x = 300, y = 380, scale = 1, color = '#ef4444', type = 'car' } = opts;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.scale(scale, scale);

                    if (type === 'rocket') {
                        // Exhaust Flame
                        ctx.fillStyle = '#f97316';
                        ctx.beginPath();
                        ctx.moveTo(-14, 0);
                        ctx.lineTo(0, 38 + Math.random() * 14);
                        ctx.lineTo(14, 0);
                        ctx.fill();
                        // Rocket Body
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.moveTo(0, -95);
                        ctx.lineTo(22, -45);
                        ctx.lineTo(22, 0);
                        ctx.lineTo(-22, 0);
                        ctx.lineTo(-22, -45);
                        ctx.closePath();
                        ctx.fill();
                        // Window
                        ctx.fillStyle = '#38bdf8';
                        ctx.beginPath();
                        ctx.arc(0, -45, 9, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        // Sports / Police Car
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.roundRect ? ctx.roundRect(-55, -36, 110, 24, 8) : ctx.fillRect(-55, -36, 110, 24);
                        ctx.fill();
                        ctx.fillStyle = '#0f172a';
                        ctx.beginPath();
                        ctx.roundRect ? ctx.roundRect(-30, -54, 58, 22, 6) : ctx.fillRect(-30, -54, 58, 22);
                        ctx.fill();
                        if (type === 'police') {
                            ctx.fillStyle = Math.floor(Date.now() / 150) % 2 === 0 ? '#ef4444' : '#3b82f6';
                            ctx.fillRect(-8, -60, 16, 6);
                        }
                        // Wheels
                        ctx.fillStyle = '#020617';
                        ctx.beginPath();
                        ctx.arc(-32, -10, 12, 0, Math.PI * 2);
                        ctx.arc(32, -10, 12, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                },

                drawExplosion(ctx, x, y, radius = 90, progress = 0.5) {
                    if (progress <= 0 || progress >= 1) return;
                    const r = radius * Math.sin(progress * Math.PI);
                    const g = ctx.createRadialGradient(x, y, 4, x, y, Math.max(10, r));
                    g.addColorStop(0, '#ffffff');
                    g.addColorStop(0.4, '#facc15');
                    g.addColorStop(0.8, '#ef4444');
                    g.addColorStop(1, 'rgba(239,68,68,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(x, y, Math.max(10, r), 0, Math.PI * 2);
                    ctx.fill();
                },

                drawParticles(ctx, w, h, t, color = '#ffffff', count = 30, direction = 'up') {
                    ctx.fillStyle = color;
                    for (let i = 0; i < count; i++) {
                        const seed = i * 73.13;
                        let px = (seed * 19) % w;
                        let py = (seed * 31) % h;
                        if (direction === 'up') py = (h - ((py + t * 90) % h));
                        else if (direction === 'down') py = (py + t * 140) % h;
                        else if (direction === 'right') px = (px + t * 180) % w;
                        ctx.globalAlpha = 0.65;
                        ctx.beginPath();
                        ctx.arc(px, py, (i % 3) + 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.globalAlpha = 1;
                },

                drawSubtitle(ctx, text) {
                    if (!text) return;
                    const w = ctx.canvas.width;
                    const h = ctx.canvas.height;
                    ctx.save();
                    ctx.font = 'bold 19px Segoe UI, sans-serif';
                    const maxW = w * 0.86;
                    const words = String(text).split(' ');
                    const lines = [];
                    let line = '';
                    for (const word of words) {
                        const test = line ? `${line} ${word}` : word;
                        if (ctx.measureText(test).width > maxW && line) {
                            lines.push(line);
                            line = word;
                        } else {
                            line = test;
                        }
                    }
                    if (line) lines.push(line);

                    const showLines = lines.slice(0, 2);
                    const boxH = showLines.length * 26 + 16;
                    const boxY = h - boxH - 18;

                    ctx.fillStyle = 'rgba(0,0,0,0.75)';
                    ctx.beginPath();
                    ctx.roundRect ? ctx.roundRect(w * 0.06, boxY, w * 0.88, boxH, 12) : ctx.fillRect(w * 0.06, boxY, w * 0.88, boxH);
                    ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    showLines.forEach((ln, idx) => {
                        ctx.fillText(ln, w / 2, boxY + 24 + idx * 26);
                    });
                    ctx.restore();
                }
            };
        },

        // =========================================================================
        // 4. RENDER ENGINE + MP4 COMPILER (WebCodecs H.264 MP4 + MediaRecorder Fallback)
        // =========================================================================
        async executeRenderEngineToMp4(renderFn, promptText, monitorCanvas, onProgress) {
            const isVertical = this.aspectRatio === '9:16';
            // Even dimensions required by H.264 MP4 encoders
            const width = isVertical ? 480 : 854;
            const height = isVertical ? 854 : 480;
            const fps = 30;
            const durationSec = 10;
            const totalFrames = fps * durationSec; // 300 frames

            const renderCanvas = document.createElement('canvas');
            renderCanvas.width = width;
            renderCanvas.height = height;
            const ctx = renderCanvas.getContext('2d');

            if (monitorCanvas) {
                monitorCanvas.width = width;
                monitorCanvas.height = height;
            }
            const monitorCtx = monitorCanvas ? monitorCanvas.getContext('2d') : null;
            const helpers = this.createCanvasHelpers();

            // METHOD A: Hardware WebCodecs VideoEncoder + Mp4Muxer -> Genuine .MP4 File
            if (typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined' && window.Mp4Muxer) {
                try {
                    const muxer = new window.Mp4Muxer.Muxer({
                        target: new window.Mp4Muxer.ArrayBufferTarget(),
                        video: {
                            codec: 'avc',
                            width,
                            height
                        },
                        fastStart: 'in-memory'
                    });

                    let encoderError = null;
                    const encoder = new VideoEncoder({
                        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                        error: (e) => { encoderError = e; }
                    });

                    encoder.configure({
                        codec: 'avc1.42001f',
                        width,
                        height,
                        bitrate: 2_500_000,
                        framerate: fps
                    });

                    for (let frame = 0; frame < totalFrames; frame++) {
                        if (encoderError) throw encoderError;
                        const t = frame / fps;

                        ctx.fillStyle = '#000000';
                        ctx.fillRect(0, 0, width, height);
                        try {
                            renderFn(ctx, width, height, t, helpers);
                        } catch (frameErr) {
                            helpers.drawSubtitle(ctx, promptText);
                        }

                        if (monitorCtx && frame % 3 === 0) {
                            monitorCtx.drawImage(renderCanvas, 0, 0);
                        }

                        const timestampUs = Math.round((frame * 1_000_000) / fps);
                        const vf = new VideoFrame(renderCanvas, { timestamp: timestampUs });
                        encoder.encode(vf, { keyFrame: frame % 30 === 0 });
                        vf.close();

                        if (frame % 5 === 0) {
                            if (onProgress) onProgress(frame + 1, totalFrames, 'rendering');
                            await new Promise(r => setTimeout(r, 0)); // Keep UI responsive
                        }
                    }

                    if (onProgress) onProgress(totalFrames, totalFrames, 'compiling');
                    await encoder.flush();
                    muxer.finalize();

                    const mp4Buffer = muxer.target.buffer;
                    if (mp4Buffer && mp4Buffer.byteLength > 1000) {
                        return {
                            blob: new Blob([mp4Buffer], { type: 'video/mp4' }),
                            extension: 'mp4',
                            formatLabel: 'MP4 • H.264 • 10.0s'
                        };
                    }
                } catch (mp4Err) {
                    console.warn("WebCodecs MP4 fallback to MediaRecorder:", mp4Err);
                }
            }

            // METHOD B: Universal MediaRecorder Engine (Works on all mobile/desktop browsers)
            return await new Promise((resolve, reject) => {
                if (!renderCanvas.captureStream || typeof MediaRecorder === 'undefined') {
                    return reject(new Error("Video rendering is not supported on this browser."));
                }

                const stream = renderCanvas.captureStream(fps);
                const mimeTypes = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
                const chosenMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
                const recorder = chosenMime
                    ? new MediaRecorder(stream, { mimeType: chosenMime, videoBitsPerSecond: 2500000 })
                    : new MediaRecorder(stream);

                const chunks = [];
                recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
                recorder.onstop = () => {
                    const isMp4 = (chosenMime || '').includes('mp4');
                    resolve({
                        blob: new Blob(chunks, { type: chosenMime || 'video/webm' }),
                        extension: isMp4 ? 'mp4' : 'webm',
                        formatLabel: `${isMp4 ? 'MP4' : 'WEBM'} • 10.0s`
                    });
                };

                recorder.start(250);
                let frame = 0;

                const interval = setInterval(() => {
                    if (frame >= totalFrames) {
                        clearInterval(interval);
                        if (onProgress) onProgress(totalFrames, totalFrames, 'compiling');
                        if (recorder.state !== 'inactive') recorder.stop();
                        return;
                    }

                    const t = frame / fps;
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, width, height);
                    try {
                        renderFn(ctx, width, height, t, helpers);
                    } catch (e) {
                        helpers.drawSubtitle(ctx, promptText);
                    }

                    if (monitorCtx && frame % 3 === 0) {
                        monitorCtx.drawImage(renderCanvas, 0, 0);
                    }

                    frame++;
                    if (onProgress && frame % 3 === 0) {
                        onProgress(frame, totalFrames, 'rendering');
                    }
                }, 1000 / fps);
            });
        },

        renderCompletedVideoCard(cardWrap, videoUrl, promptText, ext, formatLabel, generatedCode) {
            const fileName = `zoneweb-ai-video.${ext}`;
            window.__lastGeneratedVideoUrl = videoUrl;
            window.__lastGeneratedVideoPrompt = promptText;
            const codePreviewId = 'zw_code_box_' + Date.now();

            cardWrap.innerHTML = `
                <div class="w-full max-w-[92%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            ${this.getCustomLogoSvg(18)}
                            <span class="text-xs md:text-sm font-extrabold text-white">AI Video Compiled</span>
                        </div>
                        <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">${formatLabel}</span>
                    </div>

                    <p class="text-xs text-gray-300">Prompt: <b class="text-white">${promptText.replace(/</g, '&lt;')}</b></p>

                    <div class="rounded-2xl overflow-hidden border border-white/15 bg-black shadow-xl flex justify-center">
                        <video src="${videoUrl}" controls autoplay loop muted playsinline class="w-full max-h-96 object-contain bg-black"></video>
                    </div>

                    <div class="flex flex-wrap gap-2 pt-1">
                        <a href="${videoUrl}" download="${fileName}" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition">
                            <i class="fa-solid fa-download"></i> Download ${ext.toUpperCase()}
                        </a>
                        <button onclick="window.ZenoVideo.embedVideoIntoCurrentWebsite()" class="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition">
                            <i class="fa-solid fa-plus-circle"></i> Add to Website
                        </button>
                        <button onclick="document.getElementById('${codePreviewId}').classList.toggle('hidden')" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-bold flex items-center gap-1.5 transition">
                            <i class="fa-solid fa-code"></i> View AI Code
                        </button>
                    </div>

                    <pre id="${codePreviewId}" class="hidden p-3 rounded-xl bg-black/80 border border-white/10 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-48">${generatedCode.replace(/</g, '&lt;')}</pre>
                </div>
            `;
        },

        embedVideoIntoCurrentWebsite() {
            if (!window.__lastGeneratedVideoUrl) return;
            const videoSection = `
            <section class="max-w-4xl mx-auto my-8 px-4 relative z-20">
                <div class="rounded-3xl overflow-hidden border border-white/15 bg-zinc-950 p-4 shadow-2xl text-center">
                    <h3 class="text-lg font-extrabold text-white mb-3">${(window.__lastGeneratedVideoPrompt || 'Featured AI Video').replace(/</g, '&lt;')}</h3>
                    <video src="${window.__lastGeneratedVideoUrl}" controls autoplay loop muted playsinline class="w-full rounded-2xl max-h-[480px] bg-black mx-auto"></video>
                </div>
            </section>`;

            if (window.state?.currentSiteHtml) {
                let updated = window.state.currentSiteHtml;
                if (updated.includes('</body>')) {
                    updated = updated.replace(/<\/body>/i, `${videoSection}\n</body>`);
                } else {
                    updated += videoSection;
                }
                window.state.currentSiteHtml = updated;
                localStorage.setItem('zw_current_site_html', updated);
                if (typeof window.updatePublicLinkUI === 'function') {
                    window.updatePublicLinkUI(window.state.currentSiteName || 'website', updated);
                }
                if (typeof window.openPreviewModal === 'function') {
                    window.openPreviewModal();
                }
            } else {
                alert("Please build or select a website first, then click Add to Website!");
            }
        }
    };

    ZenoVideo.init();
})();
