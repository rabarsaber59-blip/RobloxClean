/**
 * ZENO-VIDEO.JS - 10s / 20s / 30s AI Story Studio, Voice Role Recognition (Male/Female/Child) & Cinema Graphics
 * 1. Duration Selector Buttons: 10s (3 Acts), 20s (6 Acts), 30s (9 Acts) — expands story depth & dialogue
 *    proportionally so ZERO seconds are left empty or repetitive.
 * 2. Automatic Character & Voice Recognition: Automatically identifies Male, Female, and Child roles from
 *    any prompt (English, Kurdish, Arabic) and assigns matching human TTS voices + distinct visual models.
 * 3. Upgraded Cinema Graphics: Detailed 2.5D environments (furnished living room with couch, curtains, painting,
 *    lamp, window & door; golden/night city; sunlit forest; beach; desert; space), sculpted necks, layered hair,
 *    expressive eyes, tears, and real-time audio-driven lip-sync (no floating text bubbles over heads).
 */
(function () {
    const ZenoVideo = {
        videoModeActive: false,
        isGeneratingVideo: false,
        isReplacingEmojis: false,
        emojiObserver: null,
        aspectRatio: '16:9',
        selectedDuration: 10, // 10, 20, or 30 seconds

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

        // =========================================================================
        // 1. TOP "GENERATE VIDEO" BUTTON & 10s / 20s / 30s STUDIO PANEL
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
                                <span class="text-xs font-extrabold text-white">AI Cinema & Human TTS Studio</span>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">Auto Voice ID</span>
                            </div>
                            <p class="text-[10px] text-gray-300">Auto-detects Male, Female & Child TTS voices + full multi-scene story</p>
                        </div>
                    </div>
                    <button onclick="window.ZenoVideo.toggleVideoMode(false)" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-600 text-gray-200 hover:text-white flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <!-- DURATION (10s / 20s / 30s) & ASPECT RATIO CONTROLS -->
                <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <div class="flex items-center gap-1.5">
                        <!-- Duration Buttons: 10s, 20s, 30s -->
                        <div class="flex items-center bg-black/60 p-0.5 rounded-lg border border-emerald-500/35">
                            <button type="button" id="zwDur10" onclick="window.ZenoVideo.setDuration(10)" class="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-extrabold transition">10s</button>
                            <button type="button" id="zwDur20" onclick="window.ZenoVideo.setDuration(20)" class="px-2.5 py-1 rounded-md text-gray-300 hover:text-white text-[11px] font-bold transition">20s</button>
                            <button type="button" id="zwDur30" onclick="window.ZenoVideo.setDuration(30)" class="px-2.5 py-1 rounded-md text-gray-300 hover:text-white text-[11px] font-bold transition">30s</button>
                        </div>

                        <!-- Aspect Ratio -->
                        <div class="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/15">
                            <button type="button" id="zwRatio169" onclick="window.ZenoVideo.setAspectRatio('16:9')" class="px-2 py-1 rounded-md bg-fuchsia-600 text-white text-[10px] font-extrabold">16:9</button>
                            <button type="button" id="zwRatio916" onclick="window.ZenoVideo.setAspectRatio('9:16')" class="px-2 py-1 rounded-md text-gray-300 text-[10px] font-bold">9:16</button>
                        </div>
                    </div>

                    <button type="button" onclick="window.ZenoVideo.triggerInstantVideoFromChat()" class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-[11px] font-extrabold shadow transition">
                        Create <span id="zwCreateBtnDurLabel">10s</span> Video
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
                    chatInput.placeholder = `Describe your ${this.selectedDuration}s story (who speaks, actions, emotions)...`;
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
        // 2. MAIN VIDEO PIPELINE: MULTI-ACT STORY + REAL TTS VOICES + CINEMA RENDER
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
            const durationSec = this.selectedDuration || 10;
            const actCount = durationSec === 30 ? 9 : (durationSec === 20 ? 6 : 3);

            document.getElementById('heroPrompt')?.classList.add('hidden');
            if (typeof window.appendMessage === 'function') {
                window.appendMessage('user', `[${durationSec}s AI Cinema Video] ${userPrompt}`);
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
                                <p id="${cardId}_phase" class="text-xs md:text-sm font-extrabold text-white">Step 1/3: AI Directing ${durationSec}s Story (${actCount} Scenes)...</p>
                                <p id="${cardId}_detail" class="text-[11px] text-fuchsia-300">Identifying Male, Female & Child voices and full dialogue...</p>
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
                            <span id="${cardId}_actBadge">${durationSec}s TTS CINEMA RENDER</span>
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
                // STEP 1: AI expands the story into `actCount` continuous acts (3 for 10s, 6 for 20s, 9 for 30s)
                updateProgress(8, `Step 1/3: Expanding ${durationSec}s Story (${actCount} Scenes)...`, "Assigning Male, Female & Child character voices...");
                const script = await this.generateFullDurationScript(userPrompt, durationSec, actCount);

                // STEP 2 & 3: Synthesize Real Human TTS Voices & Render Full 10s / 20s / 30s Video
                updateProgress(20, `Step 2/3: Generating Human TTS Voices...`, "Fetching natural Male, Female & Child speech audio...");
                const stageCanvas = document.getElementById(`${cardId}_stageCanvas`);

                const { blob, extension } = await this.renderAndRecordFullVideo(
                    stageCanvas,
                    script,
                    durationSec,
                    (doneTts, totalTts) => {
                        const ttsPct = 20 + Math.round((doneTts / Math.max(1, totalTts)) * 15);
                        updateProgress(ttsPct, "Step 2/3: Generating Human TTS Voices...", `Synthesized voice line ${doneTts} of ${totalTts}...`);
                    },
                    (frame, totalFrames, currentActIdx) => {
                        const pct = 35 + Math.round((frame / totalFrames) * 65);
                        const actObj = script.acts[currentActIdx] || script.acts[0];
                        updateProgress(
                            pct,
                            `Step 3/3: Rendering ${durationSec}.0s HD Cinema...`,
                            `Scene ${currentActIdx + 1}/${script.acts.length} • ${(frame / 30).toFixed(1)}s / ${durationSec}.0s`,
                            `SCENE ${currentActIdx + 1}/${script.acts.length} • TTS LIP-SYNC`
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
                        <p class="font-bold">Render Notice: ${err.message}</p>
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
        // 3. AI STORY EXPANDER & VOICE IDENTIFIER (10s = 3 ACTS, 20s = 6 ACTS, 30s = 9 ACTS)
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
                    ent.scale = Math.min(ent.scale || 0.78, 0.80);
                } else if (/(wife|woman|female|mother|mom|girl|sister|queen|ئافرەت|ژن|دایک|امرأة|زوجة)/i.test(nameLower)) {
                    ent.gender = 'female';
                    ent.scale = ent.scale || 1.06;
                } else if (/(man|male|husband|father|dad|king|پیاو|باوک|رجل)/i.test(nameLower)) {
                    ent.gender = 'male';
                    ent.scale = ent.scale || 1.14;
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
            const schemaPrompt = `You are a master 2.5D Cinema Screenwriter & Animation Director.
The user selected a ${durationSec}-SECOND video. You MUST generate EXACTLY ${actCount} sequential, richly detailed scenes ("acts"), each lasting ~3.3 seconds, so that ALL ${durationSec} seconds are packed with continuous story progression, character movement, and spoken TTS dialogue (NO empty or repeated scenes!).

CRITICAL VOICE & CHARACTER RULES:
1. Identify each character's exact gender/age role: "male" (man/husband/father), "female" (woman/wife/mother), or "child" (kid/son/daughter).
2. Set "gender" on each entity AND matching "voiceType": "male" | "female" | "child" on every actor so the TTS engine speaks with a real Man voice, Woman voice, or Child voice!
3. Every single Act (all ${actCount} acts) MUST have at least one character speaking a natural, expressive "spokenLine" (in English, 5 to 12 words) with "speaking": true so the viewer hears continuous human voices throughout the entire ${durationSec}-second video!
4. Choose the exact matching setting ("room" for house/home/family/indoor, "golden_city" or "night_city" for street/city, "forest", "beach", "desert", "space").

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
      "name": "Name",
      "scale": 1.12,
      "primaryColor": "#2563eb",
      "secondaryColor": "#0f172a",
      "hairColor": "#1e293b",
      "hat": "none" | "crown" | "police" | "hoodie",
      "beard": false
    }
  ],
  "acts": [
    {
      "title": "Scene 1",
      "subtitle": "Narrative caption for Scene 1 (max 62 chars)",
      "sound": "speech" | "child_cry" | "door_slam" | "footsteps" | "laugh" | "sad_violin" | "coin_jackpot" | "explosion",
      "actors": [
        {
          "id": "e1",
          "startX": 0.26,
          "endX": 0.36,
          "startY": 0.83,
          "endY": 0.83,
          "facing": 1,
          "pose": "argue" | "walk" | "run" | "idle" | "beg" | "point" | "punch" | "celebrate" | "fall" | "cry",
          "expression": "angry" | "crying" | "sad" | "happy" | "laughing" | "shocked" | "neutral",
          "holding": "none" | "suitcase" | "money" | "gold_bag" | "sword" | "phone" | "food",
          "speaking": true,
          "voiceType": "male" | "female" | "child",
          "spokenLine": "Natural spoken dialogue line for TTS"
        }
      ]
    }
  ]
}
USER STORY PROMPT (${durationSec}s, ${actCount} Acts): "${userPrompt}"`;

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
                    { id: 'e1', kind: 'human', gender: 'male', name: 'Father', scale: 1.14, primaryColor: '#2563eb', secondaryColor: '#0f172a', hairColor: '#1e293b', beard: true },
                    { id: 'e2', kind: 'human', gender: 'female', name: 'Mother', scale: 1.07, primaryColor: '#e11d48', secondaryColor: '#4c0519', hairColor: '#451a03' }
                ];
                if (roles.hasChild) {
                    entities.push({ id: 'e3', kind: 'human', gender: 'child', name: 'Child', scale: 0.78, primaryColor: '#f59e0b', secondaryColor: '#1e293b', hairColor: '#451a03' });
                }

                const storyBeats = [
                    { sub: 'Tension rises inside the living room', snd: 'speech', mLine: 'Why did you hide the truth from me?', fLine: '', cLine: '', mPose: 'argue', fPose: 'idle', cPose: 'idle', mExpr: 'angry', fExpr: 'shocked', cExpr: 'neutral', bag: 'none' },
                    { sub: 'The wife responds angrily during the argument', snd: 'speech', mLine: '', fLine: 'You never listen to what I say anymore!', cLine: '', mPose: 'idle', fPose: 'argue', cPose: 'idle', mExpr: 'angry', fExpr: 'angry', cExpr: 'shocked', bag: 'none' },
                    { sub: 'Their child hears the shouting and begins crying', snd: 'child_cry', mLine: '', fLine: '', cLine: 'Please stop fighting, I am scared!', mPose: 'point', fPose: 'argue', cPose: 'cry', mExpr: 'angry', fExpr: 'sad', cExpr: 'crying', bag: 'none' },
                    { sub: 'The mother comforts her crying child', snd: 'sad_violin', mLine: 'Wait, let us talk calmly about this.', fLine: 'Come here sweetheart, mommy is here.', cLine: '', mPose: 'idle', fPose: 'idle', cPose: 'cry', mExpr: 'sad', fExpr: 'crying', cExpr: 'crying', bag: 'none' },
                    { sub: 'She packs their suitcase to leave the house', snd: 'footsteps', mLine: '', fLine: 'We need some time away from here.', cLine: 'Are we leaving our home mommy?', mPose: 'idle', fPose: 'walk', cPose: 'walk', mExpr: 'sad', fExpr: 'sad', cExpr: 'crying', bag: 'suitcase' },
                    { sub: 'They walk toward the front door together', snd: 'door_slam', mLine: 'Please do not go like this!', fLine: 'Goodbye, take care of yourself.', cLine: 'Goodbye daddy!', mPose: 'beg', fPose: 'walk', cPose: 'walk', mExpr: 'sad', fExpr: 'crying', cExpr: 'crying', bag: 'suitcase' },
                    { sub: 'Stepping outside into the quiet evening street', snd: 'footsteps', mLine: '', fLine: 'Stay close to me my little one.', cLine: 'I will stay with you mommy.', mPose: 'idle', fPose: 'walk', cPose: 'walk', mExpr: 'sad', fExpr: 'sad', cExpr: 'sad', bag: 'suitcase' },
                    { sub: 'Looking back one last time at the house', snd: 'sad_violin', mLine: 'I promise I will make things right.', fLine: 'I hope one day things will change.', cLine: '', mPose: 'idle', fPose: 'idle', cPose: 'idle', mExpr: 'sad', fExpr: 'sad', cExpr: 'sad', bag: 'suitcase' },
                    { sub: 'A new chapter begins as they move forward', snd: 'speech', mLine: '', fLine: 'Everything is going to be okay now.', cLine: 'I love you mommy!', mPose: 'idle', fPose: 'walk', cPose: 'walk', mExpr: 'sad', fExpr: 'happy', cExpr: 'happy', bag: 'suitcase' }
                ];

                const acts = [];
                for (let i = 0; i < actCount; i++) {
                    const b = storyBeats[i % storyBeats.length];
                    const progress = i / Math.max(1, actCount - 1);
                    const walkOutOffset = progress > 0.5 ? (progress - 0.5) * 0.55 : 0;

                    acts.push({
                        title: `Scene ${i + 1}`,
                        subtitle: b.sub,
                        sound: b.snd,
                        actors: [
                            { id: 'e1', startX: 0.25, endX: 0.30, startY: 0.83, endY: 0.83, facing: 1, pose: b.mPose, expression: b.mExpr, holding: 'none', speaking: Boolean(b.mLine), voiceType: 'male', spokenLine: b.mLine },
                            { id: 'e2', startX: 0.54 + walkOutOffset * 0.6, endX: 0.58 + walkOutOffset * 0.8, startY: 0.83, endY: 0.83, facing: walkOutOffset > 0 ? 1 : -1, pose: b.fPose, expression: b.fExpr, holding: b.bag, speaking: Boolean(b.fLine), voiceType: 'female', spokenLine: b.fLine },
                            ...(roles.hasChild ? [{ id: 'e3', startX: 0.68 + walkOutOffset * 0.6, endX: 0.72 + walkOutOffset * 0.8, startY: 0.83, endY: 0.83, facing: walkOutOffset > 0 ? 1 : -1, pose: b.cPose, expression: b.cExpr, holding: 'none', speaking: Boolean(b.cLine), voiceType: 'child', spokenLine: b.cLine }] : [])
                        ]
                    });
                }

                return { setting: 'room', weather: 'none', mood: 'dramatic', entities, acts };
            }

            // General multi-act story expansion for any other prompt
            const entities = [
                { id: 'e1', kind: 'human', gender: roles.hasFemale ? 'female' : (roles.hasChild ? 'child' : 'male'), name: 'Hero', scale: 1.12, primaryColor: '#3b82f6', secondaryColor: '#1e293b', hairColor: '#1f2937' }
            ];
            const acts = [];
            for (let i = 0; i < actCount; i++) {
                const startX = 0.18 + (i / actCount) * 0.55;
                acts.push({
                    title: `Scene ${i + 1}`,
                    subtitle: `${promptText.slice(0, 52)} (Part ${i + 1})`,
                    sound: i === actCount - 1 ? 'coin_jackpot' : 'speech',
                    actors: [{
                        id: 'e1',
                        startX,
                        endX: Math.min(0.82, startX + 0.08),
                        startY: 0.83,
                        endY: 0.83,
                        facing: 1,
                        pose: i === actCount - 1 ? 'celebrate' : 'walk',
                        expression: i === actCount - 1 ? 'happy' : 'neutral',
                        holding: i >= Math.floor(actCount / 2) ? 'money' : 'none',
                        speaking: true,
                        voiceType: entities[0].gender,
                        spokenLine: i === 0 ? promptText.slice(0, 60) : (i === actCount - 1 ? 'We finally made it!' : 'Let us keep moving forward!')
                    }]
                });
            }
            return { setting: 'golden_city', weather: 'none', mood: 'happy', entities, acts };
        },

        // =========================================================================
        // 4. FULL-DURATION RENDERER (10s / 20s / 30s) + REAL HUMAN TTS LIP-SYNC
        // =========================================================================
        async renderAndRecordFullVideo(canvas, script, durationSec, onTtsProgress, onFrameProgress) {
            const isVertical = this.aspectRatio === '9:16';
            const width = isVertical ? 480 : 854;
            const height = isVertical ? 854 : 480;

            if (!canvas) canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {
                throw new Error("Video recording is not supported on this browser.");
            }

            const fps = 30;
            const totalFrames = fps * durationSec; // 300 (10s), 600 (20s), or 900 (30s)
            const actCount = script.acts.length;
            const framesPerAct = totalFrames / actCount;

            let mixedStream = canvas.captureStream(fps);
            const soundSession = window.ZenoSounds
                ? window.ZenoSounds.createRecordingSession(script.mood || 'dramatic')
                : null;

            // Preload real human TTS speech audio buffers for ALL acts before starting recording
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

                    // Trigger Human TTS Voices & Scene Foley Sounds cleanly in each Act
                    if (soundSession) {
                        const speakers = (currentAct.actors || []).filter(a => a.speaking && a.spokenLine);

                        // Speaker 1 speaks at frame 4 of the Act
                        if (localFrame === 4 && speakers[0]) {
                            const sp = speakers[0];
                            soundSession.speakHumanLine(
                                sp.voiceType || 'male',
                                sp.spokenLine,
                                1.6,
                                `${actIdx}_${sp.id}`,
                                sp.expression === 'angry' ? 'angry' : 'neutral'
                            );
                        }
                        // Speaker 2 responds halfway through the Act (frame ~48) so dialogue fills the entire scene!
                        if (localFrame === 48 && speakers[1]) {
                            const sp2 = speakers[1];
                            soundSession.speakHumanLine(
                                sp2.voiceType || 'female',
                                sp2.spokenLine,
                                1.6,
                                `${actIdx}_${sp2.id}`,
                                sp2.expression === 'angry' ? 'angry' : 'neutral'
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

                    ctx.save();
                    const camZoom = (actIdx % 2 === 1) ? (1.03 + localT * 0.04) : (1.0 + Math.sin(t * 0.5) * 0.02);
                    const camPanX = ((actIdx % 3) - 1) * -8;
                    ctx.translate(width * 0.5 + camPanX, height * 0.5);
                    ctx.scale(camZoom, camZoom);
                    ctx.translate(-width * 0.5, -height * 0.5);

                    // 1. Render High-Detail 2.5D Environment
                    this.drawRichEnvironment(ctx, width, height, t, script.setting, script.weather);

                    // 2. Render Characters with Real Audio-Driven Lip-Sync (No floating text bubbles!)
                    const entityMap = {};
                    (script.entities || []).forEach(e => { entityMap[e.id] = e; });

                    const speakersInAct = (currentAct.actors || []).filter(a => a.speaking && a.spokenLine);

                    (currentAct.actors || []).forEach((actorState, idx) => {
                        const meta = entityMap[actorState.id] || script.entities[idx] || { kind: 'human', primaryColor: '#3b82f6' };
                        const ease = localT * localT * (3 - 2 * localT);
                        const px = (actorState.startX + (actorState.endX - actorState.startX) * ease) * width;
                        const py = (actorState.startY + (actorState.endY - actorState.startY) * ease) * height;

                        // Sync mouth movement specifically to the character whose TTS turn is active right now
                        const speakerTurnIdx = speakersInAct.findIndex(s => s.id === actorState.id);
                        let isMyTurnToSpeak = false;
                        if (speakerTurnIdx === 0 && localT >= 0.03 && localT <= 0.52) isMyTurnToSpeak = true;
                        else if (speakerTurnIdx >= 1 && localT > 0.48 && localT <= 0.94) isMyTurnToSpeak = true;

                        const isExpressing = isMyTurnToSpeak || actorState.expression === 'crying' || actorState.expression === 'laughing';
                        const mouthAperture = isExpressing
                            ? Math.max(liveAudioMouth, Math.abs(Math.sin(t * 21 + idx)) * 0.72 + 0.16)
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
                            isCurrentlySpeaking: isMyTurnToSpeak
                        });
                    });

                    if (currentAct.sound === 'explosion' && localT > 0.05 && localT < 0.75) {
                        this.drawExplosionEffect(ctx, width * 0.55, height * 0.60, 145, (localT - 0.05) / 0.7);
                    }

                    ctx.restore();

                    // Cinema Framing, Vignette & Bottom Subtitle
                    this.drawFilmVignette(ctx, width, height);
                    this.drawCinemaSubtitle(ctx, currentAct.subtitle, width, height);

                    if (localT < 0.06) {
                        ctx.fillStyle = `rgba(0,0,0,${1 - localT / 0.06})`;
                        ctx.fillRect(0, 0, width, height);
                    }

                    frame++;
                    if (onFrameProgress && (frame % 4 === 0 || frame === totalFrames)) {
                        onFrameProgress(frame, totalFrames, actIdx);
                    }
                }, 1000 / fps);
            });
        },

        // =========================================================================
        // 5. UPGRADED CINEMA ENVIRONMENTS & ANATOMICALLY DETAILED CHARACTERS
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
            const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.35, w * 0.5, h * 0.5, w * 0.76);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(0,0,0,0.45)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, w, h);
        },

        drawRichEnvironment(ctx, w, h, t, setting, weather) {
            const groundY = h * 0.83;
            const sky = ctx.createLinearGradient(0, 0, 0, groundY);

            if (setting === 'room') {
                // Luxury Cozy Living Room with Curtained Window, Framed Art, Sofa, Floor Lamp & Exit Door
                const wall = ctx.createLinearGradient(0, 0, 0, groundY);
                wall.addColorStop(0, '#1e1b4b');
                wall.addColorStop(0.6, '#312e81');
                wall.addColorStop(1, '#1e293b');
                ctx.fillStyle = wall;
                ctx.fillRect(0, 0, w, groundY);

                // Wainscoting Wall Panels & Baseboard
                ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
                ctx.fillRect(0, groundY - 72, w, 72);
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, groundY - 12, w, 12);

                // Framed Sunset Landscape Painting on Center Wall
                const artX = w * 0.43, artY = h * 0.14, artW = w * 0.14, artH = h * 0.18;
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(artX - 4, artY - 4, artW + 8, artH + 8);
                const artGrad = ctx.createLinearGradient(artX, artY, artX, artY + artH);
                artGrad.addColorStop(0, '#38bdf8');
                artGrad.addColorStop(1, '#f97316');
                ctx.fillStyle = artGrad;
                ctx.fillRect(artX, artY, artW, artH);

                // Curtained Window on Left
                const winX = w * 0.12, winY = h * 0.16, winW = w * 0.20, winH = h * 0.30;
                const winSky = ctx.createLinearGradient(winX, winY, winX, winY + winH);
                winSky.addColorStop(0, '#0284c7');
                winSky.addColorStop(1, '#bae6fd');
                ctx.fillStyle = winSky;
                ctx.fillRect(winX, winY, winW, winH);
                ctx.strokeStyle = '#f8fafc';
                ctx.lineWidth = 4;
                ctx.strokeRect(winX, winY, winW, winH);
                // Drapes / Curtains
                ctx.fillStyle = '#be123c';
                this.roundBox(ctx, winX - 10, winY - 4, 18, winH + 12, 4);
                ctx.fill();
                this.roundBox(ctx, winX + winW - 8, winY - 4, 18, winH + 12, 4);
                ctx.fill();

                // Cozy Sofa / Couch in Midground
                const sofaX = w * 0.36, sofaY = groundY - 58, sofaW = w * 0.28, sofaH = 58;
                ctx.fillStyle = '#475569';
                this.roundBox(ctx, sofaX, sofaY, sofaW, 38, 10);
                ctx.fill();
                ctx.fillStyle = '#64748b';
                this.roundBox(ctx, sofaX - 6, sofaY + 24, sofaW + 12, 26, 8);
                ctx.fill();
                // Decorative Throw Pillows
                ctx.fillStyle = '#f59e0b';
                this.roundBox(ctx, sofaX + 10, sofaY + 10, 22, 18, 5);
                ctx.fill();

                // Wooden Front Door on Right
                const doorW = w * 0.13, doorH = h * 0.48;
                const doorX = w * 0.83, doorY = groundY - doorH;
                const doorGrad = ctx.createLinearGradient(doorX, doorY, doorX + doorW, doorY + doorH);
                doorGrad.addColorStop(0, '#92400e');
                doorGrad.addColorStop(1, '#451a03');
                ctx.fillStyle = doorGrad;
                this.roundBox(ctx, doorX, doorY, doorW, doorH, 6);
                ctx.fill();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 2;
                ctx.strokeRect(doorX + 8, doorY + 12, doorW - 16, doorH * 0.36);
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(doorX + 14, doorY + doorH * 0.54, 4.5, 0, Math.PI * 2);
                ctx.fill();

                // Warm Hardwood Floor with Subtle Sheen
                const floorGrad = ctx.createLinearGradient(0, groundY, 0, h);
                floorGrad.addColorStop(0, '#78350f');
                floorGrad.addColorStop(1, '#290f02');
                ctx.fillStyle = floorGrad;
                ctx.fillRect(0, groundY, w, h - groundY);

            } else if (setting === 'forest') {
                sky.addColorStop(0, '#065f46');
                sky.addColorStop(0.55, '#0ea5e9');
                sky.addColorStop(1, '#e0f2fe');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY);

                // Sunbeams
                const sunGlow = ctx.createRadialGradient(w * 0.82, h * 0.16, 10, w * 0.82, h * 0.16, 160);
                sunGlow.addColorStop(0, '#fef08a');
                sunGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
                ctx.fillStyle = sunGlow;
                ctx.fillRect(0, 0, w, groundY);

                for (let i = 0; i < 8; i++) {
                    const tx = (i + 0.5) * (w / 8);
                    const th = 115 + (i % 3) * 32;
                    ctx.fillStyle = '#451a03';
                    ctx.fillRect(tx - 8, groundY - th * 0.5, 16, th * 0.5);
                    ctx.fillStyle = '#14532d';
                    ctx.beginPath();
                    ctx.arc(tx - 15, groundY - th * 0.65, 32, 0, Math.PI * 2);
                    ctx.arc(tx + 15, groundY - th * 0.65, 32, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#16a34a';
                    ctx.beginPath();
                    ctx.arc(tx, groundY - th * 0.78, 36, 0, Math.PI * 2);
                    ctx.fill();
                }

                const grass = ctx.createLinearGradient(0, groundY, 0, h);
                grass.addColorStop(0, '#16a34a');
                grass.addColorStop(1, '#052e16');
                ctx.fillStyle = grass;
                ctx.fillRect(0, groundY, w, h - groundY);

            } else {
                const isGolden = setting === 'golden_city';
                sky.addColorStop(0, isGolden ? '#1e1b4b' : '#050814');
                sky.addColorStop(0.55, isGolden ? '#7e22ce' : '#1e3a8a');
                sky.addColorStop(1, isGolden ? '#f59e0b' : '#312e81');
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, w, groundY);

                const cols = 10;
                const bw = w / cols;
                for (let i = 0; i < cols; i++) {
                    const bh = h * (0.24 + ((i * 31) % 24) / 100);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(i * bw + 3, groundY - bh, bw - 6, bh);
                    ctx.fillStyle = 'rgba(253, 224, 71, 0.38)';
                    for (let wy = groundY - bh + 12; wy < groundY - 16; wy += 16) {
                        if ((i + wy) % 3 !== 0) ctx.fillRect(i * bw + 10, wy, 6, 8);
                    }
                }
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, groundY, w, h - groundY);
            }
        },

        drawAnimatedEntity(ctx, { meta, actor, x, y, t, frame, mouthAperture, isCurrentlySpeaking }) {
            const scale = meta.scale || 1;
            const facing = actor.facing || 1;
            const pose = actor.pose || 'idle';
            const expr = actor.expression || 'neutral';

            this.drawPolishedCinemaCharacter(ctx, {
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
        },

        // =========================================================================
        // POLISHED 2.5D CINEMA CHARACTER (Sculpted Neck, Layered Hair, Detailed Clothes,
        // Expressive Eyes, Falling Tears & Real Audio-Driven Lip-Sync — NO Text Bubbles)
        // =========================================================================
        drawPolishedCinemaCharacter(ctx, opts) {
            const {
                x, y, scale, facing, pose, expr, gender, holding,
                shirtColor, pantsColor, hairColor, hat, beard,
                mouthAperture, isCurrentlySpeaking, t, frame
            } = opts;

            const isFemale = gender === 'female';
            const isChild = gender === 'child';
            const isMoving = pose === 'walk' || pose === 'run';
            const freq = pose === 'run' ? 18 : 11;
            const legAngle = isMoving ? Math.sin(t * freq) * 0.50 : 0;
            const bounceY = isMoving ? Math.abs(Math.sin(t * freq)) * 6 : (pose === 'celebrate' ? Math.abs(Math.sin(t * 11)) * 15 : 0);
            const bodyShake = (expr === 'laughing' || expr === 'crying') ? Math.sin(t * 25) * 2.2 : 0;

            // Ground Contact Shadow
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.ellipse(x, y + 4, 28 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(x, y - bounceY);
            if (pose === 'fall') ctx.rotate(facing * 1.15);
            ctx.scale(scale * facing, scale);

            // 1. Back Flowing Hair Layer (Female)
            if (isFemale) {
                const hairGrad = ctx.createLinearGradient(-24, -162, 12, -85);
                hairGrad.addColorStop(0, hairColor);
                hairGrad.addColorStop(1, '#090a0f');
                ctx.fillStyle = hairGrad;
                this.roundBox(ctx, -25, -162 + bodyShake, 34, 74, 16);
                ctx.fill();
            }

            // 2. Back Articulated Arm
            ctx.save();
            ctx.translate(-11, -104);
            let backArmRot = isMoving ? Math.sin(t * freq) * 0.45 : 0.12;
            if (pose === 'celebrate') backArmRot = -2.4;
            else if (pose === 'argue') backArmRot = -0.95 + Math.sin(t * 16) * 0.35;
            else if (pose === 'cry') backArmRot = -1.75 + Math.sin(t * 12) * 0.1;

            ctx.rotate(backArmRot);
            ctx.fillStyle = shirtColor;
            this.roundBox(ctx, -5.5, 0, 11, 34, 5.5);
            ctx.fill();
            ctx.fillStyle = '#fcd34d';
            ctx.beginPath();
            ctx.arc(0, 38, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 3. Articulated Legs & Detailed Shoes
            [-7, 7].forEach((hipX, idx) => {
                ctx.save();
                ctx.translate(hipX, -54);
                ctx.rotate(idx === 0 ? legAngle : -legAngle);

                ctx.fillStyle = isFemale ? '#fcd34d' : pantsColor;
                this.roundBox(ctx, -6, 0, 12, 46, 6);
                ctx.fill();

                ctx.fillStyle = isFemale ? shirtColor : '#f8fafc';
                this.roundBox(ctx, -6.5, 44, 19, 10, 5);
                ctx.fill();
                ctx.restore();
            });

            // 4. Sculpted Neck
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-5, -124 + bodyShake, 10, 12);

            // 5. Tailored Torso (A-line Dress with Belt for Female, Shaded Jacket with Collar for Male/Child)
            const torsoGrad = ctx.createLinearGradient(-20, -116, 20, -50);
            torsoGrad.addColorStop(0, shirtColor);
            torsoGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = torsoGrad;

            if (isFemale) {
                ctx.beginPath();
                ctx.moveTo(-15, -115 + bodyShake);
                ctx.lineTo(15, -115 + bodyShake);
                ctx.lineTo(27, -40 + bodyShake);
                ctx.lineTo(-27, -40 + bodyShake);
                ctx.closePath();
                ctx.fill();

                // Waist Belt
                ctx.fillStyle = 'rgba(255,255,255,0.28)';
                ctx.fillRect(-19, -82 + bodyShake, 38, 5);
            } else {
                this.roundBox(ctx, -19, -115 + bodyShake, 38, 63, 13);
                ctx.fill();

                // White Collar & Rim Highlight
                ctx.fillStyle = 'rgba(255,255,255,0.88)';
                ctx.beginPath();
                ctx.moveTo(-6, -115 + bodyShake);
                ctx.lineTo(6, -115 + bodyShake);
                ctx.lineTo(0, -96 + bodyShake);
                ctx.closePath();
                ctx.fill();
            }

            // 6. Front Articulated Arm & Props
            ctx.save();
            ctx.translate(11, -104);
            let frontArmRot = isMoving ? -Math.sin(t * freq) * 0.45 : -0.15;
            if (pose === 'beg' || pose === 'point') frontArmRot = -1.25 + Math.sin(t * 7) * 0.08;
            else if (pose === 'argue') frontArmRot = -1.35 + Math.cos(t * 18) * 0.35;
            else if (pose === 'celebrate') frontArmRot = -2.55 + Math.sin(t * 14) * 0.15;
            else if (pose === 'cry') frontArmRot = -1.85 + Math.cos(t * 12) * 0.1;

            ctx.rotate(frontArmRot);
            ctx.fillStyle = shirtColor;
            this.roundBox(ctx, -5.5, 0, 11, 35, 5.5);
            ctx.fill();

            ctx.fillStyle = '#fcd34d';
            ctx.beginPath();
            ctx.arc(0, 39, 6.5, 0, Math.PI * 2);
            ctx.fill();

            if (holding === 'suitcase') {
                ctx.save();
                ctx.translate(0, 43);
                ctx.fillStyle = '#78350f';
                this.roundBox(ctx, -16, 0, 32, 24, 5);
                ctx.fill();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 2;
                ctx.strokeRect(-12, 4, 24, 16);
                ctx.restore();
            } else if (holding === 'money') {
                ctx.save();
                ctx.translate(0, 43);
                ctx.fillStyle = '#16a34a';
                this.roundBox(ctx, -4, -8, 28, 16, 4);
                ctx.fill();
                ctx.restore();
            } else if (holding === 'gold_bag') {
                ctx.save();
                ctx.translate(2, 47);
                ctx.fillStyle = '#eab308';
                ctx.beginPath();
                ctx.arc(0, 6, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();

            // 7. Sculpted 2.5D Head with Smooth Skin Gradient
            const headY = -142 + bodyShake;
            const headRadius = isChild ? 25 : 23;
            const headGrad = ctx.createRadialGradient(-4, headY - 6, 4, 0, headY, headRadius + 2);
            headGrad.addColorStop(0, '#fef08a');
            headGrad.addColorStop(0.7, '#fcd34d');
            headGrad.addColorStop(1, '#d97706');
            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
            ctx.fill();

            // Hair / Crown / Hat
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
                ctx.arc(-1, headY - 4, headRadius + 0.8, Math.PI * 0.88, Math.PI * 2.12);
                ctx.fill();
            }

            if (beard && !isFemale && !isChild) {
                ctx.fillStyle = hairColor;
                ctx.beginPath();
                ctx.arc(3, headY + 8, 15, 0, Math.PI);
                ctx.fill();
            }

            // 8. Expressive Eyebrow & Glossy Eye with Dual Catchlights
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
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 2.6;
                ctx.beginPath();
                ctx.moveTo(4, headY - 4);
                ctx.lineTo(14, headY - 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(8.5, headY - 3, 5.0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(9.8, headY - 3, 2.8, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(10.8, headY - 4.3, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Streaming Tears when Crying
            if (expr === 'crying') {
                ctx.fillStyle = '#38bdf8';
                const tear1 = (t * 48) % 25;
                const tear2 = ((t * 48) + 12) % 25;
                ctx.beginPath();
                ctx.arc(11, headY + 1 + tear1, 2.6, 0, Math.PI * 2);
                ctx.arc(7, headY + 3 + tear2, 2.4, 0, Math.PI * 2);
                ctx.fill();
            }

            // 9. REAL AUDIO-DRIVEN LIP-SYNC MOUTH (NO FLOATING TEXT BUBBLES!)
            const openAmount = Math.min(1, Math.max(0, mouthAperture || 0));
            const mouthH = openAmount * 9.5;
            const mouthW = 6.5 + openAmount * 2.5;
            const mouthX = 8;
            const mouthY = headY + 8.5 + openAmount * 2;

            ctx.save();
            if (openAmount > 0.08) {
                ctx.fillStyle = '#4c0519';
                ctx.beginPath();
                ctx.ellipse(mouthX, mouthY, mouthW, Math.max(2.5, mouthH), 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(mouthX - mouthW * 0.65, mouthY - Math.max(2.5, mouthH) + 0.8, mouthW * 1.3, 2.6);

                ctx.fillStyle = '#fb7185';
                ctx.beginPath();
                ctx.ellipse(mouthX, mouthY + Math.max(2.5, mouthH) * 0.45, mouthW * 0.55, Math.max(1.5, mouthH * 0.35), 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = isFemale ? '#be123c' : '#78350f';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.ellipse(mouthX, mouthY, mouthW, Math.max(2.5, mouthH), 0, 0, Math.PI * 2);
                ctx.stroke();

                if (isCurrentlySpeaking) {
                    const wavePulse = (t * 6) % 1;
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.60 * (1 - wavePulse)})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(mouthX + 12, mouthY, 8 + wavePulse * 14, -0.45, 0.45);
                    ctx.stroke();
                }
            } else {
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

        renderCompletedVideoPlayer(cardWrap, videoUrl, promptText, ext, durationSec) {
            const fileName = `zoneweb-${durationSec}s-tts-video.${ext}`;
            window.__lastGeneratedVideoUrl = videoUrl;
            window.__lastGeneratedVideoPrompt = promptText;

            cardWrap.innerHTML = `
                <div class="w-full max-w-[94%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            ${this.getCustomLogoSvg(18)}
                            <span class="text-xs md:text-sm font-extrabold text-white">AI Cinema TTS Video Ready</span>
                        </div>
                        <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">${durationSec}.0s • HUMAN TTS</span>
                    </div>

                    <p class="text-xs text-gray-300">Scene: <b class="text-white">${promptText.replace(/</g, '&lt;')}</b></p>

                    <div class="rounded-2xl overflow-hidden border border-white/15 bg-black shadow-xl flex justify-center">
                        <video src="${videoUrl}" controls autoplay loop playsinline class="w-full max-h-96 object-contain bg-black"></video>
                    </div>

                    <div class="flex flex-wrap gap-2 pt-1">
                        <a href="${videoUrl}" download="${fileName}" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition">
                            <i class="fa-solid fa-download"></i> Download ${durationSec}s Video
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
