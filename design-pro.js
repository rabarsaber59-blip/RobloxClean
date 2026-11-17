/**
 * DESIGN-PRO.JS - Universal Multi-Network Ads Engine, Viewport Switcher & Live Code Editor Modal
 * Strictly in English. Supports all ad networks (Adsterra, Unity Ads, Google AdSense, Monetag,
 * PropellerAds, AppLovin, Popunders, Banners) and executes ad scripts inside the live site.
 */
(function () {
    const DesignPro = {
        adNetworks: [
            { id: 'adsterra', name: '🔥 Adsterra', url: 'https://beta.publishers.adsterra.com/websites', style: 'bg-orange-500/20 border-orange-500/40 text-orange-300' },
            { id: 'unity', name: '🎮 Unity Ads', url: 'https://cloud.unity.com/', style: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' },
            { id: 'adsense', name: '🌐 Google AdSense', url: 'https://www.google.com/adsense/start/', style: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
            { id: 'monetag', name: '💰 Monetag', url: 'https://monetag.com/', style: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
            { id: 'propeller', name: '🚀 PropellerAds', url: 'https://propellerads.com/', style: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' },
            { id: 'applovin', name: '📱 AppLovin', url: 'https://www.applovin.com/', style: 'bg-purple-500/20 border-purple-500/40 text-purple-300' }
        ],

        init() {
            window.DesignPro = this;
            window.addEventListener('DOMContentLoaded', () => {
                this.upgradeUniversalAdsDrawer();
                this.upgradePreviewToolbar();
                this.buildLiveCodeEditorModal();
            });
            console.log("✨ DesignPro Loaded (Universal Ads & Pro Preview Tools Active).");
        },

        // Upgrades "1. Universal Ads Manager" in the 3-dots menu to accept all ad formats & placements
        upgradeUniversalAdsDrawer() {
            const adsPanel = document.getElementById('adsPanel');
            if (!adsPanel) return;

            const savedPos = localStorage.getItem('zw_ads_position') || 'top';
            const savedCode = localStorage.getItem('zw_ads_code') || '';

            adsPanel.innerHTML = `
                <p class="text-[11px] text-gray-400 leading-relaxed">Select an ad network to get your code, then paste any Banner, Popunder, Native, or Auto-Ad script below:</p>
                
                <div class="grid grid-cols-2 gap-1.5">
                    ${this.adNetworks.map(net => `
                        <a href="${net.url}" target="_blank" class="py-1.5 px-2 rounded-lg border ${net.style} text-[11px] font-bold text-center hover:opacity-90 transition truncate">
                            <i class="fa-solid fa-up-right-from-square mr-1 text-[9px]"></i>${net.name}
                        </a>
                    `).join('')}
                </div>

                <div>
                    <label class="text-[10px] text-gray-400 block mb-1">Ad Placement in Website:</label>
                    <select id="adsPlacementPos" onchange="window.DesignPro.saveUniversalAds()" class="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none">
                        <option value="top" ${savedPos === 'top' ? 'selected' : ''}>⬆️ Top Header Banner Slot</option>
                        <option value="bottom" ${savedPos === 'bottom' ? 'selected' : ''}>⬇️ Bottom Sticky Floating Banner</option>
                        <option value="head" ${savedPos === 'head' ? 'selected' : ''}>🧠 Inside &lt;head&gt; (Popunder / AdSense Auto-Ads)</option>
                        <option value="both" ${savedPos === 'both' ? 'selected' : ''}>🔥 Maximum Revenue (Top + Bottom + &lt;head&gt;)</option>
                    </select>
                </div>

                <textarea id="adsCodeInput" rows="3" oninput="window.DesignPro.saveUniversalAds()" placeholder="Paste ANY ad code (<script>, <iframe>, Adsterra, Unity, AdSense, or custom HTML banner)..." 
                    class="w-full bg-black/60 border border-white/15 rounded-xl p-2 text-xs text-emerald-300 font-mono focus:outline-none">${savedCode}</textarea>

                <div class="flex gap-1.5">
                    <button onclick="window.DesignPro.injectUniversalAdsNow()" class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg">
                        <i class="fa-solid fa-bolt mr-1"></i> Inject Ads Now
                    </button>
                    <button onclick="window.DesignPro.clearAds()" class="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold" title="Remove Ads">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
        },

        saveUniversalAds() {
            const codeEl = document.getElementById('adsCodeInput');
            const posEl = document.getElementById('adsPlacementPos');
            if (codeEl && window.state) {
                window.state.adsCode = codeEl.value;
                localStorage.setItem('zw_ads_code', codeEl.value);
            }
            if (posEl) {
                localStorage.setItem('zw_ads_position', posEl.value);
            }
        },

        injectUniversalAdsNow() {
            this.saveUniversalAds();
            if (typeof window.applyAdsToWebsite === 'function') {
                window.applyAdsToWebsite();
            }
        },

        clearAds() {
            const codeEl = document.getElementById('adsCodeInput');
            if (codeEl) codeEl.value = '';
            if (window.state) window.state.adsCode = '';
            localStorage.removeItem('zw_ads_code');
            alert("🗑️ Ad code cleared.");
        },

        // Adds Responsive Device Switchers (Desktop / Tablet / Mobile) & Code Editor button to Preview Modal
        upgradePreviewToolbar() {
            const previewTitle = document.getElementById('previewSiteTitle');
            if (!previewTitle || !previewTitle.parentElement || document.getElementById('proViewportBar')) return;

            const bar = document.createElement('div');
            bar.id = 'proViewportBar';
            bar.className = "flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 ml-2";
            bar.innerHTML = `
                <button onclick="window.DesignPro.setViewport('100%')" class="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold" title="Desktop View"><i class="fa-solid fa-desktop"></i></button>
                <button onclick="window.DesignPro.setViewport('768px')" class="px-2 py-1 rounded-lg hover:bg-white/10 text-[11px] font-bold" title="Tablet View"><i class="fa-solid fa-tablet-screen-button"></i></button>
                <button onclick="window.DesignPro.setViewport('390px')" class="px-2 py-1 rounded-lg hover:bg-white/10 text-[11px] font-bold" title="Mobile View"><i class="fa-solid fa-mobile-screen"></i></button>
                <button onclick="window.DesignPro.openCodeEditor()" class="px-2.5 py-1 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-300 text-[11px] font-bold flex items-center gap-1">
                    <i class="fa-solid fa-code"></i> <span class="hidden sm:inline">Edit Code</span>
                </button>
            `;
            previewTitle.parentElement.appendChild(bar);
        },

        setViewport(width) {
            const iframe = document.getElementById('livePreviewIframe');
            if (!iframe) return;
            iframe.style.width = width;
            iframe.style.maxWidth = width;
        },

        buildLiveCodeEditorModal() {
            if (document.getElementById('liveCodeEditorModal')) return;
            const modal = document.createElement('div');
            modal.id = 'liveCodeEditorModal';
            modal.className = "hidden fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 md:p-6";
            modal.innerHTML = `
                <div class="card-bg w-full max-w-4xl h-[85vh] rounded-3xl border border-white/15 shadow-2xl flex flex-col overflow-hidden text-white">
                    <div class="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-code text-violet-400"></i>
                            <span class="font-extrabold text-sm">Live HTML / CSS / JS Source Code Editor</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="window.DesignPro.saveEditedCode()" class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold shadow">
                                Save & Update Live Site
                            </button>
                            <button onclick="document.getElementById('liveCodeEditorModal').classList.add('hidden')" class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                    <textarea id="rawHtmlEditorTextarea" spellcheck="false" class="flex-1 w-full bg-[#07080c] text-emerald-300 font-mono text-xs p-4 focus:outline-none resize-none leading-relaxed"></textarea>
                </div>
            `;
            document.body.appendChild(modal);
        },

        openCodeEditor() {
            if (!window.state?.currentSiteHtml) return alert("No website code to edit yet.");
            const textarea = document.getElementById('rawHtmlEditorTextarea');
            if (textarea) textarea.value = window.state.currentSiteHtml;
            document.getElementById('liveCodeEditorModal')?.classList.remove('hidden');
        },

        saveEditedCode() {
            const textarea = document.getElementById('rawHtmlEditorTextarea');
            if (!textarea || !window.state) return;
            const updatedHtml = window.healWebsiteCode ? window.healWebsiteCode(textarea.value) : textarea.value;
            window.state.currentSiteHtml = updatedHtml;
            localStorage.setItem('zw_current_site_html', updatedHtml);

            const iframe = document.getElementById('livePreviewIframe');
            if (iframe) iframe.srcdoc = updatedHtml;

            if (typeof window.updatePublicLinkUI === 'function') {
                window.updatePublicLinkUI(window.state.currentSiteName || 'website', updatedHtml);
            }
            document.getElementById('liveCodeEditorModal')?.classList.add('hidden');
        }
    };

    DesignPro.init();
})();
