/**
 * ZENO-VIDEO.JS - Real Free AI Video Models, Screen 2 Onboarding, 3-Dots Selector & One-Time Key Modal
 * 1. Adds Free Video AI Models (HuggingFace Wan 2.1, CogVideoX, LTX-Video, Mochi-1, Google Veo, Fal.ai)
 *    to Screen 2 (New User Setup) and the Top 3-Dots Menu.
 * 2. Allows entering Screen 3 with just ONE API key (either a website key or a video key).
 * 3. Opens a compact Video API Key modal with a direct "Get API Key" button ONLY if no video key
 *    was saved yet (or if the saved token expires/returns 401/403). Saves permanently once pasted.
 * 4. Global Emoji-to-Custom-Logo Replacer across the UI.
 */
(function () {
    const ZenoVideo = {
        videoModeActive: false,
        isGeneratingVideo: false,
        isReplacingEmojis: false,
        emojiObserver: null,
        aspectRatio: '16:9',

        // Persistent Video API Key & Model State
        videoProvider: localStorage.getItem('zw_video_provider') || 'huggingface',
        videoModel: localStorage.getItem('zw_video_model') || 'Wan-AI/Wan2.1-T2V-1.3B',
        videoApiKey: (localStorage.getItem('zw_video_api_key') || localStorage.getItem('zw_hf_video_token') || '').trim(),

        // Free & Freemium Text-to-Video AI Models Directory
        freeVideoModels: [
            {
                id: 'hf_wan21',
                provider: 'huggingface',
                model: 'Wan-AI/Wan2.1-T2V-1.3B',
                name: 'Wan 2.1 T2V (HuggingFace Free)',
                badge: 'FREE',
                keyUrl: 'https://huggingface.co/settings/tokens',
                placeholder: 'Paste HuggingFace Free Token (hf_...)...'
            },
            {
                id: 'hf_cogvideo',
                provider: 'huggingface',
                model: 'THUDM/CogVideoX-5b',
                name: 'CogVideoX-5B (HuggingFace Free)',
                badge: 'FREE',
                keyUrl: 'https://huggingface.co/settings/tokens',
                placeholder: 'Paste HuggingFace Free Token (hf_...)...'
            },
            {
                id: 'hf_ltx',
                provider: 'huggingface',
                model: 'Lightricks/LTX-Video',
                name: 'LTX-Video Fast (HuggingFace Free)',
                badge: 'FREE',
                keyUrl: 'https://huggingface.co/settings/tokens',
                placeholder: 'Paste HuggingFace Free Token (hf_...)...'
            },
            {
                id: 'hf_mochi',
                provider: 'huggingface',
                model: 'genmo/mochi-1-preview',
                name: 'Mochi-1 Cinema (HuggingFace Free)',
                badge: 'FREE',
                keyUrl: 'https://huggingface.co/settings/tokens',
                placeholder: 'Paste HuggingFace Free Token (hf_...)...'
            },
            {
                id: 'google_veo',
                provider: 'gemini',
                model: 'veo-2.0-generate-001',
                name: 'Google Veo 2 (AI Studio Key)',
                badge: 'FREE TIER',
                keyUrl: 'https://aistudio.google.com/app/apikey',
                placeholder: 'Paste Google AI Studio Key (AIza...)...'
            },
            {
                id: 'fal_ltx',
                provider: 'fal',
                model: 'fal-ai/ltx-video',
                name: 'Fal.ai LTX-Video (Starter Credits)',
                badge: 'FREE CREDITS',
                keyUrl: 'https://fal.ai/dashboard/keys',
                placeholder: 'Paste Fal.ai API Key...'
            }
        ],

        init() {
            window.ZenoVideo = this;
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

        // If user entered ONLY a Video API Key on Screen 2, ensure Screen 3 unlocks automatically
        allowSingleVideoKeyOnStartup() {
            if (this.videoApiKey && this.videoApiKey.length > 5) {
                const mainKey = (localStorage.getItem('zw_api_key') || '').trim();
                if (!mainKey) {
                    localStorage.setItem('zw_api_key', this.videoApiKey);
                    if (window.state) window.state.apiKey = this.videoApiKey;
                }
            }
        },

        getSelectedModelObj(modelValue = null) {
            const target = modelValue || this.videoModel;
            return this.freeVideoModels.find(m => m.model === target || m.id === target) || this.freeVideoModels[0];
        },

        saveVideoCredentials(provider, model, key) {
            this.videoProvider = provider;
            this.videoModel = model;
            this.videoApiKey = (key || '').trim();

            localStorage.setItem('zw_video_provider', this.videoProvider);
            localStorage.setItem('zw_video_model', this.videoModel);
            localStorage.setItem('zw_video_api_key', this.videoApiKey);
            localStorage.setItem('zw_hf_video_token', this.videoApiKey);

            // Sync drawer inputs if open
            const drawerSel = document.getElementById('drawerVideoModelSelect');
            const drawerInp = document.getElementById('drawerVideoApiKey');
            if (drawerSel) drawerSel.value = this.videoModel;
            if (drawerInp) drawerInp.value = this.videoApiKey;
        },

        clearExpiredVideoKey() {
            this.videoApiKey = '';
            localStorage.removeItem('zw_video_api_key');
            localStorage.removeItem('zw_hf_video_token');
        },

        // =========================================================================
        // 1. SCREEN 2 ENHANCEMENT (NEW USERS: WEBSITE OR FREE VIDEO AI SINGLE KEY)
        // =========================================================================
        upgradeScreen2WithVideoModels() {
            const screen2Card = document.querySelector('#screen2 .card-bg');
            const apiKeyInput = document.getElementById('apiKeyInput');
            const getApiKeyBtn = document.getElementById('getApiKeyBtn');
            if (!screen2Card || !apiKeyInput || document.getElementById('screen2VideoProviders')) return;

            // Add Free Video AI Provider Buttons right below the existing Gemini/OpenAI/Claude grid
            const existingGrid = screen2Card.querySelector('.grid.grid-cols-3');
            if (existingGrid) {
                const videoSection = document.createElement('div');
                videoSection.id = 'screen2VideoProviders';
                videoSection.className = "mb-4 p-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 space-y-2";
                videoSection.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-extrabold text-fuchsia-300 uppercase tracking-wider">Free Video AI Models (1 Key Needed):</span>
                        <span class="text-[10px] text-emerald-400 font-bold">Free Tier</span>
                    </div>
                    <div class="grid grid-cols-3 gap-1.5">
                        <button type="button" onclick="window.ZenoVideo.selectScreen2VideoProvider('huggingface', 'Wan-AI/Wan2.1-T2V-1.3B', 'https://huggingface.co/settings/tokens', 'Paste HuggingFace Free Token (hf_...)...')"
                            class="s2-vid-btn py-2 px-2 rounded-xl bg-black/40 hover:bg-fuchsia-600/30 border border-fuchsia-500/30 text-[11px] font-bold text-white transition">
                            Wan 2.1 (HF)
                        </button>
                        <button type="button" onclick="window.ZenoVideo.selectScreen2VideoProvider('huggingface', 'THUDM/CogVideoX-5b', 'https://huggingface.co/settings/tokens', 'Paste HuggingFace Free Token (hf_...)...')"
                            class="s2-vid-btn py-2 px-2 rounded-xl bg-black/40 hover:bg-fuchsia-600/30 border border-fuchsia-500/30 text-[11px] font-bold text-white transition">
                            CogVideoX
                        </button>
                        <button type="button" onclick="window.ZenoVideo.selectScreen2VideoProvider('fal', 'fal-ai/ltx-video', 'https://fal.ai/dashboard/keys', 'Paste Fal.ai Video API Key...')"
                            class="s2-vid-btn py-2 px-2 rounded-xl bg-black/40 hover:bg-fuchsia-600/30 border border-fuchsia-500/30 text-[11px] font-bold text-white transition">
                            Fal LTX-Video
                        </button>
                    </div>
                `;
                existingGrid.insertAdjacentElement('afterend', videoSection);
            }

            // Add quick "Free HuggingFace Video Key" link to the quick-links row
            const quickLinksRow = screen2Card.querySelector('.flex.flex-wrap.gap-2.mb-6');
            if (quickLinksRow) {
                const hfLink = document.createElement('a');
                hfLink.href = 'https://huggingface.co/settings/tokens';
                hfLink.target = '_blank';
                hfLink.className = "px-2.5 py-1 rounded-lg bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-300 font-semibold";
                hfLink.innerHTML = `<i class="fa-solid fa-film mr-1"></i>Free Video Key (HuggingFace)`;
                quickLinksRow.appendChild(hfLink);
            }

            // Hook saveApiKeyAndContinue so a SINGLE key (either website key OR video key) enters Screen 3
            const origSaveContinue = window.saveApiKeyAndContinue;
            window.saveApiKeyAndContinue = () => {
                const rawKey = (document.getElementById('apiKeyInput')?.value || '').trim();
                if (rawKey.length < 5) {
                    const err = document.getElementById('apiErrorMsg');
                    if (err) {
                        err.innerText = "Please enter at least one API key to launch ZoneWeb.";
                        err.classList.remove('hidden');
                    }
                    return;
                }

                // Auto-detect if this single key is a Video AI key (hf_..., fal, r8_...) or Gemini (AIza... supports both)
                if (rawKey.startsWith('hf_')) {
                    this.saveVideoCredentials('huggingface', this.videoModel || 'Wan-AI/Wan2.1-T2V-1.3B', rawKey);
                } else if (window.__s2SelectedVideoProv === 'fal') {
                    this.saveVideoCredentials('fal', 'fal-ai/ltx-video', rawKey);
                } else if (rawKey.startsWith('AIza')) {
                    // Gemini key can also attempt Veo if user wants, though we still allow dedicated HF free video key
                    if (!this.videoApiKey) {
                        this.saveVideoCredentials('gemini', 'veo-2.0-generate-001', rawKey);
                    }
                }

                if (typeof origSaveContinue === 'function') {
                    origSaveContinue();
                } else {
                    localStorage.setItem('zw_api_key', rawKey);
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
            if (getBtn) {
                getBtn.href = keyUrl;
            }
        },

        // =========================================================================
        // 2. TOP 3-DOTS MENU: FREE VIDEO AI MODELS & KEY SETTINGS
        // =========================================================================
        upgradeThreeDotsMenuWithVideoModels() {
            const topSettingsBox = document.querySelector('#drawerOverlay .mb-5.bg-white\\/5');
            if (!topSettingsBox || document.getElementById('drawerVideoAiSection')) return;

            const section = document.createElement('div');
            section.id = 'drawerVideoAiSection';
            section.className = "pt-2.5 border-t border-white/10 space-y-2";
            section.innerHTML = `
                <div class="flex items-center justify-between">
                    <label class="text-[11px] font-bold text-fuchsia-300">Free Video AI Model:</label>
                    <a id="drawerGetVideoKeyLink" href="${this.getSelectedModelObj().keyUrl}" target="_blank" class="text-[10px] text-amber-300 hover:underline font-bold">Get Free Key</a>
                </div>
                <select id="drawerVideoModelSelect" onchange="window.ZenoVideo.onDrawerVideoModelChange(this.value)" class="w-full bg-black/50 border border-fuchsia-500/30 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none">
                    ${this.freeVideoModels.map(m => `<option value="${m.model}" ${m.model === this.videoModel ? 'selected' : ''}>${m.name}</option>`).join('')}
                </select>
                <div class="flex gap-1.5">
                    <input id="drawerVideoApiKey" type="password" value="${this.videoApiKey}" placeholder="Paste Free Video API Key..." class="flex-1 bg-black/40 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none">
                    <button type="button" onclick="window.ZenoVideo.saveFromDrawer()" class="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-bold text-white shadow">Save</button>
                </div>
            `;
            topSettingsBox.appendChild(section);
        },

        onDrawerVideoModelChange(modelVal) {
            const obj = this.getSelectedModelObj(modelVal);
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
            const obj = this.getSelectedModelObj(modelVal);
            this.saveVideoCredentials(obj.provider, obj.model, keyVal);

            const badge = document.getElementById('saveConfirmBadge');
            if (badge) {
                badge.classList.remove('hidden');
                setTimeout(() => badge.classList.add('hidden'), 2000);
            }
        },

        // =========================================================================
        // 3. COMPACT VIDEO API KEY POPUP MODAL (ASKS ONCE IF MISSING OR EXPIRED)
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
                                <h3 class="font-extrabold text-sm md:text-base">Free Video AI Key Required</h3>
                                <p id="zwVidModalReason" class="text-[11px] text-gray-400">Saved permanently until expiration</p>
                            </div>
                        </div>
                        <button onclick="document.getElementById('zenoVideoKeyModal').classList.add('hidden')" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="space-y-3">
                        <div>
                            <label class="text-xs font-bold text-fuchsia-300 block mb-1">1. Choose Free Video AI Model:</label>
                            <select id="zwModalVideoModelSelect" onchange="window.ZenoVideo.onModalVideoModelChange(this.value)" class="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
                                ${this.freeVideoModels.map(m => `<option value="${m.model}">${m.name}</option>`).join('')}
                            </select>
                        </div>

                        <div>
                            <label class="text-xs font-bold text-gray-300 block mb-1">2. Paste API Key (Direct Get Key Button Next to Box):</label>
                            <div class="flex gap-2">
                                <input id="zwModalVideoKeyInput" type="password" placeholder="Paste HuggingFace Free Token (hf_...)..."
                                    class="flex-1 bg-black/50 border border-fuchsia-500/40 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none">
                                <a id="zwModalGetKeyBtn" href="https://huggingface.co/settings/tokens" target="_blank"
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
            const obj = this.getSelectedModelObj(modelVal);
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
                selEl.value = this.videoModel;
                this.onModalVideoModelChange(this.videoModel);
            }
            if (inpEl) inpEl.value = '';

            modal?.classList.remove('hidden');
        },

        confirmModalVideoKey() {
            const modelVal = document.getElementById('zwModalVideoModelSelect')?.value || this.videoModel;
            const keyVal = (document.getElementById('zwModalVideoKeyInput')?.value || '').trim();
            if (keyVal.length < 5) {
                return alert("Please paste your Video API Key first, or click 'Get API Key' next to the box.");
            }

            const obj = this.getSelectedModelObj(modelVal);
            this.saveVideoCredentials(obj.provider, obj.model, keyVal);
            document.getElementById('zenoVideoKeyModal')?.classList.add('hidden');

            const pending = window.__pendingVideoPromptAfterKey;
            window.__pendingVideoPromptAfterKey = null;
            if (pending) {
                this.generateRealAiVideo(pending);
            }
        },

        // =========================================================================
        // 4. TOP "GENERATE VIDEO" BUTTON & CHAT VIDEO STUDIO PANEL
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
                            <span class="text-xs font-extrabold text-white block">Free AI Video Studio</span>
                            <span class="text-[10px] text-fuchsia-300" id="zwActiveVideoModelLabel">${this.getSelectedModelObj().name}</span>
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

                    <button type="button" onclick="window.ZenoVideo.openVideoKeyPromptModal(null, 'Change or update your Free Video API Key')" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-amber-300 font-bold border border-amber-500/30">
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
            if (lbl) lbl.innerText = this.getSelectedModelObj().name;

            if (enable) {
                panel?.classList.remove('hidden');
                if (chatInput) {
                    chatInput.placeholder = "Describe the video scene you want AI to create...";
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
        // 5. REAL AI VIDEO GENERATION (CHECKS SAVED KEY ONCE -> CALLS FREE VIDEO AI)
        // =========================================================================
        async generateRealAiVideo(userPrompt) {
            if (this.isGeneratingVideo) return;

            // Security filter check
            if (window.ZenoUltimate && window.ZenoUltimate.forbiddenPattern && window.ZenoUltimate.forbiddenPattern.test(userPrompt)) {
                if (typeof window.appendMessage === 'function') {
                    window.appendMessage('user', userPrompt);
                    window.appendMessage('ai', "Security Alert: Adult, hacking, or malware video generation is not allowed.");
                }
                return;
            }

            // If the user has NOT provided a Video API Key yet, open the compact popup modal once!
            if (!this.videoApiKey || this.videoApiKey.length < 5) {
                this.openVideoKeyPromptModal(userPrompt, "Paste a Free Video API Key once — saved until expiration");
                return;
            }

            this.isGeneratingVideo = true;
            document.getElementById('heroPrompt')?.classList.add('hidden');
            if (typeof window.appendMessage === 'function') {
                window.appendMessage('user', `[AI Video: ${this.getSelectedModelObj().name}] ${userPrompt}`);
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
                                <p id="${cardId}_title" class="text-xs md:text-sm font-extrabold text-white">Generating Real AI Video...</p>
                                <p id="${cardId}_status" class="text-[11px] text-fuchsia-300">Connecting to ${this.getSelectedModelObj().name}...</p>
                            </div>
                        </div>
                        <span id="${cardId}_pct" class="text-xs font-mono font-extrabold text-fuchsia-400">15%</span>
                    </div>
                    <div class="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                        <div id="${cardId}_bar" class="h-full bg-gradient-to-r from-fuchsia-600 via-purple-500 to-emerald-400 transition-all duration-300" style="width:15%;"></div>
                    </div>
                </div>
            `;
            feed?.appendChild(cardWrap);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

            const setProgress = (pct, statusText) => {
                const pEl = document.getElementById(`${cardId}_pct`);
                const bEl = document.getElementById(`${cardId}_bar`);
                const sEl = document.getElementById(`${cardId}_status`);
                if (pEl) pEl.innerText = `${pct}%`;
                if (bEl) bEl.style.width = `${pct}%`;
                if (sEl && statusText) sEl.innerText = statusText;
            };

            try {
                const key = this.videoApiKey;
                const prov = this.videoProvider;
                const model = this.videoModel;

                // 1. HuggingFace Free Text-to-Video Models (Wan 2.1, CogVideoX, LTX-Video, Mochi-1)
                if (prov === 'huggingface' || key.startsWith('hf_')) {
                    const blob = await this.callHuggingFaceVideoApi(key, model, userPrompt, setProgress);
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        this.renderFinalVideoPlayer(cardWrap, url, userPrompt, 'mp4', model.split('/').pop());
                        return;
                    }
                }

                // 2. Google Veo 2 (via AI Studio Key)
                if (prov === 'gemini' || key.startsWith('AIza')) {
                    const veoUrl = await this.callGoogleVeoApi(key, userPrompt, setProgress);
                    if (veoUrl) {
                        this.renderFinalVideoPlayer(cardWrap, veoUrl, userPrompt, 'mp4', 'Google Veo 2');
                        return;
                    }
                }

                // 3. Fal.ai Free Starter Credits Video API
                if (prov === 'fal') {
                    const falUrl = await this.callFalVideoApi(key, model, userPrompt, setProgress);
                    if (falUrl) {
                        this.renderFinalVideoPlayer(cardWrap, falUrl, userPrompt, 'mp4', 'Fal.ai LTX-Video');
                        return;
                    }
                }

                throw new Error("The selected free model is currently busy or requires a different token.");
            } catch (err) {
                if (err.isExpiredKey) {
                    // Key expired or invalid -> clear it and re-open the small key prompt modal
                    this.clearExpiredVideoKey();
                    cardWrap.remove();
                    this.openVideoKeyPromptModal(userPrompt, "Your previous Video API Key expired or is invalid. Paste a new one:");
                } else {
                    cardWrap.innerHTML = `
                        <div class="w-full max-w-[92%] rounded-2xl p-4 card-bg border border-amber-500/40 space-y-2.5 text-xs text-gray-200">
                            <p class="font-bold text-amber-300">Video Engine Notice: ${err.message}</p>
                            <div class="flex flex-wrap gap-2">
                                <button onclick="window.ZenoVideo.openVideoKeyPromptModal(\`${userPrompt.replace(/`/g, '')}\`, 'Switch to another Free Video AI Model or Key')" class="px-3 py-1.5 rounded-xl bg-fuchsia-600 text-white font-bold">
                                    Switch Model / Update Key
                                </button>
                            </div>
                        </div>
                    `;
                }
            } finally {
                this.isGeneratingVideo = false;
                this.toggleVideoMode(false);
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        },

        // --- REAL HUGGING FACE FREE INFERENCE VIDEO API ---
        async callHuggingFaceVideoApi(token, primaryModel, promptText, setProgress) {
            const candidateModels = [
                primaryModel,
                'Wan-AI/Wan2.1-T2V-1.3B',
                'Lightricks/LTX-Video',
                'THUDM/CogVideoX-5b',
                'cerspense/zeroscope_v2_576w'
            ].filter((v, i, a) => v && a.indexOf(v) === i);

            for (const modelId of candidateModels) {
                const endpoints = [
                    `https://router.huggingface.co/hf-inference/models/${modelId}`,
                    `https://api-inference.huggingface.co/models/${modelId}`
                ];

                for (const url of endpoints) {
                    for (let attempt = 1; attempt <= 2; attempt++) {
                        try {
                            setProgress(25 + attempt * 15, `Rendering video on ${modelId.split('/').pop()} (Attempt ${attempt})...`);
                            const res = await fetch(url, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ inputs: promptText })
                            });

                            // Check if token expired or unauthorized (401 / 403)
                            if (res.status === 401 || res.status === 403) {
                                const errObj = new Error("HuggingFace token expired or unauthorized.");
                                errObj.isExpiredKey = true;
                                throw errObj;
                            }

                            if (res.ok) {
                                const cType = res.headers.get('content-type') || '';
                                if (cType.includes('video') || cType.includes('octet-stream')) {
                                    setProgress(95, "Finalizing MP4 video...");
                                    return await res.blob();
                                }
                            }

                            // 503 means free HuggingFace GPU is warming up the model -> wait & retry
                            if (res.status === 503) {
                                const info = await res.json().catch(() => ({}));
                                const waitSec = Math.min(12, Math.ceil(info.estimated_time || 6));
                                setProgress(50, `Free GPU warming up ${modelId.split('/').pop()} (${waitSec}s)...`);
                                await new Promise(r => setTimeout(r, waitSec * 1000));
                                continue;
                            }
                            break;
                        } catch (e) {
                            if (e.isExpiredKey) throw e;
                        }
                    }
                }
            }
            return null;
        },

        // --- REAL GOOGLE VEO 2 VIDEO API ---
        async callGoogleVeoApi(apiKey, promptText, setProgress) {
            const models = ['veo-2.0-generate-001', 'veo-3.0-generate-preview'];
            for (const model of models) {
                try {
                    setProgress(30, `Submitting prompt to Google ${model}...`);
                    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${encodeURIComponent(apiKey)}`;
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            instances: [{ prompt: promptText }],
                            parameters: { aspectRatio: this.aspectRatio }
                        })
                    });

                    if (res.status === 400 || res.status === 401 || res.status === 403) {
                        const errData = await res.json().catch(() => ({}));
                        const msg = errData.error?.message || '';
                        if (/api key not valid|expired|permission/i.test(msg)) {
                            const errObj = new Error(msg);
                            errObj.isExpiredKey = true;
                            throw errObj;
                        }
                        continue;
                    }

                    if (!res.ok) continue;
                    const opData = await res.json();
                    if (!opData.name) continue;

                    for (let i = 0; i < 16; i++) {
                        await new Promise(r => setTimeout(r, 3000));
                        setProgress(Math.min(92, 40 + i * 3), `Google ${model} rendering video (${(i + 1) * 3}s)...`);
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
                } catch (e) {
                    if (e.isExpiredKey) throw e;
                }
            }
            return null;
        },

        // --- REAL FAL.AI VIDEO API ---
        async callFalVideoApi(apiKey, modelId, promptText, setProgress) {
            try {
                setProgress(35, "Generating video with Fal.ai...");
                const res = await fetch(`https://fal.run/${modelId || 'fal-ai/ltx-video'}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Key ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompt: promptText })
                });
                if (res.status === 401 || res.status === 403) {
                    const errObj = new Error("Fal.ai key expired or invalid.");
                    errObj.isExpiredKey = true;
                    throw errObj;
                }
                if (res.ok) {
                    const data = await res.json();
                    return data.video?.url || null;
                }
            } catch (e) {
                if (e.isExpiredKey) throw e;
            }
            return null;
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

                    <p class="text-xs text-gray-300">Prompt: <b class="text-white">${promptText.replace(/</g, '&lt;')}</b></p>

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
