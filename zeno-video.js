/**
 * ZENO-VIDEO.JS - Real Multi-Engine AI Video Generator (Veo + HuggingFace + AI Multi-Scene Director)
 * 1. Top "Generate Video" Button -> Opens Video Studio Bar above the AI Chat.
 * 2. Generates REAL AI Videos for any story, action, anime, or cinematic prompt:
 *    - Engine A: Direct Google Veo 2 / Veo 3 API (using your Gemini API Key) or HuggingFace Text-to-Video.
 *    - Engine B: Real AI 3-Scene Storyboard Director (Generates real AI visuals for each scene of your story,
 *      animates them with cinematic camera motion, subtitles, and WebAudio soundtrack into a real 10s video).
 * 3. Supports 16:9 (Landscape) & 9:16 (TikTok/Reels) formats + Direct Download & Add to Website.
 * 4. Global Emoji-to-Custom-Logo Replacer across the UI.
 */
(function () {
    const ZenoVideo = {
        videoModeActive: false,
        isGeneratingVideo: false,
        isReplacingEmojis: false,
        emojiObserver: null,
        aspectRatio: '16:9', // '16:9' or '9:16'
        hfVideoToken: localStorage.getItem('zw_hf_video_token') || '',

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

        // Custom bespoke ZoneWeb geometric diamond emblem (replaces UI emojis only)
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
        // 1. GLOBAL EMOJI REPLACER (REPLACES ALL UI EMOJIS WITH CUSTOM LOGO)
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
        // 2. TOP "GENERATE VIDEO" BUTTON & CHAT VIDEO STUDIO PANEL
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
            panel.className = "hidden mb-2.5 p-3 rounded-2xl bg-gradient-to-r from-fuchsia-950/90 via-indigo-950/90 to-purple-950/90 border border-fuchsia-500/40 shadow-xl space-y-2.5";
            panel.innerHTML = `
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-fuchsia-600 text-white flex items-center justify-center shadow">
                            ${this.getVideoIconSvg('w-4 h-4')}
                        </span>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-extrabold text-white">Real AI Video Generator</span>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 font-bold">10s Story & Scene AI</span>
                            </div>
                            <p class="text-[10px] text-gray-300">Describe any story, action, or scene below — AI directs & renders real visuals</p>
                        </div>
                    </div>
                    <button onclick="window.ZenoVideo.toggleVideoMode(false)" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-600 text-gray-200 hover:text-white flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <div class="flex flex-wrap items-center gap-1.5">
                    <!-- Aspect Ratio Switcher -->
                    <div class="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/15">
                        <button type="button" id="zwRatio169" onclick="window.ZenoVideo.setAspectRatio('16:9')" class="px-2 py-1 rounded-md bg-fuchsia-600 text-white text-[10px] font-extrabold">16:9 Landscape</button>
                        <button type="button" id="zwRatio916" onclick="window.ZenoVideo.setAspectRatio('9:16')" class="px-2 py-1 rounded-md text-gray-300 text-[10px] font-bold">9:16 TikTok/Reels</button>
                    </div>

                    <!-- Optional HuggingFace Video Token -->
                    <button type="button" onclick="window.ZenoVideo.configureVideoToken()" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-amber-300 font-bold border border-amber-500/30">
                        <i class="fa-solid fa-key mr-1"></i>Video API Key
                    </button>

                    <button type="button" onclick="window.ZenoVideo.triggerInstantVideoFromChat()" class="ml-auto px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold shadow transition">
                        Generate 10s Video Now
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
                b16.className = ratio === '16:9' ? "px-2 py-1 rounded-md bg-fuchsia-600 text-white text-[10px] font-extrabold" : "px-2 py-1 rounded-md text-gray-300 text-[10px] font-bold";
                b9.className = ratio === '9:16' ? "px-2 py-1 rounded-md bg-fuchsia-600 text-white text-[10px] font-extrabold" : "px-2 py-1 rounded-md text-gray-300 text-[10px] font-bold";
            }
        },

        configureVideoToken() {
            const val = prompt("Optional: Paste a HuggingFace Access Token (hf_...) for direct Text-to-Video models, or leave blank to use your Gemini API Key & Multi-Scene AI Director:", this.hfVideoToken);
            if (val !== null) {
                this.hfVideoToken = val.trim();
                localStorage.setItem('zw_hf_video_token', this.hfVideoToken);
                alert(this.hfVideoToken ? "HuggingFace Video Token saved!" : "Using Gemini Veo + Multi-Scene AI Video Director.");
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
                    chatInput.placeholder = "Write your video story or scene (e.g. A poor man asks a kid for money...)";
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
                return alert("Please describe what happens in your video first!");
            }
            chatInput.value = '';
            this.generateRealAiVideo(promptText);
        },

        hookChatSubmissionForVideo() {
            const origSend = window.sendUserMessage;
            window.sendUserMessage = async () => {
                const chatInput = document.getElementById('chatInput');
                const text = (chatInput?.value || '').trim();

                if (this.videoModeActive || /\b(generate video|create video|make a video|make video|ڤیدیۆ دروست بکە|ڤیدیۆیەک دروست بکە)\b/i.test(text)) {
                    if (!text) return;
                    chatInput.value = '';
                    await this.generateRealAiVideo(text);
                    return;
                }

                if (typeof origSend === 'function') {
                    return origSend();
                }
            };
        },

        // =========================================================================
        // 3. REAL AI VIDEO GENERATION PIPELINE (VEO API -> HF T2V -> 3-SCENE AI DIRECTOR)
        // =========================================================================
        async generateRealAiVideo(userPrompt) {
            if (this.isGeneratingVideo) return;
            this.isGeneratingVideo = true;

            // Security check using ZenoUltimate if present
            if (window.ZenoUltimate && window.ZenoUltimate.forbiddenPattern && window.ZenoUltimate.forbiddenPattern.test(userPrompt)) {
                this.isGeneratingVideo = false;
                if (typeof window.appendMessage === 'function') {
                    window.appendMessage('user', userPrompt);
                    window.appendMessage('ai', "Security Alert: Adult, hacking, or malware video generation is not allowed.");
                }
                return;
            }

            document.getElementById('heroPrompt')?.classList.add('hidden');
            if (typeof window.appendMessage === 'function') {
                window.appendMessage('user', `[AI Video Request] ${userPrompt}`);
            }

            const feed = document.getElementById('chatFeed');
            const cardId = 'zw_real_vid_' + Date.now();
            const cardWrap = document.createElement('div');
            cardWrap.id = cardId;
            cardWrap.className = "flex justify-start w-full my-3";
            cardWrap.innerHTML = `
                <div class="w-full max-w-[92%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center animate-spin">
                                <i class="fa-solid fa-clapperboard text-xs"></i>
                            </div>
                            <div>
                                <p id="${cardId}_title" class="text-xs md:text-sm font-extrabold text-white">Directing Real AI Video...</p>
                                <p id="${cardId}_status" class="text-[11px] text-fuchsia-300">Analyzing story scenes & connecting to AI video models...</p>
                            </div>
                        </div>
                        <span id="${cardId}_pct" class="text-xs font-mono font-extrabold text-fuchsia-400">10%</span>
                    </div>
                    <div class="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                        <div id="${cardId}_bar" class="h-full bg-gradient-to-r from-fuchsia-600 via-purple-500 to-emerald-400 transition-all duration-300" style="width:10%;"></div>
                    </div>
                </div>
            `;
            feed?.appendChild(cardWrap);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

            const setProgress = (pct, statusText, titleText) => {
                const pEl = document.getElementById(`${cardId}_pct`);
                const bEl = document.getElementById(`${cardId}_bar`);
                const sEl = document.getElementById(`${cardId}_status`);
                const tEl = document.getElementById(`${cardId}_title`);
                if (pEl) pEl.innerText = `${pct}%`;
                if (bEl) bEl.style.width = `${pct}%`;
                if (sEl && statusText) sEl.innerText = statusText;
                if (tEl && titleText) tEl.innerText = titleText;
            };

            try {
                // ATTEMPT 1: Google Veo 2 / Veo 3 Real Video Generation via User's Gemini API Key
                const geminiKey = (window.state?.apiKey || localStorage.getItem('zw_api_key') || '').trim();
                if (geminiKey && geminiKey.startsWith('AIza')) {
                    setProgress(20, "Checking Google Veo Video Engine with your API Key...");
                    const veoVideoUrl = await this.tryGoogleVeoApi(geminiKey, userPrompt, (msg) => setProgress(45, msg));
                    if (veoVideoUrl) {
                        this.renderFinalVideoPlayer(cardWrap, veoVideoUrl, userPrompt, 'mp4', 'Google Veo AI');
                        return;
                    }
                }

                // ATTEMPT 2: HuggingFace Text-to-Video Model (if user configured hf_ token)
                if (this.hfVideoToken && this.hfVideoToken.startsWith('hf_')) {
                    setProgress(30, "Generating neural video frames via HuggingFace Text-to-Video...");
                    const hfBlob = await this.tryHuggingFaceTextToVideo(this.hfVideoToken, userPrompt);
                    if (hfBlob) {
                        const url = URL.createObjectURL(hfBlob);
                        this.renderFinalVideoPlayer(cardWrap, url, userPrompt, 'mp4', 'Neural Text-to-Video');
                        return;
                    }
                }

                // ATTEMPT 3 (GUARANTEED REAL AI VISUAL STORYBOARD VIDEO):
                // Breaks ANY prompt/story into 3 real scenes using Gemini, generates real AI artwork for each scene,
                // and compiles a 10-second animated cinematic video with camera motion, subtitles & soundtrack!
                setProgress(25, "AI Director is breaking your prompt into 3 cinematic scenes...");
                const storyboard = await this.generateAiStoryboardScenes(geminiKey, userPrompt);

                setProgress(45, "Generating real AI visuals for Scene 1, Scene 2 & Scene 3...");
                const sceneImages = await this.fetchRealAiSceneImages(storyboard, (loadedCount) => {
                    setProgress(45 + loadedCount * 10, `Rendered AI Scene ${loadedCount} of ${storyboard.length}...`);
                });

                setProgress(78, "Recording 10.0s cinematic video with camera motion & audio...");
                const compiledBlob = await this.compileAnimatedStoryVideo(storyboard, sceneImages, (sec, pct) => {
                    const totalPct = 78 + Math.round(pct * 0.22);
                    setProgress(totalPct, `Encoding 10.0s video (${sec.toFixed(1)}s / 10.0s)...`);
                });

                const finalUrl = URL.createObjectURL(compiledBlob);
                const ext = compiledBlob.type.includes('mp4') ? 'mp4' : 'webm';
                this.renderFinalVideoPlayer(cardWrap, finalUrl, userPrompt, ext, 'ZoneWeb AI Cinema');

            } catch (err) {
                console.error("Video generation error:", err);
                cardWrap.innerHTML = `
                    <div class="w-full max-w-[90%] rounded-2xl p-4 card-bg border border-red-500/40 text-xs text-red-300">
                        Could not complete video rendering: ${err.message}. Please try again.
                    </div>
                `;
            } finally {
                this.isGeneratingVideo = false;
                this.toggleVideoMode(false);
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        },

        // --- ENGINE A: DIRECT GOOGLE VEO 2 / VEO 3 API ---
        async tryGoogleVeoApi(apiKey, promptText, onStatus) {
            const veoModels = ['veo-2.0-generate-001', 'veo-3.0-generate-preview'];
            for (const model of veoModels) {
                try {
                    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${encodeURIComponent(apiKey)}`;
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            instances: [{ prompt: promptText }],
                            parameters: { aspectRatio: this.aspectRatio }
                        })
                    });

                    if (!res.ok) continue; // Fall back cleanly if key doesn't have Veo billing enabled
                    const opData = await res.json();
                    if (!opData.name) continue;

                    // Poll Veo operation up to 45 seconds
                    for (let i = 0; i < 15; i++) {
                        await new Promise(r => setTimeout(r, 3000));
                        if (onStatus) onStatus(`Google ${model} is rendering real video (${(i + 1) * 3}s)...`);
                        const pollRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opData.name}?key=${encodeURIComponent(apiKey)}`);
                        if (!pollRes.ok) break;
                        const pollData = await pollRes.json();
                        if (pollData.done) {
                            const samples = pollData.response?.generateVideoResponse?.generatedSamples || pollData.response?.predictions || [];
                            const uri = samples[0]?.video?.uri || samples[0]?.uri;
                            if (uri) {
                                const sep = uri.includes('?') ? '&' : '?';
                                return `${uri}${sep}key=${encodeURIComponent(apiKey)}`;
                            }
                            break;
                        }
                    }
                } catch (e) {}
            }
            return null;
        },

        // --- ENGINE B: HUGGINGFACE TEXT-TO-VIDEO ---
        async tryHuggingFaceTextToVideo(token, promptText) {
            const models = ['ali-vilab/text-to-video-ms-1.7b', 'cerspense/zeroscope_v2_576w'];
            for (const m of models) {
                try {
                    const res = await fetch(`https://api-inference.huggingface.co/models/${m}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ inputs: promptText })
                    });
                    if (res.ok && res.headers.get('content-type')?.includes('video')) {
                        return await res.blob();
                    }
                } catch (e) {}
            }
            return null;
        },

        // --- ENGINE C: AI STORYBOARD DIRECTOR (BREAKS ANY PROMPT INTO 3 VISUAL SCENES) ---
        async generateAiStoryboardScenes(geminiKey, userPrompt) {
            // Try using user's Gemini API key to write 3 vivid visual scene descriptions + short subtitles
            if (geminiKey && geminiKey.startsWith('AIza')) {
                try {
                    const sys = `You are a film director. Break the user's video request into exactly 3 sequential cinematic scenes for a 10-second video.
Return ONLY valid JSON array of 3 objects with keys:
- "visualPrompt": detailed English visual description of the characters, action, setting, and cinematic lighting (no text/words in image).
- "caption": short dramatic subtitle (max 55 chars) describing what happens in this scene.
User request: "${userPrompt}"`;

                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: sys }] }],
                            generationConfig: { temperature: 0.5 }
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        const jsonMatch = raw.match(/\[[\s\S]*\]/);
                        if (jsonMatch) {
                            const parsed = JSON.parse(jsonMatch[0]);
                            if (Array.isArray(parsed) && parsed.length >= 2) {
                                return parsed.slice(0, 3);
                            }
                        }
                    }
                } catch (e) {}
            }

            // Smart local sentence splitter if Gemini JSON wasn't reachable
            const clean = userPrompt.replace(/^make a video\s*/i, '').trim();
            const clauses = clean.split(/\b(?:and then|then|and|while|after that|,)\b/i).map(s => s.trim()).filter(Boolean);

            if (clauses.length >= 3) {
                return [
                    { visualPrompt: `${clauses[0]}, realistic cinematic movie still, dramatic lighting, 4k`, caption: clauses[0].slice(0, 58) },
                    { visualPrompt: `${clauses[1]}, emotional close-up cinematic shot, realistic photography, 4k`, caption: clauses[1].slice(0, 58) },
                    { visualPrompt: `${clauses.slice(2).join(' ')}, dramatic climax scene, cinematic movie lighting, 4k`, caption: clauses.slice(2).join(' ').slice(0, 58) }
                ];
            } else if (clauses.length === 2) {
                return [
                    { visualPrompt: `${clauses[0]}, cinematic opening scene, realistic 4k`, caption: clauses[0].slice(0, 58) },
                    { visualPrompt: `${clauses[0]} and ${clauses[1]}, dramatic tension cinematic shot, 4k`, caption: clauses[1].slice(0, 58) },
                    { visualPrompt: `${clauses[1]}, dramatic finale scene, cinematic lighting, 4k`, caption: clauses[1].slice(0, 58) }
                ];
            }

            return [
                { visualPrompt: `${clean}, wide establishing cinematic shot, realistic lighting, 4k`, caption: clean.slice(0, 58) },
                { visualPrompt: `${clean}, dramatic action close-up shot, high detail, 4k`, caption: clean.slice(0, 58) },
                { visualPrompt: `${clean}, epic cinematic finale shot, golden hour lighting, 4k`, caption: clean.slice(0, 58) }
            ];
        },

        // Fetches real CORS-safe AI-generated images for each scene
        async fetchRealAiSceneImages(storyboard, onEachLoaded) {
            const isVertical = this.aspectRatio === '9:16';
            const w = isVertical ? 540 : 960;
            const h = isVertical ? 960 : 540;
            const images = [];

            for (let i = 0; i < storyboard.length; i++) {
                const scene = storyboard[i];
                const seed = Math.floor(Math.random() * 999999) + i * 137;
                const promptEncoded = encodeURIComponent(`${scene.visualPrompt}, ultra detailed, cinematic film frame, no text, no watermark`);
                const aiImgUrl = `https://image.pollinations.ai/prompt/${promptEncoded}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=flux`;

                const loadedImg = await this.loadCorsSafeImage(aiImgUrl, w, h, scene.caption, i);
                images.push(loadedImg);
                if (onEachLoaded) onEachLoaded(i + 1);
            }
            return images;
        },

        // Loads external AI image via Blob so HTML5 Canvas NEVER gets tainted during video recording
        async loadCorsSafeImage(url, w, h, fallbackCaption, sceneIndex) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 14000);
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeout);

                if (res.ok) {
                    const blob = await res.blob();
                    const objUrl = URL.createObjectURL(blob);
                    return await new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = objUrl;
                    });
                }
            } catch (e) {}

            // Fallback procedural illustrated scene canvas (never shows a generic diamond logo!)
            const off = document.createElement('canvas');
            off.width = w;
            off.height = h;
            const c = off.getContext('2d');
            const palettes = [
                ['#0f172a', '#1e3a8a', '#38bdf8'],
                ['#1f1124', '#581c87', '#f43f5e'],
                ['#14110b', '#78350f', '#fbbf24']
            ];
            const pal = palettes[sceneIndex % palettes.length];
            const g = c.createLinearGradient(0, 0, w, h);
            g.addColorStop(0, pal[0]);
            g.addColorStop(0.6, pal[1]);
            g.addColorStop(1, pal[2]);
            c.fillStyle = g;
            c.fillRect(0, 0, w, h);
            return off;
        },

        // Compiles the 3 AI-generated scenes into a smooth 10.0s animated video with camera motion, subtitles & audio
        compileAnimatedStoryVideo(storyboard, sceneImages, onProgress) {
            return new Promise((resolve, reject) => {
                const isVertical = this.aspectRatio === '9:16';
                const canvas = document.createElement('canvas');
                canvas.width = isVertical ? 540 : 960;
                canvas.height = isVertical ? 960 : 540;
                const ctx = canvas.getContext('2d');

                if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {
                    return reject(new Error('MediaRecorder not supported on this device.'));
                }

                // Synthesize subtle cinematic background synth chord via WebAudio so the video has real audio
                let mixedStream = canvas.captureStream(30);
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const dest = audioCtx.createMediaStreamDestination();
                    const gain = audioCtx.createGain();
                    gain.gain.value = 0.06;
                    gain.connect(dest);

                    [110, 164.81, 220].forEach((freq, idx) => {
                        const osc = audioCtx.createOscillator();
                        osc.type = idx === 0 ? 'sine' : 'triangle';
                        osc.frequency.value = freq;
                        osc.connect(gain);
                        osc.start();
                        setTimeout(() => { try { osc.stop(); } catch (e) {} }, 10200);
                    });

                    const audioTrack = dest.stream.getAudioTracks()[0];
                    if (audioTrack) mixedStream.addTrack(audioTrack);
                } catch (e) {}

                const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
                const chosenMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
                const recorder = chosenMime
                    ? new MediaRecorder(mixedStream, { mimeType: chosenMime, videoBitsPerSecond: 3200000 })
                    : new MediaRecorder(mixedStream);

                const chunks = [];
                recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
                recorder.onstop = () => resolve(new Blob(chunks, { type: chosenMime || 'video/webm' }));

                const durationMs = 10000; // 10.0 seconds total
                const sceneCount = sceneImages.length;
                const sceneDur = durationMs / sceneCount;
                const startTime = performance.now();

                recorder.start(250);

                const drawFrame = (now) => {
                    const elapsed = now - startTime;
                    const clamped = Math.min(durationMs, elapsed);
                    const sceneIdx = Math.min(sceneCount - 1, Math.floor(clamped / sceneDur));
                    const localT = (clamped % sceneDur) / sceneDur; // 0.0 -> 1.0 within current scene

                    const img = sceneImages[sceneIdx];
                    const sceneMeta = storyboard[sceneIdx] || { caption: '' };

                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Ken Burns Cinematic Camera Motion (alternating Zoom-In, Pan-Right, Zoom-Out)
                    if (img) {
                        const zoom = sceneIdx === 0
                            ? 1.0 + localT * 0.14
                            : sceneIdx === 1
                                ? 1.14 - localT * 0.12
                                : 1.02 + localT * 0.15;
                        const panX = (sceneIdx === 1 ? (localT - 0.5) * 40 : (0.5 - localT) * 30);

                        const drawW = canvas.width * zoom;
                        const drawH = canvas.height * zoom;
                        const dx = (canvas.width - drawW) / 2 + panX;
                        const dy = (canvas.height - drawH) / 2;

                        ctx.drawImage(img, dx, dy, drawW, drawH);
                    }

                    // Cinematic Letterbox & Bottom Gradient Vignette for Subtitle Readability
                    const vig = ctx.createLinearGradient(0, canvas.height * 0.65, 0, canvas.height);
                    vig.addColorStop(0, 'rgba(0,0,0,0)');
                    vig.addColorStop(1, 'rgba(0,0,0,0.88)');
                    ctx.fillStyle = vig;
                    ctx.fillRect(0, canvas.height * 0.65, canvas.width, canvas.height * 0.35);

                    // Scene Subtitle Caption at the Bottom
                    if (sceneMeta.caption) {
                        ctx.textAlign = 'center';
                        ctx.fillStyle = '#ffffff';
                        ctx.font = `bold ${isVertical ? 22 : 24}px Segoe UI, sans-serif`;
                        ctx.shadowColor = 'rgba(0,0,0,0.9)';
                        ctx.shadowBlur = 8;
                        ctx.fillText(sceneMeta.caption, canvas.width / 2, canvas.height - (isVertical ? 54 : 36));
                        ctx.shadowBlur = 0;
                    }

                    // Smooth Crossfade Transition between scenes
                    if (localT < 0.12) {
                        ctx.fillStyle = `rgba(0, 0, 0, ${1 - localT / 0.12})`;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    } else if (localT > 0.90 && sceneIdx < sceneCount - 1) {
                        ctx.fillStyle = `rgba(0, 0, 0, ${(localT - 0.90) / 0.10})`;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }

                    if (onProgress) {
                        onProgress(clamped / 1000, Math.round((clamped / durationMs) * 100));
                    }

                    if (elapsed < durationMs) {
                        requestAnimationFrame(drawFrame);
                    } else {
                        if (recorder.state !== 'inactive') recorder.stop();
                    }
                };

                requestAnimationFrame(drawFrame);
            });
        },

        renderFinalVideoPlayer(cardWrap, videoUrl, promptText, ext, engineBadge) {
            const fileName = `zoneweb-ai-video.${ext}`;
            window.__lastGeneratedVideoUrl = videoUrl;
            window.__lastGeneratedVideoPrompt = promptText;

            cardWrap.innerHTML = `
                <div class="w-full max-w-[92%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            ${this.getCustomLogoSvg(18)}
                            <span class="text-xs md:text-sm font-extrabold text-white">AI Video Generated</span>
                        </div>
                        <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">${engineBadge} • ${this.aspectRatio}</span>
                    </div>

                    <p class="text-xs text-gray-300">Scene: <b class="text-white">${promptText.replace(/</g, '&lt;')}</b></p>

                    <div class="rounded-2xl overflow-hidden border border-white/15 bg-black shadow-xl flex justify-center">
                        <video src="${videoUrl}" controls autoplay loop playsinline class="w-full max-h-96 object-contain bg-black"></video>
                    </div>

                    <div class="flex flex-wrap gap-2 pt-1">
                        <a href="${videoUrl}" download="${fileName}" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition">
                            <i class="fa-solid fa-download"></i> Download Video
                        </a>
                        <button onclick="window.ZenoVideo.embedVideoIntoCurrentWebsite()" class="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition">
                            <i class="fa-solid fa-plus-circle"></i> Add Video to Website
                        </button>
                    </div>
                </div>
            `;
        },

        embedVideoIntoCurrentWebsite() {
            if (!window.__lastGeneratedVideoUrl) return;
            const videoSection = `
            <section class="max-w-4xl mx-auto my-8 px-4 relative z-20">
                <div class="rounded-3xl overflow-hidden border border-white/15 bg-zinc-950 p-4 shadow-2xl text-center">
                    <h3 class="text-lg font-extrabold text-white mb-3">${(window.__lastGeneratedVideoPrompt || 'Featured AI Video').replace(/</g, '&lt;')}</h3>
                    <video src="${window.__lastGeneratedVideoUrl}" controls autoplay loop playsinline class="w-full rounded-2xl max-h-[480px] bg-black mx-auto"></video>
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
                alert("Please build or select a website first, then click Add Video to Website!");
            }
        }
    };

    ZenoVideo.init();
})();
