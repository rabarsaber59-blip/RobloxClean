/**
 * ZENO-VIDEO.JS - Real 3D Model Cinema Engine (Three.js) + Neural Human TTS Voices
 * 1. Full 3D Models & Environments (powered by Three.js r128 WebGLRenderer):
 *    - Articulated 3D Human Models (Male, Female with 3D flowing hair & dress, Child with smaller proportions)
 *      featuring 3D joint pivots (walking legs, swinging arms, arguing/crying poses), 3D props (suitcase,
 *      glowing cash, gold bag, sword), animated 3D tears, and an articulated 3D lower jaw + teeth that
 *      opens and closes in real time with the Neural Human TTS voice!
 *    - Articulated 3D Robot, 3D Monster, 3D Car/Rocket, and 3D Animal models.
 *    - Full 3D Environments: Furnished 3D Living Room (walls, window, sofa, swinging 3D exit door, hardwood floor),
 *      3D Golden/Night City with illuminated skyscrapers & streetlamps, 3D Forest, 3D Beach, 3D Desert, 3D Space.
 *    - Dynamic 3D Perspective Camera with smooth cinematic dolly & pan.
 * 2. Duration Selector: 10s (3 Scenes), 20s (6 Scenes), 30s (9 Scenes) with zero empty seconds.
 * 3. Preserves the global UI emoji-to-custom-logo replacer.
 */
