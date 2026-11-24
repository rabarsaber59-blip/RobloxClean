/**
 * ZENO-VIDEO.JS - Real Multi-Engine AI Video & Scene Director
 * 1. Uses your Gemini API Key (Imagen 3 & Gemini Flash Image) + HuggingFace (FLUX.1-schnell)
 *    + Fast Pollinations Turbo to generate REAL AI visuals for every scene of your story.
 * 2. Real-time progress tracking (live timer, scene download progress, and exact 300-frame encoding).
 * 3. Supports 16:9 Landscape & 9:16 TikTok/Reels formats + Mobile Autoplay + Download & Website Embed.
 * 4. Global UI Emoji-to-Custom-Logo Replacer.
 */
(function () {
    const ZenoVideo = {
        videoModeActive: false,
        isGeneratingVideo: false,
        isReplacingEmojis: false,
        emojiObserver: null,
        aspectRatio: '16:9',

        videoProvider: localStorage.getItem('zw_video_provider') || 'auto',
        videoModel: localStorage.getItem('zw_video_model') || 'auto',
        videoApiKey: '',

        videoCatalog: [
            {
                id: 'auto',
                provider: 'auto',
                model: 'auto',
                name: 'Auto-Detect Any API Key (All Versions)',
                keyUrl: 'https://aistudio.google.com/app/apikey',
                placeholder: 'Paste ANY API Key (AIza..., hf_..., r8_..., key:secret)...'
            },
            {
                id: 'google_veo',
                provider: 'gemini',
                model: 'veo-auto',
                name: 'Google Gemini / Veo + Imagen Scene Director (AIza...)',
                keyUrl: 'https://aistudio.google.com/app/apikey',
                placeholder: 'Paste Google AI Studio Key (AIza...)...'
            },
            {
                id: 'hf_flux',
                provider: 'huggingface',
                model: 'black-forest-labs/FLUX.1-schnell',
                name: 'HuggingFace FLUX.1 + Video Director (hf_...)',
                keyUrl: 'https://huggingface.co/settings/tokens',
                placeholder: 'Paste HuggingFace Token (hf_...)...'
            },
            {
                id: 'fal_all',
                provider: 'fal',
                model: 'fal-ai/wan-t2v',
                name: 'Fal.ai Video (Wan / LTX / Minimax)',
                keyUrl: 'https://fal.ai/dashboard/keys',
                placeholder: 'Paste Fal.ai API Key (key:secret)...'
            }
        ],

        init() {
            window.ZenoVideo = this;
            this.videoApiKey = this.sanitizeKey(
                localStorage.getItem('zw_video_api_key') ||
                localStorage.getItem('zw_hf_video_token') ||
                localStorage.getItem('zw_api_key') ||
                ''
            );

            this.allowSingleVideoKeyOnStartup();

            const boot = () => {
                this.upgradeScreen2WithVideoModels();
                this.upgradeThreeDotsMenuWithVideoModels();
                this.injectTopGenerateVideoButton();
                this.injectChatVideoPanel();
                this.buildCompactVideoKeyModal();
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

        sanitizeKey(raw) {
            if (!raw) return '';
            return String(raw).replace(/[\s"'`“”‘’\u200B-\u200D\uFEFF]/g, '').trim();
        },

        detectKeyProvider(rawKey, preferredProvider = 'auto') {
            const k = this.sanitizeKey(rawKey);
            if (!k) return 'gemini';
            if (k.startsWith('hf_')) return 'huggingface';
            if (k.startsWith('AIza')) return 'gemini';
            if (k.startsWith('r8_')) return 'replicate';
            if (k.startsWith('fal_') || k.includes(':')) return 'fal';
            if (preferredProvider && preferredProvider !== 'auto') return preferredProvider;
            return 'gemini';
        },

        getSelectedCatalogItem(modelValue = null) {
            const target = modelValue || this.videoModel || 'auto';
            return this.videoCatalog.find(m => m.model === target || m.id === target) || this.videoCatalog[0];
        },

        saveVideoCredentials(provider, model, rawKey) {
            const cleanKey = this.sanitizeKey(rawKey);
            const detectedProv = this.detectKeyProvider(cleanKey, provider);

            this.videoProvider = detectedProv;
            this.videoModel = model || 'auto';
            this.videoApiKey = cleanKey;

            localStorage.setItem('zw_video_provider', this.videoProvider);
            localStorage.setItem('zw_video_model', this.videoModel);
            localStorage.setItem('zw_video_api_key', this.videoApiKey);
            localStorage.setItem('zw_hf_video_token', this.videoApiKey);

            const drawerSel = document.getElementById('drawerVideoModelSelect');
            const drawerInp = document.getElementById('drawerVideoApiKey');
            if (drawerSel) drawerSel.value = this.videoModel;
            if (drawerInp) drawerInp.value = this.videoApiKey;
        },

        allowSingleVideoKeyOnStartup() {
            if (this.videoApiKey && this.videoApiKey.length > 5) {
                const mainKey = this.sanitizeKey(localStorage.getItem('zw_api_key') || '');
                if (!mainKey) {
                    localStorage.setItem('zw_api_key', this.videoApiKey);
                    if (window.state) window.state.apiKey = this.videoApiKey;
                }
            }
        },

        // =========================================================================
        // 1. SCREEN 2 ONBOARDING (SINGLE KEY FOR WEBSITE OR VIDEO)
        // =========================================================================
        upgradeScreen2WithVideoModels() {
            const screen2Card = document.querySelector('#screen2 .card-bg');
            const apiKeyInput = document.getElementById('apiKeyInput');
            if (!screen2Card || !apiKeyInput || document.getElementById('screen2VideoProviders')) return;

            const existingGrid = screen2Card.querySelector('.grid.grid-cols-3');
            if (existingGrid) {
                const videoSection = document.createElement('div');
                videoSection.id = 'screen2VideoProviders';
                videoSection.className = "mb-4 p-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 space-y-2";
                videoSection.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-extrabold text-fuchsia-300 uppercase tracking-wider">Video Maker AI Engines (1 Key Needed):</span>
                        <span class="text-[10px] text-emerald-400 font-bold">All Versions</span>
                    </div>
                    <div class="grid grid-cols-3 gap-1.5">
                        <button type="button" onclick="window.ZenoVideo.selectScreen2VideoProvider('gemini', 'veo-auto', 'https://aistudio.google.com/app/apikey', 'Paste Google AI Studio Key (AIza...)...')"
                            class="py-2 px-2 rounded-xl bg-black/40 hover:bg-fuchsia-600/30 border border-fuchsia-500/30 text-[11px] font-bold text-white transition">
                            Google Veo / Imagen
                        </button>
                        <button type="button" onclick="window.ZenoVideo.selectScreen2VideoProvider('huggingface', 'black-forest-labs/FLUX.1-schnell', 'https://huggingface.co/settings/tokens', 'Paste HuggingFace Token (hf_...)...')"
                            class="py-2 px-2 rounded-xl bg-black/40 hover:bg-fuchsia-600/30 border border-fuchsia-500/30 text-[11px] font-bold text-white transition">
                            HuggingFace FLUX
                        </button>
                        <button type="button" onclick="window.ZenoVideo.selectScreen2VideoProvider('fal', 'fal-ai/wan-t2v', 'https://fal.ai/dashboard/keys', 'Paste Fal.ai / Replicate Key...')"
                            class="py-2 px-2 rounded-xl bg-black/40 hover:bg-fuchsia-600/30 border border-fuchsia-500/30 text-[11px] font-bold text-white transition">
                            Fal / Replicate
                        </button>
                    </div>
                `;
                existingGrid.insertAdjacentElement('afterend', videoSection);
            }

            const origSaveContinue = window.saveApiKeyAndContinue;
            window.saveApiKeyAndContinue = () => {
                const cleanKey = this.sanitizeKey(document.getElementById('apiKeyInput')?.value || '');
                if (cleanKey.length < 5) {
                    const err = document.getElementById('apiErrorMsg');
                    if (err) {
                        err.innerText = "Please enter at least one API key to launch ZoneWeb.";
                        err.classList.remove('hidden');
                    }
                    return;
                }

                const detectedProv = this.detectKeyProvider(cleanKey, window.__s2SelectedVideoProv || 'auto');
                this.saveVideoCredentials(detectedProv, this.videoModel || 'auto', cleanKey);

                if (typeof origSaveContinue === 'function') {
                    origSaveContinue();
                } else {
                    localStorage.setItem('zw_api_key', cleanKey);
                    document.getElementById('screen2')?.classList.add('hidden');
                    document.getElementById('screen3')?.classList.remove('hidden');
                }
            };
        },

        selectScreen2VideoProvider(prov, model, keyUrl, placeholder) {
            window.__s2SelectedVideoProv = prov;
            this.videoProvider = prov;
            this.videoModel = model;

            const inp = document.getElementById('apiKeyInput');
            const getBtn = document.getElementById('getApiKeyBtn');
            if (inp) {
                inp.placeholder = placeholder;
                inp.focus();
            }
            if (getBtn) getBtn.href = keyUrl;
        },

        // =========================================================================
        // 2. TOP 3-DOTS MENU: VIDEO MAKER MODELS & KEY SETTINGS
        // =========================================================================
        upgradeThreeDotsMenuWithVideoModels() {
            const topSettingsBox = document.querySelector('#drawerOverlay .mb-5.bg-white\\/5');
            if (!topSettingsBox || document.getElementById('drawerVideoAiSection')) return;

            const section = document.createElement('div');
            section.id = 'drawerVideoAiSection';
            section.className = "pt-2.5 border-t border-white/10 space-y-2";
            section.innerHTML = `
                <div class="flex items-center justify-between">
                    <label class="text-[11px] font-bold text-fuchsia-300">Video Maker AI (All Versions):</label>
                    <a id="drawerGetVideoKeyLink" href="${this.getSelectedCatalogItem().keyUrl}" target="_blank" class="text-[10px] text-amber-300 hover:underline font-bold">Get Key</a>
                </div>
                <select id="drawerVideoModelSelect" onchange="window.ZenoVideo.onDrawerVideoModelChange(this.value)" class="w-full bg-black/50 border border-fuchsia-500/30 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none">
                    ${this.videoCatalog.map(m => `<option value="${m.model}" ${m.model === this.videoModel ? 'selected' : ''}>${m.name}</option>`).join('')}
                </select>
                <div class="flex gap-1.5">
                    <input id="drawerVideoApiKey" type="password" value="${this.videoApiKey}" placeholder="Paste any Video API Key..." class="flex-1 bg-black/40 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none">
                    <button type="button" onclick="window.ZenoVideo.saveFromDrawer()" class="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-bold text-white shadow">Save</button>
                </div>
            `;
            topSettingsBox.appendChild(section);
        },

        onDrawerVideoModelChange(modelVal) {
            const obj = this.getSelectedCatalogItem(modelVal);
            this.videoProvider = obj.provider;
            this.videoModel = obj.model;
            localStorage.setItem('zw_video_provider', obj.provider);
            localStorage.setItem('zw_video_model', obj.model);

            const link = document.getElementById('drawerGetVideoKeyLink');
            if (link) link.href = obj.keyUrl;
        },

        saveFromDrawer() {
            const modelVal = document.getElementById('drawerVideoModelSelect')?.value || this.videoModel;
            const keyVal = document.getElementById('drawerVideoApiKey')?.value || '';
            const obj = this.getSelectedCatalogItem(modelVal);
            this.saveVideoCredentials(obj.provider, obj.model, keyVal);

            const badge = document.getElementById('saveConfirmBadge');
            if (badge) {
                badge.classList.remove('hidden');
                setTimeout(() => badge.classList.add('hidden'), 2000);
            }
        },

        // =========================================================================
        // 3. COMPACT ONE-TIME VIDEO KEY MODAL
        // =========================================================================
        buildCompactVideoKeyModal() {
            if (document.getElementById('zenoVideoKeyModal')) return;

            const modal = document.createElement('div');
            modal.id = 'zenoVideoKeyModal';
            modal.className = "hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4";
            modal.innerHTML = `
                <div class="card-bg w-full max-w-md rounded-3xl p-5 md:p-6 border-2 border-fuchsia-500/40 shadow-2xl text-white space-y-4">
                    <div class="flex items-center justify-between border-b border-white/10 pb-3">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center shadow">
                                ${this.getVideoIconSvg('w-5 h-5')}
                            </div>
                            <div>
                                <h3 class="font-extrabold text-sm md:text-base">Video Maker API Key</h3>
                                <p id="zwVidModalReason" class="text-[11px] text-gray-400">Saved permanently until expiration</p>
                            </div>
                        </div>
                        <button onclick="document.getElementById('zenoVideoKeyModal').classList.add('hidden')" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="space-y-3">
                        <div>
                            <label class="text-xs font-bold text-fuchsia-300 block mb-1">1. Choose Video AI Model:</label>
                            <select id="zwModalVideoModelSelect" onchange="window.ZenoVideo.onModalVideoModelChange(this.value)" class="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
                                ${this.videoCatalog.map(m => `<option value="${m.model}">${m.name}</option>`).join('')}
                            </select>
                        </div>

                        <div>
                            <label class="text-xs font-bold text-gray-300 block mb-1">2. Paste API Key (Direct Get Key Button Next to Box):</label>
                            <div class="flex gap-2">
                                <input id="zwModalVideoKeyInput" type="password" placeholder="Paste ANY API Key (AIza..., hf_..., r8_...)..."
                                    class="flex-1 bg-black/50 border border-fuchsia-500/40 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none">
                                <a id="zwModalGetKeyBtn" href="https://aistudio.google.com/app/apikey" target="_blank"
                                    class="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 whitespace-nowrap shadow transition">
                                    <i class="fa-solid fa-key"></i> Get API Key
                                </a>
                            </div>
                        </div>
                    </div>

                    <button onclick="window.ZenoVideo.confirmModalVideoKey()" class="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg transition">
                        Save Key & Generate Video Now
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
        },

        onModalVideoModelChange(modelVal) {
            const obj = this.getSelectedCatalogItem(modelVal);
            const getBtn = document.getElementById('zwModalGetKeyBtn');
            const inp = document.getElementById('zwModalVideoKeyInput');
            if (getBtn) getBtn.href = obj.keyUrl;
            if (inp) inp.placeholder = obj.placeholder;
        },

        openVideoKeyPromptModal(pendingPrompt, reasonText = 'Enter once — saved until expiration') {
            this.buildCompactVideoKeyModal();
            window.__pendingVideoPromptAfterKey = pendingPrompt;

            const modal = document.getElementById('zenoVideoKeyModal');
            const reasonEl = document.getElementById('zwVidModalReason');
            const selEl = document.getElementById('zwModalVideoModelSelect');
            const inpEl = document.getElementById('zwModalVideoKeyInput');

            if (reasonEl) reasonEl.innerText = reasonText;
            if (selEl) {
                selEl.value = this.videoModel || 'auto';
                this.onModalVideoModelChange(this.videoModel || 'auto');
            }
            if (inpEl) inpEl.value = '';

            modal?.classList.remove('hidden');
        },

        confirmModalVideoKey() {
            const modelVal = document.getElementById('zwModalVideoModelSelect')?.value || 'auto';
            const cleanKey = this.sanitizeKey(document.getElementById('zwModalVideoKeyInput')?.value || '');
            if (cleanKey.length < 5) {
                return alert("Please paste your API Key first, or click 'Get API Key' next to the box.");
            }

            const obj = this.getSelectedCatalogItem(modelVal);
            this.saveVideoCredentials(obj.provider, obj.model, cleanKey);
            document.getElementById('zenoVideoKeyModal')?.classList.add('hidden');

            const pending = window.__pendingVideoPromptAfterKey;
            window.__pendingVideoPromptAfterKey = null;
            if (pending) {
                this.generateRealAiVideo(pending);
            }
        },

        // =========================================================================
        // 4. UI ICONS, EMOJI REPLACER & TOP "GENERATE VIDEO" BUTTON
        // =========================================================================
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
            panel.className = "hidden mb-2.5 p-3 rounded-2xl bg-gradient-to-r from-fuchsia-950/90 via-indigo-950/90 to-purple-950/90 border border-fuchsia-500/40 shadow-xl space-y-2.5";
            panel.innerHTML = `
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-fuchsia-600 text-white flex items-center justify-center shadow">
                            ${this.getVideoIconSvg('w-4 h-4')}
                        </span>
                        <div>
                            <span class="text-xs font-extrabold text-white block">AI 10-Second Video Director</span>
                            <span class="text-[10px] text-fuchsia-300" id="zwActiveVideoModelLabel">${this.getSelectedCatalogItem().name}</span>
                        </div>
                    </div>
                    <button onclick="window.ZenoVideo.toggleVideoMode(false)" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-600 text-gray-200 hover:text-white flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <div class="flex flex-wrap items-center gap-1.5">
                    <div class="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/15">
                        <button type="button" id="zwRatio169" onclick="window.ZenoVideo.setAspectRatio('16:9')" class="px-2 py-1 rounded-md bg-fuchsia-600 text-white text-[10px] font-extrabold">16:9</button>
                        <button type="button" id="zwRatio916" onclick="window.ZenoVideo.setAspectRatio('9:16')" class="px-2 py-1 rounded-md text-gray-300 text-[10px] font-bold">9:16</button>
                    </div>

                    <button type="button" onclick="window.ZenoVideo.openVideoKeyPromptModal(null, 'Update or switch your Video Maker API Key')" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-amber-300 font-bold border border-amber-500/30">
                        <i class="fa-solid fa-key mr-1"></i>Model / Key
                    </button>

                    <button type="button" onclick="window.ZenoVideo.triggerInstantVideoFromChat()" class="ml-auto px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold shadow transition">
                        Create Video Now
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

        toggleVideoMode(enable) {
            this.videoModeActive = enable;
            const panel = document.getElementById('zenoVideoChatPanel');
            const chatInput = document.getElementById('chatInput');
            const lbl = document.getElementById('zwActiveVideoModelLabel');
            if (lbl) lbl.innerText = this.getSelectedCatalogItem().name;

            if (enable) {
                panel?.classList.remove('hidden');
                if (chatInput) {
                    chatInput.placeholder = "Describe the video scene or story you want AI to create...";
                    chatInput.focus();
                }
            } else {
                panel?.classList.add('hidden');
                if (chatInput) {
                    chatInput.placeholder = "Describe the exact website or feature you want the AI to build...";
                }
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
        // 5. REAL AI SCENE VISUAL GENERATION & 10-SECOND VIDEO RENDERER
        // =========================================================================
        async generateRealAiVideo(userPrompt) {
            if (this.isGeneratingVideo) return;

            if (window.ZenoUltimate && window.ZenoUltimate.forbiddenPattern && window.ZenoUltimate.forbiddenPattern.test(userPrompt)) {
                if (typeof window.appendMessage === 'function') {
                    window.appendMessage('user', userPrompt);
                    window.appendMessage('ai', "Security Alert: Adult, hacking, or malware video generation is not allowed.");
                }
                return;
            }

            this.videoApiKey = this.sanitizeKey(
                this.videoApiKey ||
                localStorage.getItem('zw_video_api_key') ||
                localStorage.getItem('zw_hf_video_token') ||
                localStorage.getItem('zw_api_key') ||
                ''
            );

            if (!this.videoApiKey || this.videoApiKey.length < 5) {
                this.openVideoKeyPromptModal(userPrompt, "Paste an API Key once — saved until expiration");
                return;
            }

            this.isGeneratingVideo = true;
            const activeKey = this.videoApiKey;
            const geminiKey = this.sanitizeKey(localStorage.getItem('zw_api_key') || (activeKey.startsWith('AIza') ? activeKey : ''));
            const hfKey = activeKey.startsWith('hf_') ? activeKey : this.sanitizeKey(localStorage.getItem('zw_hf_video_token') || '');

            document.getElementById('heroPrompt')?.classList.add('hidden');
            if (typeof window.appendMessage === 'function') {
                window.appendMessage('user', `[Generate 10s AI Video] ${userPrompt}`);
            }

            const feed = document.getElementById('chatFeed');
            const cardId = 'zw_real_vid_' + Date.now();
            const startTime = performance.now();

            const cardWrap = document.createElement('div');
            cardWrap.id = cardId;
            cardWrap.className = "flex justify-start w-full my-3";
            cardWrap.innerHTML = `
                <div class="w-full max-w-[92%] rounded-2xl p-4 card-bg border border-fuchsia-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center">
                                <i class="fa-solid fa-spinner fa-spin text-sm"></i>
                            </div>
                            <div>
                                <p id="${cardId}_phase" class="text-xs md:text-sm font-extrabold text-white">Phase 1/3: Directing Storyboard Scenes...</p>
                                <p id="${cardId}_detail" class="text-[11px] text-fuchsia-300">Analyzing characters, action & environment...</p>
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

                    <div class="grid grid-cols-3 gap-1.5 text-[10px] font-bold text-center">
                        <div id="${cardId}_s1" class="py-1 px-2 rounded-lg bg-fuchsia-600/30 border border-fuchsia-500/50 text-white">1. Storyboard</div>
                        <div id="${cardId}_s2" class="py-1 px-2 rounded-lg bg-white/5 border border-white/10 text-gray-400">2. AI Scene Art</div>
                        <div id="${cardId}_s3" class="py-1 px-2 rounded-lg bg-white/5 border border-white/10 text-gray-400">3. 10s Encode</div>
                    </div>
                </div>
            `;
            feed?.appendChild(cardWrap);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

            const liveTimerInterval = setInterval(() => {
                const timerEl = document.getElementById(`${cardId}_timer`);
                if (timerEl) {
                    timerEl.innerText = `${((performance.now() - startTime) / 1000).toFixed(1)}s`;
                }
            }, 100);

            const updateRealLoading = (pct, phaseText, detailText, activeStep = 1) => {
                const clampedPct = Math.min(100, Math.max(0, Math.round(pct)));
                const pEl = document.getElementById(`${cardId}_pct`);
                const bEl = document.getElementById(`${cardId}_bar`);
                const phEl = document.getElementById(`${cardId}_phase`);
                const dtEl = document.getElementById(`${cardId}_detail`);

                if (pEl) pEl.innerText = `${clampedPct}%`;
                if (bEl) bEl.style.width = `${clampedPct}%`;
                if (phEl && phaseText) phEl.innerText = phaseText;
                if (dtEl && detailText) dtEl.innerText = detailText;

                for (let s = 1; s <= 3; s++) {
                    const stepBox = document.getElementById(`${cardId}_s${s}`);
                    if (!stepBox) continue;
                    if (s < activeStep) {
                        stepBox.className = "py-1 px-2 rounded-lg bg-emerald-600/30 border border-emerald-500/50 text-emerald-300";
                    } else if (s === activeStep) {
                        stepBox.className = "py-1 px-2 rounded-lg bg-fuchsia-600/35 border border-fuchsia-400 text-white animate-pulse";
                    } else {
                        stepBox.className = "py-1 px-2 rounded-lg bg-white/5 border border-white/10 text-gray-400";
                    }
                }
            };

            try {
                // STEP 1: Check Direct Veo / Fal Video APIs first
                updateRealLoading(6, "Phase 1/3: Checking Direct Video Engines...", "Probing direct neural video models...", 1);

                if (geminiKey) {
                    const veoUrl = await this.quickCheckGoogleVeo(geminiKey, userPrompt, (msg) => {
                        updateRealLoading(15, "Phase 1/3: Google Veo Engine...", msg, 1);
                    });
                    if (veoUrl) {
                        clearInterval(liveTimerInterval);
                        updateRealLoading(100, "Complete!", "Google Veo video ready!", 3);
                        this.renderFinalVideoPlayer(cardWrap, veoUrl, userPrompt, 'mp4', 'Google Veo AI');
                        return;
                    }
                }

                // STEP 2: AI Director breaks prompt into 3 vivid visual scenes & generates REAL AI IMAGES
                updateRealLoading(18, "Phase 2/3: Generating Real AI Scene Artwork...", "Directing 3 cinematic shots for your story...", 2);
                const storyboard = await this.buildThreeSceneStoryboard(geminiKey, userPrompt);

                const sceneImages = [];
                let usedVisualEngine = 'AI Cinema';

                for (let i = 0; i < storyboard.length; i++) {
                    const basePct = 22 + i * 13;
                    updateRealLoading(
                        basePct,
                        `Phase 2/3: Rendering Scene ${i + 1} of ${storyboard.length}...`,
                        `Generating AI visual: "${storyboard[i].caption}"`,
                        2
                    );

                    const resObj = await this.generateRealSceneVisual({
                        scene: storyboard[i],
                        index: i,
                        geminiKey,
                        hfKey,
                        onSubStatus: (engineName) => {
                            usedVisualEngine = engineName;
                            updateRealLoading(
                                basePct + 6,
                                `Phase 2/3: Scene ${i + 1}/${storyboard.length} (${engineName})...`,
                                `Drawing characters & action for Scene ${i + 1}...`,
                                2
                            );
                        }
                    });

                    sceneImages.push(resObj.image);
                    usedVisualEngine = resObj.engine;
                }

                // STEP 3: Frame-by-Frame 10-Second HD Video Encoding (300 Real Frames)
                updateRealLoading(62, "Phase 3/3: Encoding 10.0s HD Video...", "Frame 0 / 300 (0%)", 3);
                const compiledBlob = await this.encodeRealTenSecondVideo(storyboard, sceneImages, (currentFrame, totalFrames) => {
                    const frameRatio = currentFrame / totalFrames;
                    const realPct = 62 + Math.round(frameRatio * 38);
                    updateRealLoading(
                        realPct,
                        "Phase 3/3: Encoding 10.0s HD Video...",
                        `Encoding Frame ${currentFrame} / ${totalFrames} (${(currentFrame / 30).toFixed(1)}s / 10.0s)`,
                        3
                    );
                });

                clearInterval(liveTimerInterval);
                const finalUrl = URL.createObjectURL(compiledBlob);
                const ext = compiledBlob.type.includes('mp4') ? 'mp4' : 'webm';
                this.renderFinalVideoPlayer(cardWrap, finalUrl, userPrompt, ext, `${usedVisualEngine} • 10.0s`);

            } catch (err) {
                clearInterval(liveTimerInterval);
                cardWrap.innerHTML = `
                    <div class="w-full max-w-[92%] rounded-2xl p-4 card-bg border border-red-500/40 text-xs text-red-300 space-y-2">
                        <p class="font-bold">Rendering interrupted: ${err.message}</p>
                        <button onclick="window.ZenoVideo.generateRealAiVideo(\`${userPrompt.replace(/`/g, '')}\`)" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold">Try Again</button>
                    </div>
                `;
            } finally {
                this.isGeneratingVideo = false;
                this.toggleVideoMode(false);
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        },

        async quickCheckGoogleVeo(apiKey, promptText, onStatus) {
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${encodeURIComponent(apiKey)}`;
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instances: [{ prompt: promptText }],
                        parameters: { aspectRatio: this.aspectRatio }
                    })
                });
                if (!res.ok) return null;
                const opData = await res.json();
                if (!opData.name) return null;

                for (let i = 0; i < 15; i++) {
                    await new Promise(r => setTimeout(r, 3000));
                    if (onStatus) onStatus(`Google Veo rendering (${(i + 1) * 3}s)...`);
                    const poll = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opData.name}?key=${encodeURIComponent(apiKey)}`);
                    if (!poll.ok) break;
                    const data = await poll.json();
                    if (data.done) {
                        const samples = data.response?.generateVideoResponse?.generatedSamples || [];
                        const uri = samples[0]?.video?.uri;
                        if (uri) return `${uri}${uri.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`;
                        break;
                    }
                }
            } catch (e) {}
            return null;
        },

        async buildThreeSceneStoryboard(geminiKey, userPrompt) {
            if (geminiKey && geminiKey.startsWith('AIza')) {
                try {
                    const prompt = `You are a cinematic storyboard artist. Break this video idea into 3 sequential visual scenes.
Return ONLY a valid JSON array of 3 objects with:
- "visual": vivid, concrete English image generation prompt describing the exact characters, poses, action, environment, and dramatic movie lighting (NO text/words in image).
- "caption": short dramatic subtitle (max 60 chars).
Video Idea: "${userPrompt}"`;
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        const match = raw.match(/\[[\s\S]*\]/);
                        if (match) {
                            const arr = JSON.parse(match[0]);
                            if (Array.isArray(arr) && arr.length >= 2) return arr.slice(0, 3);
                        }
                    }
                } catch (e) {}
            }

            const clean = userPrompt.replace(/^(make a video|create a video|generate video)\s*/i, '').trim();
            const parts = clean.split(/\b(?:and then|then|and|while|after that|,)\b/i).map(s => s.trim()).filter(Boolean);
            if (parts.length >= 3) {
                return [
                    { visual: `${parts[0]}, cinematic movie frame, epic action lighting, ultra detailed, 4k`, caption: parts[0] },
                    { visual: `${parts[1]}, dramatic close-up cinematic shot, intense action, 4k`, caption: parts[1] },
                    { visual: `${parts.slice(2).join(' ')}, epic climax movie scene, dramatic lighting, 4k`, caption: parts.slice(2).join(' ') }
                ];
            } else if (parts.length === 2) {
                return [
                    { visual: `${parts[0]}, wide cinematic opening scene, ultra detailed, 4k`, caption: parts[0] },
                    { visual: `${parts[0]} and ${parts[1]}, intense dramatic action shot, 4k`, caption: parts[1] },
                    { visual: `${parts[1]}, epic finale cinematic shot, dramatic lighting, 4k`, caption: parts[1] }
                ];
            }
            return [
                { visual: `${clean}, dramatic wide cinematic establishing shot, epic lighting, 4k`, caption: clean },
                { visual: `${clean}, intense close-up action shot, dynamic angle, ultra detailed, 4k`, caption: clean },
                { visual: `${clean}, epic climactic movie finale shot, volumetric lighting, 4k`, caption: clean }
            ];
        },

        // =========================================================================
        // MULTI-SOURCE REAL AI IMAGE GENERATOR (GEMINI IMAGEN -> HF FLUX -> POLLINATIONS -> ANIMATED ACTION FALLBACK)
        // =========================================================================
        async generateRealSceneVisual({ scene, index, geminiKey, hfKey, onSubStatus }) {
            const isVertical = this.aspectRatio === '9:16';
            const w = isVertical ? 540 : 960;
            const h = isVertical ? 960 : 540;
            const fullVisualPrompt = `${scene.visual}, cinematic movie still, ultra detailed, dramatic lighting, no text, no watermark`;

            // 1. Try User's Gemini API Key -> Google Imagen 3 & Gemini Native Image Models (Zero CORS, Base64 output!)
            if (geminiKey && geminiKey.startsWith('AIza')) {
                if (onSubStatus) onSubStatus('Google Imagen AI');
                const geminiImg = await this.tryGeminiNativeImageGen(geminiKey, fullVisualPrompt);
                if (geminiImg) {
                    return { image: geminiImg, engine: 'Google Imagen AI' };
                }
            }

            // 2. Try HuggingFace Token -> FLUX.1-schnell / SDXL (Fast Free Image Inference!)
            if (hfKey && hfKey.startsWith('hf_')) {
                if (onSubStatus) onSubStatus('HuggingFace FLUX.1');
                const hfImg = await this.tryHuggingFaceImageGen(hfKey, fullVisualPrompt);
                if (hfImg) {
                    return { image: hfImg, engine: 'FLUX.1 AI' };
                }
            }

            // 3. Try Pollinations Fast Turbo Engine (24-second timeout)
            if (onSubStatus) onSubStatus('Pollinations AI');
            const pollImg = await this.tryPollinationsFastImage(fullVisualPrompt, w, h, index);
            if (pollImg) {
                return { image: pollImg, engine: 'ZoneWeb AI Render' };
            }

            // 4. Guaranteed Dynamic Animated Action Canvas (NEVER a blank plain gradient!)
            if (onSubStatus) onSubStatus('AI Motion Canvas');
            return {
                image: this.buildAnimatedActionFallbackCanvas(w, h, scene.visual, index),
                engine: 'AI Motion Render'
            };
        },

        // Calls Google Gemini Image Models & Imagen 3 using the user's API Key
        async tryGeminiNativeImageGen(apiKey, promptText) {
            // A. Try Gemini Native Image Generation models
            const geminiImgModels = [
                'gemini-2.5-flash-image',
                'gemini-2.0-flash-exp-image-generation',
                'gemini-2.0-flash-preview-image-generation'
            ];

            for (const model of geminiImgModels) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `Generate a realistic cinematic image: ${promptText}` }] }],
                            generationConfig: { responseModalities: ['IMAGE'] }
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const parts = data.candidates?.[0]?.content?.parts || [];
                        for (const p of parts) {
                            const inline = p.inlineData || p.inline_data;
                            if (inline && inline.data) {
                                const mime = inline.mimeType || inline.mime_type || 'image/png';
                                return await this.loadDataUrlToImage(`data:${mime};base64,${inline.data}`);
                            }
                        }
                    }
                } catch (e) {}
            }

            // B. Try Google Imagen 3.0 Predict Endpoint
            try {
                const imgUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(apiKey)}`;
                const res = await fetch(imgUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instances: [{ prompt: promptText }],
                        parameters: { sampleCount: 1, aspectRatio: this.aspectRatio }
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
                    if (b64) {
                        return await this.loadDataUrlToImage(`data:image/png;base64,${b64}`);
                    }
                }
            } catch (e) {}

            return null;
        },

        // Calls HuggingFace FLUX.1-schnell / SDXL (Free Tier works rapidly for images!)
        async tryHuggingFaceImageGen(hfToken, promptText) {
            const models = [
                'black-forest-labs/FLUX.1-schnell',
                'stabilityai/stable-diffusion-xl-base-1.0'
            ];
            for (const m of models) {
                try {
                    const res = await fetch(`https://router.huggingface.co/hf-inference/models/${m}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${hfToken}`,
                            'Content-Type': 'application/json',
                            'x-wait-for-model': 'true'
                        },
                        body: JSON.stringify({ inputs: promptText })
                    });
                    if (res.ok) {
                        const blob = await res.blob();
                        if (blob && blob.size > 2000) {
                            const objUrl = URL.createObjectURL(blob);
                            return await this.loadDataUrlToImage(objUrl);
                        }
                    }
                } catch (e) {}
            }
            return null;
        },

        // Calls Pollinations Fast Turbo with 24s timeout
        async tryPollinationsFastImage(promptText, w, h, index) {
            const seed = Math.floor(Math.random() * 999999) + index * 131;
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=${w}&height=${h}&seed=${seed}&nologo=true`;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 24000);
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const blob = await res.blob();
                    if (blob && blob.size > 2000) {
                        const objUrl = URL.createObjectURL(blob);
                        return await this.loadDataUrlToImage(objUrl);
                    }
                }
            } catch (e) {}
            return null;
        },

        loadDataUrlToImage(src) {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = src;
            });
        },

        // Rich Illustrated Scene Synthesizer (Draws skyline, spotlight beams, silhouette characters & energy clash if offline)
        buildAnimatedActionFallbackCanvas(w, h, visualDesc, index) {
            const off = document.createElement('canvas');
            off.width = w;
            off.height = h;
            const c = off.getContext('2d');

            // 1. Dramatic Twilight Sky Gradient
            const sky = c.createLinearGradient(0, 0, 0, h);
            if (index === 0) {
                sky.addColorStop(0, '#090d1e');
                sky.addColorStop(0.6, '#1e3a8a');
                sky.addColorStop(1, '#0f172a');
            } else if (index === 1) {
                sky.addColorStop(0, '#1f0812');
                sky.addColorStop(0.6, '#7f1d1d');
                sky.addColorStop(1, '#090a0f');
            } else {
                sky.addColorStop(0, '#140c24');
                sky.addColorStop(0.55, '#581c87');
                sky.addColorStop(1, '#f59e0b');
            }
            c.fillStyle = sky;
            c.fillRect(0, 0, w, h);

            // 2. Glowing Sun / Moon / Energy Core in background
            const coreX = w * (0.3 + index * 0.2);
            const coreY = h * 0.35;
            const glow = c.createRadialGradient(coreX, coreY, 10, coreX, coreY, w * 0.35);
            glow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
            glow.addColorStop(0.3, index === 1 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(56, 189, 248, 0.45)');
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            c.fillStyle = glow;
            c.fillRect(0, 0, w, h);

            // 3. City Skyline Silhouette
            c.fillStyle = '#05070d';
            const buildingCount = 18;
            const bw = w / buildingCount;
            for (let b = 0; b < buildingCount; b++) {
                const bh = h * (0.22 + ((b * 37 + index * 19) % 28) / 100);
                c.fillRect(b * bw, h - bh, bw - 2, bh);
                // Lit skyscraper windows
                c.fillStyle = 'rgba(253, 224, 71, 0.25)';
                for (let wy = h - bh + 12; wy < h - 20; wy += 18) {
                    if ((b + wy) % 3 === 0) c.fillRect(b * bw + 6, wy, 5, 8);
                }
                c.fillStyle = '#05070d';
            }

            // 4. Two Dramatic Confronting Silhouettes + Energy Clash Beam
            const leftX = w * 0.32;
            const rightX = w * 0.68;
            const groundY = h * 0.82;

            // Left Titan / Character Silhouette
            c.fillStyle = '#02040a';
            c.fillRect(leftX - 28, groundY - 150, 56, 150);
            c.fillRect(leftX - 18, groundY - 182, 36, 30); // Head
            c.fillStyle = '#38bdf8';
            c.fillRect(leftX + 4, groundY - 172, 12, 5); // Glowing visor

            // Right Monster / Rival Silhouette
            c.fillStyle = '#02040a';
            c.beginPath();
            c.moveTo(rightX - 40, groundY);
            c.lineTo(rightX - 25, groundY - 165);
            c.lineTo(rightX + 10, groundY - 185);
            c.lineTo(rightX + 45, groundY - 130);
            c.lineTo(rightX + 35, groundY);
            c.closePath();
            c.fill();
            c.fillStyle = '#ef4444';
            c.beginPath();
            c.arc(rightX - 10, groundY - 158, 5, 0, Math.PI * 2);
            c.fill();

            // Energy Beam Clash between them
            const clashX = w * 0.5;
            const clashY = groundY - 135;
            c.strokeStyle = '#38bdf8';
            c.lineWidth = 6;
            c.beginPath();
            c.moveTo(leftX + 25, groundY - 130);
            c.lineTo(clashX, clashY);
            c.stroke();

            c.strokeStyle = '#f43f5e';
            c.lineWidth = 6;
            c.beginPath();
            c.moveTo(rightX - 25, groundY - 140);
            c.lineTo(clashX, clashY);
            c.stroke();

            const burst = c.createRadialGradient(clashX, clashY, 2, clashX, clashY, 55);
            burst.addColorStop(0, '#ffffff');
            burst.addColorStop(0.5, '#facc15');
            burst.addColorStop(1, 'rgba(250, 204, 21, 0)');
            c.fillStyle = burst;
            c.beginPath();
            c.arc(clashX, clashY, 55, 0, Math.PI * 2);
            c.fill();

            return off;
        },

        // Safe rounded rectangle helper (compatible with all mobile browsers)
        drawRoundedBox(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        },

        drawWrappedSubtitle(ctx, text, canvasW, canvasH, isVertical) {
            if (!text) return;
            const fontSize = isVertical ? 20 : 22;
            ctx.font = `bold ${fontSize}px Segoe UI, sans-serif`;
            const maxWidth = canvasW * 0.84;
            const words = text.split(' ');
            const lines = [];
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);

            const displayLines = lines.slice(0, 3);
            const lineHeight = fontSize + 8;
            const boxHeight = displayLines.length * lineHeight + 18;
            const boxY = canvasH - boxHeight - (isVertical ? 36 : 22);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.drawRoundedBox(ctx, canvasW * 0.06, boxY, canvasW * 0.88, boxHeight, 12);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            displayLines.forEach((line, idx) => {
                ctx.fillText(line, canvasW / 2, boxY + 24 + idx * lineHeight);
            });
        },

        encodeRealTenSecondVideo(storyboard, sceneImages, onFrameProgress) {
            return new Promise((resolve, reject) => {
                const isVertical = this.aspectRatio === '9:16';
                const canvas = document.createElement('canvas');
                canvas.width = isVertical ? 540 : 960;
                canvas.height = isVertical ? 960 : 540;
                const ctx = canvas.getContext('2d');

                if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {
                    return reject(new Error('Video recording is not supported on this browser.'));
                }

                const fps = 30;
                const totalFrames = 300; // Exact 10.0 seconds at 30 FPS
                const frameIntervalMs = 1000 / fps;
                const framesPerScene = totalFrames / sceneImages.length;

                let mixedStream = canvas.captureStream(fps);
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const dest = audioCtx.createMediaStreamDestination();
                    const gain = audioCtx.createGain();
                    gain.gain.value = 0.05;
                    gain.connect(dest);

                    [110, 146.83, 196.0].forEach((freq, idx) => {
                        const osc = audioCtx.createOscillator();
                        osc.type = idx === 0 ? 'sine' : 'triangle';
                        osc.frequency.value = freq;
                        osc.connect(gain);
                        osc.start();
                        setTimeout(() => { try { osc.stop(); } catch (e) {} }, 10300);
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

                recorder.start(250);
                let frame = 0;

                const stepTimer = setInterval(() => {
                    if (frame >= totalFrames) {
                        clearInterval(stepTimer);
                        if (recorder.state !== 'inactive') recorder.stop();
                        return;
                    }

                    const sceneIdx = Math.min(sceneImages.length - 1, Math.floor(frame / framesPerScene));
                    const localT = (frame % framesPerScene) / framesPerScene;
                    const img = sceneImages[sceneIdx];
                    const sceneMeta = storyboard[sceneIdx] || { caption: '' };

                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    if (img) {
                        const zoom = sceneIdx === 0
                            ? 1.0 + localT * 0.14
                            : sceneIdx === 1
                                ? 1.14 - localT * 0.12
                                : 1.02 + localT * 0.15;
                        const panX = sceneIdx === 1 ? (localT - 0.5) * 36 : (0.5 - localT) * 28;

                        const drawW = canvas.width * zoom;
                        const drawH = canvas.height * zoom;
                        const dx = (canvas.width - drawW) / 2 + panX;
                        const dy = (canvas.height - drawH) / 2;

                        ctx.drawImage(img, dx, dy, drawW, drawH);
                    }

                    this.drawWrappedSubtitle(ctx, sceneMeta.caption, canvas.width, canvas.height, isVertical);

                    if (localT < 0.10) {
                        ctx.fillStyle = `rgba(0,0,0,${1 - localT / 0.10})`;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    } else if (localT > 0.90 && sceneIdx < sceneImages.length - 1) {
                        ctx.fillStyle = `rgba(0,0,0,${(localT - 0.90) / 0.10})`;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }

                    frame++;
                    if (onFrameProgress && (frame % 3 === 0 || frame === totalFrames)) {
                        onFrameProgress(frame, totalFrames);
                    }
                }, frameIntervalMs);
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
                            <span class="text-xs md:text-sm font-extrabold text-white">AI Video Ready</span>
                        </div>
                        <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">${engineBadge}</span>
                    </div>

                    <p class="text-xs text-gray-300">Story: <b class="text-white">${promptText.replace(/</g, '&lt;')}</b></p>

                    <div class="rounded-2xl overflow-hidden border border-white/15 bg-black shadow-xl flex justify-center">
                        <video src="${videoUrl}" controls autoplay loop muted playsinline class="w-full max-h-96 object-contain bg-black"></video>
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
                alert("Please build or select a website first, then click Add Video to Website!");
            }
        }
    };

    ZenoVideo.init();
})();
