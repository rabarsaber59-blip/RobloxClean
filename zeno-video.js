/**
 * ZENO-VIDEO.JS - AI Dynamic Character Animation Canvas & Sound Engine
 * 1. Top "Generate Video" button activates Video Mode above the AI chat bar.
 * 2. Translates ANY prompt (Kurdish, English, Arabic, etc.) into a custom 3-Act animated Canvas script
 *    with specific characters, settings, props, expressions, dialogue & camera motion (never repeats static scenes).
 * 3. Articulated 2D Canvas Character Kinematics: walking legs, swinging arms, blinking eyes, lip-syncing
 *    mouths during speech, facial expressions, vehicles, robots, monsters & weather particles.
 * 4. Real Synthesized WebAudio Sound Engine: footsteps, speech tones, laughter, laser/explosion impacts,
 *    and adaptive background score mixed directly into the recorded video file.
 * 5. Preserves the global UI emoji-to-custom-logo replacer.
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
        // 2. TOP "GENERATE VIDEO" BUTTON & VIDEO MODE PANEL ON CHAT
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
                                <span class="text-xs font-extrabold text-white">AI Character Animation & Sound Studio</span>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">Canvas + Audio</span>
                            </div>
                            <p class="text-[10px] text-gray-300">Describe any story or scene below — AI animates characters & sounds on Canvas</p>
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
                        Create Animated Video
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
                    chatInput.placeholder = "Write your exact story or scene (characters, actions, place)...";
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
                return alert("Please describe the video story or scene first!");
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
        // 3. MAIN VIDEO PIPELINE: AI CHOREOGRAPHY -> LIVE CANVAS + SOUND -> VIDEO
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
                window.appendMessage('user', `[Animated Video] ${userPrompt}`);
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
                                <p id="${cardId}_phase" class="text-xs md:text-sm font-extrabold text-white">Step 1/2: AI is directing characters & script...</p>
                                <p id="${cardId}_detail" class="text-[11px] text-fuchsia-300">Building custom scene choreography & sound cues...</p>
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

                    <!-- LIVE ANIMATION CANVAS STAGE (Shows Characters Moving in Real Time!) -->
                    <div class="rounded-2xl overflow-hidden border-2 border-white/15 bg-black relative shadow-inner">
                        <canvas id="${cardId}_stageCanvas" class="w-full max-h-80 object-contain mx-auto block bg-black"></canvas>
                        <div class="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 border border-white/15 text-[10px] font-bold text-emerald-300 flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                            <span id="${cardId}_actBadge">LIVE CANVAS ANIMATION + AUDIO</span>
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
                // 1. Ask AI to produce a custom JSON Choreography tailored 100% to the user's exact prompt
                updateProgress(10, "Step 1/2: AI Directing Custom Scene...", "Analyzing characters, setting, actions & dialogue...");
                const script = await this.generateCustomChoreographyScript(userPrompt);

                // 2. Render & Record the Live Canvas Character Animation + Synchronized WebAudio Sounds
                updateProgress(20, "Step 2/2: Animating Characters & Recording Sound...", "Rendering 30 FPS Canvas + Audio...", `ACT 1: ${script.acts[0]?.title || 'Opening'}`);
                const stageCanvas = document.getElementById(`${cardId}_stageCanvas`);

                const { blob, extension } = await this.renderAndRecordCanvasWithAudio(
                    stageCanvas,
                    script,
                    (frame, totalFrames, currentActIdx) => {
                        const pct = 20 + Math.round((frame / totalFrames) * 80);
                        const actObj = script.acts[currentActIdx] || script.acts[0];
                        updateProgress(
                            pct,
                            "Step 2/2: Animating Characters & Sound...",
                            `Frame ${frame}/${totalFrames} • ${actObj?.subtitle || ''}`,
                            `ACT ${currentActIdx + 1}/3 • AUDIO ON`
                        );
                    }
                );

                clearInterval(timerInterval);
                const videoUrl = URL.createObjectURL(blob);
                this.renderCompletedVideoPlayer(cardWrap, videoUrl, userPrompt, extension, script);

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
        // 4. AI CHOREOGRAPHY DIRECTOR (PRODUCES UNIQUE JSON FOR EVERY PROMPT)
        // =========================================================================
        async generateCustomChoreographyScript(userPrompt) {
            const schemaPrompt = `You are an expert 2D Animation Director. Create a UNIQUE, detailed 3-Act animation script (10 seconds total) that accurately depicts the user's EXACT request.
Never use generic templates—every character, prop, action, setting, and dialogue MUST match the user's prompt!

Return ONLY valid JSON (no markdown fences needed, just raw JSON) with this exact structure:
{
  "setting": "street" | "forest" | "space" | "desert" | "room" | "beach" | "night_city",
  "weather": "none" | "stars" | "rain" | "embers" | "snow",
  "mood": "dramatic" | "happy" | "action" | "sad",
  "entities": [
    {
      "id": "e1",
      "kind": "human" | "robot" | "monster" | "car" | "rocket" | "animal",
      "name": "Short Name",
      "scale": 1.0,
      "primaryColor": "#3b82f6",
      "secondaryColor": "#1e293b",
      "hairColor": "#1f2937",
      "hat": "none" | "crown" | "police" | "cap",
      "beard": false
    }
  ],
  "acts": [
    {
      "title": "Act 1",
      "subtitle": "Short subtitle describing Act 1 (max 55 chars)",
      "sound": "footsteps" | "speech" | "laugh" | "laser" | "explosion" | "engine",
      "actors": [
        {
          "id": "e1",
          "startX": 0.2,
          "endX": 0.38,
          "startY": 0.82,
          "endY": 0.82,
          "facing": 1,
          "pose": "walk" | "idle" | "beg" | "point" | "punch" | "celebrate" | "fall" | "run",
          "expression": "neutral" | "happy" | "laughing" | "sad" | "angry" | "shocked",
          "holding": "none" | "money" | "gold_bag" | "sword" | "phone" | "gift" | "food",
          "speech": "Short spoken line (max 28 chars, or empty string)"
        }
      ]
    },
    { "title": "Act 2", "subtitle": "...", "sound": "...", "actors": [...] },
    { "title": "Act 3", "subtitle": "...", "sound": "...", "actors": [...] }
  ]
}

Rules:
- Include 1 to 3 entities matching the exact characters/objects in the user's prompt.
- Coordinates startX, endX, startY, endY are normalized (0.1 to 0.9, ground level is 0.82).
- Write subtitles and speech in the SAME language the user used (or English if requested).
USER PROMPT: "${userPrompt}"`;

            const rawKey = (window.state?.apiKey || localStorage.getItem('zw_api_key') || '').replace(/[\s"'`]/g, '').trim();
            let rawText = '';

            // 1. Call User's Connected Gemini API Key
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
            }
            // 2. Call User's OpenAI / Groq Key if connected
            else if (rawKey.startsWith('sk-') || rawKey.startsWith('gsk_')) {
                try {
                    const isGroq = rawKey.startsWith('gsk_');
                    const url = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
                    const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${rawKey}` },
                        body: JSON.stringify({
                            model,
                            messages: [{ role: 'user', content: schemaPrompt }]
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        rawText = data.choices?.[0]?.message?.content || '';
                    }
                } catch (e) {}
            }

            // 3. Cloud AI Fallback
            if (!rawText) {
                try {
                    const res = await fetch('https://text.pollinations.ai/openai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'openai',
                            messages: [{ role: 'user', content: schemaPrompt }]
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        rawText = data.choices?.[0]?.message?.content || '';
                    }
                } catch (e) {}
            }

            // Parse & validate JSON choreography
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

            // 4. Deep Prompt-Specific Local Builder (Never repeats a generic story—builds from user's exact words!)
            return this.buildCustomScriptFromPromptWords(userPrompt);
        },

        buildCustomScriptFromPromptWords(promptText) {
            const p = (promptText || '').toLowerCase();
            const isForest = /(forest|tree|jungle|nature|park|garden|دارستان|باخچە)/i.test(p);
            const isSpace = /(space|planet|moon|rocket|galaxy|star|ئاسمان|ئەستێرە|مانگ)/i.test(p);
            const isDesert = /(desert|sand|camel|sun|بیابان)/i.test(p);
            const isBeach = /(beach|ocean|sea|water|دەریا|ئاو)/i.test(p);
            const isRoom = /(room|house|home|office|school|ماڵ|ژوور|قوتابخانە)/i.test(p);

            const setting = isForest ? 'forest' : isSpace ? 'space' : isDesert ? 'desert' : isBeach ? 'beach' : isRoom ? 'room' : 'night_city';
            const weather = isSpace ? 'stars' : /(rain|باران)/i.test(p) ? 'rain' : /(snow|بەفر)/i.test(p) ? 'snow' : /(fight|fire|war|robot|monster|شەڕ|ئاگر)/i.test(p) ? 'embers' : 'none';

            // Detect specific entities mentioned by the user
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

            // Fill remaining slots with custom humans tailored to user words
            if (entities.length === 0) {
                const isKing = /(king|prince|queen|پاشا|شازادە)/i.test(p);
                const isKid = /(kid|child|boy|girl|منداڵ|کوڕ|کچ)/i.test(p);
                entities.push({
                    id: 'e1',
                    kind: 'human',
                    name: 'Hero',
                    scale: 1.05,
                    primaryColor: isKing ? '#eab308' : '#3b82f6',
                    secondaryColor: '#1e293b',
                    hat: isKing ? 'crown' : 'none',
                    beard: /(old|man|پیاو|پیر)/i.test(p)
                });
                if (isKid || /(two|friend|enemy|thief|police|against|with|and|لەگەڵ|هاوڕێ|دز)/i.test(p)) {
                    entities.push({
                        id: 'e2',
                        kind: 'human',
                        name: 'Character 2',
                        scale: isKid ? 0.85 : 1.05,
                        primaryColor: '#ef4444',
                        secondaryColor: '#0f172a',
                        hat: /(police|پۆلیس)/i.test(p) ? 'police' : 'none'
                    });
                }
            }

            // Split the user's exact prompt into 3 sequential subtitles
            const words = promptText.trim().split(/\s+/);
            const chunk = Math.max(1, Math.ceil(words.length / 3));
            const s1 = words.slice(0, chunk).join(' ');
            const s2 = words.slice(chunk, chunk * 2).join(' ') || s1;
            const s3 = words.slice(chunk * 2).join(' ') || s2;

            const isFight = /(fight|battle|punch|attack|revenge|war|شەڕ|تۆڵە|لێدان)/i.test(p);

            return {
                setting,
                weather,
                mood: isFight ? 'action' : 'happy',
                entities,
                acts: [
                    {
                        title: 'Act 1',
                        subtitle: s1,
                        sound: 'footsteps',
                        actors: entities.map((ent, idx) => ({
                            id: ent.id,
                            startX: idx === 0 ? 0.15 : 0.85,
                            endX: idx === 0 ? 0.36 : 0.64,
                            startY: 0.82,
                            endY: 0.82,
                            facing: idx === 0 ? 1 : -1,
                            pose: 'walk',
                            expression: 'neutral',
                            holding: 'none',
                            speech: idx === 0 ? s1.slice(0, 22) : ''
                        }))
                    },
                    {
                        title: 'Act 2',
                        subtitle: s2,
                        sound: isFight ? 'laser' : 'speech',
                        actors: entities.map((ent, idx) => ({
                            id: ent.id,
                            startX: idx === 0 ? 0.36 : 0.64,
                            endX: idx === 0 ? 0.42 : 0.58,
                            startY: 0.82,
                            endY: 0.82,
                            facing: idx === 0 ? 1 : -1,
                            pose: isFight ? 'punch' : (idx === 1 ? 'point' : 'idle'),
                            expression: isFight ? 'angry' : 'shocked',
                            holding: isFight && idx === 0 ? 'sword' : 'none',
                            speech: idx === 1 ? s2.slice(0, 22) : ''
                        }))
                    },
                    {
                        title: 'Act 3',
                        subtitle: s3,
                        sound: isFight ? 'explosion' : 'laugh',
                        actors: entities.map((ent, idx) => ({
                            id: ent.id,
                            startX: idx === 0 ? 0.42 : 0.58,
                            endX: idx === 0 ? 0.48 : 0.72,
                            startY: 0.82,
                            endY: 0.82,
                            facing: idx === 0 ? 1 : -1,
                            pose: idx === 0 ? 'celebrate' : (isFight ? 'fall' : 'celebrate'),
                            expression: idx === 0 ? 'happy' : (isFight ? 'shocked' : 'laughing'),
                            holding: idx === 0 ? 'gold_bag' : 'none',
                            speech: idx === 0 ? s3.slice(0, 22) : ''
                        }))
                    }
                ]
            };
        },

        // =========================================================================
        // 5. REAL-TIME CANVAS CHARACTER ANIMATOR & SYNCHRONIZED WEBAUDIO SOUND ENGINE
        // =========================================================================
        renderAndRecordCanvasWithAudio(canvas, script, onFrameProgress) {
            return new Promise((resolve, reject) => {
                const isVertical = this.aspectRatio === '9:16';
                const width = isVertical ? 480 : 854;
                const height = isVertical ? 854 : 480;

                if (!canvas) {
                    canvas = document.createElement('canvas');
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {
                    return reject(new Error("Canvas recording is not supported on this browser."));
                }

                const fps = 30;
                const durationSec = 10;
                const totalFrames = fps * durationSec; // 300 frames
                const framesPerAct = totalFrames / 3;

                // --- SETUP REAL WEBAUDIO SOUND SYNTHESIZER & STREAM MIXER ---
                let audioCtx = null;
                let mixedStream = canvas.captureStream(fps);
                let soundControllers = null;

                try {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    audioCtx = new AudioCtx();
                    if (audioCtx.state === 'suspended') {
                        audioCtx.resume().catch(() => {});
                    }
                    const dest = audioCtx.createMediaStreamDestination();
                    const masterGain = audioCtx.createGain();
                    masterGain.gain.value = 0.25;
                    masterGain.connect(dest);
                    // Also route softly to speakers if user interacts so they can hear live sound!
                    masterGain.connect(audioCtx.destination);

                    // Continuous Background Mood Pad
                    const padOsc1 = audioCtx.createOscillator();
                    const padOsc2 = audioCtx.createOscillator();
                    const padGain = audioCtx.createGain();
                    padOsc1.type = 'sine';
                    padOsc2.type = 'triangle';
                    padOsc1.frequency.value = script.mood === 'action' ? 110 : (script.mood === 'sad' ? 130.81 : 146.83);
                    padOsc2.frequency.value = script.mood === 'action' ? 164.81 : (script.mood === 'sad' ? 155.56 : 220.0);
                    padGain.gain.value = 0.14;
                    padOsc1.connect(padGain);
                    padOsc2.connect(padGain);
                    padGain.connect(masterGain);
                    padOsc1.start();
                    padOsc2.start();

                    soundControllers = {
                        ctx: audioCtx,
                        master: masterGain,
                        pad1: padOsc1,
                        pad2: padOsc2,
                        playFootstep() {
                            const o = audioCtx.createOscillator();
                            const g = audioCtx.createGain();
                            o.type = 'sine';
                            o.frequency.setValueAtTime(115, audioCtx.currentTime);
                            o.frequency.exponentialRampToValueAtTime(42, audioCtx.currentTime + 0.08);
                            g.gain.setValueAtTime(0.35, audioCtx.currentTime);
                            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
                            o.connect(g);
                            g.connect(masterGain);
                            o.start();
                            o.stop(audioCtx.currentTime + 0.09);
                        },
                        playSpeechBlip(pitch = 260) {
                            const o = audioCtx.createOscillator();
                            const g = audioCtx.createGain();
                            o.type = 'triangle';
                            o.frequency.setValueAtTime(pitch + (Math.random() - 0.5) * 70, audioCtx.currentTime);
                            g.gain.setValueAtTime(0.22, audioCtx.currentTime);
                            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
                            o.connect(g);
                            g.connect(masterGain);
                            o.start();
                            o.stop(audioCtx.currentTime + 0.07);
                        },
                        playLaugh() {
                            const notes = [420, 380, 440, 360];
                            notes.forEach((f, idx) => {
                                const t0 = audioCtx.currentTime + idx * 0.09;
                                const o = audioCtx.createOscillator();
                                const g = audioCtx.createGain();
                                o.type = 'sine';
                                o.frequency.setValueAtTime(f, t0);
                                g.gain.setValueAtTime(0.28, t0);
                                g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07);
                                o.connect(g);
                                g.connect(masterGain);
                                o.start(t0);
                                o.stop(t0 + 0.08);
                            });
                        },
                        playExplosion() {
                            const bufferSize = audioCtx.sampleRate * 0.45;
                            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                            const data = buffer.getChannelData(0);
                            for (let i = 0; i < bufferSize; i++) {
                                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.14));
                            }
                            const noise = audioCtx.createBufferSource();
                            noise.buffer = buffer;
                            const filter = audioCtx.createBiquadFilter();
                            filter.type = 'lowpass';
                            filter.frequency.value = 320;
                            const g = audioCtx.createGain();
                            g.gain.setValueAtTime(0.65, audioCtx.currentTime);
                            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
                            noise.connect(filter);
                            filter.connect(g);
                            g.connect(masterGain);
                            noise.start();
                        },
                        playLaser() {
                            const o = audioCtx.createOscillator();
                            const g = audioCtx.createGain();
                            o.type = 'sawtooth';
                            o.frequency.setValueAtTime(880, audioCtx.currentTime);
                            o.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.18);
                            g.gain.setValueAtTime(0.28, audioCtx.currentTime);
                            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
                            o.connect(g);
                            g.connect(masterGain);
                            o.start();
                            o.stop(audioCtx.currentTime + 0.19);
                        },
                        stopAll() {
                            try {
                                padOsc1.stop();
                                padOsc2.stop();
                                audioCtx.close();
                            } catch (e) {}
                        }
                    };

                    const audioTrack = dest.stream.getAudioTracks()[0];
                    if (audioTrack) {
                        mixedStream.addTrack(audioTrack);
                    }
                } catch (audioErr) {
                    console.warn("WebAudio fallback:", audioErr);
                }

                const mimeTypes = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
                const chosenMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
                const recorder = chosenMime
                    ? new MediaRecorder(mixedStream, { mimeType: chosenMime, videoBitsPerSecond: 3000000 })
                    : new MediaRecorder(mixedStream);

                const chunks = [];
                recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
                recorder.onstop = () => {
                    if (soundControllers) soundControllers.stopAll();
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

                    const t = frame / fps; // 0.0 -> 10.0s
                    const actIdx = Math.min(2, Math.floor(frame / framesPerAct));
                    const localT = (frame % framesPerAct) / framesPerAct; // 0.0 -> 1.0 inside Act
                    const currentAct = script.acts[actIdx] || script.acts[0];

                    // Trigger Synchronized Sound Effects on specific frames
                    if (soundControllers) {
                        const snd = currentAct.sound || 'speech';
                        if (snd === 'footsteps' && frame % 12 === 0) soundControllers.playFootstep();
                        else if (snd === 'speech' && frame % 8 === 0) soundControllers.playSpeechBlip(actIdx === 1 ? 310 : 230);
                        else if (snd === 'laugh' && frame % 28 === 0) soundControllers.playLaugh();
                        else if (snd === 'laser' && frame % 14 === 0) soundControllers.playLaser();
                        else if (snd === 'explosion' && (frame % framesPerAct === 6)) soundControllers.playExplosion();
                        else if (snd === 'engine' && frame % 10 === 0) soundControllers.playFootstep();
                    }

                    // Draw Background Environment
                    this.drawEnvironmentStage(ctx, width, height, t, script.setting, script.weather);

                    // Draw & Animate Each Entity in Current Act
                    const entityMap = {};
                    (script.entities || []).forEach(e => { entityMap[e.id] = e; });

                    const actActors = currentAct.actors || [];
                    actActors.forEach((actorState, idx) => {
                        const meta = entityMap[actorState.id] || script.entities[idx] || { kind: 'human', primaryColor: '#3b82f6' };
                        const ease = localT * localT * (3 - 2 * localT);
                        const px = (actorState.startX + (actorState.endX - actorState.startX) * ease) * width;
                        const py = (actorState.startY + (actorState.endY - actorState.startY) * ease) * height;

                        this.drawAnimatedEntity(ctx, {
                            meta,
                            actor: actorState,
                            x: px,
                            y: py,
                            t,
                            localT,
                            frame
                        });
                    });

                    // Draw Explosion Effect if Act sound is explosion
                    if (currentAct.sound === 'explosion' && localT > 0.05 && localT < 0.75) {
                        const expProg = (localT - 0.05) / 0.7;
                        this.drawExplosionEffect(ctx, width * 0.55, height * 0.62, 135, expProg);
                    }

                    // Draw Cinematic Subtitle Bar
                    this.drawCinemaSubtitle(ctx, currentAct.subtitle, width, height);

                    // Act Transition Crossfade
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
        // 6. CANVAS 2D STAGE & ARTICULATED CHARACTER RENDERING FUNCTIONS
        // =========================================================================
        drawEnvironmentStage(ctx, w, h, t, setting, weather) {
            const groundY = h * 0.82;
            const sky = ctx.createLinearGradient(0, 0, 0, groundY);

            if (setting === 'forest') {
                sky.addColorStop(0, '#0c4a6e');
                sky.addColorStop(1, '#38bdf8');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY);

                // Sun
                ctx.fillStyle = '#fde047';
                ctx.beginPath();
                ctx.arc(w * 0.82, h * 0.18, 32, 0, Math.PI * 2);
                ctx.fill();

                // Layered Trees
                for (let i = 0; i < 9; i++) {
                    const tx = (i + 0.5) * (w / 9);
                    const th = 95 + (i % 3) * 28;
                    ctx.fillStyle = '#451a03';
                    ctx.fillRect(tx - 7, groundY - th * 0.45, 14, th * 0.45);
                    ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#166534';
                    ctx.beginPath();
                    ctx.arc(tx, groundY - th * 0.65, 36, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.fillStyle = '#14532d';
                ctx.fillRect(0, groundY, w, h - groundY);
            } else if (setting === 'space') {
                sky.addColorStop(0, '#02040a');
                sky.addColorStop(1, '#1e1038');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, h);

                // Planet
                const pg = ctx.createRadialGradient(w * 0.75, h * 0.28, 10, w * 0.75, h * 0.28, 65);
                pg.addColorStop(0, '#a855f7');
                pg.addColorStop(1, '#3b0764');
                ctx.fillStyle = pg;
                ctx.beginPath();
                ctx.arc(w * 0.75, h * 0.28, 62, 0, Math.PI * 2);
                ctx.fill();
            } else if (setting === 'desert') {
                sky.addColorStop(0, '#ea580c');
                sky.addColorStop(1, '#fde047');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY);
                ctx.fillStyle = '#d97706';
                ctx.fillRect(0, groundY, w, h - groundY);
            } else if (setting === 'beach') {
                sky.addColorStop(0, '#0284c7');
                sky.addColorStop(1, '#bae6fd');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY * 0.75);
                ctx.fillStyle = '#0369a1';
                ctx.fillRect(0, groundY * 0.75, w, groundY * 0.25);
                ctx.fillStyle = '#facc15';
                ctx.fillRect(0, groundY, w, h - groundY);
            } else if (setting === 'room') {
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(0, 0, w, groundY);
                // Window
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(w * 0.38, h * 0.2, w * 0.24, h * 0.28);
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 4;
                ctx.strokeRect(w * 0.38, h * 0.2, w * 0.24, h * 0.28);
                ctx.fillStyle = '#334155';
                ctx.fillRect(0, groundY, w, h - groundY);
            } else {
                // Night City / Street
                sky.addColorStop(0, '#060918');
                sky.addColorStop(1, '#1e1b4b');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY);

                const cols = 12;
                const bw = w / cols;
                for (let i = 0; i < cols; i++) {
                    const bh = h * (0.22 + ((i * 31) % 25) / 100);
                    ctx.fillStyle = '#0b0f1d';
                    ctx.fillRect(i * bw + 2, groundY - bh, bw - 4, bh);
                    ctx.fillStyle = 'rgba(253, 224, 71, 0.28)';
                    for (let wy = groundY - bh + 12; wy < groundY - 14; wy += 16) {
                        if ((i + wy) % 2 === 0) ctx.fillRect(i * bw + 8, wy, 5, 8);
                    }
                }
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(0, groundY, w, h - groundY);
            }

            // Weather / Particles
            if (weather && weather !== 'none') {
                const count = 45;
                for (let i = 0; i < count; i++) {
                    const sx = (i * 173 + (weather === 'rain' ? -t * 120 : 0) + w * 10) % w;
                    const sy = (i * 97 + (weather === 'embers' ? -t * 110 : t * 160) + h * 10) % h;
                    ctx.fillStyle = weather === 'embers' ? '#f97316' : (weather === 'rain' ? '#38bdf8' : '#ffffff');
                    ctx.globalAlpha = 0.7;
                    ctx.beginPath();
                    if (weather === 'rain') {
                        ctx.rect(sx, sy, 2, 10);
                    } else {
                        ctx.arc(sx, sy, (i % 2) + 1.2, 0, Math.PI * 2);
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
                this.drawArticulatedRobot(ctx, x, y, scale, facing, pose, meta.primaryColor || '#3b82f6', meta.secondaryColor || '#38bdf8', t);
            } else if (kind === 'monster') {
                this.drawArticulatedMonster(ctx, x, y, scale, facing, pose, meta.primaryColor || '#15803d', meta.secondaryColor || '#ef4444', t);
            } else if (kind === 'car' || kind === 'rocket') {
                this.drawArticulatedVehicle(ctx, x, y, scale, facing, kind, meta.primaryColor || '#ef4444', t);
            } else if (kind === 'animal') {
                this.drawArticulatedAnimal(ctx, x, y, scale, facing, pose, meta.primaryColor || '#d97706', t);
            } else {
                this.drawArticulatedHuman(ctx, {
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

        // Fully Articulated Human Character with Walking Legs, Swinging Arms, Blinking & Lip-Sync
        drawArticulatedHuman(ctx, opts) {
            const { x, y, scale, facing, pose, expr, holding, shirtColor, pantsColor, hairColor, hat, beard, speech, t, frame } = opts;

            const isMoving = pose === 'walk' || pose === 'run';
            const freq = pose === 'run' ? 18 : 11;
            const legAngle = isMoving ? Math.sin(t * freq) * 0.55 : 0;
            const bounceY = isMoving ? Math.abs(Math.sin(t * freq)) * 6 : (pose === 'celebrate' ? Math.abs(Math.sin(t * 10)) * 14 : 0);
            const laughShake = expr === 'laughing' ? Math.sin(t * 28) * 3 : 0;

            ctx.save();
            ctx.translate(x, y - bounceY);
            if (pose === 'fall') {
                ctx.rotate(facing * 1.15);
            }
            ctx.scale(scale * facing, scale);

            // Animated Left & Right Legs
            ctx.strokeStyle = pantsColor;
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';

            ctx.save();
            ctx.translate(-6, -54);
            ctx.rotate(legAngle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 52);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(6, -54);
            ctx.rotate(-legAngle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 52);
            ctx.stroke();
            ctx.restore();

            // Torso
            ctx.fillStyle = shirtColor;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(-18, -112 + laughShake, 36, 60, 10) : ctx.fillRect(-18, -112 + laughShake, 36, 60);
            ctx.fill();

            // Articulated Arms
            ctx.strokeStyle = '#fcd34d';
            ctx.lineWidth = 8;
            ctx.beginPath();
            if (pose === 'beg' || pose === 'point') {
                ctx.moveTo(12, -100);
                ctx.lineTo(44, -90 + Math.sin(t * 8) * 4);
            } else if (pose === 'punch') {
                const jab = Math.max(0, Math.sin(t * 16)) * 26;
                ctx.moveTo(12, -100);
                ctx.lineTo(36 + jab, -100);
            } else if (pose === 'celebrate') {
                ctx.moveTo(-14, -102);
                ctx.lineTo(-32, -145 + Math.sin(t * 14) * 6);
                ctx.moveTo(14, -102);
                ctx.lineTo(32, -145 - Math.sin(t * 14) * 6);
            } else {
                const armSwing = isMoving ? Math.sin(t * freq) * 16 : Math.sin(t * 3) * 3;
                ctx.moveTo(-14, -100);
                ctx.lineTo(-18 - armSwing, -60);
                ctx.moveTo(14, -100);
                ctx.lineTo(18 + armSwing, -60);
            }
            ctx.stroke();

            // Held Prop
            if (holding === 'money') {
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(36, -100, 22, 12);
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
                ctx.lineTo(78, -125);
                ctx.stroke();
            } else if (holding === 'phone') {
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(36, -102, 10, 16);
            }

            // Head
            ctx.fillStyle = '#fcd34d';
            ctx.beginPath();
            ctx.arc(0, -134 + laughShake, 21, 0, Math.PI * 2);
            ctx.fill();

            // Hair or Hat
            if (hat === 'crown') {
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.moveTo(-16, -150);
                ctx.lineTo(-10, -168);
                ctx.lineTo(0, -155);
                ctx.lineTo(10, -168);
                ctx.lineTo(16, -150);
                ctx.closePath();
                ctx.fill();
            } else if (hat === 'police') {
                ctx.fillStyle = '#1d4ed8';
                ctx.fillRect(-20, -156, 40, 10);
                ctx.fillStyle = '#facc15';
                ctx.fillRect(-4, -154, 8, 5);
            } else {
                ctx.fillStyle = hairColor;
                ctx.beginPath();
                ctx.arc(0, -138 + laughShake, 21, Math.PI, Math.PI * 2);
                ctx.fill();
            }

            if (beard) {
                ctx.fillStyle = hairColor;
                ctx.beginPath();
                ctx.arc(2, -126 + laughShake, 14, 0, Math.PI);
                ctx.fill();
            }

            // Blinking Eye
            const isBlinking = (frame % 75) < 4;
            ctx.fillStyle = '#0f172a';
            if (isBlinking) {
                ctx.fillRect(4, -137 + laughShake, 7, 2);
            } else {
                ctx.beginPath();
                ctx.arc(7, -136 + laughShake, 2.7, 0, Math.PI * 2);
                ctx.fill();
            }

            // Animated Lip-Sync Mouth & Facial Expression
            const isSpeaking = speech && speech.length > 0;
            const mouthOpen = (isSpeaking || expr === 'laughing') ? (Math.abs(Math.sin(t * 22)) * 6 + 2) : 0;

            ctx.strokeStyle = '#0f172a';
            ctx.fillStyle = '#7f1d1d';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            if (mouthOpen > 0) {
                ctx.ellipse(7, -125 + laughShake, 5, mouthOpen, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (expr === 'happy') {
                ctx.arc(6, -128, 7, 0, Math.PI);
                ctx.stroke();
            } else if (expr === 'sad' || expr === 'angry') {
                ctx.arc(6, -120, 6, Math.PI, Math.PI * 2);
                ctx.stroke();
            } else if (expr === 'shocked') {
                ctx.arc(7, -125, 4.5, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.moveTo(2, -126);
                ctx.lineTo(12, -126);
                ctx.stroke();
            }

            ctx.restore();

            // Speech Bubble
            if (speech) {
                ctx.save();
                ctx.font = 'bold 13px Segoe UI, sans-serif';
                const tw = ctx.measureText(speech).width + 20;
                const bx = Math.min(ctx.canvas.width - tw - 10, Math.max(10, x - tw / 2));
                const by = Math.max(14, y - 192 * scale);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(bx, by, tw, 28, 10) : ctx.fillRect(bx, by, tw, 28);
                ctx.fill();
                ctx.fillStyle = '#0f172a';
                ctx.textAlign = 'center';
                ctx.fillText(speech, bx + tw / 2, by + 18);
                ctx.restore();
            }
        },

        drawArticulatedRobot(ctx, x, y, scale, facing, pose, color, eyeColor, t) {
            const stride = pose === 'walk' || pose === 'run' ? Math.sin(t * 10) * 14 : 0;
            ctx.save();
            ctx.translate(x, y - Math.abs(stride) * 0.3);
            ctx.scale(scale * facing, scale);

            ctx.fillStyle = '#334155';
            ctx.fillRect(-32 + stride, -75, 22, 75);
            ctx.fillRect(10 - stride, -75, 22, 75);

            ctx.fillStyle = color;
            ctx.fillRect(-44, -162, 88, 90);

            ctx.fillStyle = '#475569';
            ctx.fillRect(-22, -198, 44, 34);
            ctx.fillStyle = eyeColor;
            ctx.fillRect(-12, -186, 30, 8);
            ctx.restore();

            if (pose === 'punch') {
                ctx.save();
                ctx.strokeStyle = eyeColor;
                ctx.lineWidth = 7;
                ctx.beginPath();
                ctx.moveTo(x + facing * 20 * scale, y - 182 * scale);
                ctx.lineTo(x + facing * 260 * scale, y - 150 * scale);
                ctx.stroke();
                ctx.restore();
            }
        },

        drawArticulatedMonster(ctx, x, y, scale, facing, pose, color, accent, t) {
            const stomp = Math.sin(t * 9) * 8;
            ctx.save();
            ctx.translate(x, y - Math.abs(stomp));
            ctx.scale(scale * facing, scale);

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-42, 0);
            ctx.lineTo(-32, -175);
            ctx.lineTo(18, -198);
            ctx.lineTo(44, -135);
            ctx.lineTo(38, 0);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.arc(16, -172, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        },

        drawArticulatedVehicle(ctx, x, y, scale, facing, kind, color, t) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale * facing, scale);
            if (kind === 'rocket') {
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.moveTo(-14, 0);
                ctx.lineTo(0, 36 + Math.random() * 14);
                ctx.lineTo(14, 0);
                ctx.fill();
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(0, -92);
                ctx.lineTo(22, -42);
                ctx.lineTo(22, 0);
                ctx.lineTo(-22, 0);
                ctx.lineTo(-22, -42);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillStyle = color;
                ctx.fillRect(-52, -36, 104, 24);
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(-28, -54, 54, 20);
                ctx.fillStyle = '#020617';
                ctx.beginPath();
                ctx.arc(-30, -10, 12, 0, Math.PI * 2);
                ctx.arc(30, -10, 12, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        },

        drawArticulatedAnimal(ctx, x, y, scale, facing, pose, color, t) {
            const hop = Math.abs(Math.sin(t * 12)) * 10;
            ctx.save();
            ctx.translate(x, y - hop);
            ctx.scale(scale * facing, scale);
            ctx.fillStyle = color;
            ctx.fillRect(-28, -42, 56, 26);
            ctx.fillRect(-24, -16, 8, 16);
            ctx.fillRect(16, -16, 8, 16);
            ctx.beginPath();
            ctx.arc(30, -44, 15, 0, Math.PI * 2);
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

            ctx.fillStyle = 'rgba(0,0,0,0.78)';
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(w * 0.06, boxY, w * 0.88, boxH, 10) : ctx.fillRect(w * 0.06, boxY, w * 0.88, boxH);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            show.forEach((ln, idx) => {
                ctx.fillText(ln, w / 2, boxY + 22 + idx * 24);
            });
            ctx.restore();
        },

        renderCompletedVideoPlayer(cardWrap, videoUrl, promptText, ext, script) {
            const fileName = `zoneweb-animated-video.${ext}`;
            window.__lastGeneratedVideoUrl = videoUrl;
            window.__lastGeneratedVideoPrompt = promptText;

            cardWrap.innerHTML = `
                <div class="w-full max-w-[94%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            ${this.getCustomLogoSvg(18)}
                            <span class="text-xs md:text-sm font-extrabold text-white">Animated Canvas Video Ready</span>
                        </div>
                        <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">10.0s • WITH SOUND</span>
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
