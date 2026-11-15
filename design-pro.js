/**
 * DESIGN-PRO.JS - Universal Multi-Network Ads Engine, Glass UI Beautifier & Pro Viewport Specs
 */
(function () {
    const DesignPro = {
        adNetworks: [
            { id: 'adsterra', name: '🔥 Adsterra', url: 'https://beta.publishers.adsterra.com/websites', color: 'bg-orange-500/20 border-orange-500/40 text-orange-300' },
            { id: 'unity', name: '🎮 Unity Ads', url: 'https://cloud.unity.com/', color: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' },
            { id: 'adsense', name: '🌐 Google AdSense', url: 'https://www.google.com/adsense/start/', color: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
            { id: 'monetag', name: '💰 Monetag', url: 'https://monetag.com/', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
            { id: 'propeller', name: '🚀 PropellerAds', url: 'https://propellerads.com/', color: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' },
            { id: 'applovin', name: '📱 AppLovin', url: 'https://www.applovin.com/', color: 'bg-purple-500/20 border-purple-500/40 text-purple-300' }
        ],

        init() {
            window.addEventListener('DOMContentLoaded', () => {
                this.injectProStyles();
                this.upgradeUniversalAdsPanel();
                this.upgradePreviewModalWithProSpecs();
            });
        },

        injectProStyles() {
            const style = document.createElement('style');
            style.innerHTML = `
                .card-bg {
                    backdrop-filter: blur(16px);
                    box-shadow: 0 10px 35px -5px rgba(0, 0, 0, 0.5);
                }
                button { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                button:active { transform: scale(0.97); }
            `;
            document.head.appendChild(style);
        },

        // Upgrades "1. Add Ads" in the 3-dots drawer to support ALL Ad networks & placement positions
        upgradeUniversalAdsPanel() {
            const adsPanel = document.getElementById('adsPanel');
            if (!adsPanel) return;

            const savedPos = localStorage.getItem('zw_ads_position') || 'top';
            const savedCode = localStorage.getItem('zw_ads_code') || '';

            adsPanel.innerHTML = `
                <p class="text-[11px] text-gray-400 mb-1.5">Click any network to copy your ad code, or paste any HTML / JS / Popunder / Banner ad script below:</p>
                <div class="grid grid-cols-2 gap-1.5 mb-2.5">
                    ${this.adNetworks.map(net => `
                        <a href="${net.url}" target="_blank" class="py-1.5 px-2 rounded-lg border ${net.color} text-[11px] font-bold text-center hover:opacity-90 transition truncate">
                            <i class="fa-solid fa-arrow-up-right-from-square mr-1 text-[9px]"></i>${net.name}
                        </a>
                    `).join('')}
                </div>

                <label class="text-[10px] text-gray-400 block mb-1">Ad Placement Position:</label>
                <select id="adsPlacementPos" onchange="window.DesignPro.saveUniversalAds()" class="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white mb-2">
                    <option value="top" ${savedPos === 'top' ? 'selected' : ''}>⬆️ Top Sticky Header Banner</option>
                    <option value="bottom" ${savedPos === 'bottom' ? 'selected' : ''}>⬇️ Bottom Floating Sticky Ad</option>
                    <option value="head" ${savedPos === 'head' ? 'selected' : ''}>🧠 Inside &lt;head&gt; (AdSense / Popunder / Auto-Ads)</option>
                    <option value="both" ${savedPos === 'both' ? 'selected' : ''}>🔥 Full Monetization (Top + Bottom + Script)</option>
                </select>

                <textarea id="adsCodeInput" rows="3" oninput="window.DesignPro.saveUniversalAds()" placeholder="Paste ANY Ad code here (Adsterra, Unity, AdSense <script>, Monetag, iframe, or custom HTML banner)..." 
                    class="w-full bg-black/60 border border-white/15 rounded-xl p-2 text-xs text-emerald-300 font-mono focus:outline-none">${savedCode}</textarea>

                <button onclick="window.DesignPro.injectUniversalAdsNow()" class="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg">
                    <i class="fa-solid fa-bolt mr-1"></i> Inject Universal Ads into Website
                </button>
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

        // Adds Device Viewport Switcher (Mobile / Tablet / Desktop) & Live Code Editor to Preview Modal
        upgradePreviewModalWithProSpecs() {
            const previewTitle = document.getElementById('previewSiteTitle');
            if (!previewTitle || !previewTitle.parentElement) return;

            const viewportBar = document.createElement('div');
            viewportBar.className = "hidden sm:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 ml-3";
            viewportBar.innerHTML = `
                <button onclick="window.DesignPro.setPreviewWidth('100%')" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold" title="Desktop View"><i class="fa-solid fa-desktop mr-1"></i>Desktop</button>
                <button onclick="window.DesignPro.setPreviewWidth('768px')" class="px-2.5 py-1 rounded-lg hover:bg-white/10 text-[11px] font-bold" title="Tablet View"><i class="fa-solid fa-tablet-screen-button mr-1"></i>Tablet</button>
                <button onclick="window.DesignPro.setPreviewWidth('390px')" class="px-2.5 py-1 rounded-lg hover:bg-white/10 text-[11px] font-bold" title="Mobile View"><i class="fa-solid fa-mobile-screen mr-1"></i>Mobile</button>
                <button onclick="window.DesignPro.openLiveCodeEditor()" class="px-2.5 py-1 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-300 text-[11px] font-bold"><i class="fa-solid fa-code mr-1"></i>Edit Code</button>
            `;
            previewTitle.parentElement.appendChild(viewportBar);
        },

        setPreviewWidth(width) {
            const iframe = document.getElementById('livePreviewIframe');
            if (!iframe) return;
            iframe.style.maxWidth = width;
            iframe.style.margin = width === '100%' ? '0' : '0 auto';
        },

        openLiveCodeEditor() {
            if (!window.state?.currentSiteHtml) return;
            const updated = prompt("💻 Live HTML Code Editor — Edit your website code directly:", window.state.currentSiteHtml);
            if (updated && updated.trim().length > 20) {
                window.state.currentSiteHtml = window.healWebsiteCode ? window.healWebsiteCode(updated) : updated;
                localStorage.setItem('zw_current_site_html', window.state.currentSiteHtml);
                document.getElementById('livePreviewIframe').srcdoc = window.state.currentSiteHtml;
                if (typeof window.updatePublicLinkUI === 'function') {
                    window.updatePublicLinkUI(window.state.currentSiteName, window.state.currentSiteHtml);
                }
            }
        }
    };

    window.DesignPro = DesignPro;
    DesignPro.init();
})();