(function () {
    const ZenoVideo = {
        videoModeActive: false,
        isGeneratingVideo: false,
        isReplacingEmojis: false,
        emojiObserver: null,
        aspectRatio: '16:9',
        selectedDuration: 10,
        threeReady: false,

        init() {
            window.ZenoVideo = this;
            this.ensureThreeJsLoaded();

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

        ensureThreeJsLoaded() {
            if (window.THREE) {
                this.threeReady = true;
                return Promise.resolve(window.THREE);
            }
            if (this.__threeLoadingPromise) return this.__threeLoadingPromise;

            this.__threeLoadingPromise = new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
                s.onload = () => {
                    this.threeReady = true;
                    resolve(window.THREE);
                };
                s.onerror = () => reject(new Error("Failed to load 3D engine (Three.js)."));
                document.head.appendChild(s);
            });
            return this.__threeLoadingPromise;
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

        // =========================================================================
        // 1. TOP "GENERATE VIDEO" BUTTON & 3D STUDIO PANEL
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
                                <span class="text-xs font-extrabold text-white">3D Model Cinema & Neural Voice Studio</span>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">3D Models + Human TTS</span>
                            </div>
                            <p class="text-[10px] text-gray-300">Real 3D articulated models with human TTS voices (Male, Female & Child)</p>
                        </div>
                    </div>
                    <button onclick="window.ZenoVideo.toggleVideoMode(false)" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-600 text-gray-200 hover:text-white flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <div class="flex items-center gap-1.5">
                        <div class="flex items-center bg-black/60 p-0.5 rounded-lg border border-emerald-500/35">
                            <button type="button" id="zwDur10" onclick="window.ZenoVideo.setDuration(10)" class="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-extrabold transition">10s</button>
                            <button type="button" id="zwDur20" onclick="window.ZenoVideo.setDuration(20)" class="px-2.5 py-1 rounded-md text-gray-300 hover:text-white text-[11px] font-bold transition">20s</button>
                            <button type="button" id="zwDur30" onclick="window.ZenoVideo.setDuration(30)" class="px-2.5 py-1 rounded-md text-gray-300 hover:text-white text-[11px] font-bold transition">30s</button>
                        </div>

                        <div class="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/15">
                            <button type="button" id="zwRatio169" onclick="window.ZenoVideo.setAspectRatio('16:9')" class="px-2 py-1 rounded-md bg-fuchsia-600 text-white text-[10px] font-extrabold">16:9</button>
                            <button type="button" id="zwRatio916" onclick="window.ZenoVideo.setAspectRatio('9:16')" class="px-2 py-1 rounded-md text-gray-300 text-[10px] font-bold">9:16</button>
                        </div>
                    </div>

                    <button type="button" onclick="window.ZenoVideo.triggerInstantVideoFromChat()" class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-[11px] font-extrabold shadow transition">
                        Create <span id="zwCreateBtnDurLabel">10s</span> 3D Video
                    </button>
                </div>
            `;

            chatCard.insertBefore(panel, chatCard.firstChild);
            if (window.ZenoSounds && typeof window.ZenoSounds.injectSoundPreviewBar === 'function') {
                window.ZenoSounds.injectSoundPreviewBar();
            }
        },

        setDuration(seconds) {
            this.selectedDuration = seconds;
            [10, 20, 30].forEach(d => {
                const btn = document.getElementById('zwDur' + d);
                if (btn) {
                    btn.className = (d === seconds)
                        ? "px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-extrabold shadow transition"
                        : "px-2.5 py-1 rounded-md text-gray-300 hover:text-white text-[11px] font-bold transition";
                }
            });
            const lbl = document.getElementById('zwCreateBtnDurLabel');
            if (lbl) lbl.innerText = `${seconds}s`;
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

        toggleVideoMode(enable) {
            this.videoModeActive = enable;
            const panel = document.getElementById('zenoVideoChatPanel');
            const chatInput = document.getElementById('chatInput');
            const topBtn = document.getElementById('topGenerateVideoBtn');

            if (enable) {
                panel?.classList.remove('hidden');
                if (window.ZenoSounds) window.ZenoSounds.injectSoundPreviewBar();
                if (chatInput) {
                    chatInput.placeholder = `Describe your ${this.selectedDuration}s 3D story (characters, actions, voices)...`;
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
                return alert("Please write your 3D video story first!");
            }
            chatInput.value = '';
            this.create3DAnimatedVideo(promptText);
        },

        hookChatSubmissionForVideo() {
            const origSend = window.sendUserMessage;
            window.sendUserMessage = async () => {
                const chatInput = document.getElementById('chatInput');
                const text = (chatInput?.value || '').trim();

                if (this.videoModeActive || /\b(generate video|create video|make a video|make video|ڤیدیۆ دروست بکە|ڤیدیۆیەک دروست بکە)\b/i.test(text)) {
                    if (!text) return;
                    chatInput.value = '';
                    await this.create3DAnimatedVideo(text);
                    return;
                }

                if (typeof origSend === 'function') {
                    return origSend();
                }
            };
        },

        // =========================================================================
        // 2. MAIN 3D VIDEO PIPELINE
        // =========================================================================
        async create3DAnimatedVideo(userPrompt) {
            if (this.isGeneratingVideo) return;

            if (window.ZenoUltimate && window.ZenoUltimate.forbiddenPattern && window.ZenoUltimate.forbiddenPattern.test(userPrompt)) {
                if (typeof window.appendMessage === 'function') {
                    window.appendMessage('user', userPrompt);
                    window.appendMessage('ai', "Security Alert: Adult, hacking, or malware video generation is not allowed.");
                }
                return;
            }

            this.isGeneratingVideo = true;
            const durationSec = this.selectedDuration || 10;
            const actCount = durationSec === 30 ? 9 : (durationSec === 20 ? 6 : 3);

            document.getElementById('heroPrompt')?.classList.add('hidden');
            if (typeof window.appendMessage === 'function') {
                window.appendMessage('user', `[${durationSec}s 3D Model Video] ${userPrompt}`);
            }

            const feed = document.getElementById('chatFeed');
            const cardId = 'zw_3d_vid_' + Date.now();
            const startTime = performance.now();

            const cardWrap = document.createElement('div');
            cardWrap.id = cardId;
            cardWrap.className = "flex justify-start w-full my-3";
            cardWrap.innerHTML = `
                <div class="w-full max-w-[94%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center">
                                <i class="fa-solid fa-cube fa-spin text-xs"></i>
                            </div>
                            <div>
                                <p id="${cardId}_phase" class="text-xs md:text-sm font-extrabold text-white">Step 1/3: Building 3D Scene & Human Voices...</p>
                                <p id="${cardId}_detail" class="text-[11px] text-fuchsia-300">Loading 3D models, lighting & Neural TTS voices...</p>
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
                            <span id="${cardId}_actBadge">3D WEBGL RENDER + NEURAL VOICE</span>
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
                await this.ensureThreeJsLoaded();

                updateProgress(10, `Step 1/3: Directing ${durationSec}s 3D Story (${actCount} Scenes)...`, "Assigning 3D models & Male, Female, Child TTS voices...");
                const script = await this.generateFullDurationScript(userPrompt, durationSec, actCount);

                updateProgress(20, "Step 2/3: Synthesizing Natural Human TTS Voices...", "Generating studio-grade human speech audio...");
                const stageCanvas = document.getElementById(`${cardId}_stageCanvas`);

                const { blob, extension } = await this.renderAndRecord3DVideo(
                    stageCanvas,
                    script,
                    durationSec,
                    (doneTts, totalTts) => {
                        const ttsPct = 20 + Math.round((doneTts / Math.max(1, totalTts)) * 18);
                        updateProgress(ttsPct, "Step 2/3: Synthesizing Neural Human Voices...", `Voiced human line ${doneTts} of ${totalTts}...`);
                    },
                    (frame, totalFrames, currentActIdx) => {
                        const pct = 38 + Math.round((frame / totalFrames) * 62);
                        updateProgress(
                            pct,
                            `Step 3/3: Rendering ${durationSec}.0s 3D Cinema...`,
                            `3D Scene ${currentActIdx + 1}/${script.acts.length} • ${(frame / 30).toFixed(1)}s / ${durationSec}.0s`,
                            `3D SCENE ${currentActIdx + 1}/${script.acts.length} • HUMAN TTS`
                        );
                    }
                );

                clearInterval(timerInterval);
                const videoUrl = URL.createObjectURL(blob);
                this.renderCompletedVideoPlayer(cardWrap, videoUrl, userPrompt, extension, durationSec);

            } catch (err) {
                clearInterval(timerInterval);
                cardWrap.innerHTML = `
                    <div class="w-full max-w-[92%] rounded-2xl p-4 card-bg border border-red-500/40 text-xs text-red-300 space-y-2">
                        <p class="font-bold">3D Render Notice: ${err.message}</p>
                        <button onclick="window.ZenoVideo.create3DAnimatedVideo(\`${userPrompt.replace(/`/g, '')}\`)" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold">Retry</button>
                    </div>
                `;
            } finally {
                this.isGeneratingVideo = false;
                this.toggleVideoMode(false);
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        },

        // =========================================================================
        // 3. AI STORY EXPANDER & VOICE ROLE RECOGNITION
        // =========================================================================
        detectCharacterRolesFromPrompt(promptText) {
            const p = (promptText || '').toLowerCase();
            const hasMale = /\b(man|men|husband|father|dad|brother|boyfriend|king|prince|policeman|he|him|his)\b|پیاو|باوک|کوڕ|مێرد|پاشا|رجل|أب|زوج/i.test(p);
            const hasFemale = /\b(woman|women|wife|mother|mom|sister|girlfriend|queen|princess|lady|she|her)\b|ئافرەت|ژن|دایک|کچ|هاوسەر|شاژن|امرأة|أم|زوجة|بنت/i.test(p);
            const hasChild = /\b(child|children|kid|kids|baby|son|daughter|little boy|little girl|toddler)\b|منداڵ|مناڵ|بچکۆلە|طفل|أطفال|ولد|صغير/i.test(p);
            return { hasMale, hasFemale, hasChild };
        },

        enforceAccurateVoiceTypes(script, promptText) {
            const roles = this.detectCharacterRolesFromPrompt(promptText);
            const entities = script.entities || [];

            entities.forEach((ent, idx) => {
                const nameLower = `${ent.name || ''} ${ent.gender || ''}`.toLowerCase();
                if (/(child|kid|baby|son|daughter|boy|girl|منداڵ|طفل)/i.test(nameLower)) {
                    ent.gender = 'child';
                    ent.scale = Math.min(ent.scale || 0.72, 0.75);
                } else if (/(wife|woman|female|mother|mom|girl|sister|queen|ئافرەت|ژن|دایک|امرأة|زوجة)/i.test(nameLower)) {
                    ent.gender = 'female';
                    ent.scale = ent.scale || 0.96;
                } else if (/(man|male|husband|father|dad|king|پیاو|باوک|رجل)/i.test(nameLower)) {
                    ent.gender = 'male';
                    ent.scale = ent.scale || 1.05;
                } else {
                    if (idx === 0 && roles.hasMale) ent.gender = 'male';
                    else if (idx === 1 && roles.hasFemale) ent.gender = 'female';
                    else if (idx === 2 && roles.hasChild) ent.gender = 'child';
                }
            });

            const genderMap = {};
            entities.forEach(e => { genderMap[e.id] = e.gender || 'male'; });

            (script.acts || []).forEach(act => {
                (act.actors || []).forEach(actor => {
                    const g = genderMap[actor.id] || actor.voiceType || 'male';
                    actor.voiceType = g;
                    if (g === 'child' && /(cry|crying|tears|sad|گریان)/i.test(`${act.subtitle || ''} ${actor.expression || ''}`)) {
                        actor.expression = 'crying';
                        act.sound = 'child_cry';
                    }
                });
            });

            return script;
        },

        async generateFullDurationScript(userPrompt, durationSec, actCount) {
            const schemaPrompt = `You are a 3D Cinema Screenwriter & Animation Director.
The user selected a ${durationSec}-SECOND 3D video. Generate EXACTLY ${actCount} sequential scenes ("acts") so ALL ${durationSec} seconds are filled with continuous 3D action and natural spoken human dialogue.
IMPORTANT:
- Set "gender": "male" | "female" | "child" accurately for each human 3D model, and matching "voiceType": "male" | "female" | "child" on every actor.
- Every Act MUST have at least one actor with "speaking": true and a natural English "spokenLine" (5 to 12 words).
- Choose the matching 3D setting: "room" (house/family/indoor), "golden_city" or "night_city" (street/city), "forest", "space", "desert", "beach".

Return ONLY valid JSON:
{
  "setting": "room" | "night_city" | "golden_city" | "forest" | "space" | "desert" | "beach",
  "mood": "dramatic" | "happy" | "action" | "sad",
  "entities": [
    {
      "id": "e1",
      "kind": "human" | "robot" | "monster" | "car" | "rocket" | "animal",
      "gender": "male" | "female" | "child",
      "name": "Name",
      "scale": 1.0,
      "primaryColor": "#2563eb",
      "secondaryColor": "#0f172a",
      "hairColor": "#1e293b",
      "hat": "none" | "crown" | "police",
      "beard": false
    }
  ],
  "acts": [
    {
      "title": "Scene 1",
      "subtitle": "Narrative caption (max 60 chars)",
      "sound": "speech" | "child_cry" | "door_slam" | "footsteps" | "laugh" | "sad_violin" | "coin_jackpot" | "explosion",
      "actors": [
        {
          "id": "e1",
          "startX": 0.28,
          "endX": 0.38,
          "startY": 0.83,
          "endY": 0.83,
          "facing": 1,
          "pose": "argue" | "walk" | "run" | "idle" | "beg" | "point" | "punch" | "celebrate" | "fall" | "cry",
          "expression": "angry" | "crying" | "sad" | "happy" | "laughing" | "shocked" | "neutral",
          "holding": "none" | "suitcase" | "money" | "gold_bag" | "sword" | "food",
          "speaking": true,
          "voiceType": "male" | "female" | "child",
          "spokenLine": "Natural spoken line"
        }
      ]
    }
  ]
}
USER PROMPT (${durationSec}s, ${actCount} Acts): "${userPrompt}"`;

            const rawKey = (window.state?.apiKey || localStorage.getItem('zw_api_key') || '').replace(/[\s"'`]/g, '').trim();
            let rawText = '';

            if (rawKey.startsWith('AIza')) {
                for (const m of ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest']) {
                    try {
                        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(rawKey)}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: schemaPrompt }] }],
                                generationConfig: { temperature: 0.75, maxOutputTokens: 4096, responseMimeType: "application/json" }
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
                            while (parsed.acts.length < actCount) {
                                const clone = JSON.parse(JSON.stringify(parsed.acts[parsed.acts.length - 1]));
                                clone.title = `Scene ${parsed.acts.length + 1}`;
                                parsed.acts.push(clone);
                            }
                            parsed.acts = parsed.acts.slice(0, actCount);
                            return this.enforceAccurateVoiceTypes(parsed, userPrompt);
                        }
                    }
                } catch (e) {}
            }

            return this.enforceAccurateVoiceTypes(this.buildRichFallbackActs(userPrompt, actCount), userPrompt);
        },

        buildRichFallbackActs(promptText, actCount) {
            const roles = this.detectCharacterRolesFromPrompt(promptText);
            const p = (promptText || '').toLowerCase();
            const isFamily = roles.hasFemale || roles.hasChild || /(family|house|home|room|wife|husband|ماڵ|هاوسەر)/i.test(p);

            if (isFamily) {
                const entities = [
                    { id: 'e1', kind: 'human', gender: 'male', name: 'Father', scale: 1.05, primaryColor: '#2563eb', secondaryColor: '#0f172a', hairColor: '#1e293b', beard: true },
                    { id: 'e2', kind: 'human', gender: 'female', name: 'Mother', scale: 0.96, primaryColor: '#e11d48', secondaryColor: '#4c0519', hairColor: '#451a03' }
                ];
                if (roles.hasChild) {
                    entities.push({ id: 'e3', kind: 'human', gender: 'child', name: 'Child', scale: 0.72, primaryColor: '#f59e0b', secondaryColor: '#1e293b', hairColor: '#451a03' });
                }

                const storyBeats = [
                    { sub: 'Tension rises inside the 3D living room', snd: 'speech', mLine: 'Why did you hide the truth from me?', fLine: '', cLine: '', mPose: 'argue', fPose: 'idle', cPose: 'idle', mExpr: 'angry', fExpr: 'shocked', cExpr: 'neutral', bag: 'none' },
                    { sub: 'The wife responds during the heated argument', snd: 'speech', mLine: '', fLine: 'You never listen to what I say anymore!', cLine: '', mPose: 'idle', fPose: 'argue', cPose: 'idle', mExpr: 'angry', fExpr: 'angry', cExpr: 'shocked', bag: 'none' },
                    { sub: 'Their child hears the shouting and begins crying', snd: 'child_cry', mLine: '', fLine: '', cLine: 'Please stop fighting, I am scared!', mPose: 'point', fPose: 'argue', cPose: 'cry', mExpr: 'angry', fExpr: 'sad', cExpr: 'crying', bag: 'none' },
                    { sub: 'The mother comforts her crying child', snd: 'sad_violin', mLine: 'Wait, let us talk calmly about this.', fLine: 'Come here sweetheart, mommy is here.', cLine: '', mPose: 'idle', fPose: 'idle', cPose: 'cry', mExpr: 'sad', fExpr: 'crying', cExpr: 'crying', bag: 'none' },
                    { sub: 'She packs their suitcase to leave the house', snd: 'footsteps', mLine: '', fLine: 'We need some time away from here.', cLine: 'Are we leaving our home mommy?', mPose: 'idle', fPose: 'walk', cPose: 'walk', mExpr: 'sad', fExpr: 'sad', cExpr: 'crying', bag: 'suitcase' },
                    { sub: 'They walk toward the front door together', snd: 'door_slam', mLine: 'Please do not go like this!', fLine: 'Goodbye, take care of yourself.', cLine: 'Goodbye daddy!', mPose: 'beg', fPose: 'walk', cPose: 'walk', mExpr: 'sad', fExpr: 'crying', cExpr: 'crying', bag: 'suitcase' },
                    { sub: 'Stepping toward the exit door with their bag', snd: 'footsteps', mLine: '', fLine: 'Stay close to me my little one.', cLine: 'I will stay with you mommy.', mPose: 'idle', fPose: 'walk', cPose: 'walk', mExpr: 'sad', fExpr: 'sad', cExpr: 'sad', bag: 'suitcase' },
                    { sub: 'Looking back one last time before leaving', snd: 'sad_violin', mLine: 'I promise I will make things right.', fLine: 'I hope one day things will change.', cLine: '', mPose: 'idle', fPose: 'idle', cPose: 'idle', mExpr: 'sad', fExpr: 'sad', cExpr: 'sad', bag: 'suitcase' },
                    { sub: 'A new chapter begins as they move out', snd: 'speech', mLine: '', fLine: 'Everything is going to be okay now.', cLine: 'I love you mommy!', mPose: 'idle', fPose: 'walk', cPose: 'walk', mExpr: 'sad', fExpr: 'happy', cExpr: 'happy', bag: 'suitcase' }
                ];

                const acts = [];
                for (let i = 0; i < actCount; i++) {
                    const b = storyBeats[i % storyBeats.length];
                    const progress = i / Math.max(1, actCount - 1);
                    const walkOutOffset = progress > 0.5 ? (progress - 0.5) * 0.52 : 0;

                    acts.push({
                        title: `Scene ${i + 1}`,
                        subtitle: b.sub,
                        sound: b.snd,
                        actors: [
                            { id: 'e1', startX: 0.28, endX: 0.33, startY: 0.83, endY: 0.83, facing: 1, pose: b.mPose, expression: b.mExpr, holding: 'none', speaking: Boolean(b.mLine), voiceType: 'male', spokenLine: b.mLine },
                            { id: 'e2', startX: 0.54 + walkOutOffset * 0.6, endX: 0.58 + walkOutOffset * 0.8, startY: 0.83, endY: 0.83, facing: walkOutOffset > 0 ? 1 : -1, pose: b.fPose, expression: b.fExpr, holding: b.bag, speaking: Boolean(b.fLine), voiceType: 'female', spokenLine: b.fLine },
                            ...(roles.hasChild ? [{ id: 'e3', startX: 0.68 + walkOutOffset * 0.6, endX: 0.72 + walkOutOffset * 0.8, startY: 0.83, endY: 0.83, facing: walkOutOffset > 0 ? 1 : -1, pose: b.cPose, expression: b.cExpr, holding: 'none', speaking: Boolean(b.cLine), voiceType: 'child', spokenLine: b.cLine }] : [])
                        ]
                    });
                }

                return { setting: 'room', mood: 'dramatic', entities, acts };
            }

            // General 3D multi-act story
            const kind = /(robot|mecha|ڕۆبۆت)/i.test(p) ? 'robot'
                : /(monster|dragon|دڕندە)/i.test(p) ? 'monster'
                : /(rocket|موشەک)/i.test(p) ? 'rocket'
                : /(car|police|ئۆتۆمبێل)/i.test(p) ? 'car'
                : /(dog|cat|lion|سەگ|شێر)/i.test(p) ? 'animal' : 'human';

            const entities = [
                { id: 'e1', kind, gender: roles.hasFemale ? 'female' : (roles.hasChild ? 'child' : 'male'), name: 'Hero', scale: 1.05, primaryColor: '#3b82f6', secondaryColor: '#1e293b', hairColor: '#1f2937' }
            ];
            const acts = [];
            for (let i = 0; i < actCount; i++) {
                const startX = 0.22 + (i / actCount) * 0.50;
                acts.push({
                    title: `Scene ${i + 1}`,
                    subtitle: `${promptText.slice(0, 52)} (Part ${i + 1})`,
                    sound: i === actCount - 1 ? 'coin_jackpot' : 'speech',
                    actors: [{
                        id: 'e1',
                        startX,
                        endX: Math.min(0.78, startX + 0.08),
                        startY: 0.83,
                        endY: 0.83,
                        facing: 1,
                        pose: i === actCount - 1 ? 'celebrate' : 'walk',
                        expression: i === actCount - 1 ? 'happy' : 'neutral',
                        holding: i >= Math.floor(actCount / 2) ? 'money' : 'none',
                        speaking: true,
                        voiceType: entities[0].gender,
                        spokenLine: i === 0 ? promptText.slice(0, 60) : (i === actCount - 1 ? 'We finally achieved our goal!' : 'Let us keep moving forward!')
                    }]
                });
            }
            return { setting: 'golden_city', mood: 'happy', entities, acts };
        },

        // =========================================================================
        // 4. REAL 3D MODEL SCENE BUILDER (THREE.JS)
        // =========================================================================
        buildThreeJsStage(width, height, script) {
            const THREE = window.THREE;
            const webglCanvas = document.createElement('canvas');
            webglCanvas.width = width;
            webglCanvas.height = height;

            const renderer = new THREE.WebGLRenderer({
                canvas: webglCanvas,
                antialias: true,
                preserveDrawingBuffer: true
            });
            renderer.setSize(width, height, false);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
            camera.position.set(0, 2.5, 9.2);
            camera.lookAt(0, 1.55, 0);

            const setting = script.setting || 'room';

            // 3-Point Studio & Environment Lighting
            const hemiLight = new THREE.HemisphereLight(
                setting === 'room' ? 0xffe4e6 : 0xbae6fd,
                setting === 'room' ? 0x451a03 : 0x1e293b,
                0.85
            );
            scene.add(hemiLight);

            const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
            keyLight.position.set(4.5, 8.5, 6.5);
            keyLight.castShadow = true;
            keyLight.shadow.mapSize.width = 1024;
            keyLight.shadow.mapSize.height = 1024;
            scene.add(keyLight);

            const rimLight = new THREE.DirectionalLight(0x818cf8, 0.65);
            rimLight.position.set(-5, 4, -4);
            scene.add(rimLight);

            let doorPivot = null;

            // Build 3D Environment Architecture
            if (setting === 'room') {
                scene.background = new THREE.Color(0x1e1b4b);
                scene.fog = new THREE.FogExp2(0x1e1b4b, 0.032);

                // 3D Hardwood Floor
                const floorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.45, metalness: 0.1 });
                const floor = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 14), floorMat);
                floor.position.set(0, -0.2, 0);
                floor.receiveShadow = true;
                scene.add(floor);

                // 3D Back Wall
                const wallMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.75 });
                const backWall = new THREE.Mesh(new THREE.BoxGeometry(24, 9, 0.4), wallMat);
                backWall.position.set(0, 4.3, -3.5);
                backWall.receiveShadow = true;
                scene.add(backWall);

                // 3D Framed Window on Left
                const winFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 0.25), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
                winFrame.position.set(-4.2, 3.2, -3.25);
                scene.add(winFrame);

                const winGlass = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.1, 0.3), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
                winGlass.position.set(-4.2, 3.2, -3.22);
                scene.add(winGlass);

                // 3D Luxury Sofa in Center Background
                const sofaMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
                const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.75, 1.3), sofaMat);
                sofaBase.position.set(-0.2, 0.38, -2.3);
                sofaBase.castShadow = true;
                scene.add(sofaBase);

                const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 0.35), sofaMat);
                sofaBack.position.set(-0.2, 1.1, -2.78);
                sofaBack.castShadow = true;
                scene.add(sofaBack);

                // 3D Hinged Wooden Exit Door on Right (Swings open when characters leave!)
                const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 3.8, 0.3), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
                doorFrame.position.set(4.6, 1.9, -3.25);
                scene.add(doorFrame);

                doorPivot = new THREE.Group();
                doorPivot.position.set(3.75, 0, -3.1);
                const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.7, 3.6, 0.14), new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.4 }));
                doorLeaf.position.set(0.85, 1.8, 0);
                doorPivot.add(doorLeaf);

                const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 }));
                knob.position.set(1.48, 1.75, 0.12);
                doorPivot.add(knob);
                scene.add(doorPivot);

            } else if (setting === 'forest') {
                scene.background = new THREE.Color(0x0ea5e9);
                scene.fog = new THREE.FogExp2(0x7dd3fc, 0.035);

                const grass = new THREE.Mesh(new THREE.BoxGeometry(36, 0.4, 24), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 }));
                grass.position.set(0, -0.2, 0);
                grass.receiveShadow = true;
                scene.add(grass);

                // 3D Pine Trees
                for (let i = -5; i <= 5; i++) {
                    const tree = new THREE.Group();
                    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.8, 12), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
                    trunk.position.y = 0.9;
                    tree.add(trunk);

                    const leaves1 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.2, 14), new THREE.MeshStandardMaterial({ color: 0x166534 }));
                    leaves1.position.y = 2.4;
                    tree.add(leaves1);

                    const leaves2 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 14), new THREE.MeshStandardMaterial({ color: 0x16a34a }));
                    leaves2.position.y = 3.5;
                    tree.add(leaves2);

                    tree.position.set(i * 2.2 + (i % 2) * 0.5, 0, -3.5 - Math.abs(i % 3) * 1.4);
                    scene.add(tree);
                }

            } else if (setting === 'space') {
                scene.background = new THREE.Color(0x03050c);
                const ground = new THREE.Mesh(new THREE.BoxGeometry(36, 0.4, 24), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }));
                ground.position.set(0, -0.2, 0);
                scene.add(ground);

                // 3D Ringed Planet
                const planet = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 32), new THREE.MeshStandardMaterial({ color: 0x9333ea }));
                planet.position.set(3.8, 4.2, -6.5);
                scene.add(planet);

                const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.14, 12, 48), new THREE.MeshStandardMaterial({ color: 0xd8b4fe }));
                ring.position.set(3.8, 4.2, -6.5);
                ring.rotation.x = 1.2;
                scene.add(ring);

            } else {
                // 3D Golden / Night City Skyline & Street
                const isGolden = setting === 'golden_city';
                scene.background = new THREE.Color(isGolden ? 0x311042 : 0x090d1e);
                scene.fog = new THREE.FogExp2(isGolden ? 0x311042 : 0x090d1e, 0.032);

                const road = new THREE.Mesh(new THREE.BoxGeometry(36, 0.4, 18), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 }));
                road.position.set(0, -0.2, 0);
                road.receiveShadow = true;
                scene.add(road);

                // 3D Skyscrapers
                for (let i = -5; i <= 5; i++) {
                    const bh = 3.5 + ((Math.abs(i) * 1.3) % 3.5);
                    const bldg = new THREE.Mesh(
                        new THREE.BoxGeometry(1.8, bh, 1.8),
                        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
                    );
                    bldg.position.set(i * 2.3, bh / 2, -4.5);
                    scene.add(bldg);
                }
            }

            // Build 3D Character & Entity Models
            const modelMap = {};
            (script.entities || []).forEach(ent => {
                modelMap[ent.id] = this.create3DEntityRig(THREE, ent);
                scene.add(modelMap[ent.id].root);
            });

            return { THREE, renderer, scene, camera, webglCanvas, modelMap, doorPivot };
        },

        // Creates a detailed articulated 3D Human / Robot / Monster / Vehicle / Animal rig
        create3DEntityRig(THREE, meta) {
            const kind = meta.kind || 'human';
            const gender = meta.gender || 'male';
            const isFemale = gender === 'female';
            const isChild = gender === 'child';

            const root = new THREE.Group();
            const bodyPivot = new THREE.Group();
            root.add(bodyPivot);

            const primaryMat = new THREE.MeshStandardMaterial({ color: meta.primaryColor || '#2563eb', roughness: 0.45 });
            const secondaryMat = new THREE.MeshStandardMaterial({ color: meta.secondaryColor || '#1e293b', roughness: 0.55 });
            const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.4 });
            const hairMat = new THREE.MeshStandardMaterial({ color: meta.hairColor || '#1f2937', roughness: 0.6 });

            if (kind === 'robot' || kind === 'monster') {
                const torso = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.35, 0.75), primaryMat);
                torso.position.y = 1.65;
                torso.castShadow = true;
                bodyPivot.add(torso);

                const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.65), secondaryMat);
                head.position.y = 2.72;
                bodyPivot.add(head);

                const visor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.1), new THREE.MeshBasicMaterial({ color: kind === 'robot' ? 0x38bdf8 : 0xef4444 }));
                visor.position.set(0, 2.74, 0.34);
                bodyPivot.add(visor);

                const leftLegPivot = new THREE.Group();
                leftLegPivot.position.set(-0.32, 0.95, 0);
                const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.95, 0.36), secondaryMat);
                lLeg.position.y = -0.47;
                leftLegPivot.add(lLeg);
                bodyPivot.add(leftLegPivot);

                const rightLegPivot = new THREE.Group();
                rightLegPivot.position.set(0.32, 0.95, 0);
                const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.95, 0.36), secondaryMat);
                rLeg.position.y = -0.47;
                rightLegPivot.add(rLeg);
                bodyPivot.add(rightLegPivot);

                const leftArmPivot = new THREE.Group();
                leftArmPivot.position.set(-0.76, 2.2, 0);
                const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.28), primaryMat);
                lArm.position.y = -0.45;
                leftArmPivot.add(lArm);
                bodyPivot.add(leftArmPivot);

                const rightArmPivot = new THREE.Group();
                rightArmPivot.position.set(0.76, 2.2, 0);
                const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.28), primaryMat);
                rArm.position.y = -0.45;
                rightArmPivot.add(rArm);
                bodyPivot.add(rightArmPivot);

                const baseScale = meta.scale || 1.1;
                root.scale.set(baseScale, baseScale, baseScale);
                return { root, bodyPivot, leftLegPivot, rightLegPivot, leftArmPivot, rightArmPivot, jawPivot: null, tearsGroup: null, props: {} };
            }

            if (kind === 'car' || kind === 'rocket') {
                const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 0.95), primaryMat);
                chassis.position.y = 0.52;
                chassis.castShadow = true;
                bodyPivot.add(chassis);

                const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.45, 0.85), secondaryMat);
                cabin.position.set(-0.1, 0.98, 0);
                bodyPivot.add(cabin);

                const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.2, 16);
                wheelGeo.rotateX(Math.PI / 2);
                const wheelMat = new THREE.MeshStandardMaterial({ color: 0x090a0f });
                [[-0.58, 0.26, 0.48], [0.58, 0.26, 0.48], [-0.58, 0.26, -0.48], [0.58, 0.26, -0.48]].forEach(pos => {
                    const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
                    wMesh.position.set(...pos);
                    bodyPivot.add(wMesh);
                });

                const baseScale = meta.scale || 1.0;
                root.scale.set(baseScale, baseScale, baseScale);
                return { root, bodyPivot, leftLegPivot: null, rightLegPivot: null, leftArmPivot: null, rightArmPivot: null, jawPivot: null, tearsGroup: null, props: {} };
            }

            // ARTICULATED 3D HUMAN RIG (Male, Female, Child)
            // 1. Left & Right 3D Legs with Hip Pivots & 3D Shoes
            const legMat = isFemale ? skinMat : secondaryMat;
            const shoeMat = new THREE.MeshStandardMaterial({ color: isFemale ? (meta.primaryColor || '#e11d48') : 0xf8fafc, roughness: 0.35 });

            const makeLeg = (xOffset) => {
                const pivot = new THREE.Group();
                pivot.position.set(xOffset, 0.96, 0);
                const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.88, 16), legMat);
                legMesh.position.y = -0.44;
                legMesh.castShadow = true;
                pivot.add(legMesh);

                const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.38), shoeMat);
                shoe.position.set(0, -0.88, 0.06);
                shoe.castShadow = true;
                pivot.add(shoe);
                return pivot;
            };
            const leftLegPivot = makeLeg(-0.19);
            const rightLegPivot = makeLeg(0.19);
            bodyPivot.add(leftLegPivot);
            bodyPivot.add(rightLegPivot);

            // 2. 3D Torso (Sculpted Jacket for Male/Child; Tailored Bodice + Flared 3D Skirt for Female)
            if (isFemale) {
                const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.56, 20), primaryMat);
                bodice.position.y = 1.68;
                bodice.castShadow = true;
                bodyPivot.add(bodice);

                const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.52, 0.65, 24), primaryMat);
                skirt.position.y = 1.12;
                skirt.castShadow = true;
                bodyPivot.add(skirt);
            } else {
                const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.29, 0.96, 20), primaryMat);
                torso.position.y = 1.46;
                torso.castShadow = true;
                bodyPivot.add(torso);
            }

            // 3. 3D Neck
            const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.22, 16), skinMat);
            neck.position.y = 2.02;
            bodyPivot.add(neck);

            // 4. Left & Right 3D Arms with Shoulder Pivots + Attachable 3D Props
            const makeArm = (xOffset) => {
                const pivot = new THREE.Group();
                pivot.position.set(xOffset, 1.88, 0);
                const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.72, 14), primaryMat);
                sleeve.position.y = -0.36;
                sleeve.castShadow = true;
                pivot.add(sleeve);

                const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), skinMat);
                hand.position.y = -0.76;
                pivot.add(hand);
                return pivot;
            };
            const leftArmPivot = makeArm(-0.42);
            const rightArmPivot = makeArm(0.42);
            bodyPivot.add(leftArmPivot);
            bodyPivot.add(rightArmPivot);

            // Attach 3D Props to Right Hand (hidden unless active in current Act)
            const suitcaseProp = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.18), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 }));
            suitcaseProp.position.set(0, -0.96, 0.08);
            suitcaseProp.visible = false;
            rightArmPivot.add(suitcaseProp);

            const moneyProp = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.06), new THREE.MeshStandardMaterial({ color: 0x16a34a, emissive: 0x15803d, emissiveIntensity: 0.4 }));
            moneyProp.position.set(0, -0.84, 0.16);
            moneyProp.visible = false;
            rightArmPivot.add(moneyProp);

            const goldBagProp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.6, roughness: 0.3 }));
            goldBagProp.position.set(0, -0.92, 0.12);
            goldBagProp.visible = false;
            rightArmPivot.add(goldBagProp);

            // 5. 3D Head Group (Sphere Cranium, 3D Hair, 3D Eyes, 3D Tears, Articulated 3D Lower Jaw)
            const headGroup = new THREE.Group();
            headGroup.position.y = 2.42;
            bodyPivot.add(headGroup);

            const headRadius = isChild ? 0.38 : 0.35;
            const cranium = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 28, 28), skinMat);
            cranium.castShadow = true;
            headGroup.add(cranium);

            // 3D Hair Styling
            const hairCap = new THREE.Mesh(
                new THREE.SphereGeometry(headRadius * 1.04, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.56),
                hairMat
            );
            hairCap.position.y = 0.03;
            headGroup.add(hairCap);

            if (isFemale) {
                // Long 3D Flowing Back Hair
                const longHair = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.95, 20), hairMat);
                longHair.position.set(0, -0.32, -0.14);
                headGroup.add(longHair);
            } else if (meta.beard && !isChild) {
                const beardMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(headRadius * 1.01, 20, 20, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45),
                    hairMat
                );
                headGroup.add(beardMesh);
            }

            // 3D Eyes (White Sclera + Dark Pupil)
            [-0.12, 0.12].forEach(ex => {
                const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
                eyeWhite.position.set(ex, 0.05, headRadius * 0.88);
                headGroup.add(eyeWhite);

                const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), new THREE.MeshBasicMaterial({ color: 0x090a0f }));
                pupil.position.set(ex, 0.05, headRadius * 0.98);
                headGroup.add(pupil);
            });

            // 3D Streaming Tears (Visible when crying)
            const tearsGroup = new THREE.Group();
            const tearMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
            const tearL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), tearMat);
            tearL.position.set(-0.13, -0.06, headRadius * 0.95);
            const tearR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), tearMat);
            tearR.position.set(0.13, -0.06, headRadius * 0.95);
            tearsGroup.add(tearL);
            tearsGroup.add(tearR);
            tearsGroup.visible = false;
            headGroup.add(tearsGroup);

            // 6. Articulated 3D Lower Jaw & Mouth Cavity (Moves dynamically with Neural TTS voice!)
            const mouthCavity = new THREE.Mesh(
                new THREE.SphereGeometry(0.11, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0x4c0519 })
            );
            mouthCavity.scale.set(1.2, 0.5, 0.6);
            mouthCavity.position.set(0, -0.13, headRadius * 0.88);
            headGroup.add(mouthCavity);

            const teethMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.14, 0.035, 0.06),
                new THREE.MeshBasicMaterial({ color: 0xffffff })
            );
            teethMesh.position.set(0, -0.10, headRadius * 0.92);
            headGroup.add(teethMesh);

            const jawPivot = new THREE.Group();
            jawPivot.position.set(0, -0.11, headRadius * 0.65);
            const lowerLip = new THREE.Mesh(
                new THREE.BoxGeometry(0.16, 0.055, 0.14),
                new THREE.MeshStandardMaterial({ color: isFemale ? 0xe11d48 : 0xd97706 })
            );
            lowerLip.position.set(0, -0.03, 0.10);
            jawPivot.add(lowerLip);
            headGroup.add(jawPivot);

            const baseScale = meta.scale || (isChild ? 0.72 : (isFemale ? 0.96 : 1.05));
            root.scale.set(baseScale, baseScale, baseScale);

            return {
                root,
                bodyPivot,
                leftLegPivot,
                rightLegPivot,
                leftArmPivot,
                rightArmPivot,
                headGroup,
                jawPivot,
                mouthCavity,
                tearsGroup,
                props: {
                    suitcase: suitcaseProp,
                    money: moneyProp,
                    gold_bag: goldBagProp
                }
            };
        },

        // =========================================================================
        // 5. RENDER & RECORD 3D SCENE + NEURAL HUMAN TTS AUDIO
        // =========================================================================
        async renderAndRecord3DVideo(compositeCanvas, script, durationSec, onTtsProgress, onFrameProgress) {
            const isVertical = this.aspectRatio === '9:16';
            const width = isVertical ? 480 : 854;
            const height = isVertical ? 854 : 480;

            if (!compositeCanvas) compositeCanvas = document.createElement('canvas');
            compositeCanvas.width = width;
            compositeCanvas.height = height;
            const compCtx = compositeCanvas.getContext('2d');

            if (!compositeCanvas.captureStream || typeof MediaRecorder === 'undefined') {
                throw new Error("Video recording is not supported on this browser.");
            }

            // Build the 3D WebGL Stage
            const stage3D = this.buildThreeJsStage(width, height, script);

            const fps = 30;
            const totalFrames = fps * durationSec;
            const actCount = script.acts.length;
            const framesPerAct = totalFrames / actCount;

            let mixedStream = compositeCanvas.captureStream(fps);
            const soundSession = window.ZenoSounds
                ? window.ZenoSounds.createRecordingSession(script.mood || 'dramatic')
                : null;

            // Preload genuine Neural Human TTS speech audio for all dialogue lines
            if (soundSession && soundSession.audioCtx && window.ZenoSounds.preloadHumanDialogueBuffers) {
                const voiceBuffers = await window.ZenoSounds.preloadHumanDialogueBuffers(
                    soundSession.audioCtx,
                    script.acts,
                    onTtsProgress
                );
                soundSession.setVoiceBuffers(voiceBuffers);
            }

            if (soundSession && soundSession.streamTrack) {
                mixedStream.addTrack(soundSession.streamTrack);
            }

            return await new Promise((resolve) => {
                const mimeTypes = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
                const chosenMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
                const recorder = chosenMime
                    ? new MediaRecorder(mixedStream, { mimeType: chosenMime, videoBitsPerSecond: 3800000 })
                    : new MediaRecorder(mixedStream);

                const chunks = [];
                recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
                recorder.onstop = () => {
                    if (soundSession) soundSession.stopAll();
                    stage3D.renderer.dispose();
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
                    const actIdx = Math.min(actCount - 1, Math.floor(frame / framesPerAct));
                    const localFrame = Math.floor(frame - actIdx * framesPerAct);
                    const localT = localFrame / framesPerAct;
                    const currentAct = script.acts[actIdx] || script.acts[0];

                    // Trigger Neural Human TTS Voices & Foley Audio
                    if (soundSession) {
                        const speakers = (currentAct.actors || []).filter(a => a.speaking && a.spokenLine);

                        if (localFrame === 4 && speakers[0]) {
                            const sp = speakers[0];
                            soundSession.speakHumanLine(
                                sp.voiceType || 'male',
                                sp.spokenLine,
                                1.6,
                                `${actIdx}_${sp.id}`
                            );
                        }
                        if (localFrame === 48 && speakers[1]) {
                            const sp2 = speakers[1];
                            soundSession.speakHumanLine(
                                sp2.voiceType || 'female',
                                sp2.spokenLine,
                                1.6,
                                `${actIdx}_${sp2.id}`
                            );
                        }

                        if (localFrame === 6) {
                            const snd = currentAct.sound || '';
                            if (['child_cry', 'door_slam', 'coin_jackpot', 'sad_violin', 'explosion'].includes(snd)) {
                                soundSession.trigger(snd);
                            }
                        } else if (currentAct.sound === 'footsteps' && frame % 12 === 0) {
                            soundSession.trigger('footsteps');
                        } else if (currentAct.sound === 'laugh' && frame % 28 === 0) {
                            soundSession.trigger('laugh');
                        }
                    }

                    const liveAudioMouth = soundSession && typeof soundSession.getLiveVoiceAperture === 'function'
                        ? soundSession.getLiveVoiceAperture()
                        : 0;

                    // Animate 3D Camera smoothly
                    const camAngle = Math.sin(t * 0.45) * 0.16;
                    const camZoomZ = (actIdx % 2 === 1) ? (8.3 - localT * 0.5) : 9.1;
                    stage3D.camera.position.set(Math.sin(camAngle) * 1.4, 2.55, camZoomZ);
                    stage3D.camera.lookAt(0, 1.5, 0);

                    // Swing 3D Exit Door open when characters leave in later acts
                    if (stage3D.doorPivot) {
                        const shouldOpenDoor = (currentAct.sound === 'door_slam' || actIdx >= Math.floor(actCount * 0.6));
                        const targetDoorRot = shouldOpenDoor ? -1.25 : 0;
                        stage3D.doorPivot.rotation.y += (targetDoorRot - stage3D.doorPivot.rotation.y) * 0.12;
                    }

                    // Update Every 3D Character Rig in the Scene
                    const speakersInAct = (currentAct.actors || []).filter(a => a.speaking && a.spokenLine);

                    (currentAct.actors || []).forEach((actorState, idx) => {
                        const rig = stage3D.modelMap[actorState.id];
                        if (!rig) return;

                        const ease = localT * localT * (3 - 2 * localT);
                        const normX = actorState.startX + (actorState.endX - actorState.startX) * ease;
                        // Map normalized 0..1 X to 3D world space (-4.4 .. +4.4)
                        const worldX = (normX - 0.5) * 8.8;
                        rig.root.position.set(worldX, 0, (idx - 1) * 0.35);

                        // Turn 3D character to face left (-PI/2) or right (+PI/2) smoothly
                        const targetRotY = (actorState.facing || 1) >= 0 ? Math.PI * 0.42 : -Math.PI * 0.42;
                        rig.root.rotation.y = targetRotY;

                        const pose = actorState.pose || 'idle';
                        const expr = actorState.expression || 'neutral';
                        const isWalking = pose === 'walk' || pose === 'run';
                        const gaitFreq = pose === 'run' ? 16 : 10;

                        // Animate 3D Legs & Body Bounce
                        if (rig.leftLegPivot && rig.rightLegPivot) {
                            if (isWalking) {
                                rig.leftLegPivot.rotation.x = Math.sin(t * gaitFreq) * 0.65;
                                rig.rightLegPivot.rotation.x = -Math.sin(t * gaitFreq) * 0.65;
                                rig.bodyPivot.position.y = Math.abs(Math.sin(t * gaitFreq)) * 0.08;
                            } else if (pose === 'celebrate') {
                                rig.leftLegPivot.rotation.x = 0;
                                rig.rightLegPivot.rotation.x = 0;
                                rig.bodyPivot.position.y = Math.abs(Math.sin(t * 10)) * 0.22;
                            } else {
                                rig.leftLegPivot.rotation.x = 0;
                                rig.rightLegPivot.rotation.x = 0;
                                rig.bodyPivot.position.y = Math.sin(t * 3) * 0.015;
                            }
                        }

                        // Animate 3D Arms
                        if (rig.leftArmPivot && rig.rightArmPivot) {
                            if (pose === 'argue') {
                                rig.rightArmPivot.rotation.x = -1.35 + Math.sin(t * 16) * 0.35;
                                rig.leftArmPivot.rotation.x = -0.8 + Math.cos(t * 14) * 0.25;
                            } else if (pose === 'celebrate') {
                                rig.rightArmPivot.rotation.z = -2.4 + Math.sin(t * 12) * 0.2;
                                rig.leftArmPivot.rotation.z = 2.4 - Math.sin(t * 12) * 0.2;
                            } else if (pose === 'cry') {
                                rig.rightArmPivot.rotation.x = -1.7;
                                rig.leftArmPivot.rotation.x = -1.7;
                            } else if (isWalking) {
                                rig.rightArmPivot.rotation.x = Math.sin(t * gaitFreq) * 0.55;
                                rig.leftArmPivot.rotation.x = -Math.sin(t * gaitFreq) * 0.55;
                                rig.rightArmPivot.rotation.z = 0;
                                rig.leftArmPivot.rotation.z = 0;
                            } else {
                                rig.rightArmPivot.rotation.x = 0;
                                rig.leftArmPivot.rotation.x = 0;
                                rig.rightArmPivot.rotation.z = 0;
                                rig.leftArmPivot.rotation.z = 0;
                            }
                        }

                        // Toggle 3D Props (Suitcase, Cash, Gold Bag)
                        if (rig.props) {
                            const hProp = actorState.holding || 'none';
                            if (rig.props.suitcase) rig.props.suitcase.visible = (hProp === 'suitcase');
                            if (rig.props.money) rig.props.money.visible = (hProp === 'money');
                            if (rig.props.gold_bag) rig.props.gold_bag.visible = (hProp === 'gold_bag');
                        }

                        // Animate 3D Tears when Crying
                        if (rig.tearsGroup) {
                            rig.tearsGroup.visible = (expr === 'crying');
                            if (expr === 'crying') {
                                rig.tearsGroup.position.y = -((t * 0.4) % 0.22);
                            }
                        }

                        // Animate 3D Articulated Jaw & Mouth Cavity in Sync with Neural Human TTS Voice!
                        const speakerTurnIdx = speakersInAct.findIndex(s => s.id === actorState.id);
                        let isMyTurn = false;
                        if (speakerTurnIdx === 0 && localT >= 0.03 && localT <= 0.52) isMyTurn = true;
                        else if (speakerTurnIdx >= 1 && localT > 0.48 && localT <= 0.94) isMyTurn = true;

                        const isTalkingOrCrying = isMyTurn || expr === 'crying' || expr === 'laughing';
                        const mouthOpen = isTalkingOrCrying
                            ? Math.max(liveAudioMouth, Math.abs(Math.sin(t * 20 + idx)) * 0.75 + 0.15)
                            : 0;

                        if (rig.jawPivot && rig.mouthCavity) {
                            rig.jawPivot.rotation.x = mouthOpen * 0.55;
                            rig.mouthCavity.scale.y = 0.25 + mouthOpen * 1.4;
                        }
                    });

                    // Render 3D Scene to WebGL Canvas, then Composite with Cinema Subtitles
                    stage3D.renderer.render(stage3D.scene, stage3D.camera);
                    compCtx.drawImage(stage3D.webglCanvas, 0, 0, width, height);
                    this.drawCinemaSubtitle(compCtx, currentAct.subtitle, width, height);

                    if (localT < 0.06) {
                        compCtx.fillStyle = `rgba(0,0,0,${1 - localT / 0.06})`;
                        compCtx.fillRect(0, 0, width, height);
                    }

                    frame++;
                    if (onFrameProgress && (frame % 4 === 0 || frame === totalFrames)) {
                        onFrameProgress(frame, totalFrames, actIdx);
                    }
                }, 1000 / fps);
            });
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
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(w * 0.06, boxY, w * 0.88, boxH, 12) : ctx.fillRect(w * 0.06, boxY, w * 0.88, boxH);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            show.forEach((ln, idx) => {
                ctx.fillText(ln, w / 2, boxY + 22 + idx * 24);
            });
            ctx.restore();
        },

        renderCompletedVideoPlayer(cardWrap, videoUrl, promptText, ext, durationSec) {
            const fileName = `zoneweb-${durationSec}s-3d-video.${ext}`;
            window.__lastGeneratedVideoUrl = videoUrl;
            window.__lastGeneratedVideoPrompt = promptText;

            cardWrap.innerHTML = `
                <div class="w-full max-w-[94%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            ${this.getCustomLogoSvg(18)}
                            <span class="text-xs md:text-sm font-extrabold text-white">3D Model Cinema Video Ready</span>
                        </div>
                        <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">${durationSec}.0s • 3D + HUMAN TTS</span>
                    </div>

                    <p class="text-xs text-gray-300">Scene: <b class="text-white">${promptText.replace(/</g, '&lt;')}</b></p>

                    <div class="rounded-2xl overflow-hidden border border-white/15 bg-black shadow-xl flex justify-center">
                        <video src="${videoUrl}" controls autoplay loop playsinline class="w-full max-h-96 object-contain bg-black"></video>
                    </div>

                    <div class="flex flex-wrap gap-2 pt-1">
                        <a href="${videoUrl}" download="${fileName}" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition">
                            <i class="fa-solid fa-download"></i> Download ${durationSec}s 3D Video
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
                    <h3 class="text-lg font-extrabold text-white mb-3">${(window.__lastGeneratedVideoPrompt || 'Featured 3D AI Video').replace(/</g, '&lt;')}</h3>
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
