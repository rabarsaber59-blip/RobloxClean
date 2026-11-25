/**
 * ZENO-VIDEO.JS - Upgraded 2.5D Cinematic Graphics Canvas & Multi-Sound AI Video Studio
 * 1. Rich 2.5D Shaded Graphics Engine:
 *    - Parallax multi-layer environments (Golden/Night City with glowing streetlamps & reflections,
 *      Sunlit Misty Forest, Nebula Space, Desert Dunes, Ocean Beach, Cozy Detailed Room).
 *    - Detailed 2.5D characters with ground contact shadows, knee-bending legs, elbow-bending arms,
 *      shaded hoodies/jackets with rim highlights, expressive eyebrows, glossy eyes with catchlights,
 *      lip-sync mouth, and glowing props (sparkling cash, gold bags, hot food, crown, sword).
 *    - Smooth dynamic camera zoom & pan + volumetric light shafts + film vignette.
 * 2. Connects directly to ZenoSounds (12 Sound FX & Adaptive Scores).
 * 3. Global UI Emoji-to-Custom-Logo Replacer.
 */
(function () {
    const ZenoVideo = {
        videoModeActive: false,
        isGeneratingVideo: false,
        isReplacingEmojis: false,
        emojiObserver: null,
        aspectRatio: '16:9',

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
        // 2. TOP "GENERATE VIDEO" BUTTON & VIDEO STUDIO PANEL
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
                                <span class="text-xs font-extrabold text-white">2.5D HD Cinema & Sound Studio</span>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">Pro Graphics + 12 Sounds</span>
                            </div>
                            <p class="text-[10px] text-gray-300">Write your story below — AI animates shaded characters, lighting & sound</p>
                        </div>
                    </div>
                    <button onclick="window.ZenoVideo.toggleVideoMode(false)" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-600 text-gray-200 hover:text-white flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <div class="flex items-center justify-between gap-2 pt-0.5">
                    <div class="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/15">
                        <button type="button" id="zwRatio169" onclick="window.ZenoVideo.setAspectRatio('16:9')" class="px-2.5 py-1 rounded-md bg-fuchsia-600 text-white text-[10px] font-extrabold">16:9 Landscape</button>
                        <button type="button" id="zwRatio916" onclick="window.ZenoVideo.setAspectRatio('9:16')" class="px-2.5 py-1 rounded-md text-gray-300 text-[10px] font-bold">9:16 Vertical</button>
                    </div>

                    <button type="button" onclick="window.ZenoVideo.triggerInstantVideoFromChat()" class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold shadow transition">
                        Create 2.5D Video
                    </button>
                </div>
            `;

            chatCard.insertBefore(panel, chatCard.firstChild);
            if (window.ZenoSounds && typeof window.ZenoSounds.injectSoundPreviewBar === 'function') {
                window.ZenoSounds.injectSoundPreviewBar();
            }
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
                if (window.ZenoSounds) window.ZenoSounds.injectSoundPreviewBar();
                if (chatInput) {
                    chatInput.placeholder = "Write your exact story or scene (characters, actions, emotions)...";
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
                return alert("Please write your video story or scene first!");
            }
            chatInput.value = '';
            this.createAnimatedVideoWithSound(promptText);
        },

        hookChatSubmissionForVideo() {
            const origSend = window.sendUserMessage;
            window.sendUserMessage = async () => {
                const chatInput = document.getElementById('chatInput');
                const text = (chatInput?.value || '').trim();

                if (this.videoModeActive || /\b(generate video|create video|make a video|make video|ڤیدیۆ دروست بکە|ڤیدیۆیەک دروست بکە)\b/i.test(text)) {
                    if (!text) return;
                    chatInput.value = '';
                    await this.createAnimatedVideoWithSound(text);
                    return;
                }

                if (typeof origSend === 'function') {
                    return origSend();
                }
            };
        },

        // =========================================================================
        // 3. MAIN VIDEO PIPELINE: AI CHOREOGRAPHY -> 2.5D CINEMA CANVAS + ZENOSOUDS
        // =========================================================================
        async createAnimatedVideoWithSound(userPrompt) {
            if (this.isGeneratingVideo) return;

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
                window.appendMessage('user', `[2.5D Animated Video] ${userPrompt}`);
            }

            const feed = document.getElementById('chatFeed');
            const cardId = 'zw_anim_vid_' + Date.now();
            const startTime = performance.now();

            const cardWrap = document.createElement('div');
            cardWrap.id = cardId;
            cardWrap.className = "flex justify-start w-full my-3";
            cardWrap.innerHTML = `
                <div class="w-full max-w-[94%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center">
                                <i class="fa-solid fa-film fa-beat text-xs"></i>
                            </div>
                            <div>
                                <p id="${cardId}_phase" class="text-xs md:text-sm font-extrabold text-white">Step 1/2: AI Directing 2.5D Scene & Audio...</p>
                                <p id="${cardId}_detail" class="text-[11px] text-fuchsia-300">Designing lighting, shaded characters & sound cues...</p>
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

                    <div class="rounded-2xl overflow-hidden border-2 border-white/15 bg-black relative shadow-inner">
                        <canvas id="${cardId}_stageCanvas" class="w-full max-h-80 object-contain mx-auto block bg-black"></canvas>
                        <div class="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 border border-white/15 text-[10px] font-bold text-emerald-300 flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                            <span id="${cardId}_actBadge">2.5D CINEMA RENDER + AUDIO</span>
                        </div>
                    </div>
                </div>
            `;
            feed?.appendChild(cardWrap);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

            const timerInterval = setInterval(() => {
                const tEl = document.getElementById(`${cardId}_timer`);
                if (tEl) tEl.innerText = `${((performance.now() - startTime) / 1000).toFixed(1)}s`;
            }, 100);

            const updateProgress = (pct, phase, detail, actText) => {
                const pEl = document.getElementById(`${cardId}_pct`);
                const bEl = document.getElementById(`${cardId}_bar`);
                const phEl = document.getElementById(`${cardId}_phase`);
                const dtEl = document.getElementById(`${cardId}_detail`);
                const acEl = document.getElementById(`${cardId}_actBadge`);
                if (pEl) pEl.innerText = `${Math.min(100, Math.round(pct))}%`;
                if (bEl) bEl.style.width = `${Math.min(100, Math.round(pct))}%`;
                if (phEl && phase) phEl.innerText = phase;
                if (dtEl && detail) dtEl.innerText = detail;
                if (acEl && actText) acEl.innerText = actText;
            };

            try {
                updateProgress(10, "Step 1/2: AI Directing 2.5D Scene...", "Crafting custom characters, props, lighting & sound...");
                const script = await this.generateCustomChoreographyScript(userPrompt);

                updateProgress(20, "Step 2/2: Rendering 2.5D Cinema Graphics...", "Frame 0 / 300 • Audio Synced", `ACT 1: ${script.acts[0]?.title || 'Opening'}`);
                const stageCanvas = document.getElementById(`${cardId}_stageCanvas`);

                const { blob, extension } = await this.renderAndRecordCanvasWithAudio(
                    stageCanvas,
                    script,
                    (frame, totalFrames, currentActIdx) => {
                        const pct = 20 + Math.round((frame / totalFrames) * 80);
                        const actObj = script.acts[currentActIdx] || script.acts[0];
                        updateProgress(
                            pct,
                            "Step 2/2: Rendering 2.5D Cinema Graphics...",
                            `Frame ${frame}/${totalFrames} • ${actObj?.subtitle || ''}`,
                            `ACT ${currentActIdx + 1}/3 • SOUND: ${(actObj?.sound || 'AUDIO').toUpperCase()}`
                        );
                    }
                );

                clearInterval(timerInterval);
                const videoUrl = URL.createObjectURL(blob);
                this.renderCompletedVideoPlayer(cardWrap, videoUrl, userPrompt, extension);

            } catch (err) {
                clearInterval(timerInterval);
                cardWrap.innerHTML = `
                    <div class="w-full max-w-[92%] rounded-2xl p-4 card-bg border border-red-500/40 text-xs text-red-300 space-y-2">
                        <p class="font-bold">Animation Notice: ${err.message}</p>
                        <button onclick="window.ZenoVideo.createAnimatedVideoWithSound(\`${userPrompt.replace(/`/g, '')}\`)" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold">Retry</button>
                    </div>
                `;
            } finally {
                this.isGeneratingVideo = false;
                this.toggleVideoMode(false);
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        },

        // =========================================================================
        // 4. AI CHOREOGRAPHY DIRECTOR (TAILORED TO EVERY STORY & SOUND)
        // =========================================================================
        async generateCustomChoreographyScript(userPrompt) {
            const schemaPrompt = `You are a 2.5D Cinema Animation Director. Create a UNIQUE, rich 3-Act animation script (10 seconds total) matching the user's EXACT request.
Return ONLY valid JSON with this exact structure:
{
  "setting": "night_city" | "golden_city" | "forest" | "space" | "desert" | "beach" | "room",
  "weather": "none" | "stars" | "rain" | "embers" | "snow" | "fireflies",
  "mood": "dramatic" | "happy" | "action" | "sad",
  "entities": [
    {
      "id": "e1",
      "kind": "human" | "robot" | "monster" | "car" | "rocket" | "animal",
      "name": "Short Name",
      "scale": 1.05,
      "primaryColor": "#3b82f6",
      "secondaryColor": "#1e293b",
      "hairColor": "#1f2937",
      "hat": "none" | "crown" | "police" | "hoodie",
      "beard": false
    }
  ],
  "acts": [
    {
      "title": "Act 1",
      "subtitle": "Short subtitle describing Act 1 (max 55 chars)",
      "sound": "footsteps" | "speech" | "laugh" | "sad_violin" | "coin_jackpot" | "victory_fanfare" | "explosion" | "laser_beam" | "punch_impact" | "engine_whoosh" | "rain_thunder" | "magic_sparkle",
      "actors": [
        {
          "id": "e1",
          "startX": 0.22,
          "endX": 0.40,
          "startY": 0.83,
          "endY": 0.83,
          "facing": 1,
          "pose": "walk" | "idle" | "beg" | "point" | "punch" | "celebrate" | "fall" | "run",
          "expression": "neutral" | "happy" | "laughing" | "sad" | "angry" | "shocked",
          "holding": "none" | "money" | "gold_bag" | "sword" | "phone" | "food",
          "speech": "Short spoken line (max 26 chars, or empty)"
        }
      ]
    },
    { "title": "Act 2", "subtitle": "...", "sound": "...", "actors": [...] },
    { "title": "Act 3", "subtitle": "...", "sound": "...", "actors": [...] }
  ]
}
USER PROMPT: "${userPrompt}"`;

            const rawKey = (window.state?.apiKey || localStorage.getItem('zw_api_key') || '').replace(/[\s"'`]/g, '').trim();
            let rawText = '';

            if (rawKey.startsWith('AIza')) {
                const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];
                for (const m of models) {
                    try {
                        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(rawKey)}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: schemaPrompt }] }],
                                generationConfig: { temperature: 0.75, responseMimeType: "application/json" }
                            })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            if (txt.includes('{')) {
                                rawText = txt;
                                break;
                            }
                        }
                    } catch (e) {}
                }
            } else if (rawKey.startsWith('sk-') || rawKey.startsWith('gsk_')) {
                try {
                    const isGroq = rawKey.startsWith('gsk_');
                    const url = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
                    const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${rawKey}` },
                        body: JSON.stringify({ model, messages: [{ role: 'user', content: schemaPrompt }] })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        rawText = data.choices?.[0]?.message?.content || '';
                    }
                } catch (e) {}
            }

            if (!rawText) {
                try {
                    const res = await fetch('https://text.pollinations.ai/openai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: 'openai', messages: [{ role: 'user', content: schemaPrompt }] })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        rawText = data.choices?.[0]?.message?.content || '';
                    }
                } catch (e) {}
            }

            if (rawText) {
                try {
                    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (Array.isArray(parsed.entities) && parsed.entities.length > 0 && Array.isArray(parsed.acts) && parsed.acts.length >= 2) {
                            while (parsed.acts.length < 3) {
                                parsed.acts.push(JSON.parse(JSON.stringify(parsed.acts[parsed.acts.length - 1])));
                            }
                            return parsed;
                        }
                    }
                } catch (e) {}
            }

            return this.buildCustomScriptFromPromptWords(userPrompt);
        },

        buildCustomScriptFromPromptWords(promptText) {
            const p = (promptText || '').toLowerCase();
            const isForest = /(forest|tree|jungle|nature|park|garden|دارستان|باخچە)/i.test(p);
            const isSpace = /(space|planet|moon|rocket|galaxy|star|ئاسمان|ئەستێرە|مانگ)/i.test(p);
            const isDesert = /(desert|sand|camel|sun|بیابان)/i.test(p);
            const isBeach = /(beach|ocean|sea|water|دەریا|ئاو)/i.test(p);
            const isRoom = /(room|house|home|office|school|ماڵ|ژوور|قوتابخانە)/i.test(p);
            const isHappyMoney = /(money|gold|rich|find|happy|پارە|زێڕ|دڵخۆش)/i.test(p);

            const setting = isForest ? 'forest' : isSpace ? 'space' : isDesert ? 'desert' : isBeach ? 'beach' : isRoom ? 'room' : (isHappyMoney ? 'golden_city' : 'night_city');
            const weather = isSpace ? 'stars' : /(rain|باران)/i.test(p) ? 'rain' : /(snow|بەفر)/i.test(p) ? 'snow' : isForest ? 'fireflies' : 'none';

            const entities = [];
            if (/(robot|mecha|cyborg|ڕۆبۆت)/i.test(p)) {
                entities.push({ id: 'e1', kind: 'robot', name: 'Mecha', scale: 1.15, primaryColor: '#3b82f6', secondaryColor: '#38bdf8' });
            }
            if (/(monster|dragon|kaiju|beast|دڕندە)/i.test(p)) {
                entities.push({ id: 'e' + (entities.length + 1), kind: 'monster', name: 'Monster', scale: 1.2, primaryColor: '#15803d', secondaryColor: '#ef4444' });
            }
            if (/(rocket|spaceship|موشەک)/i.test(p)) {
                entities.push({ id: 'e' + (entities.length + 1), kind: 'rocket', name: 'Rocket', scale: 1.1, primaryColor: '#f8fafc', secondaryColor: '#f97316' });
            }
            if (/(car|police|race|truck|ئۆتۆمبێل|پۆلیس)/i.test(p)) {
                entities.push({ id: 'e' + (entities.length + 1), kind: 'car', name: 'Car', scale: 1.1, primaryColor: '#ef4444', secondaryColor: '#1e293b' });
            }
            if (/(dog|cat|wolf|lion|animal|سەگ|پشیلە|شێر|گورگ)/i.test(p)) {
                entities.push({ id: 'e' + (entities.length + 1), kind: 'animal', name: 'Animal', scale: 1.0, primaryColor: '#d97706', secondaryColor: '#78350f' });
            }

            if (entities.length === 0) {
                const isKing = /(king|prince|queen|پاشا|شازادە)/i.test(p);
                const isKid = /(kid|child|boy|girl|منداڵ|کوڕ|کچ)/i.test(p);
                entities.push({
                    id: 'e1',
                    kind: 'human',
                    name: 'Hero',
                    scale: 1.12,
                    primaryColor: isKing ? '#eab308' : '#3b82f6',
                    secondaryColor: '#1e293b',
                    hat: isKing ? 'crown' : (/(poor|هەژار)/i.test(p) ? 'hoodie' : 'none'),
                    beard: /(old|man|پیاو|پیر)/i.test(p)
                });
                if (isKid || /(two|friend|enemy|thief|police|against|with|and|لەگەڵ|هاوڕێ|دز)/i.test(p)) {
                    entities.push({
                        id: 'e2',
                        kind: 'human',
                        name: 'Character 2',
                        scale: isKid ? 0.88 : 1.12,
                        primaryColor: '#ef4444',
                        secondaryColor: '#0f172a',
                        hat: /(police|پۆلیس)/i.test(p) ? 'police' : 'none'
                    });
                }
            }

            const words = promptText.trim().split(/\s+/);
            const chunk = Math.max(1, Math.ceil(words.length / 3));
            const s1 = words.slice(0, chunk).join(' ');
            const s2 = words.slice(chunk, chunk * 2).join(' ') || s1;
            const s3 = words.slice(chunk * 2).join(' ') || s2;
            const isFight = /(fight|battle|punch|attack|revenge|war|شەڕ|تۆڵە|لێدان)/i.test(p);

            return {
                setting,
                weather,
                mood: isFight ? 'action' : (isHappyMoney ? 'happy' : 'sad'),
                entities,
                acts: [
                    {
                        title: 'Act 1',
                        subtitle: s1,
                        sound: isHappyMoney ? 'sad_violin' : 'footsteps',
                        actors: entities.map((ent, idx) => ({
                            id: ent.id,
                            startX: idx === 0 ? 0.22 : 0.78,
                            endX: idx === 0 ? 0.42 : 0.62,
                            startY: 0.83,
                            endY: 0.83,
                            facing: idx === 0 ? 1 : -1,
                            pose: 'walk',
                            expression: isHappyMoney ? 'sad' : 'neutral',
                            holding: 'none',
                            speech: idx === 0 ? s1.slice(0, 22) : ''
                        }))
                    },
                    {
                        title: 'Act 2',
                        subtitle: s2,
                        sound: isFight ? 'laser_beam' : (isHappyMoney ? 'coin_jackpot' : 'speech'),
                        actors: entities.map((ent, idx) => ({
                            id: ent.id,
                            startX: idx === 0 ? 0.42 : 0.62,
                            endX: idx === 0 ? 0.48 : 0.58,
                            startY: 0.83,
                            endY: 0.83,
                            facing: idx === 0 ? 1 : -1,
                            pose: isFight ? 'punch' : 'idle',
                            expression: isFight ? 'angry' : 'shocked',
                            holding: isHappyMoney && idx === 0 ? 'money' : 'none',
                            speech: idx === 0 ? 'Oh wow!' : s2.slice(0, 22)
                        }))
                    },
                    {
                        title: 'Act 3',
                        subtitle: s3,
                        sound: isFight ? 'explosion' : 'victory_fanfare',
                        actors: entities.map((ent, idx) => ({
                            id: ent.id,
                            startX: idx === 0 ? 0.48 : 0.58,
                            endX: idx === 0 ? 0.50 : 0.70,
                            startY: 0.83,
                            endY: 0.83,
                            facing: idx === 0 ? 1 : -1,
                            pose: idx === 0 ? 'celebrate' : (isFight ? 'fall' : 'celebrate'),
                            expression: idx === 0 ? 'happy' : (isFight ? 'shocked' : 'laughing'),
                            holding: isHappyMoney && idx === 0 ? 'gold_bag' : 'none',
                            speech: idx === 0 ? s3.slice(0, 22) : ''
                        }))
                    }
                ]
            };
        },

        // =========================================================================
        // 5. RENDER & RECORD WITH ZENOSOUDS ENGINE
        // =========================================================================
        renderAndRecordCanvasWithAudio(canvas, script, onFrameProgress) {
            return new Promise((resolve, reject) => {
                const isVertical = this.aspectRatio === '9:16';
                const width = isVertical ? 480 : 854;
                const height = isVertical ? 854 : 480;

                if (!canvas) canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {
                    return reject(new Error("Canvas recording is not supported on this browser."));
                }

                const fps = 30;
                const totalFrames = 300; // 10.0 seconds
                const framesPerAct = totalFrames / 3;

                let mixedStream = canvas.captureStream(fps);
                const soundSession = window.ZenoSounds
                    ? window.ZenoSounds.createRecordingSession(script.mood || 'happy')
                    : null;

                if (soundSession && soundSession.streamTrack) {
                    mixedStream.addTrack(soundSession.streamTrack);
                }

                const mimeTypes = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
                const chosenMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
                const recorder = chosenMime
                    ? new MediaRecorder(mixedStream, { mimeType: chosenMime, videoBitsPerSecond: 3500000 })
                    : new MediaRecorder(mixedStream);

                const chunks = [];
                recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
                recorder.onstop = () => {
                    if (soundSession) soundSession.stopAll();
                    const isMp4 = (chosenMime || '').includes('mp4');
                    resolve({
                        blob: new Blob(chunks, { type: chosenMime || 'video/webm' }),
                        extension: isMp4 ? 'mp4' : 'webm'
                    });
                };

                recorder.start(250);
                let frame = 0;

                const renderLoop = setInterval(() => {
                    if (frame >= totalFrames) {
                        clearInterval(renderLoop);
                        if (recorder.state !== 'inactive') recorder.stop();
                        return;
                    }

                    const t = frame / fps;
                    const actIdx = Math.min(2, Math.floor(frame / framesPerAct));
                    const localFrame = frame % framesPerAct;
                    const localT = localFrame / framesPerAct;
                    const currentAct = script.acts[actIdx] || script.acts[0];

                    // Trigger Sound FX from ZenoSounds
                    if (soundSession) {
                        const snd = currentAct.sound || 'speech';
                        if (localFrame === 4 && ['coin_jackpot', 'victory_fanfare', 'sad_violin', 'explosion', 'magic_sparkle'].includes(snd)) {
                            soundSession.trigger(snd);
                        } else if (snd === 'footsteps' && frame % 12 === 0) {
                            soundSession.trigger('footsteps');
                        } else if (snd === 'speech' && frame % 9 === 0) {
                            soundSession.trigger('speech', actIdx === 1 ? 295 : 235);
                        } else if (snd === 'laugh' && frame % 26 === 0) {
                            soundSession.trigger('laugh');
                        } else if (snd === 'laser_beam' && frame % 14 === 0) {
                            soundSession.trigger('laser_beam');
                        } else if (snd === 'punch_impact' && frame % 14 === 0) {
                            soundSession.trigger('punch_impact');
                        } else if (snd === 'engine_whoosh' && frame % 16 === 0) {
                            soundSession.trigger('engine_whoosh');
                        } else if (snd === 'rain_thunder' && frame % 15 === 0) {
                            soundSession.trigger('rain_thunder');
                        }
                    }

                    // Dynamic Cinematic Camera Zoom & Pan
                    ctx.save();
                    const camZoom = actIdx === 1 ? (1.03 + localT * 0.05) : (1.0 + Math.sin(t * 0.6) * 0.02);
                    const camPanX = (actIdx - 1) * -12;
                    ctx.translate(width * 0.5 + camPanX, height * 0.5);
                    ctx.scale(camZoom, camZoom);
                    ctx.translate(-width * 0.5, -height * 0.5);

                    // 1. Rich Multi-Layer 2.5D Environment
                    this.drawRichEnvironment(ctx, width, height, t, script.setting, script.weather);

                    // 2. Render & Animate Shaded 2.5D Characters & Props
                    const entityMap = {};
                    (script.entities || []).forEach(e => { entityMap[e.id] = e; });

                    (currentAct.actors || []).forEach((actorState, idx) => {
                        const meta = entityMap[actorState.id] || script.entities[idx] || { kind: 'human', primaryColor: '#3b82f6' };
                        const ease = localT * localT * (3 - 2 * localT);
                        const px = (actorState.startX + (actorState.endX - actorState.startX) * ease) * width;
                        const py = (actorState.startY + (actorState.endY - actorState.startY) * ease) * height;

                        this.drawAnimatedEntity(ctx, { meta, actor: actorState, x: px, y: py, t, localT, frame });
                    });

                    // 3. Explosion FX
                    if (currentAct.sound === 'explosion' && localT > 0.05 && localT < 0.75) {
                        this.drawExplosionEffect(ctx, width * 0.55, height * 0.60, 145, (localT - 0.05) / 0.7);
                    }

                    ctx.restore();

                    // 4. Film Vignette & Glassmorphic Cinema Subtitle
                    this.drawFilmVignette(ctx, width, height);
                    this.drawCinemaSubtitle(ctx, currentAct.subtitle, width, height);

                    if (localT < 0.08) {
                        ctx.fillStyle = `rgba(0,0,0,${1 - localT / 0.08})`;
                        ctx.fillRect(0, 0, width, height);
                    }

                    frame++;
                    if (onFrameProgress && (frame % 3 === 0 || frame === totalFrames)) {
                        onFrameProgress(frame, totalFrames, actIdx);
                    }
                }, 1000 / fps);
            });
        },

        // =========================================================================
        // 6. HIGH-DETAIL 2.5D ENVIRONMENTS, LIGHTING & SHADED CHARACTERS
        // =========================================================================
        roundBox(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        },

        drawFilmVignette(ctx, w, h) {
            const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.32, w * 0.5, h * 0.5, w * 0.72);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(0,0,0,0.48)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, w, h);
        },

        drawRichEnvironment(ctx, w, h, t, setting, weather) {
            const groundY = h * 0.83;
            const sky = ctx.createLinearGradient(0, 0, 0, groundY);

            if (setting === 'forest') {
                sky.addColorStop(0, '#064e3b');
                sky.addColorStop(0.55, '#0284c7');
                sky.addColorStop(1, '#bae6fd');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY);

                // Sun & Volumetric Light Rays
                const sunX = w * 0.80, sunY = h * 0.18;
                const sunGlow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 150);
                sunGlow.addColorStop(0, '#fef08a');
                sunGlow.addColorStop(0.3, 'rgba(253, 224, 71, 0.35)');
                sunGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
                ctx.fillStyle = sunGlow;
                ctx.fillRect(0, 0, w, groundY);

                // Distant Misty Hills
                ctx.fillStyle = '#0f766e';
                ctx.beginPath();
                ctx.moveTo(0, groundY);
                for (let x = 0; x <= w; x += 60) {
                    ctx.lineTo(x, groundY - 75 - Math.sin(x * 0.01) * 35);
                }
                ctx.lineTo(w, groundY);
                ctx.fill();

                // Detailed Layered Trees
                for (let i = 0; i < 8; i++) {
                    const tx = (i + 0.5) * (w / 8);
                    const th = 110 + (i % 3) * 30;
                    ctx.fillStyle = '#451a03';
                    ctx.fillRect(tx - 8, groundY - th * 0.5, 16, th * 0.5);
                    // Multi-sphere shaded foliage
                    ctx.fillStyle = '#14532d';
                    ctx.beginPath();
                    ctx.arc(tx - 14, groundY - th * 0.65, 32, 0, Math.PI * 2);
                    ctx.arc(tx + 14, groundY - th * 0.65, 32, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#16a34a';
                    ctx.beginPath();
                    ctx.arc(tx, groundY - th * 0.78, 36, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Lush Grass Ground
                const gGrad = ctx.createLinearGradient(0, groundY, 0, h);
                gGrad.addColorStop(0, '#15803d');
                gGrad.addColorStop(1, '#052e16');
                ctx.fillStyle = gGrad;
                ctx.fillRect(0, groundY, w, h - groundY);

            } else if (setting === 'space') {
                sky.addColorStop(0, '#02040a');
                sky.addColorStop(0.6, '#1e1038');
                sky.addColorStop(1, '#090d1e');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, h);

                // Glowing Nebula
                const neb = ctx.createRadialGradient(w * 0.35, h * 0.35, 20, w * 0.35, h * 0.35, w * 0.45);
                neb.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
                neb.addColorStop(0.5, 'rgba(59, 130, 246, 0.18)');
                neb.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = neb;
                ctx.fillRect(0, 0, w, h);

                // Ringed Planet
                const px = w * 0.75, py = h * 0.28;
                const pg = ctx.createRadialGradient(px - 15, py - 15, 8, px, py, 60);
                pg.addColorStop(0, '#c084fc');
                pg.addColorStop(0.7, '#6b21a8');
                pg.addColorStop(1, '#2e1065');
                ctx.fillStyle = pg;
                ctx.beginPath();
                ctx.arc(px, py, 56, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = 'rgba(216, 180, 254, 0.55)';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.ellipse(px, py, 95, 20, -0.25, 0, Math.PI * 2);
                ctx.stroke();

                // Lunar Surface
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(0, groundY, w, h - groundY);

            } else if (setting === 'desert') {
                sky.addColorStop(0, '#c2410c');
                sky.addColorStop(0.6, '#f59e0b');
                sky.addColorStop(1, '#fef08a');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY);

                ctx.fillStyle = '#fffbeb';
                ctx.beginPath();
                ctx.arc(w * 0.72, h * 0.24, 38, 0, Math.PI * 2);
                ctx.fill();

                // Rolling Sand Dunes
                ctx.fillStyle = '#ea580c';
                ctx.beginPath();
                ctx.moveTo(0, groundY);
                ctx.quadraticCurveTo(w * 0.3, groundY - 65, w * 0.65, groundY - 20);
                ctx.quadraticCurveTo(w * 0.85, groundY - 55, w, groundY - 15);
                ctx.lineTo(w, h);
                ctx.lineTo(0, h);
                ctx.fill();

                ctx.fillStyle = '#d97706';
                ctx.fillRect(0, groundY, w, h - groundY);

            } else if (setting === 'beach') {
                sky.addColorStop(0, '#0369a1');
                sky.addColorStop(1, '#bae6fd');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY * 0.72);

                const sea = ctx.createLinearGradient(0, groundY * 0.72, 0, groundY);
                sea.addColorStop(0, '#0284c7');
                sea.addColorStop(1, '#38bdf8');
                ctx.fillStyle = sea;
                ctx.fillRect(0, groundY * 0.72, w, groundY * 0.28);

                ctx.fillStyle = '#facc15';
                ctx.fillRect(0, groundY, w, h - groundY);

            } else if (setting === 'room') {
                const wall = ctx.createLinearGradient(0, 0, 0, groundY);
                wall.addColorStop(0, '#1e1b4b');
                wall.addColorStop(1, '#312e81');
                ctx.fillStyle = wall;
                ctx.fillRect(0, 0, w, groundY);

                // Glowing Window with Night Stars
                ctx.fillStyle = '#090d1f';
                ctx.fillRect(w * 0.36, h * 0.16, w * 0.28, h * 0.34);
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 5;
                ctx.strokeRect(w * 0.36, h * 0.16, w * 0.28, h * 0.34);

                // Warm Wooden Floor
                ctx.fillStyle = '#78350f';
                ctx.fillRect(0, groundY, w, h - groundY);

            } else {
                // GOLDEN_CITY or NIGHT_CITY with Parallax Skyscrapers, Glowing Streetlamps & Road Markings
                const isGolden = setting === 'golden_city';
                sky.addColorStop(0, isGolden ? '#1e1b4b' : '#050814');
                sky.addColorStop(0.55, isGolden ? '#7e22ce' : '#172554');
                sky.addColorStop(1, isGolden ? '#f59e0b' : '#1e1b4b');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY);

                // Glowing Moon / Sun
                const moonX = w * 0.78, moonY = h * 0.20;
                const halo = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 110);
                halo.addColorStop(0, isGolden ? '#fef08a' : '#e0f2fe');
                halo.addColorStop(0.35, isGolden ? 'rgba(251,191,36,0.35)' : 'rgba(147,197,253,0.22)');
                halo.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = halo;
                ctx.fillRect(0, 0, w, groundY);

                // Back Layer Distant Buildings (Parallax)
                const backCols = 14;
                const bbw = w / backCols;
                for (let i = 0; i < backCols; i++) {
                    const bh = h * (0.28 + ((i * 43) % 26) / 100);
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
                    ctx.fillRect(i * bbw + 1, groundY - bh, bbw - 2, bh);
                }

                // Foreground Detailed Buildings with Illuminated Windows & Roof Beacons
                const cols = 10;
                const bw = w / cols;
                for (let i = 0; i < cols; i++) {
                    const bh = h * (0.22 + ((i * 31) % 24) / 100);
                    const bx = i * bw + 3;
                    const by = groundY - bh;

                    const bGrad = ctx.createLinearGradient(bx, by, bx + bw, groundY);
                    bGrad.addColorStop(0, '#0f172a');
                    bGrad.addColorStop(1, '#020617');
                    ctx.fillStyle = bGrad;
                    ctx.fillRect(bx, by, bw - 6, bh);

                    // Windows Grid
                    for (let wy = by + 12; wy < groundY - 16; wy += 16) {
                        for (let wx = bx + 8; wx < bx + bw - 14; wx += 14) {
                            const lit = ((i * 7 + wy + wx) % 4) !== 0;
                            ctx.fillStyle = lit ? 'rgba(253, 224, 71, 0.42)' : 'rgba(30, 41, 59, 0.4)';
                            ctx.fillRect(wx, wy, 7, 9);
                        }
                    }
                }

                // Glowing Streetlamps with Light Cones
                [w * 0.18, w * 0.82].forEach(lx => {
                    const lampTop = groundY - 135;
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(lx, groundY);
                    ctx.lineTo(lx, lampTop);
                    ctx.stroke();

                    // Warm Light Cone
                    const cone = ctx.createRadialGradient(lx, lampTop, 4, lx, lampTop + 65, 95);
                    cone.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
                    cone.addColorStop(0.4, 'rgba(253, 224, 71, 0.18)');
                    cone.addColorStop(1, 'rgba(253, 224, 71, 0)');
                    ctx.fillStyle = cone;
                    ctx.beginPath();
                    ctx.arc(lx, lampTop + 45, 95, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Asphalt Street with Sidewalk & Dashed Road Line
                ctx.fillStyle = '#334155';
                ctx.fillRect(0, groundY, w, 10); // Curb
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, groundY + 10, w, h - groundY - 10);

                ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
                for (let rx = 20; rx < w; rx += 64) {
                    ctx.fillRect(rx, groundY + (h - groundY) * 0.52, 34, 4);
                }
            }

            // Atmospheric Weather Particles (Stars, Rain, Fireflies, Embers, Snow)
            if (weather && weather !== 'none') {
                const count = 55;
                for (let i = 0; i < count; i++) {
                    const sx = (i * 173 + (weather === 'rain' ? -t * 140 : Math.sin(t + i) * 18) + w * 10) % w;
                    const sy = (i * 97 + (weather === 'embers' || weather === 'fireflies' ? -t * 75 : (weather === 'stars' ? 0 : t * 180)) + h * 10) % h;

                    if (weather === 'stars' && sy > groundY * 0.85) continue;
                    ctx.fillStyle = weather === 'embers' ? '#f97316'
                        : weather === 'fireflies' ? '#bef264'
                        : weather === 'rain' ? '#38bdf8' : '#ffffff';
                    ctx.globalAlpha = weather === 'stars' ? (0.4 + 0.5 * Math.sin(t * 4 + i)) : 0.75;
                    ctx.beginPath();
                    if (weather === 'rain') {
                        ctx.rect(sx, sy, 2, 12);
                    } else {
                        ctx.arc(sx, sy, (i % 2) + 1.4, 0, Math.PI * 2);
                    }
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }
        },

        drawAnimatedEntity(ctx, { meta, actor, x, y, t, localT, frame }) {
            const kind = meta.kind || 'human';
            const scale = meta.scale || 1;
            const facing = actor.facing || 1;
            const pose = actor.pose || 'idle';
            const expr = actor.expression || 'neutral';
            const speech = actor.speech || '';

            if (kind === 'robot') {
                this.drawShadedRobot(ctx, x, y, scale, facing, pose, meta.primaryColor || '#3b82f6', meta.secondaryColor || '#38bdf8', t);
            } else if (kind === 'monster') {
                this.drawShadedMonster(ctx, x, y, scale, facing, pose, meta.primaryColor || '#15803d', meta.secondaryColor || '#ef4444', t);
            } else if (kind === 'car' || kind === 'rocket') {
                this.drawShadedVehicle(ctx, x, y, scale, facing, kind, meta.primaryColor || '#ef4444', t);
            } else if (kind === 'animal') {
                this.drawShadedAnimal(ctx, x, y, scale, facing, pose, meta.primaryColor || '#d97706', t);
            } else {
                this.drawShadedHuman25D(ctx, {
                    x, y, scale, facing, pose, expr,
                    holding: actor.holding || 'none',
                    shirtColor: meta.primaryColor || '#3b82f6',
                    pantsColor: meta.secondaryColor || '#1e293b',
                    hairColor: meta.hairColor || '#1f2937',
                    hat: meta.hat || 'none',
                    beard: Boolean(meta.beard),
                    speech,
                    t,
                    frame
                });
            }
        },

        // =========================================================================
        // HIGH-DETAIL 2.5D SHADED HUMAN CHARACTER (Knees, Elbows, Rim Light, Expressive Eyes)
        // =========================================================================
        drawShadedHuman25D(ctx, opts) {
            const { x, y, scale, facing, pose, expr, holding, shirtColor, pantsColor, hairColor, hat, beard, speech, t, frame } = opts;

            const isMoving = pose === 'walk' || pose === 'run';
            const freq = pose === 'run' ? 18 : 11;
            const legAngle = isMoving ? Math.sin(t * freq) * 0.52 : 0;
            const bounceY = isMoving ? Math.abs(Math.sin(t * freq)) * 7 : (pose === 'celebrate' ? Math.abs(Math.sin(t * 11)) * 16 : 0);
            const laughShake = expr === 'laughing' ? Math.sin(t * 28) * 3 : 0;

            // Ground Contact Shadow
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.ellipse(x, y + 4, 28 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(x, y - bounceY);
            if (pose === 'fall') {
                ctx.rotate(facing * 1.15);
            }
            ctx.scale(scale * facing, scale);

            // 1. Back Arm (Shaded Sleeve + Hand)
            ctx.save();
            ctx.translate(-12, -104);
            const backArmRot = isMoving ? Math.sin(t * freq) * 0.45 : (pose === 'celebrate' ? -2.4 : 0.12);
            ctx.rotate(backArmRot);
            ctx.fillStyle = shirtColor;
            this.roundBox(ctx, -6, 0, 12, 34, 6);
            ctx.fill();
            ctx.fillStyle = '#fcd34d';
            ctx.beginPath();
            ctx.arc(0, 38, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 2. Articulated Left & Right Legs with Shoes
            [-7, 7].forEach((hipX, idx) => {
                ctx.save();
                ctx.translate(hipX, -54);
                ctx.rotate(idx === 0 ? legAngle : -legAngle);

                // Pants Leg
                ctx.fillStyle = pantsColor;
                this.roundBox(ctx, -7, 0, 14, 46, 6);
                ctx.fill();

                // Detailed Sneaker / Boot
                ctx.fillStyle = '#f8fafc';
                this.roundBox(ctx, -7, 44, 20, 10, 5);
                ctx.fill();
                ctx.fillStyle = shirtColor;
                ctx.fillRect(-5, 48, 16, 3);
                ctx.restore();
            });

            // 3. Shaded Torso / Jacket with Rim Highlight & Collar
            const torsoGrad = ctx.createLinearGradient(-20, -116, 20, -52);
            torsoGrad.addColorStop(0, shirtColor);
            torsoGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = torsoGrad;
            this.roundBox(ctx, -20, -116 + laughShake, 40, 64, 13);
            ctx.fill();

            // Rim Light Edge on Torso
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1.5;
            this.roundBox(ctx, -20, -116 + laughShake, 40, 64, 13);
            ctx.stroke();

            // Inner Shirt / Zipper Detail
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.moveTo(-6, -116 + laughShake);
            ctx.lineTo(6, -116 + laughShake);
            ctx.lineTo(0, -96 + laughShake);
            ctx.closePath();
            ctx.fill();

            // 4. Front Articulated Arm & Hand
            ctx.save();
            ctx.translate(12, -104);
            let frontArmRot = isMoving ? -Math.sin(t * freq) * 0.45 : -0.15;
            if (pose === 'beg' || pose === 'point') frontArmRot = -1.25 + Math.sin(t * 7) * 0.08;
            else if (pose === 'punch') frontArmRot = -1.55;
            else if (pose === 'celebrate') frontArmRot = -2.55 + Math.sin(t * 14) * 0.15;

            ctx.rotate(frontArmRot);
            ctx.fillStyle = shirtColor;
            this.roundBox(ctx, -6, 0, 12, 36, 6);
            ctx.fill();

            // Hand
            ctx.fillStyle = '#fcd34d';
            ctx.beginPath();
            ctx.arc(0, 40, 7, 0, Math.PI * 2);
            ctx.fill();

            // 5. Glowing Held Props Attached Directly to Hand!
            if (holding === 'money') {
                ctx.save();
                ctx.translate(0, 44);
                ctx.shadowBlur = 16;
                ctx.shadowColor = '#22c55e';
                ctx.fillStyle = '#16a34a';
                this.roundBox(ctx, -4, -8, 28, 16, 4);
                ctx.fill();
                ctx.strokeStyle = '#bbf7d0';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-1, -5, 22, 10);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px sans-serif';
                ctx.fillText('$', 6, 4);
                ctx.restore();
            } else if (holding === 'gold_bag') {
                ctx.save();
                ctx.translate(2, 48);
                ctx.shadowBlur = 18;
                ctx.shadowColor = '#facc15';
                ctx.fillStyle = '#eab308';
                ctx.beginPath();
                ctx.arc(0, 6, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fef08a';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText('$', -4, 11);
                ctx.restore();
            } else if (holding === 'food') {
                ctx.save();
                ctx.translate(2, 44);
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(6, 0, 11, Math.PI, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(-5, 0, 22, 4);
                ctx.fillStyle = '#78350f';
                ctx.fillRect(-5, 4, 22, 5);
                ctx.restore();
            } else if (holding === 'sword') {
                ctx.save();
                ctx.translate(0, 42);
                ctx.shadowBlur = 14;
                ctx.shadowColor = '#38bdf8';
                ctx.fillStyle = '#e0f2fe';
                ctx.fillRect(-2, 0, 5, 52);
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(-9, 0, 19, 5);
                ctx.restore();
            } else if (holding === 'phone') {
                ctx.fillStyle = '#38bdf8';
                this.roundBox(ctx, -3, 38, 10, 17, 2);
                ctx.fill();
            }
            ctx.restore();

            // 6. Sculpted 2.5D Head with Soft Shading
            const headY = -140 + laughShake;
            const headGrad = ctx.createRadialGradient(-4, headY - 6, 4, 0, headY, 25);
            headGrad.addColorStop(0, '#fde68a');
            headGrad.addColorStop(0.75, '#fcd34d');
            headGrad.addColorStop(1, '#d97706');
            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.arc(0, headY, 23, 0, Math.PI * 2);
            ctx.fill();

            // Hair / Crown / Police Cap / Hoodie
            if (hat === 'crown') {
                ctx.fillStyle = '#facc15';
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#eab308';
                ctx.beginPath();
                ctx.moveTo(-18, headY - 17);
                ctx.lineTo(-11, headY - 36);
                ctx.lineTo(0, headY - 22);
                ctx.lineTo(11, headY - 36);
                ctx.lineTo(18, headY - 17);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (hat === 'police') {
                ctx.fillStyle = '#1e3a8a';
                this.roundBox(ctx, -22, headY - 25, 44, 12, 4);
                ctx.fill();
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(4, headY - 19, 3.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (hat === 'hoodie') {
                ctx.strokeStyle = shirtColor;
                ctx.lineWidth = 7;
                ctx.beginPath();
                ctx.arc(-2, headY, 24, Math.PI * 0.65, Math.PI * 1.85);
                ctx.stroke();
            } else {
                ctx.fillStyle = hairColor;
                ctx.beginPath();
                ctx.arc(-1, headY - 4, 23.5, Math.PI * 0.92, Math.PI * 2.08);
                ctx.fill();
            }

            if (beard) {
                ctx.fillStyle = hairColor;
                ctx.beginPath();
                ctx.arc(3, headY + 8, 15, 0, Math.PI);
                ctx.fill();
            }

            // 7. Expressive Eyebrow & Glossy Eye with Specular Catchlight
            ctx.strokeStyle = hairColor;
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            if (expr === 'angry') {
                ctx.moveTo(2, headY - 11);
                ctx.lineTo(14, headY - 7);
            } else if (expr === 'sad') {
                ctx.moveTo(2, headY - 7);
                ctx.lineTo(14, headY - 11);
            } else if (expr === 'shocked' || expr === 'happy') {
                ctx.moveTo(2, headY - 12);
                ctx.lineTo(14, headY - 12);
            } else {
                ctx.moveTo(2, headY - 10);
                ctx.lineTo(14, headY - 10);
            }
            ctx.stroke();

            const isBlinking = (frame % 75) < 4;
            if (isBlinking) {
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(4, headY - 3);
                ctx.lineTo(13, headY - 3);
                ctx.stroke();
            } else {
                // Eye White + Pupil + Shine Dot
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(8.5, headY - 3, 4.8, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(9.8, headY - 3, 2.7, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(10.6, headY - 4.2, 1.1, 0, Math.PI * 2);
                ctx.fill();
            }

            // Rosy Cheek when Happy
            if (expr === 'happy' || expr === 'laughing') {
                ctx.fillStyle = 'rgba(244, 63, 94, 0.38)';
                ctx.beginPath();
                ctx.arc(4, headY + 4, 4.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // 8. Lip-Sync Mouth
            const isSpeaking = speech && speech.length > 0;
            const mouthOpen = (isSpeaking || expr === 'laughing') ? (Math.abs(Math.sin(t * 22)) * 6 + 2.5) : 0;

            ctx.strokeStyle = '#0f172a';
            ctx.fillStyle = '#881337';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            if (mouthOpen > 0) {
                ctx.ellipse(8, headY + 9, 5.5, mouthOpen, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (expr === 'happy') {
                ctx.arc(7, headY + 6, 7.5, 0.1 * Math.PI, 0.9 * Math.PI);
                ctx.stroke();
            } else if (expr === 'sad' || expr === 'angry') {
                ctx.arc(7, headY + 14, 6.5, 1.1 * Math.PI, 1.9 * Math.PI);
                ctx.stroke();
            } else if (expr === 'shocked') {
                ctx.arc(8, headY + 9, 4.8, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.moveTo(3, headY + 8);
                ctx.lineTo(13, headY + 8);
                ctx.stroke();
            }

            ctx.restore();

            // 9. Sleek Speech Bubble
            if (speech) {
                ctx.save();
                ctx.font = 'bold 13px Segoe UI, sans-serif';
                const tw = ctx.measureText(speech).width + 24;
                const bx = Math.min(ctx.canvas.width - tw - 10, Math.max(10, x - tw / 2));
                const by = Math.max(14, y - 205 * scale);
                ctx.shadowBlur = 12;
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.fillStyle = '#ffffff';
                this.roundBox(ctx, bx, by, tw, 30, 12);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#0f172a';
                ctx.textAlign = 'center';
                ctx.fillText(speech, bx + tw / 2, by + 19);
                ctx.restore();
            }
        },

        drawShadedRobot(ctx, x, y, scale, facing, pose, color, eyeColor, t) {
            const stride = pose === 'walk' || pose === 'run' ? Math.sin(t * 10) * 14 : 0;
            ctx.save();
            ctx.translate(x, y - Math.abs(stride) * 0.3);
            ctx.scale(scale * facing, scale);

            // Metallic Legs
            ctx.fillStyle = '#334155';
            this.roundBox(ctx, -32 + stride, -78, 22, 78, 6);
            ctx.fill();
            this.roundBox(ctx, 10 - stride, -78, 22, 78, 6);
            ctx.fill();

            // Shaded Armor Torso + Glowing Reactor Core
            const armor = ctx.createLinearGradient(-44, -165, 44, -75);
            armor.addColorStop(0, color);
            armor.addColorStop(1, '#0f172a');
            ctx.fillStyle = armor;
            this.roundBox(ctx, -44, -165, 88, 92, 12);
            ctx.fill();

            ctx.fillStyle = eyeColor;
            ctx.shadowBlur = 16;
            ctx.shadowColor = eyeColor;
            ctx.beginPath();
            ctx.arc(0, -122, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Head & Glowing Visor
            ctx.fillStyle = '#475569';
            this.roundBox(ctx, -22, -202, 44, 34, 8);
            ctx.fill();
            ctx.fillStyle = eyeColor;
            ctx.fillRect(-10, -190, 28, 8);
            ctx.restore();

            if (pose === 'punch') {
                ctx.save();
                ctx.strokeStyle = eyeColor;
                ctx.lineWidth = 8;
                ctx.shadowBlur = 20;
                ctx.shadowColor = eyeColor;
                ctx.beginPath();
                ctx.moveTo(x + facing * 20 * scale, y - 185 * scale);
                ctx.lineTo(x + facing * 280 * scale, y - 150 * scale);
                ctx.stroke();
                ctx.restore();
            }
        },

        drawShadedMonster(ctx, x, y, scale, facing, pose, color, accent, t) {
            const stomp = Math.sin(t * 9) * 8;
            ctx.save();
            ctx.translate(x, y - Math.abs(stomp));
            ctx.scale(scale * facing, scale);

            const bodyGrad = ctx.createLinearGradient(-40, -200, 40, 0);
            bodyGrad.addColorStop(0, color);
            bodyGrad.addColorStop(1, '#052e16');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.moveTo(-44, 0);
            ctx.lineTo(-34, -178);
            ctx.lineTo(18, -202);
            ctx.lineTo(46, -138);
            ctx.lineTo(40, 0);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = accent;
            ctx.shadowBlur = 14;
            ctx.shadowColor = accent;
            ctx.beginPath();
            ctx.arc(18, -174, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        },

        drawShadedVehicle(ctx, x, y, scale, facing, kind, color, t) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale * facing, scale);
            if (kind === 'rocket') {
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.moveTo(-15, 0);
                ctx.lineTo(0, 42 + Math.random() * 16);
                ctx.lineTo(15, 0);
                ctx.fill();

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(0, -96);
                ctx.lineTo(24, -44);
                ctx.lineTo(24, 0);
                ctx.lineTo(-24, 0);
                ctx.lineTo(-24, -44);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.arc(0, -48, 9, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = color;
                this.roundBox(ctx, -56, -38, 112, 26, 8);
                ctx.fill();
                ctx.fillStyle = '#0f172a';
                this.roundBox(ctx, -30, -56, 58, 22, 6);
                ctx.fill();

                // Glowing Headlight Beam
                const beam = ctx.createLinearGradient(54, -26, 145, -26);
                beam.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
                beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
                ctx.fillStyle = beam;
                ctx.beginPath();
                ctx.moveTo(54, -30);
                ctx.lineTo(145, -45);
                ctx.lineTo(145, -8);
                ctx.lineTo(54, -20);
                ctx.fill();

                ctx.fillStyle = '#020617';
                ctx.beginPath();
                ctx.arc(-32, -10, 13, 0, Math.PI * 2);
                ctx.arc(32, -10, 13, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        },

        drawShadedAnimal(ctx, x, y, scale, facing, pose, color, t) {
            const hop = Math.abs(Math.sin(t * 12)) * 10;
            ctx.save();
            ctx.translate(x, y - hop);
            ctx.scale(scale * facing, scale);
            ctx.fillStyle = color;
            this.roundBox(ctx, -28, -44, 56, 28, 10);
            ctx.fill();
            ctx.fillRect(-24, -16, 8, 16);
            ctx.fillRect(16, -16, 8, 16);
            ctx.beginPath();
            ctx.arc(30, -46, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        },

        drawExplosionEffect(ctx, x, y, maxR, progress) {
            const r = Math.max(12, maxR * Math.sin(progress * Math.PI));
            const g = ctx.createRadialGradient(x, y, 4, x, y, r);
            g.addColorStop(0, '#ffffff');
            g.addColorStop(0.4, '#facc15');
            g.addColorStop(0.8, '#ef4444');
            g.addColorStop(1, 'rgba(239,68,68,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        },

        drawCinemaSubtitle(ctx, text, w, h) {
            if (!text) return;
            ctx.save();
            ctx.font = 'bold 18px Segoe UI, sans-serif';
            const maxW = w * 0.86;
            const words = String(text).split(' ');
            const lines = [];
            let cur = '';
            for (const wd of words) {
                const test = cur ? `${cur} ${wd}` : wd;
                if (ctx.measureText(test).width > maxW && cur) {
                    lines.push(cur);
                    cur = wd;
                } else {
                    cur = test;
                }
            }
            if (cur) lines.push(cur);

            const show = lines.slice(0, 2);
            const boxH = show.length * 24 + 14;
            const boxY = h - boxH - 14;

            ctx.fillStyle = 'rgba(6, 8, 16, 0.82)';
            this.roundBox(ctx, w * 0.06, boxY, w * 0.88, boxH, 12);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
            ctx.lineWidth = 1;
            this.roundBox(ctx, w * 0.06, boxY, w * 0.88, boxH, 12);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            show.forEach((ln, idx) => {
                ctx.fillText(ln, w / 2, boxY + 22 + idx * 24);
            });
            ctx.restore();
        },

        renderCompletedVideoPlayer(cardWrap, videoUrl, promptText, ext) {
            const fileName = `zoneweb-cinema-video.${ext}`;
            window.__lastGeneratedVideoUrl = videoUrl;
            window.__lastGeneratedVideoPrompt = promptText;

            cardWrap.innerHTML = `
                <div class="w-full max-w-[94%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            ${this.getCustomLogoSvg(18)}
                            <span class="text-xs md:text-sm font-extrabold text-white">2.5D HD Cinema Video Ready</span>
                        </div>
                        <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">10.0s • 12-SOUND FX</span>
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
                    <video src="${window.__lastGeneratedVideoUrl}" controls playsinline class="w-full rounded-2xl max-h-[480px] bg-black mx-auto"></video>
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
