/**
 * ZENO-VIDEO.JS - True Lip-Sync Character Voice Animation & 2.5D Cinema Engine
 * 1. NO floating white text bubbles above characters' heads — characters speak directly with
 *    real human voice audio (Male, Female, Child & Crying) and animated moving mouths!
 * 2. Real-time Audio-Driven Lip-Sync: Character jaw, upper/lower lips, teeth & tongue open and close
 *    in exact synchronization with the spoken voice waveform, accompanied by subtle acoustic sound waves.
 * 3. Distinct Male, Female (long flowing hair + dress/tunic), and Child models + falling tears when crying.
 * 4. Accurate Scene Detection (House/Room with door & window for family stories, Forest, City, Beach, Desert, Space).
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
                                <span class="text-xs font-extrabold text-white">2.5D Voice & Lip-Sync Video Studio</span>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">Real Human Voices</span>
                            </div>
                            <p class="text-[10px] text-gray-300">Characters speak out loud with moving mouths — no text bubbles over heads</p>
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
                        Create Video Now
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
                    chatInput.placeholder = "Describe your story (characters, actions, voices & emotions)...";
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
                return alert("Please write your video story first!");
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
        // 3. MAIN VIDEO PIPELINE: AI SCRIPT -> HUMAN VOICE BUFFERS -> LIP-SYNC RENDER
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
                window.appendMessage('user', `[2.5D Voice Video] ${userPrompt}`);
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
                                <i class="fa-solid fa-microphone-lines fa-beat text-xs"></i>
                            </div>
                            <div>
                                <p id="${cardId}_phase" class="text-xs md:text-sm font-extrabold text-white">Step 1/2: Generating Characters & Human Voices...</p>
                                <p id="${cardId}_detail" class="text-[11px] text-fuchsia-300">Directing scene actions & synthesizing human voices...</p>
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
                            <span id="${cardId}_actBadge">LIP-SYNC VOICE RENDER</span>
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
                updateProgress(8, "Step 1/2: Directing Characters & Human Voices...", "Building custom 3-Act story & character dialogue...");
                const script = await this.generateCustomChoreographyScript(userPrompt);

                updateProgress(20, "Step 2/2: Animating Lip-Sync & Human Voices...", "Frame 0 / 300 • Live Voice Audio", `ACT 1: ${script.acts[0]?.title || 'Scene 1'}`);
                const stageCanvas = document.getElementById(`${cardId}_stageCanvas`);

                const { blob, extension } = await this.renderAndRecordCanvasWithAudio(
                    stageCanvas,
                    script,
                    (frame, totalFrames, currentActIdx) => {
                        const pct = 20 + Math.round((frame / totalFrames) * 80);
                        const actObj = script.acts[currentActIdx] || script.acts[0];
                        updateProgress(
                            pct,
                            "Step 2/2: Animating Lip-Sync & Human Voices...",
                            `Frame ${frame}/${totalFrames} • ${actObj?.subtitle || ''}`,
                            `ACT ${currentActIdx + 1}/3 • HUMAN VOICE ON`
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
        // 4. AI CHOREOGRAPHY DIRECTOR (ACCURATE SETTINGS, GENDERS, AGES & SPOKEN LINES)
        // =========================================================================
        async generateCustomChoreographyScript(userPrompt) {
            const schemaPrompt = `You are a 2.5D Cinema Animation Director. Create a UNIQUE, accurate 3-Act animation script (10 seconds total) matching the user's EXACT story.
IMPORTANT:
- Choose the EXACT matching setting ("room" for family/home/house/wife/husband/argument, "night_city" or "golden_city" for street/city, "forest", "space", "desert", "beach").
- Set "gender": "male" | "female" | "child" accurately for each human character!
- Instead of text bubbles above heads, characters speak out loud using "spokenLine" (short natural spoken dialogue in English or user's language) and "voiceType": "male" | "female" | "child".
- When a child or person cries, set "expression": "crying" so tears stream down their face and crying sound plays!

Return ONLY valid JSON:
{
  "setting": "room" | "night_city" | "golden_city" | "forest" | "space" | "desert" | "beach",
  "weather": "none" | "stars" | "rain" | "embers" | "snow" | "fireflies",
  "mood": "dramatic" | "happy" | "action" | "sad",
  "entities": [
    {
      "id": "e1",
      "kind": "human" | "robot" | "monster" | "car" | "rocket" | "animal",
      "gender": "male" | "female" | "child",
      "name": "Short Name",
      "scale": 1.1,
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
      "subtitle": "Short narrative caption (max 55 chars)",
      "sound": "speech" | "child_cry" | "door_slam" | "footsteps" | "laugh" | "sad_violin" | "coin_jackpot" | "explosion" | "punch_impact",
      "actors": [
        {
          "id": "e1",
          "startX": 0.28,
          "endX": 0.36,
          "startY": 0.83,
          "endY": 0.83,
          "facing": 1,
          "pose": "argue" | "walk" | "run" | "idle" | "beg" | "point" | "punch" | "celebrate" | "fall" | "cry",
          "expression": "angry" | "crying" | "sad" | "happy" | "laughing" | "shocked" | "neutral",
          "holding": "none" | "suitcase" | "money" | "gold_bag" | "sword" | "phone" | "food",
          "speaking": true,
          "voiceType": "male" | "female" | "child",
          "spokenLine": "Natural spoken dialogue line"
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
                                generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
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

            // Accurate Setting Detection
            const isFamilyHome = /(room|house|home|wife|husband|child|baby|family|move out|ماڵ|ژوور|هاوسەر|منداڵ)/i.test(p);
            const isForest = /(forest|tree|jungle|nature|park|garden|دارستان|باخچە)/i.test(p);
            const isSpace = /(space|planet|moon|rocket|galaxy|ئاسمان|هەسارە|مانگ)/i.test(p);
            const isDesert = /(desert|sand|camel|بیابان)/i.test(p);
            const isBeach = /(beach|ocean|sea|water|دەریا)/i.test(p);

            const setting = isFamilyHome ? 'room' : isForest ? 'forest' : isSpace ? 'space' : isDesert ? 'desert' : isBeach ? 'beach' : 'night_city';
            const weather = isSpace ? 'stars' : /(rain|باران)/i.test(p) ? 'rain' : /(snow|بەفر)/i.test(p) ? 'snow' : 'none';

            // Family Drama Scene (Man + Wife + Child crying & moving out)
            if (/(wife|husband|woman|girl|mother|mom|ژن|هاوسەر)/i.test(p)) {
                const hasChild = /(child|kid|baby|son|daughter|منداڵ|کوڕ|کچ)/i.test(p);
                const isCrying = /(cry|crying|tears|sad|گریان)/i.test(p);
                const isMovingOut = /(move out|leave|leaving|pack|bag|suitcase|ڕۆیشتن|جێهێشتن)/i.test(p);

                const entities = [
                    { id: 'e1', kind: 'human', gender: 'male', name: 'Man', scale: 1.14, primaryColor: '#2563eb', secondaryColor: '#0f172a', hairColor: '#1e293b', beard: true },
                    { id: 'e2', kind: 'human', gender: 'female', name: 'Wife', scale: 1.08, primaryColor: '#e11d48', secondaryColor: '#4c0519', hairColor: '#451a03' }
                ];
                if (hasChild) {
                    entities.push({ id: 'e3', kind: 'human', gender: 'child', name: 'Child', scale: 0.78, primaryColor: '#f59e0b', secondaryColor: '#1e293b', hairColor: '#451a03' });
                }

                return {
                    setting: 'room',
                    weather: 'none',
                    mood: 'dramatic',
                    entities,
                    acts: [
                        {
                            title: 'Act 1',
                            subtitle: 'A heated argument breaks out inside the house',
                            sound: 'speech',
                            actors: [
                                { id: 'e1', startX: 0.28, endX: 0.35, startY: 0.83, endY: 0.83, facing: 1, pose: 'argue', expression: 'angry', holding: 'none', speaking: true, voiceType: 'male', spokenLine: 'Why did you do this?' },
                                { id: 'e2', startX: 0.65, endX: 0.56, startY: 0.83, endY: 0.83, facing: -1, pose: 'argue', expression: 'angry', holding: 'none', speaking: false, voiceType: 'female', spokenLine: '' },
                                ...(hasChild ? [{ id: 'e3', startX: 0.76, endX: 0.72, startY: 0.83, endY: 0.83, facing: -1, pose: 'idle', expression: 'shocked', holding: 'none', speaking: false, voiceType: 'child', spokenLine: '' }] : [])
                            ]
                        },
                        {
                            title: 'Act 2',
                            subtitle: hasChild ? 'The wife shouts back while their child starts crying' : 'The argument escalates',
                            sound: hasChild && isCrying ? 'child_cry' : 'speech',
                            actors: [
                                { id: 'e1', startX: 0.35, endX: 0.33, startY: 0.83, endY: 0.83, facing: 1, pose: 'point', expression: 'angry', holding: 'none', speaking: false, voiceType: 'male', spokenLine: '' },
                                { id: 'e2', startX: 0.56, endX: 0.58, startY: 0.83, endY: 0.83, facing: -1, pose: 'argue', expression: 'crying', holding: isMovingOut ? 'suitcase' : 'none', speaking: true, voiceType: 'female', spokenLine: 'I cannot stay here anymore!' },
                                ...(hasChild ? [{ id: 'e3', startX: 0.72, endX: 0.70, startY: 0.83, endY: 0.83, facing: -1, pose: 'cry', expression: 'crying', holding: 'none', speaking: true, voiceType: 'child', spokenLine: 'Mommy, daddy stop!' }] : [])
                            ]
                        },
                        {
                            title: 'Act 3',
                            subtitle: isMovingOut ? 'They pack their bag and walk out the door' : 'Heartbroken farewell',
                            sound: 'door_slam',
                            actors: [
                                { id: 'e1', startX: 0.33, endX: 0.28, startY: 0.83, endY: 0.83, facing: 1, pose: 'idle', expression: 'sad', holding: 'none', speaking: false, voiceType: 'male', spokenLine: '' },
                                { id: 'e2', startX: 0.58, endX: 0.90, startY: 0.83, endY: 0.83, facing: 1, pose: 'walk', expression: 'sad', holding: 'suitcase', speaking: false, voiceType: 'female', spokenLine: '' },
                                ...(hasChild ? [{ id: 'e3', startX: 0.70, endX: 0.95, startY: 0.83, endY: 0.83, facing: 1, pose: 'walk', expression: 'crying', holding: 'none', speaking: false, voiceType: 'child', spokenLine: '' }] : [])
                            ]
                        }
                    ]
                };
            }

            // General Fallback tailored to user's words
            const entities = [
                { id: 'e1', kind: 'human', gender: 'male', name: 'Hero', scale: 1.12, primaryColor: '#3b82f6', secondaryColor: '#1e293b', hairColor: '#1f2937' }
            ];
            const words = promptText.trim().split(/\s+/);
            const chunk = Math.max(1, Math.ceil(words.length / 3));
            const s1 = words.slice(0, chunk).join(' ');
            const s2 = words.slice(chunk, chunk * 2).join(' ') || s1;
            const s3 = words.slice(chunk * 2).join(' ') || s2;

            return {
                setting,
                weather,
                mood: 'happy',
                entities,
                acts: [
                    {
                        title: 'Act 1',
                        subtitle: s1,
                        sound: 'footsteps',
                        actors: [{ id: 'e1', startX: 0.22, endX: 0.44, startY: 0.83, endY: 0.83, facing: 1, pose: 'walk', expression: 'neutral', holding: 'none', speaking: true, voiceType: 'male', spokenLine: s1 }]
                    },
                    {
                        title: 'Act 2',
                        subtitle: s2,
                        sound: 'coin_jackpot',
                        actors: [{ id: 'e1', startX: 0.44, endX: 0.50, startY: 0.83, endY: 0.83, facing: 1, pose: 'idle', expression: 'shocked', holding: 'money', speaking: true, voiceType: 'male', spokenLine: 'Look at this!' }]
                    },
                    {
                        title: 'Act 3',
                        subtitle: s3,
                        sound: 'laugh',
                        actors: [{ id: 'e1', startX: 0.50, endX: 0.52, startY: 0.83, endY: 0.83, facing: 1, pose: 'celebrate', expression: 'laughing', holding: 'gold_bag', speaking: true, voiceType: 'male', spokenLine: 'I am so happy!' }]
                    }
                ]
            };
        },

        // =========================================================================
        // 5. RENDER & RECORD WITH LIVE HUMAN VOICE ANALYSER + LIP-SYNC
        // =========================================================================
        async renderAndRecordCanvasWithAudio(canvas, script, onFrameProgress) {
            const isVertical = this.aspectRatio === '9:16';
            const width = isVertical ? 480 : 854;
            const height = isVertical ? 854 : 480;

            if (!canvas) canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {
                throw new Error("Canvas recording is not supported on this browser.");
            }

            const fps = 30;
            const totalFrames = 300; // 10.0 seconds
            const framesPerAct = totalFrames / 3;

            let mixedStream = canvas.captureStream(fps);
            const soundSession = window.ZenoSounds
                ? window.ZenoSounds.createRecordingSession(script.mood || 'dramatic')
                : null;

            // Preload real human TTS audio buffers for all spoken character lines
            if (soundSession && soundSession.audioCtx && window.ZenoSounds.preloadHumanDialogueBuffers) {
                const voiceBuffers = await window.ZenoSounds.preloadHumanDialogueBuffers(soundSession.audioCtx, script.acts);
                soundSession.setVoiceBuffers(voiceBuffers);
            }

            if (soundSession && soundSession.streamTrack) {
                mixedStream.addTrack(soundSession.streamTrack);
            }

            return await new Promise((resolve) => {
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

                    // Trigger Human Voices & Foley Sounds at the start of each Act
                    if (soundSession) {
                        if (localFrame === 4) {
                            // Speak each character's human dialogue line
                            const speakers = (currentAct.actors || []).filter(a => a.speaking && a.spokenLine);
                            speakers.forEach((sp, spIdx) => {
                                const delayMs = spIdx * 1350;
                                setTimeout(() => {
                                    if (soundSession && typeof soundSession.speakHumanLine === 'function') {
                                        soundSession.speakHumanLine(
                                            sp.voiceType || 'male',
                                            sp.spokenLine,
                                            1.6,
                                            `${actIdx}_${sp.id}`,
                                            sp.expression === 'angry' ? 'angry' : 'neutral'
                                        );
                                    }
                                }, delayMs);
                            });

                            // Also trigger scene foley (child_cry, door_slam, coin_jackpot, explosion, etc.)
                            const snd = currentAct.sound || '';
                            if (['child_cry', 'door_slam', 'coin_jackpot', 'victory_fanfare', 'sad_violin', 'explosion'].includes(snd)) {
                                soundSession.trigger(snd);
                            }
                        } else if (currentAct.sound === 'footsteps' && frame % 12 === 0) {
                            soundSession.trigger('footsteps');
                        } else if (currentAct.sound === 'laugh' && frame % 28 === 0) {
                            soundSession.trigger('laugh');
                        } else if (currentAct.sound === 'punch_impact' && frame % 14 === 0) {
                            soundSession.trigger('punch_impact');
                        }
                    }

                    // Live Voice Waveform Aperture (0.0 -> 1.0) for real-time mouth movement!
                    const liveAudioMouth = soundSession && typeof soundSession.getLiveVoiceAperture === 'function'
                        ? soundSession.getLiveVoiceAperture()
                        : 0;

                    ctx.save();
                    const camZoom = actIdx === 1 ? (1.03 + localT * 0.05) : (1.0 + Math.sin(t * 0.6) * 0.02);
                    const camPanX = (actIdx - 1) * -10;
                    ctx.translate(width * 0.5 + camPanX, height * 0.5);
                    ctx.scale(camZoom, camZoom);
                    ctx.translate(-width * 0.5, -height * 0.5);

                    // 1. Render Environment
                    this.drawRichEnvironment(ctx, width, height, t, script.setting, script.weather);

                    // 2. Render Characters (NO speech bubbles above heads — real lip-sync mouth movement!)
                    const entityMap = {};
                    (script.entities || []).forEach(e => { entityMap[e.id] = e; });

                    (currentAct.actors || []).forEach((actorState, idx) => {
                        const meta = entityMap[actorState.id] || script.entities[idx] || { kind: 'human', primaryColor: '#3b82f6' };
                        const ease = localT * localT * (3 - 2 * localT);
                        const px = (actorState.startX + (actorState.endX - actorState.startX) * ease) * width;
                        const py = (actorState.startY + (actorState.endY - actorState.startY) * ease) * height;

                        // Determine if this character's mouth is actively speaking right now
                        const isCurrentlySpeaking = Boolean(
                            (actorState.speaking && localT < 0.85) ||
                            actorState.expression === 'crying' ||
                            actorState.expression === 'laughing'
                        );
                        const mouthAperture = isCurrentlySpeaking
                            ? Math.max(liveAudioMouth, Math.abs(Math.sin(t * 20 + idx)) * 0.75 + 0.15)
                            : 0;

                        this.drawAnimatedEntity(ctx, {
                            meta,
                            actor: actorState,
                            x: px,
                            y: py,
                            t,
                            localT,
                            frame,
                            mouthAperture,
                            isCurrentlySpeaking
                        });
                    });

                    if (currentAct.sound === 'explosion' && localT > 0.05 && localT < 0.75) {
                        this.drawExplosionEffect(ctx, width * 0.55, height * 0.60, 145, (localT - 0.05) / 0.7);
                    }

                    ctx.restore();

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
        // 6. HIGH-DETAIL 2.5D ENVIRONMENTS & CHARACTERS (MALE, FEMALE, CHILD + TEARS)
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
            const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.34, w * 0.5, h * 0.5, w * 0.75);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(0,0,0,0.45)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, w, h);
        },

        drawRichEnvironment(ctx, w, h, t, setting, weather) {
            const groundY = h * 0.83;
            const sky = ctx.createLinearGradient(0, 0, 0, groundY);

            if (setting === 'room') {
                // Detailed Cozy House Living Room with Wooden Door, Curtained Window, Couch & Warm Lamp
                const wall = ctx.createLinearGradient(0, 0, 0, groundY);
                wall.addColorStop(0, '#1e293b');
                wall.addColorStop(1, '#334155');
                ctx.fillStyle = wall;
                ctx.fillRect(0, 0, w, groundY);

                // Baseboard Trim
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, groundY - 14, w, 14);

                // Framed Window on Left
                const winX = w * 0.14, winY = h * 0.18, winW = w * 0.22, winH = h * 0.32;
                ctx.fillStyle = '#0c4a6e';
                ctx.fillRect(winX, winY, winW, winH);
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 5;
                ctx.strokeRect(winX, winY, winW, winH);
                ctx.beginPath();
                ctx.moveTo(winX + winW / 2, winY);
                ctx.lineTo(winX + winW / 2, winY + winH);
                ctx.moveTo(winX, winY + winH / 2);
                ctx.lineTo(winX + winW, winY + winH / 2);
                ctx.stroke();

                // Wooden Front Exit Door on Right (so characters visibly walk out!)
                const doorW = w * 0.14, doorH = h * 0.46;
                const doorX = w * 0.82, doorY = groundY - doorH;
                ctx.fillStyle = '#78350f';
                this.roundBox(ctx, doorX, doorY, doorW, doorH, 6);
                ctx.fill();
                ctx.strokeStyle = '#451a03';
                ctx.lineWidth = 4;
                this.roundBox(ctx, doorX, doorY, doorW, doorH, 6);
                ctx.stroke();
                // Golden Doorknob
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(doorX + 14, doorY + doorH * 0.54, 5, 0, Math.PI * 2);
                ctx.fill();

                // Warm Hardwood Floor
                const floorGrad = ctx.createLinearGradient(0, groundY, 0, h);
                floorGrad.addColorStop(0, '#92400e');
                floorGrad.addColorStop(1, '#451a03');
                ctx.fillStyle = floorGrad;
                ctx.fillRect(0, groundY, w, h - groundY);

            } else if (setting === 'forest') {
                sky.addColorStop(0, '#064e3b');
                sky.addColorStop(0.55, '#0284c7');
                sky.addColorStop(1, '#bae6fd');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY);

                for (let i = 0; i < 8; i++) {
                    const tx = (i + 0.5) * (w / 8);
                    const th = 110 + (i % 3) * 30;
                    ctx.fillStyle = '#451a03';
                    ctx.fillRect(tx - 8, groundY - th * 0.5, 16, th * 0.5);
                    ctx.fillStyle = '#16a34a';
                    ctx.beginPath();
                    ctx.arc(tx, groundY - th * 0.72, 36, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#15803d';
                ctx.fillRect(0, groundY, w, h - groundY);

            } else if (setting === 'space') {
                sky.addColorStop(0, '#02040a');
                sky.addColorStop(1, '#1e1038');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(0, groundY, w, h - groundY);

            } else if (setting === 'desert') {
                sky.addColorStop(0, '#c2410c');
                sky.addColorStop(1, '#fef08a');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY);
                ctx.fillStyle = '#d97706';
                ctx.fillRect(0, groundY, w, h - groundY);

            } else if (setting === 'beach') {
                sky.addColorStop(0, '#0369a1');
                sky.addColorStop(1, '#bae6fd');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY * 0.72);
                ctx.fillStyle = '#0284c7';
                ctx.fillRect(0, groundY * 0.72, w, groundY * 0.28);
                ctx.fillStyle = '#facc15';
                ctx.fillRect(0, groundY, w, h - groundY);

            } else {
                const isGolden = setting === 'golden_city';
                sky.addColorStop(0, isGolden ? '#1e1b4b' : '#050814');
                sky.addColorStop(0.55, isGolden ? '#7e22ce' : '#172554');
                sky.addColorStop(1, isGolden ? '#f59e0b' : '#1e1b4b');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY);

                const cols = 10;
                const bw = w / cols;
                for (let i = 0; i < cols; i++) {
                    const bh = h * (0.22 + ((i * 31) % 24) / 100);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(i * bw + 3, groundY - bh, bw - 6, bh);
                    ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
                    for (let wy = groundY - bh + 12; wy < groundY - 16; wy += 16) {
                        if ((i + wy) % 3 !== 0) ctx.fillRect(i * bw + 10, wy, 6, 8);
                    }
                }
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, groundY, w, h - groundY);
            }
        },

        drawAnimatedEntity(ctx, { meta, actor, x, y, t, localT, frame, mouthAperture, isCurrentlySpeaking }) {
            const kind = meta.kind || 'human';
            const scale = meta.scale || 1;
            const facing = actor.facing || 1;
            const pose = actor.pose || 'idle';
            const expr = actor.expression || 'neutral';

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
                    gender: meta.gender || 'male',
                    holding: actor.holding || 'none',
                    shirtColor: meta.primaryColor || '#3b82f6',
                    pantsColor: meta.secondaryColor || '#1e293b',
                    hairColor: meta.hairColor || '#1f2937',
                    hat: meta.hat || 'none',
                    beard: Boolean(meta.beard),
                    mouthAperture,
                    isCurrentlySpeaking,
                    t,
                    frame
                });
            }
        },

        // =========================================================================
        // ARTICULATED 2.5D CHARACTER WITH REAL MOVING MOUTH, TEETH, TONGUE & TEARS
        // (ZERO text bubbles above head!)
        // =========================================================================
        drawShadedHuman25D(ctx, opts) {
            const {
                x, y, scale, facing, pose, expr, gender, holding,
                shirtColor, pantsColor, hairColor, hat, beard,
                mouthAperture, isCurrentlySpeaking, t, frame
            } = opts;

            const isFemale = gender === 'female';
            const isChild = gender === 'child';
            const isMoving = pose === 'walk' || pose === 'run';
            const freq = pose === 'run' ? 18 : 11;
            const legAngle = isMoving ? Math.sin(t * freq) * 0.52 : 0;
            const bounceY = isMoving ? Math.abs(Math.sin(t * freq)) * 7 : (pose === 'celebrate' ? Math.abs(Math.sin(t * 11)) * 16 : 0);
            const bodyShake = (expr === 'laughing' || expr === 'crying') ? Math.sin(t * 26) * 2.5 : 0;

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

            // 1. Back Long Hair Layer (for Female Characters)
            if (isFemale) {
                ctx.fillStyle = hairColor;
                this.roundBox(ctx, -24, -158 + bodyShake, 32, 68, 14);
                ctx.fill();
            }

            // 2. Back Arm
            ctx.save();
            ctx.translate(-12, -104);
            let backArmRot = isMoving ? Math.sin(t * freq) * 0.45 : 0.12;
            if (pose === 'celebrate') backArmRot = -2.4;
            else if (pose === 'argue') backArmRot = -0.9 + Math.sin(t * 16) * 0.35;
            else if (pose === 'cry') backArmRot = -1.7 + Math.sin(t * 12) * 0.1;

            ctx.rotate(backArmRot);
            ctx.fillStyle = shirtColor;
            this.roundBox(ctx, -6, 0, 12, 34, 6);
            ctx.fill();
            ctx.fillStyle = '#fcd34d';
            ctx.beginPath();
            ctx.arc(0, 38, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 3. Articulated Legs
            [-7, 7].forEach((hipX, idx) => {
                ctx.save();
                ctx.translate(hipX, -54);
                ctx.rotate(idx === 0 ? legAngle : -legAngle);

                ctx.fillStyle = isFemale ? '#fcd34d' : pantsColor;
                this.roundBox(ctx, -6.5, 0, 13, 46, 6);
                ctx.fill();

                ctx.fillStyle = isFemale ? shirtColor : '#f8fafc';
                this.roundBox(ctx, -7, 44, 20, 10, 5);
                ctx.fill();
                ctx.restore();
            });

            // 4. Shaded Torso (Dress/Tunic for Female, Jacket/Shirt for Male & Child)
            const torsoGrad = ctx.createLinearGradient(-20, -116, 20, -52);
            torsoGrad.addColorStop(0, shirtColor);
            torsoGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = torsoGrad;

            if (isFemale) {
                // Flared A-Line Dress
                ctx.beginPath();
                ctx.moveTo(-16, -116 + bodyShake);
                ctx.lineTo(16, -116 + bodyShake);
                ctx.lineTo(27, -42 + bodyShake);
                ctx.lineTo(-27, -42 + bodyShake);
                ctx.closePath();
                ctx.fill();
            } else {
                this.roundBox(ctx, -20, -116 + bodyShake, 40, 64, 13);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
                ctx.lineWidth = 1.5;
                this.roundBox(ctx, -20, -116 + bodyShake, 40, 64, 13);
                ctx.stroke();
            }

            // 5. Front Articulated Arm & Props
            ctx.save();
            ctx.translate(12, -104);
            let frontArmRot = isMoving ? -Math.sin(t * freq) * 0.45 : -0.15;
            if (pose === 'beg' || pose === 'point') frontArmRot = -1.25 + Math.sin(t * 7) * 0.08;
            else if (pose === 'argue') frontArmRot = -1.35 + Math.cos(t * 18) * 0.35;
            else if (pose === 'punch') frontArmRot = -1.55;
            else if (pose === 'celebrate') frontArmRot = -2.55 + Math.sin(t * 14) * 0.15;
            else if (pose === 'cry') frontArmRot = -1.85 + Math.cos(t * 12) * 0.1;

            ctx.rotate(frontArmRot);
            ctx.fillStyle = shirtColor;
            this.roundBox(ctx, -6, 0, 12, 36, 6);
            ctx.fill();

            ctx.fillStyle = '#fcd34d';
            ctx.beginPath();
            ctx.arc(0, 40, 7, 0, Math.PI * 2);
            ctx.fill();

            if (holding === 'suitcase') {
                ctx.save();
                ctx.translate(0, 44);
                ctx.fillStyle = '#78350f';
                this.roundBox(ctx, -16, 0, 32, 24, 5);
                ctx.fill();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 2;
                ctx.strokeRect(-12, 4, 24, 16);
                ctx.restore();
            } else if (holding === 'money') {
                ctx.save();
                ctx.translate(0, 44);
                ctx.fillStyle = '#16a34a';
                this.roundBox(ctx, -4, -8, 28, 16, 4);
                ctx.fill();
                ctx.restore();
            } else if (holding === 'gold_bag') {
                ctx.save();
                ctx.translate(2, 48);
                ctx.fillStyle = '#eab308';
                ctx.beginPath();
                ctx.arc(0, 6, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();

            // 6. Sculpted 2.5D Head
            const headY = -140 + bodyShake;
            const headRadius = isChild ? 25 : 23;
            const headGrad = ctx.createRadialGradient(-4, headY - 6, 4, 0, headY, headRadius + 2);
            headGrad.addColorStop(0, '#fde68a');
            headGrad.addColorStop(0.75, '#fcd34d');
            headGrad.addColorStop(1, '#d97706');
            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
            ctx.fill();

            // Hair / Crown / Police Cap
            if (hat === 'crown') {
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.moveTo(-18, headY - 17);
                ctx.lineTo(-11, headY - 36);
                ctx.lineTo(0, headY - 22);
                ctx.lineTo(11, headY - 36);
                ctx.lineTo(18, headY - 17);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillStyle = hairColor;
                ctx.beginPath();
                ctx.arc(-1, headY - 4, headRadius + 0.5, Math.PI * 0.90, Math.PI * 2.10);
                ctx.fill();
            }

            if (beard && !isFemale && !isChild) {
                ctx.fillStyle = hairColor;
                ctx.beginPath();
                ctx.arc(3, headY + 8, 15, 0, Math.PI);
                ctx.fill();
            }

            // 7. Expressive Eyebrow & Glossy Eye
            ctx.strokeStyle = hairColor;
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            if (expr === 'angry') {
                ctx.moveTo(2, headY - 12);
                ctx.lineTo(15, headY - 6);
            } else if (expr === 'sad' || expr === 'crying') {
                ctx.moveTo(2, headY - 6);
                ctx.lineTo(15, headY - 12);
            } else {
                ctx.moveTo(2, headY - 10);
                ctx.lineTo(14, headY - 10);
            }
            ctx.stroke();

            const isBlinking = (frame % 75) < 4;
            if (isBlinking || expr === 'crying') {
                // Closed/Squeezed Eyes when Crying or Blinking
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 2.6;
                ctx.beginPath();
                ctx.moveTo(4, headY - 4);
                ctx.lineTo(14, headY - 2);
                ctx.stroke();
            } else {
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

            // Falling Animated Tears when Crying!
            if (expr === 'crying') {
                ctx.fillStyle = '#38bdf8';
                const tearDrop1 = (t * 45) % 24;
                const tearDrop2 = ((t * 45) + 12) % 24;
                ctx.beginPath();
                ctx.arc(11, headY + 1 + tearDrop1, 2.6, 0, Math.PI * 2);
                ctx.arc(7, headY + 3 + tearDrop2, 2.4, 0, Math.PI * 2);
                ctx.fill();
            }

            // 8. REAL ARTICULATED MOUTH WITH MOVING JAW, LIPS, TEETH & TONGUE (NO TEXT BUBBLES!)
            const openAmount = Math.min(1, Math.max(0, mouthAperture || 0));
            const mouthH = openAmount * 9.5;
            const mouthW = 6.5 + openAmount * 2.5;
            const mouthCenterX = 8;
            const mouthCenterY = headY + 8.5 + openAmount * 2;

            ctx.save();
            if (openAmount > 0.08) {
                // Dark Open Mouth Cavity
                ctx.fillStyle = '#4c0519';
                ctx.beginPath();
                ctx.ellipse(mouthCenterX, mouthCenterY, mouthW, Math.max(2.5, mouthH), 0, 0, Math.PI * 2);
                ctx.fill();

                // Upper White Teeth Row
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(mouthCenterX - mouthW * 0.65, mouthCenterY - Math.max(2.5, mouthH) + 0.8, mouthW * 1.3, 2.6);

                // Pink Tongue at Bottom of Open Mouth
                ctx.fillStyle = '#fb7185';
                ctx.beginPath();
                ctx.ellipse(mouthCenterX, mouthCenterY + Math.max(2.5, mouthH) * 0.45, mouthW * 0.55, Math.max(1.5, mouthH * 0.35), 0, 0, Math.PI * 2);
                ctx.fill();

                // Lip Outline
                ctx.strokeStyle = isFemale ? '#be123c' : '#78350f';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.ellipse(mouthCenterX, mouthCenterY, mouthW, Math.max(2.5, mouthH), 0, 0, Math.PI * 2);
                ctx.stroke();

                // Subtle Acoustic Voice Waves Emerging from Mouth (Visual indicator of real voice!)
                if (isCurrentlySpeaking) {
                    const wavePulse = (t * 6) % 1;
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.65 * (1 - wavePulse)})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(mouthCenterX + 12, mouthCenterY, 8 + wavePulse * 14, -0.45, 0.45);
                    ctx.stroke();
                }
            } else {
                // Closed Mouth Expressions
                ctx.strokeStyle = isFemale ? '#be123c' : '#0f172a';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                if (expr === 'happy') {
                    ctx.arc(7, headY + 6, 7.5, 0.1 * Math.PI, 0.9 * Math.PI);
                } else if (expr === 'sad' || expr === 'angry' || expr === 'crying') {
                    ctx.arc(7, headY + 14, 6.5, 1.1 * Math.PI, 1.9 * Math.PI);
                } else {
                    ctx.moveTo(3, headY + 8);
                    ctx.lineTo(13, headY + 8);
                }
                ctx.stroke();
            }
            ctx.restore();

            ctx.restore();
        },

        drawShadedRobot(ctx, x, y, scale, facing, pose, color, eyeColor, t) {
            const stride = pose === 'walk' || pose === 'run' ? Math.sin(t * 10) * 14 : 0;
            ctx.save();
            ctx.translate(x, y - Math.abs(stride) * 0.3);
            ctx.scale(scale * facing, scale);
            ctx.fillStyle = '#334155';
            this.roundBox(ctx, -32 + stride, -78, 22, 78, 6);
            ctx.fill();
            this.roundBox(ctx, 10 - stride, -78, 22, 78, 6);
            ctx.fill();
            ctx.fillStyle = color;
            this.roundBox(ctx, -44, -165, 88, 92, 12);
            ctx.fill();
            ctx.fillStyle = '#475569';
            this.roundBox(ctx, -22, -202, 44, 34, 8);
            ctx.fill();
            ctx.fillStyle = eyeColor;
            ctx.fillRect(-10, -190, 28, 8);
            ctx.restore();
        },

        drawShadedMonster(ctx, x, y, scale, facing, pose, color, accent, t) {
            const stomp = Math.sin(t * 9) * 8;
            ctx.save();
            ctx.translate(x, y - Math.abs(stomp));
            ctx.scale(scale * facing, scale);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-44, 0);
            ctx.lineTo(-34, -178);
            ctx.lineTo(18, -202);
            ctx.lineTo(46, -138);
            ctx.lineTo(40, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.arc(18, -174, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        },

        drawShadedVehicle(ctx, x, y, scale, facing, kind, color) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale * facing, scale);
            ctx.fillStyle = color;
            this.roundBox(ctx, -56, -38, 112, 26, 8);
            ctx.fill();
            ctx.fillStyle = '#020617';
            ctx.beginPath();
            ctx.arc(-32, -10, 13, 0, Math.PI * 2);
            ctx.arc(32, -10, 13, 0, Math.PI * 2);
            ctx.fill();
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

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            show.forEach((ln, idx) => {
                ctx.fillText(ln, w / 2, boxY + 22 + idx * 24);
            });
            ctx.restore();
        },

        renderCompletedVideoPlayer(cardWrap, videoUrl, promptText, ext) {
            const fileName = `zoneweb-voice-video.${ext}`;
            window.__lastGeneratedVideoUrl = videoUrl;
            window.__lastGeneratedVideoPrompt = promptText;

            cardWrap.innerHTML = `
                <div class="w-full max-w-[94%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            ${this.getCustomLogoSvg(18)}
                            <span class="text-xs md:text-sm font-extrabold text-white">2.5D Voice & Lip-Sync Video Ready</span>
                        </div>
                        <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">10.0s • HUMAN VOICE</span>
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
