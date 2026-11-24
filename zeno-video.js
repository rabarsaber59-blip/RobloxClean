/**
 * ZENO-VIDEO.JS
 * 1. Top "Generate Video" Button -> Opens Video Generation Bar directly above the AI Chat.
 * 2. Real 10-Second AI Video Generator -> Renders & records a real 10.0s playable & downloadable video
 *    tailored to the user's prompt, with direct "Download Video" and "Add to Website" actions.
 * 3. Global Emoji-to-Custom-Logo Replacer -> Automatically replaces every Unicode emoji across the
 *    entire interface with a custom bespoke ZoneWeb vector emblem.
 */
(function () {
    const ZenoVideo = {
        videoModeActive: false,
        isGeneratingVideo: false,
        isReplacingEmojis: false,
        emojiObserver: null,

        init() {
            window.ZenoVideo = this;
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

        // Custom bespoke ZoneWeb geometric diamond logo SVG (replaces all emojis)
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
        // 1. GLOBAL EMOJI REPLACER (REPLACES ALL EMOJIS WITH CUSTOM LOGO)
        // =========================================================================
        replaceAllEmojisWithCustomLogos(rootNode = document.body) {
            if (!rootNode || this.isReplacingEmojis) return;
            this.isReplacingEmojis = true;

            try {
                // Clean document title if any emoji exists
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
                        if (parent.closest('.zw-custom-logo-badge')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return emojiRegex.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    }
                });

                const nodesToReplace = [];
                let current;
                while ((current = walker.nextNode())) {
                    nodesToReplace.push(current);
                }

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

                    if (textNode.parentNode) {
                        textNode.parentNode.replaceChild(frag, textNode);
                    }
                }
            } catch (e) {
                // Fallback for older browsers without Unicode property escapes
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
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.replaceAllEmojisWithCustomLogos(node);
                        } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
                            this.replaceAllEmojisWithCustomLogos(node.parentElement);
                        }
                    }
                }
            });
            this.emojiObserver.observe(document.body, { childList: true, subtree: true });
        },

        // =========================================================================
        // 2. TOP "GENERATE VIDEO" BUTTON
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

        // =========================================================================
        // 3. VIDEO GENERATION BAR ON TOP OF THE AI CHAT
        // =========================================================================
        injectChatVideoPanel() {
            const chatCard = document.querySelector('#bottomChatBarContainer .card-bg');
            if (!chatCard || document.getElementById('zenoVideoChatPanel')) return;

            const panel = document.createElement('div');
            panel.id = 'zenoVideoChatPanel';
            panel.className = "hidden mb-2.5 p-3 rounded-2xl bg-gradient-to-r from-fuchsia-950/80 via-indigo-950/80 to-purple-950/80 border border-fuchsia-500/40 shadow-xl space-y-2.5";
            panel.innerHTML = `
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-fuchsia-600 text-white flex items-center justify-center shadow">
                            ${this.getVideoIconSvg('w-4 h-4')}
                        </span>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-extrabold text-white">AI 10-Second Video Studio</span>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/25 border border-fuchsia-400/40 text-fuchsia-200 font-bold">10.0s HD</span>
                            </div>
                            <p class="text-[10px] text-gray-300">Describe your video scene below and the AI will generate a 10-second video</p>
                        </div>
                    </div>
                    <button onclick="window.ZenoVideo.toggleVideoMode(false)" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-600 text-gray-200 hover:text-white flex items-center justify-center transition" title="Close Video Mode">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <div class="flex flex-wrap items-center gap-1.5">
                    <button type="button" onclick="window.ZenoVideo.fillAndRunVideoPrompt('Futuristic neon cyber city with glowing lights and flying particles')" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-fuchsia-200 font-semibold transition">Neon Cyber City</button>
                    <button type="button" onclick="window.ZenoVideo.fillAndRunVideoPrompt('Deep space galaxy with falling stars and glowing purple nebula')" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-blue-200 font-semibold transition">Cosmic Falling Stars</button>
                    <button type="button" onclick="window.ZenoVideo.fillAndRunVideoPrompt('Luxury gold & dark promotional brand intro with 3D diamond crystal')" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-amber-200 font-semibold transition">Luxury Brand Intro</button>
                    <button type="button" onclick="window.ZenoVideo.triggerInstantVideoFromChat()" class="ml-auto px-3 py-1 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[11px] font-extrabold shadow transition">
                        Create 10s Video Now
                    </button>
                </div>
            `;

            chatCard.insertBefore(panel, chatCard.firstChild);
        },

        toggleVideoMode(enable) {
            this.videoModeActive = enable;
            const panel = document.getElementById('zenoVideoChatPanel');
            const chatInput = document.getElementById('chatInput');
            const topBtn = document.getElementById('topGenerateVideoBtn');

            if (enable) {
                panel?.classList.remove('hidden');
                if (chatInput) {
                    chatInput.placeholder = "Describe the 10-second video you want AI to generate...";
                    chatInput.focus();
                }
                if (topBtn) {
                    topBtn.classList.add('ring-2', 'ring-fuchsia-300');
                }
            } else {
                panel?.classList.add('hidden');
                if (chatInput) {
                    chatInput.placeholder = "Describe the exact website or feature you want the AI to build...";
                }
                if (topBtn) {
                    topBtn.classList.remove('ring-2', 'ring-fuchsia-300');
                }
            }
        },

        fillAndRunVideoPrompt(promptText) {
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.value = promptText;
            }
            this.triggerInstantVideoFromChat();
        },

        triggerInstantVideoFromChat() {
            const chatInput = document.getElementById('chatInput');
            const promptText = (chatInput?.value || '').trim() || "Cinematic ZoneWeb AI 10-Second Promotional Video";
            if (chatInput) chatInput.value = '';
            this.generateTenSecondVideo(promptText);
        },

        hookChatSubmissionForVideo() {
            const origSend = window.sendUserMessage;
            window.sendUserMessage = async () => {
                const chatInput = document.getElementById('chatInput');
                const text = (chatInput?.value || '').trim();

                if (this.videoModeActive || /\b(generate video|create video|make a video|10 second video|ڤیدیۆ دروست بکە)\b/i.test(text)) {
                    const finalPrompt = text || "Cinematic AI 10-Second Visual Showcase";
                    if (chatInput) chatInput.value = '';
                    await this.generateTenSecondVideo(finalPrompt);
                    return;
                }

                if (typeof origSend === 'function') {
                    return origSend();
                }
            };
        },

        // =========================================================================
        // 4. REAL 10-SECOND AI VIDEO RENDERER & RECORDER (MediaRecorder + Canvas)
        // =========================================================================
        async generateTenSecondVideo(promptText) {
            if (this.isGeneratingVideo) return;
            this.isGeneratingVideo = true;

            document.getElementById('heroPrompt')?.classList.add('hidden');
            if (typeof window.appendMessage === 'function') {
                window.appendMessage('user', `[Generate 10s Video] ${promptText}`);
            }

            // Create live 10-second rendering progress bubble inside the AI chat
            const feed = document.getElementById('chatFeed');
            const renderCardId = 'zw_video_render_' + Date.now();
            const cardWrap = document.createElement('div');
            cardWrap.id = renderCardId;
            cardWrap.className = "flex justify-start w-full my-3";
            cardWrap.innerHTML = `
                <div class="w-full max-w-[90%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center animate-pulse">
                                ${this.getVideoIconSvg('w-4 h-4')}
                            </div>
                            <div>
                                <p class="text-xs md:text-sm font-extrabold text-white">AI is generating your 10-second video...</p>
                                <p id="${renderCardId}_sub" class="text-[11px] text-fuchsia-300">Rendering 10.0s cinematic frames (0.0s / 10.0s)</p>
                            </div>
                        </div>
                        <span id="${renderCardId}_pct" class="text-xs font-mono font-extrabold text-fuchsia-400">0%</span>
                    </div>
                    <div class="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                        <div id="${renderCardId}_bar" class="h-full bg-gradient-to-r from-fuchsia-600 via-purple-500 to-blue-500 transition-all duration-150" style="width:0%;"></div>
                    </div>
                </div>
            `;
            feed?.appendChild(cardWrap);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

            // Determine visual theme from user's prompt
            const sceneConfig = this.analyzeVideoPromptTheme(promptText);

            try {
                const videoBlob = await this.recordTenSecondCanvasVideo(promptText, sceneConfig, (elapsedSec, pct) => {
                    const subEl = document.getElementById(`${renderCardId}_sub`);
                    const pctEl = document.getElementById(`${renderCardId}_pct`);
                    const barEl = document.getElementById(`${renderCardId}_bar`);
                    if (subEl) subEl.innerText = `Rendering 10.0s cinematic video (${elapsedSec.toFixed(1)}s / 10.0s)`;
                    if (pctEl) pctEl.innerText = `${pct}%`;
                    if (barEl) barEl.style.width = `${pct}%`;
                });

                const videoUrl = URL.createObjectURL(videoBlob);
                const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
                const fileName = `zoneweb-ai-video-10s.${ext}`;

                // Store globally so user can also insert it into their website
                window.__lastGeneratedVideoUrl = videoUrl;
                window.__lastGeneratedVideoPrompt = promptText;

                cardWrap.innerHTML = `
                    <div class="w-full max-w-[92%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                                ${this.getCustomLogoSvg(18)}
                                <span class="text-xs md:text-sm font-extrabold text-white">10-Second AI Video Ready</span>
                            </div>
                            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">10.0s • HD</span>
                        </div>

                        <p class="text-xs text-gray-300">Prompt: <b class="text-white">${promptText.replace(/</g, '&lt;')}</b></p>

                        <div class="rounded-2xl overflow-hidden border border-white/15 bg-black shadow-xl">
                            <video src="${videoUrl}" controls autoplay loop muted playsinline class="w-full max-h-80 object-contain bg-black"></video>
                        </div>

                        <div class="flex flex-wrap gap-2 pt-1">
                            <a href="${videoUrl}" download="${fileName}" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition">
                                <i class="fa-solid fa-download"></i> Download 10s Video
                            </a>
                            <button onclick="window.ZenoVideo.embedVideoIntoCurrentWebsite()" class="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition">
                                <i class="fa-solid fa-plus-circle"></i> Add Video to My Website
                            </button>
                        </div>
                    </div>
                `;
            } catch (err) {
                cardWrap.innerHTML = `
                    <div class="w-full max-w-[90%] rounded-2xl p-4 card-bg border border-red-500/40 text-xs text-red-300">
                        Video recording is not supported on this browser view. Please open in Chrome or Safari.
                    </div>
                `;
            } finally {
                this.isGeneratingVideo = false;
                this.toggleVideoMode(false);
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        },

        analyzeVideoPromptTheme(prompt) {
            const p = (prompt || '').toLowerCase();
            if (/(fire|red|lava|action|war|ئاگر|سوور)/i.test(p)) {
                return { bg1: '#1a0505', bg2: '#450a0a', primary: '#ef4444', secondary: '#f59e0b', mode: 'embers' };
            }
            if (/(ocean|water|sea|blue|rain|ئاو|شین|دەریا)/i.test(p)) {
                return { bg1: '#041322', bg2: '#0c2d48', primary: '#38bdf8', secondary: '#2563eb', mode: 'waves' };
            }
            if (/(gold|luxury|vip|coffee|royal|زێڕین|قاوە)/i.test(p)) {
                return { bg1: '#0c0a06', bg2: '#271c08', primary: '#fbbf24', secondary: '#d97706', mode: 'luxury' };
            }
            if (/(green|nature|forest|matrix|emerald|سەوز)/i.test(p)) {
                return { bg1: '#03140c', bg2: '#063722', primary: '#10b981', secondary: '#34d399', mode: 'matrix' };
            }
            // Default Cyber Purple/Blue Diamond Theme
            return { bg1: '#060714', bg2: '#1e1038', primary: '#6366f1', secondary: '#c084fc', mode: 'cosmos' };
        },

        recordTenSecondCanvasVideo(promptText, theme, onProgress) {
            return new Promise((resolve, reject) => {
                const canvas = document.createElement('canvas');
                canvas.width = 854;
                canvas.height = 480;
                const ctx = canvas.getContext('2d');

                if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {
                    return reject(new Error('MediaRecorder unavailable'));
                }

                const mimeCandidates = [
                    'video/webm;codecs=vp9',
                    'video/webm;codecs=vp8',
                    'video/webm',
                    'video/mp4'
                ];
                const supportedMime = mimeCandidates.find(m => MediaRecorder.isTypeSupported(m)) || '';

                const stream = canvas.captureStream(30);
                const recorder = supportedMime
                    ? new MediaRecorder(stream, { mimeType: supportedMime, videoBitsPerSecond: 2500000 })
                    : new MediaRecorder(stream);

                const chunks = [];
                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) chunks.push(e.data);
                };
                recorder.onstop = () => {
                    resolve(new Blob(chunks, { type: supportedMime || 'video/webm' }));
                };

                // Generate 110 dynamic particles for the 10-second scene
                const particles = Array.from({ length: 110 }, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: Math.random() * 3.2 + 1,
                    vx: (Math.random() - 0.5) * 2.4,
                    vy: (Math.random() - 0.5) * 2.4 + (theme.mode === 'embers' ? -1.8 : 0.9),
                    alpha: Math.random() * 0.75 + 0.25
                }));

                const cleanHeadline = promptText.replace(/[^\w\s\u0600-\u06FF-]/g, '').trim().slice(0, 46) || 'ZoneWeb AI Studio';
                const durationMs = 10000; // Exact 10 seconds
                const startTime = performance.now();

                recorder.start(200);

                const renderFrame = (now) => {
                    const elapsed = now - startTime;
                    const t = Math.min(1, elapsed / durationMs); // 0.0 -> 1.0 over 10 seconds
                    const angle = t * Math.PI * 4;

                    // 1. Dynamic Cinematic Gradient Background
                    const grad = ctx.createRadialGradient(
                        canvas.width * (0.5 + 0.15 * Math.cos(angle * 0.5)),
                        canvas.height * (0.5 + 0.15 * Math.sin(angle * 0.5)),
                        40,
                        canvas.width * 0.5,
                        canvas.height * 0.5,
                        canvas.width * 0.75
                    );
                    grad.addColorStop(0, theme.bg2);
                    grad.addColorStop(1, theme.bg1);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // 2. Animated Perspective Light Grid
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.lineWidth = 1;
                    const gridOffset = (elapsed * 0.04) % 48;
                    for (let gx = gridOffset; gx < canvas.width; gx += 48) {
                        ctx.beginPath();
                        ctx.moveTo(gx, 0);
                        ctx.lineTo(gx, canvas.height);
                        ctx.stroke();
                    }
                    for (let gy = gridOffset; gy < canvas.height; gy += 48) {
                        ctx.beginPath();
                        ctx.moveTo(0, gy);
                        ctx.lineTo(canvas.width, gy);
                        ctx.stroke();
                    }

                    // 3. Particles & Connecting Energy Beams
                    for (const p of particles) {
                        p.x += p.vx;
                        p.y += p.vy;
                        if (p.x < 0) p.x = canvas.width;
                        if (p.x > canvas.width) p.x = 0;
                        if (p.y < 0) p.y = canvas.height;
                        if (p.y > canvas.height) p.y = 0;

                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                        ctx.fillStyle = theme.primary;
                        ctx.globalAlpha = p.alpha;
                        ctx.fill();
                    }
                    ctx.globalAlpha = 1;

                    // 4. Center Pulsing 3D-Style Faceted Diamond Emblem
                    const cx = canvas.width / 2;
                    const cy = canvas.height * 0.38;
                    const pulse = 1 + 0.08 * Math.sin(angle * 2);
                    const dw = 46 * pulse;
                    const dh = 62 * pulse;

                    ctx.save();
                    ctx.shadowBlur = 30;
                    ctx.shadowColor = theme.primary;

                    // Upper diamond facet
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - dh);
                    ctx.lineTo(cx + dw, cy);
                    ctx.lineTo(cx - dw, cy);
                    ctx.closePath();
                    ctx.fillStyle = theme.primary;
                    ctx.fill();

                    // Lower diamond facet
                    ctx.beginPath();
                    ctx.moveTo(cx - dw, cy);
                    ctx.lineTo(cx + dw, cy);
                    ctx.lineTo(cx, cy + dh);
                    ctx.closePath();
                    ctx.fillStyle = theme.secondary;
                    ctx.fill();

                    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();

                    // 5. Kinetic Scene Title & Subtitle
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 30px Segoe UI, sans-serif';
                    ctx.fillText(cleanHeadline, cx, canvas.height * 0.66);

                    ctx.fillStyle = theme.secondary;
                    ctx.font = '600 15px Segoe UI, sans-serif';
                    ctx.fillText(`ZONEWEB AI MOTION STUDIO • ${(elapsed / 1000).toFixed(1)}s / 10.0s`, cx, canvas.height * 0.75);

                    // 6. Bottom Cinematic Timeline Bar
                    const barW = canvas.width * 0.6;
                    const barX = (canvas.width - barW) / 2;
                    const barY = canvas.height * 0.84;
                    ctx.fillStyle = 'rgba(255,255,255,0.12)';
                    ctx.fillRect(barX, barY, barW, 6);
                    ctx.fillStyle = theme.primary;
                    ctx.fillRect(barX, barY, barW * t, 6);

                    if (onProgress) {
                        onProgress(Math.min(10, elapsed / 1000), Math.min(100, Math.round(t * 100)));
                    }

                    if (elapsed < durationMs) {
                        requestAnimationFrame(renderFrame);
                    } else {
                        if (recorder.state !== 'inactive') recorder.stop();
                    }
                };

                requestAnimationFrame(renderFrame);
            });
        },

        embedVideoIntoCurrentWebsite() {
            if (!window.__lastGeneratedVideoUrl) return;
            const videoSection = `
            <section class="max-w-4xl mx-auto my-8 px-4 relative z-20">
                <div class="rounded-3xl overflow-hidden border border-white/15 bg-zinc-950 p-4 shadow-2xl text-center">
                    <h3 class="text-lg font-extrabold text-white mb-3">${(window.__lastGeneratedVideoPrompt || 'Featured AI Video').replace(/</g, '&lt;')}</h3>
                    <video src="${window.__lastGeneratedVideoUrl}" controls autoplay loop muted playsinline class="w-full rounded-2xl max-h-[460px] bg-black mx-auto"></video>
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
                alert("Please create or select a website first, then click Add Video to My Website!");
            }
        }
    };

    ZenoVideo.init();
})();
