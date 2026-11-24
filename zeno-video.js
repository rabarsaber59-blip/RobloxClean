/**
 * ZENO-VIDEO.JS - Universal All-Version AI Video API Engine
 * Supports ALL versions and formats of Video Maker API keys without errors:
 * - Auto-Detect Engine (Inspects key prefix & discovers enabled models automatically)
 * - HuggingFace (hf_...): Wan 2.1 (1.3B & 14B), LTX-Video, CogVideoX (5B & 2B), Mochi-1, Zeroscope
 * - Google AI Studio (AIza...): Auto-discovers Veo 3.1, Veo 3.0, Veo 3.0 Fast, Veo 2.0
 * - Replicate (r8_...): Wan 2.1, Minimax Video-01, Luma Ray, LTX-Video
 * - Fal.ai (key:secret / fal_...): Wan-T2V, LTX-Video, Kling, Minimax
 * - Luma Dream Machine (luma-...), RunwayML (key_... / rw_...), Together AI (tgp_... / sk-...)
 * - One-Time Key Modal with direct "Get API Key" button (saved until expiration)
 * - Global Emoji-to-Custom-Logo UI Replacer
 */
(function () {
    const ZenoVideo = {
        videoModeActive: false,
        isGeneratingVideo: false,
        isReplacingEmojis: false,
        emojiObserver: null,
        aspectRatio: '16:9',

        // Persistent Video API Key & Model State
        videoProvider: localStorage.getItem('zw_video_provider') || 'auto',
        videoModel: localStorage.getItem('zw_video_model') || 'auto',
        videoApiKey: '',

        // All Supported Video Maker Providers & Models
        videoCatalog: [
            {
                id: 'auto',
                provider: 'auto',
                model: 'auto',
                name: 'Auto-Detect Any Video API Key (All Versions)',
                keyUrl: 'https://huggingface.co/settings/tokens',
                placeholder: 'Paste ANY Video API Key (hf_..., AIza..., r8_..., luma-..., key:secret, sk-...)...'
            },
            {
                id: 'hf_wan21',
                provider: 'huggingface',
                model: 'Wan-AI/Wan2.1-T2V-1.3B',
                name: 'HuggingFace Free: Wan 2.1 T2V (All Versions)',
                keyUrl: 'https://huggingface.co/settings/tokens',
                placeholder: 'Paste HuggingFace Token (hf_...)...'
            },
            {
                id: 'hf_ltx',
                provider: 'huggingface',
                model: 'Lightricks/LTX-Video',
                name: 'HuggingFace Free: LTX-Video Fast',
                keyUrl: 'https://huggingface.co/settings/tokens',
                placeholder: 'Paste HuggingFace Token (hf_...)...'
            },
            {
                id: 'hf_cogvideo',
                provider: 'huggingface',
                model: 'THUDM/CogVideoX-5b',
                name: 'HuggingFace Free: CogVideoX (5B / 2B)',
                keyUrl: 'https://huggingface.co/settings/tokens',
                placeholder: 'Paste HuggingFace Token (hf_...)...'
            },
            {
                id: 'hf_mochi',
                provider: 'huggingface',
                model: 'genmo/mochi-1-preview',
                name: 'HuggingFace Free: Mochi-1 Preview',
                keyUrl: 'https://huggingface.co/settings/tokens',
                placeholder: 'Paste HuggingFace Token (hf_...)...'
            },
            {
                id: 'google_veo',
                provider: 'gemini',
                model: 'veo-auto',
                name: 'Google Veo (Veo 3.1 / 3.0 / 2.0 - AI Studio)',
                keyUrl: 'https://aistudio.google.com/app/apikey',
                placeholder: 'Paste Google AI Studio Key (AIza...)...'
            },
            {
                id: 'replicate_all',
                provider: 'replicate',
                model: 'wan-video/wan-2.1-t2v-480p',
                name: 'Replicate Video (Wan 2.1 / Minimax / Luma)',
                keyUrl: 'https://replicate.com/account/api-tokens',
                placeholder: 'Paste Replicate API Token (r8_...)...'
            },
            {
                id: 'fal_all',
                provider: 'fal',
                model: 'fal-ai/wan-t2v',
                name: 'Fal.ai Video (Wan / LTX / Kling)',
                keyUrl: 'https://fal.ai/dashboard/keys',
                placeholder: 'Paste Fal.ai API Key (key:secret)...'
            },
            {
                id: 'luma_ray',
                provider: 'luma',
                model: 'ray-2',
                name: 'Luma Dream Machine (Ray 2 / Ray 1.6)',
                keyUrl: 'https://lumalabs.ai/dream-machine/api/keys',
                placeholder: 'Paste Luma API Key (luma-...)...'
            },
            {
                id: 'runway_gen',
                provider: 'runway',
                model: 'gen3a_turbo',
                name: 'RunwayML (Gen-3 Alpha Turbo)',
                keyUrl: 'https://dev.runwayml.com/',
                placeholder: 'Paste Runway API Key (key_...)...'
            },
            {
                id: 'together_vid',
                provider: 'together',
                model: 'Wan-AI/Wan2.1-T2V-1.3B',
                name: 'Together AI Video (Wan 2.1 / Minimax)',
                keyUrl: 'https://api.together.xyz/settings/api-keys',
                placeholder: 'Paste Together AI API Key...'
            }
        ],

        init() {
            window.ZenoVideo = this;
            this.videoApiKey = this.sanitizeKey(
                localStorage.getItem('zw_video_api_key') ||
                localStorage.getItem('zw_hf_video_token') ||
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

        // Removes spaces, quotes, newlines, and hidden mobile clipboard characters
        sanitizeKey(raw) {
            if (!raw) return '';
            return String(raw).replace(/[\s"'`“”‘’\u200B-\u200D\uFEFF]/g, '').trim();
        },

        // Universal Key Format & Version Detector
        detectKeyProvider(rawKey, preferredProvider = 'auto') {
            const k = this.sanitizeKey(rawKey);
            if (!k) return 'huggingface';

            if (k.startsWith('hf_')) return 'huggingface';
            if (k.startsWith('AIza')) return 'gemini';
            if (k.startsWith('r8_')) return 'replicate';
            if (k.startsWith('luma-')) return 'luma';
            if (k.startsWith('rw_') || (k.startsWith('key_') && k.length > 40)) return 'runway';
            if (k.startsWith('tgp_')) return 'together';
            if (k.startsWith('fal_') || /^[0-9a-f-]{20,}:[0-9a-f-]{20,}$/i.test(k) || k.includes(':')) return 'fal';
            if (k.startsWith('sk-') && preferredProvider === 'together') return 'together';

            if (preferredProvider && preferredProvider !== 'auto') return preferredProvider;
            return 'huggingface';
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

        clearExpiredVideoKey() {
            this.videoApiKey = '';
            localStorage.removeItem('zw_video_api_key');
            localStorage.removeItem('zw_hf_video_token');
        },

        // Allows entering Screen 3 with a single Video API Key on Screen 2
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
        // 1. SCREEN 2 ONBOARDING (SUPPORTS ANY SINGLE WEBSITE OR VIDEO API KEY)
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
                        <span class="text-[11px] font-extrabold text-fuchsia-300 uppercase tracking-wider">Video Maker AI Engines (All Versions):</span>
                        <span class="text-[10px] text-emerald-400 font-bold">1 Key Needed</span>
                    </div>
                    <div class="grid grid-cols-3 gap-1.5">
                        <button type="button" onclick="window.ZenoVideo.selectScreen2VideoProvider('huggingface', 'auto', 'https://huggingface.co/settings/tokens', 'Paste HuggingFace Token (hf_...)...')"
                            class="py-2 px-2 rounded-xl bg-black/40 hover:bg-fuchsia-600/30 border border-fuchsia-500/30 text-[11px] font-bold text-white transition">
                            HuggingFace
                        </button>
                        <button type="button" onclick="window.ZenoVideo.selectScreen2VideoProvider('gemini', 'veo-auto', 'https://aistudio.google.com/app/apikey', 'Paste Google Veo / AI Studio Key (AIza...)...')"
                            class="py-2 px-2 rounded-xl bg-black/40 hover:bg-fuchsia-600/30 border border-fuchsia-500/30 text-[11px] font-bold text-white transition">
                            Google Veo
                        </button>
                        <button type="button" onclick="window.ZenoVideo.selectScreen2VideoProvider('replicate', 'wan-video/wan-2.1-t2v-480p', 'https://replicate.com/account/api-tokens', 'Paste Replicate / Fal / Luma Key...')"
                            class="py-2 px-2 rounded-xl bg-black/40 hover:bg-fuchsia-600/30 border border-fuchsia-500/30 text-[11px] font-bold text-white transition">
                            Replicate / Fal
                        </button>
                    </div>
                `;
                existingGrid.insertAdjacentElement('afterend', videoSection);
            }

            const quickLinksRow = screen2Card.querySelector('.flex.flex-wrap.gap-2.mb-6');
            if (quickLinksRow) {
                const hfLink = document.createElement('a');
                hfLink.href = 'https://huggingface.co/settings/tokens';
                hfLink.target = '_blank';
                hfLink.className = "px-2.5 py-1 rounded-lg bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-300 font-semibold";
                hfLink.innerHTML = `<i class="fa-solid fa-film mr-1"></i>Free Video Key (HF)`;
                quickLinksRow.appendChild(hfLink);
            }

            const origSaveContinue = window.saveApiKeyAndContinue;
            window.saveApiKeyAndContinue = () => {
                const cleanKey = this.sanitizeKey(document.getElementById('apiKeyInput')?.value || '');
                if (cleanKey.length < 5) {
                    const err = document.getElementById('apiErrorMsg');
                    if (err) {
                        err.innerText = "Please enter at least one API key to enter ZoneWeb.";
                        err.classList.remove('hidden');
                    }
                    return;
                }

                const detectedProv = this.detectKeyProvider(cleanKey, window.__s2SelectedVideoProv || 'auto');
                if (['huggingface', 'replicate', 'fal', 'luma', 'runway', 'together'].includes(detectedProv) || window.__s2SelectedVideoProv) {
                    this.saveVideoCredentials(detectedProv, this.videoModel || 'auto', cleanKey);
                } else if (cleanKey.startsWith('AIza') && !this.videoApiKey) {
                    this.saveVideoCredentials('gemini', 'veo-auto', cleanKey);
                }

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
        // 2. TOP 3-DOTS MENU: UNIVERSAL VIDEO MAKER MODELS & KEY SETTINGS
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
        // 3. COMPACT VIDEO API KEY MODAL (ASKS ONCE IF MISSING OR EXPIRED)
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
                                <h3 class="font-extrabold text-sm md:text-base">Video Maker API Key Setup</h3>
                                <p id="zwVidModalReason" class="text-[11px] text-gray-400">Accepts all key versions — saved until expiration</p>
                            </div>
                        </div>
                        <button onclick="document.getElementById('zenoVideoKeyModal').classList.add('hidden')" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="space-y-3">
                        <div>
                            <label class="text-xs font-bold text-fuchsia-300 block mb-1">1. Choose Video Maker AI Model (or Auto-Detect):</label>
                            <select id="zwModalVideoModelSelect" onchange="window.ZenoVideo.onModalVideoModelChange(this.value)" class="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
                                ${this.videoCatalog.map(m => `<option value="${m.model}">${m.name}</option>`).join('')}
                            </select>
                        </div>

                        <div>
                            <label class="text-xs font-bold text-gray-300 block mb-1">2. Paste API Key (Direct Get Key Button Next to Box):</label>
                            <div class="flex gap-2">
                                <input id="zwModalVideoKeyInput" type="password" placeholder="Paste ANY Video API Key (hf_..., AIza..., r8_..., etc.)..."
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
            const obj = this.getSelectedCatalogItem(modelVal);
            const getBtn = document.getElementById('zwModalGetKeyBtn');
            const inp = document.getElementById('zwModalVideoKeyInput');
            if (getBtn) getBtn.href = obj.keyUrl;
            if (inp) inp.placeholder = obj.placeholder;
        },

        openVideoKeyPromptModal(pendingPrompt, reasonText = 'Accepts all key versions — saved until expiration') {
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
                return alert("Please paste your Video API Key first, or click 'Get API Key' next to the box.");
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
                            <span class="text-xs font-extrabold text-white block">Universal AI Video Studio</span>
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
        // 5. UNIVERSAL ZERO-ERROR VIDEO GENERATION ENGINE (ALL KEY VERSIONS)
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

            // Refresh sanitized key from storage
            this.videoApiKey = this.sanitizeKey(
                this.videoApiKey ||
                localStorage.getItem('zw_video_api_key') ||
                localStorage.getItem('zw_hf_video_token') ||
                ''
            );

            if (!this.videoApiKey || this.videoApiKey.length < 5) {
                this.openVideoKeyPromptModal(userPrompt, "Paste ANY Video Maker API Key once — saved until expiration");
                return;
            }

            this.isGeneratingVideo = true;
            const key = this.videoApiKey;
            const detectedProvider = this.detectKeyProvider(key, this.videoProvider);

            document.getElementById('heroPrompt')?.classList.add('hidden');
            if (typeof window.appendMessage === 'function') {
                window.appendMessage('user', `[AI Video • ${detectedProvider.toUpperCase()}] ${userPrompt}`);
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
                                <p id="${cardId}_title" class="text-xs md:text-sm font-extrabold text-white">Generating Video (${detectedProvider.toUpperCase()})...</p>
                                <p id="${cardId}_status" class="text-[11px] text-fuchsia-300">Auto-selecting best available model version...</p>
                            </div>
                        </div>
                        <span id="${cardId}_pct" class="text-xs font-mono font-extrabold text-fuchsia-400">12%</span>
                    </div>
                    <div class="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                        <div id="${cardId}_bar" class="h-full bg-gradient-to-r from-fuchsia-600 via-purple-500 to-emerald-400 transition-all duration-300" style="width:12%;"></div>
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
                let resultUrl = null;
                let usedEngineLabel = detectedProvider.toUpperCase();

                if (detectedProvider === 'huggingface') {
                    const res = await this.runHuggingFaceAllVersions(key, this.videoModel, userPrompt, setProgress);
                    if (res) {
                        resultUrl = res.url;
                        usedEngineLabel = res.modelLabel;
                    }
                } else if (detectedProvider === 'gemini') {
                    const res = await this.runGoogleVeoAllVersions(key, userPrompt, setProgress);
                    if (res) {
                        resultUrl = res.url;
                        usedEngineLabel = res.modelLabel;
                    }
                } else if (detectedProvider === 'replicate') {
                    const res = await this.runReplicateAllVersions(key, this.videoModel, userPrompt, setProgress);
                    if (res) {
                        resultUrl = res.url;
                        usedEngineLabel = res.modelLabel;
                    }
                } else if (detectedProvider === 'fal') {
                    const res = await this.runFalAllVersions(key, this.videoModel, userPrompt, setProgress);
                    if (res) {
                        resultUrl = res.url;
                        usedEngineLabel = res.modelLabel;
                    }
                } else if (detectedProvider === 'luma') {
                    const res = await this.runLumaAllVersions(key, userPrompt, setProgress);
                    if (res) {
                        resultUrl = res.url;
                        usedEngineLabel = res.modelLabel;
                    }
                } else if (detectedProvider === 'runway') {
                    const res = await this.runRunwayAllVersions(key, userPrompt, setProgress);
                    if (res) {
                        resultUrl = res.url;
                        usedEngineLabel = res.modelLabel;
                    }
                } else if (detectedProvider === 'together') {
                    const res = await this.runTogetherAllVersions(key, userPrompt, setProgress);
                    if (res) {
                        resultUrl = res.url;
                        usedEngineLabel = res.modelLabel;
                    }
                }

                // Cross-provider auto-probe if key prefix was non-standard
                if (!resultUrl && detectedProvider !== 'huggingface') {
                    const hfFallback = await this.runHuggingFaceAllVersions(key, 'auto', userPrompt, setProgress).catch(() => null);
                    if (hfFallback) {
                        resultUrl = hfFallback.url;
                        usedEngineLabel = hfFallback.modelLabel;
                    }
                }

                if (resultUrl) {
                    this.renderFinalVideoPlayer(cardWrap, resultUrl, userPrompt, 'mp4', usedEngineLabel);
                    return;
                }

                throw new Error("All free GPU queues on this provider are temporarily busy. Please try again in a few seconds or switch models.");
            } catch (err) {
                if (err.isExpiredKey) {
                    this.clearExpiredVideoKey();
                    cardWrap.remove();
                    this.openVideoKeyPromptModal(userPrompt, "Your API key expired or was rejected (401/403). Paste a valid Video API Key:");
                } else {
                    cardWrap.innerHTML = `
                        <div class="w-full max-w-[92%] rounded-2xl p-4 card-bg border border-amber-500/40 space-y-2.5 text-xs text-gray-200">
                            <p class="font-bold text-amber-300">Video Queue Notice: ${err.message}</p>
                            <div class="flex flex-wrap gap-2">
                                <button onclick="window.ZenoVideo.generateRealAiVideo(\`${userPrompt.replace(/`/g, '')}\`)" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold">
                                    Retry Now
                                </button>
                                <button onclick="window.ZenoVideo.openVideoKeyPromptModal(\`${userPrompt.replace(/`/g, '')}\`, 'Switch Video AI Model or Key')" class="px-3 py-1.5 rounded-xl bg-fuchsia-600 text-white font-bold">
                                    Change Model / Key
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

        // =========================================================================
        // PROVIDER 1: HUGGING FACE (ALL VERSIONS & ENDPOINTS + JSON/BLOB PARSER)
        // =========================================================================
        async runHuggingFaceAllVersions(token, preferredModel, promptText, setProgress) {
            const allHfModels = [
                preferredModel !== 'auto' ? preferredModel : null,
                'Wan-AI/Wan2.1-T2V-1.3B',
                'Lightricks/LTX-Video',
                'THUDM/CogVideoX-5b',
                'THUDM/CogVideoX-2b',
                'genmo/mochi-1-preview',
                'Wan-AI/Wan2.1-T2V-14B',
                'ali-vilab/text-to-video-ms-1.7b',
                'cerspense/zeroscope_v2_576w'
            ].filter((v, i, a) => v && v.includes('/') && a.indexOf(v) === i);

            for (const modelId of allHfModels) {
                const shortName = modelId.split('/').pop();
                const endpoints = [
                    `https://router.huggingface.co/hf-inference/models/${modelId}`,
                    `https://api-inference.huggingface.co/models/${modelId}`
                ];

                for (const url of endpoints) {
                    for (let attempt = 1; attempt <= 2; attempt++) {
                        try {
                            setProgress(25 + attempt * 12, `Rendering with ${shortName} (v${attempt})...`);
                            const res = await fetch(url, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'x-wait-for-model': 'true'
                                },
                                body: JSON.stringify({
                                    inputs: promptText,
                                    parameters: { num_frames: 49 }
                                })
                            });

                            if (res.status === 401 || res.status === 403) {
                                const e = new Error("HuggingFace token unauthorized or expired.");
                                e.isExpiredKey = true;
                                throw e;
                            }

                            if (res.ok) {
                                const cType = (res.headers.get('content-type') || '').toLowerCase();
                                if (cType.includes('json')) {
                                    const json = await res.json();
                                    const b64 = json.video || json[0]?.video || json.generated_video;
                                    if (b64) {
                                        const dataUrl = b64.startsWith('data:') ? b64 : `data:video/mp4;base64,${b64}`;
                                        setProgress(96, "Video ready!");
                                        return { url: dataUrl, modelLabel: shortName };
                                    }
                                } else {
                                    const blob = await res.blob();
                                    if (blob && blob.size > 1500) {
                                        setProgress(96, "Video ready!");
                                        return { url: URL.createObjectURL(blob), modelLabel: shortName };
                                    }
                                }
                            }

                            if (res.status === 503 || res.status === 429) {
                                const info = await res.json().catch(() => ({}));
                                const waitSec = Math.min(10, Math.max(3, Math.ceil(info.estimated_time || 5)));
                                setProgress(52, `Warming up ${shortName} GPU (${waitSec}s)...`);
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

        // =========================================================================
        // PROVIDER 2: GOOGLE VEO (AUTO-DISCOVERS VEO 3.1 / 3.0 / 2.0 ON KEY)
        // =========================================================================
        async runGoogleVeoAllVersions(apiKey, promptText, setProgress) {
            let discoveredVeo = [];
            try {
                const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
                if (listRes.status === 400 || listRes.status === 401 || listRes.status === 403) {
                    const errData = await listRes.json().catch(() => ({}));
                    if (/api key not valid|expired/i.test(errData.error?.message || '')) {
                        const e = new Error("Google API Key is invalid or expired.");
                        e.isExpiredKey = true;
                        throw e;
                    }
                }
                if (listRes.ok) {
                    const listData = await listRes.json();
                    discoveredVeo = (listData.models || [])
                        .filter(m => m.name.toLowerCase().includes('veo'))
                        .map(m => m.name.replace(/^models\//, ''));
                }
            } catch (e) {
                if (e.isExpiredKey) throw e;
            }

            const veoModels = [
                ...discoveredVeo,
                'veo-3.1-generate-preview',
                'veo-3.0-generate-preview',
                'veo-3.0-fast-generate-preview',
                'veo-2.0-generate-001'
            ].filter((v, i, a) => a.indexOf(v) === i);

            for (const model of veoModels) {
                try {
                    setProgress(30, `Submitting to Google ${model}...`);
                    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${encodeURIComponent(apiKey)}`;
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            instances: [{ prompt: promptText }],
                            parameters: { aspectRatio: this.aspectRatio }
                        })
                    });

                    if (!res.ok) continue;
                    const opData = await res.json();
                    if (!opData.name) continue;

                    for (let i = 0; i < 18; i++) {
                        await new Promise(r => setTimeout(r, 3000));
                        setProgress(Math.min(94, 38 + i * 3), `Google ${model} rendering (${(i + 1) * 3}s)...`);
                        const pollRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opData.name}?key=${encodeURIComponent(apiKey)}`);
                        if (!pollRes.ok) break;
                        const pollData = await pollRes.json();
                        if (pollData.done) {
                            const samples = pollData.response?.generateVideoResponse?.generatedSamples || pollData.response?.predictions || [];
                            const uri = samples[0]?.video?.uri || samples[0]?.uri;
                            if (uri) {
                                const sep = uri.includes('?') ? '&' : '?';
                                return { url: `${uri}${sep}key=${encodeURIComponent(apiKey)}`, modelLabel: model };
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

        // =========================================================================
        // PROVIDER 3: REPLICATE (ALL VIDEO MODELS + ASYNC POLLING)
        // =========================================================================
        async runReplicateAllVersions(token, preferredModel, promptText, setProgress) {
            const models = [
                preferredModel && preferredModel.includes('/') && !preferredModel.startsWith('Wan-AI') ? preferredModel : null,
                'wan-video/wan-2.1-t2v-480p',
                'minimax/video-01',
                'luma/ray',
                'lightricks/ltx-video'
            ].filter((v, i, a) => v && a.indexOf(v) === i);

            for (const m of models) {
                try {
                    setProgress(30, `Starting Replicate ${m.split('/').pop()}...`);
                    const res = await fetch(`https://api.replicate.com/v1/models/${m}/predictions`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'wait=10'
                        },
                        body: JSON.stringify({ input: { prompt: promptText } })
                    });

                    if (res.status === 401 || res.status === 403) {
                        const e = new Error("Replicate API token invalid or expired.");
                        e.isExpiredKey = true;
                        throw e;
                    }
                    if (!res.ok) continue;

                    let pred = await res.json();
                    for (let i = 0; i < 20 && pred.status !== 'succeeded' && pred.status !== 'failed'; i++) {
                        await new Promise(r => setTimeout(r, 3000));
                        setProgress(Math.min(92, 40 + i * 3), `Replicate rendering (${(i + 1) * 3}s)...`);
                        const poll = await fetch(pred.urls.get, { headers: { 'Authorization': `Bearer ${token}` } });
                        if (!poll.ok) break;
                        pred = await poll.json();
                    }

                    if (pred.status === 'succeeded' && pred.output) {
                        const outUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
                        if (outUrl) return { url: outUrl, modelLabel: m.split('/').pop() };
                    }
                } catch (e) {
                    if (e.isExpiredKey) throw e;
                }
            }
            return null;
        },

        // =========================================================================
        // PROVIDER 4: FAL.AI (WAN / LTX / KLING / MINIMAX)
        // =========================================================================
        async runFalAllVersions(apiKey, preferredModel, promptText, setProgress) {
            const endpoints = [
                preferredModel && preferredModel.startsWith('fal-ai/') ? preferredModel : null,
                'fal-ai/wan-t2v',
                'fal-ai/ltx-video',
                'fal-ai/minimax-video',
                'fal-ai/fast-svd'
            ].filter((v, i, a) => v && a.indexOf(v) === i);

            for (const ep of endpoints) {
                try {
                    setProgress(40, `Generating on Fal.ai (${ep.replace('fal-ai/', '')})...`);
                    const res = await fetch(`https://fal.run/${ep}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Key ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ prompt: promptText, aspect_ratio: this.aspectRatio })
                    });

                    if (res.status === 401 || res.status === 403) {
                        const e = new Error("Fal.ai API key invalid or expired.");
                        e.isExpiredKey = true;
                        throw e;
                    }
                    if (res.ok) {
                        const data = await res.json();
                        const vidUrl = data.video?.url || data.videos?.[0]?.url;
                        if (vidUrl) return { url: vidUrl, modelLabel: ep.replace('fal-ai/', '') };
                    }
                } catch (e) {
                    if (e.isExpiredKey) throw e;
                }
            }
            return null;
        },

        // =========================================================================
        // PROVIDER 5: LUMA DREAM MACHINE (RAY-2 / RAY-1-6)
        // =========================================================================
        async runLumaAllVersions(apiKey, promptText, setProgress) {
            for (const model of ['ray-2', 'ray-1-6']) {
                try {
                    setProgress(35, `Submitting to Luma Dream Machine (${model})...`);
                    const res = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ prompt: promptText, model, aspect_ratio: this.aspectRatio })
                    });
                    if (res.status === 401 || res.status === 403) {
                        const e = new Error("Luma API key invalid or expired.");
                        e.isExpiredKey = true;
                        throw e;
                    }
                    if (!res.ok) continue;

                    let gen = await res.json();
                    for (let i = 0; i < 20 && gen.state !== 'completed' && gen.state !== 'failed'; i++) {
                        await new Promise(r => setTimeout(r, 3000));
                        setProgress(Math.min(92, 42 + i * 3), `Luma ${model} rendering (${(i + 1) * 3}s)...`);
                        const poll = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${gen.id}`, {
                            headers: { 'Authorization': `Bearer ${apiKey}` }
                        });
                        if (!poll.ok) break;
                        gen = await poll.json();
                    }
                    if (gen.state === 'completed' && gen.assets?.video) {
                        return { url: gen.assets.video, modelLabel: `Luma ${model}` };
                    }
                } catch (e) {
                    if (e.isExpiredKey) throw e;
                }
            }
            return null;
        },

        // =========================================================================
        // PROVIDER 6: RUNWAYML (GEN-3 ALPHA TURBO)
        // =========================================================================
        async runRunwayAllVersions(apiKey, promptText, setProgress) {
            try {
                setProgress(35, "Submitting to RunwayML Gen-3...");
                const res = await fetch('https://api.dev.runwayml.com/v1/text_to_video', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'X-Runway-Version': '2024-11-06',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ model: 'gen3a_turbo', promptText, duration: 10 })
                });
                if (res.status === 401 || res.status === 403) {
                    const e = new Error("RunwayML API key invalid or expired.");
                    e.isExpiredKey = true;
                    throw e;
                }
                if (!res.ok) return null;

                let task = await res.json();
                for (let i = 0; i < 20 && task.status !== 'SUCCEEDED' && task.status !== 'FAILED'; i++) {
                    await new Promise(r => setTimeout(r, 3000));
                    setProgress(Math.min(92, 42 + i * 3), `Runway Gen-3 rendering (${(i + 1) * 3}s)...`);
                    const poll = await fetch(`https://api.dev.runwayml.com/v1/tasks/${task.id}`, {
                        headers: { 'Authorization': `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' }
                    });
                    if (!poll.ok) break;
                    task = await poll.json();
                }
                if (task.status === 'SUCCEEDED' && task.output?.[0]) {
                    return { url: task.output[0], modelLabel: 'Runway Gen-3' };
                }
            } catch (e) {
                if (e.isExpiredKey) throw e;
            }
            return null;
        },

        // =========================================================================
        // PROVIDER 7: TOGETHER AI VIDEO
        // =========================================================================
        async runTogetherAllVersions(apiKey, promptText, setProgress) {
            for (const model of ['Wan-AI/Wan2.1-T2V-1.3B', 'minimax/video-01']) {
                try {
                    setProgress(40, `Generating with Together AI (${model.split('/').pop()})...`);
                    const res = await fetch('https://api.together.xyz/v1/videos/generations', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ model, prompt: promptText })
                    });
                    if (res.status === 401 || res.status === 403) {
                        const e = new Error("Together AI key invalid or expired.");
                        e.isExpiredKey = true;
                        throw e;
                    }
                    if (res.ok) {
                        const data = await res.json();
                        const vidUrl = data.data?.[0]?.url || data.url;
                        if (vidUrl) return { url: vidUrl, modelLabel: model.split('/').pop() };
                    }
                } catch (e) {
                    if (e.isExpiredKey) throw e;
                }
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
