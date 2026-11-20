/**
 * ZENO-PRO-EXTRAS.JS
 * 1. Templates Full-Screen Placement Canvas: Auto-expands to full screen whenever an item is added
 *    so users can freely position elements cleanly, then click "Save & Add More" to return.
 * 2. Top "Domain" Button: Direct links for TinyURL, .com, and .net + Real Custom Domain Binding & CNAME export.
 * 3. Inbox Trash Cans: Delete buttons for individual Saved Projects and Inbox Chat cards.
 */
(function () {
    const ZenoProExtras = {
        lastTemplateItemCount: 0,
        isFullScreenCanvas: false,
        customDomains: JSON.parse(localStorage.getItem('zw_custom_domains') || '{}'),

        init() {
            window.ZenoProExtras = this;
            const setup = () => {
                this.fixStudioContrastStyles();
                this.injectTopDomainButton();
                this.upgradeTemplatesFullScreenWorkflow();
                this.upgradeInboxWithTrashButtons();
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setup);
            } else {
                setup();
            }
            console.log("🌟 ZenoProExtras Loaded (Full-Screen Templates, Domain Manager & Inbox Trash Active).");
        },

        // Fix Light Mode top-bar contrast inside Templates Studio so all buttons stay crisp
        fixStudioContrastStyles() {
            if (document.getElementById('zenoProExtrasStyles')) return;
            const style = document.createElement('style');
            style.id = 'zenoProExtrasStyles';
            style.innerHTML = `
                #templatesFullStudio .card-bg {
                    background-color: #0e111a !important;
                    color: #ffffff !important;
                    border-color: rgba(255, 255, 255, 0.12) !important;
                }
                #studioCanvasWrapper.zw-fullscreen-canvas {
                    position: fixed !important;
                    inset: 0 !important;
                    z-index: 70 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    padding: 10px !important;
                    background: #05060a !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                #studioCanvasWrapper.zw-fullscreen-canvas #studioLiveCanvas {
                    flex: 1 !important;
                    height: calc(100vh - 80px) !important;
                    min-height: 0 !important;
                    border-radius: 20px !important;
                }
            `;
            document.head.appendChild(style);
        },

        // =========================================================================
        // 1. TEMPLATES FULL-SCREEN CANVAS MODE (EXPAND ON ADD -> SAVE -> RETURN)
        // =========================================================================
        upgradeTemplatesFullScreenWorkflow() {
            const wireStudio = () => {
                const TS = window.TemplatesStudio;
                if (!TS) return;

                if (!document.getElementById('templatesFullStudio') && typeof TS.buildStudioView === 'function') {
                    TS.buildStudioView();
                }

                const canvas = document.getElementById('studioLiveCanvas');
                if (!canvas || !canvas.parentElement) return;

                const canvasWrapper = canvas.parentElement;
                canvasWrapper.id = 'studioCanvasWrapper';

                // Inject Full-Screen Control Bar above the canvas
                if (!document.getElementById('zwCanvasFullScreenBar')) {
                    const fsBar = document.createElement('div');
                    fsBar.id = 'zwCanvasFullScreenBar';
                    fsBar.className = "flex flex-wrap items-center justify-between gap-2 mb-2 bg-[#0e111a] p-2.5 rounded-2xl border border-white/15 shrink-0";
                    fsBar.innerHTML = `
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span id="zwFsModeLabel" class="text-xs font-extrabold text-white">Design Canvas</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button id="zwEnterFsBtn" onclick="window.ZenoProExtras.enterFullScreenCanvas()" class="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow">
                                <i class="fa-solid fa-expand"></i> <span>Full Screen</span>
                            </button>
                            <button id="zwFsDeleteBtn" onclick="window.TemplatesStudio && window.TemplatesStudio.deleteSelectedOrLast()" class="hidden px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow">
                                <i class="fa-solid fa-trash-can"></i> <span>Delete</span>
                            </button>
                            <button id="zwSaveBackFsBtn" onclick="window.ZenoProExtras.saveAndReturnToTools()" class="hidden px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg">
                                <i class="fa-solid fa-check-circle"></i> <span>Save & Add More</span>
                            </button>
                        </div>
                    `;
                    canvasWrapper.insertBefore(fsBar, canvasWrapper.firstChild);
                }

                // Hook TS.renderCanvas to auto-open Full-Screen whenever a new item is added
                if (!TS.__fullScreenHooked) {
                    TS.__fullScreenHooked = true;
                    this.lastTemplateItemCount = (TS.items || []).length;
                    const origRender = TS.renderCanvas.bind(TS);

                    TS.renderCanvas = () => {
                        origRender();
                        const currentCount = (TS.items || []).length;
                        if (currentCount > this.lastTemplateItemCount) {
                            this.lastTemplateItemCount = currentCount;
                            this.enterFullScreenCanvas();
                        } else {
                            this.lastTemplateItemCount = currentCount;
                        }
                    };
                }
            };

            wireStudio();

            // Re-wire whenever Templates Studio opens
            if (window.TemplatesStudio && !window.TemplatesStudio.__extrasOpenHooked) {
                window.TemplatesStudio.__extrasOpenHooked = true;
                const origOpen = window.TemplatesStudio.openStudio.bind(window.TemplatesStudio);
                window.TemplatesStudio.openStudio = () => {
                    origOpen();
                    wireStudio();
                    this.exitFullScreenCanvas();
                };
            }
        },

        enterFullScreenCanvas() {
            const wrapper = document.getElementById('studioCanvasWrapper');
            if (!wrapper) return;

            this.isFullScreenCanvas = true;
            wrapper.classList.add('zw-fullscreen-canvas');

            document.getElementById('zwEnterFsBtn')?.classList.add('hidden');
            document.getElementById('zwSaveBackFsBtn')?.classList.remove('hidden');
            document.getElementById('zwFsDeleteBtn')?.classList.remove('hidden');

            const label = document.getElementById('zwFsModeLabel');
            if (label) {
                label.innerHTML = `🖐️ Full-Screen Editor — Drag items to arrange, then click <span class="text-emerald-400">Save & Add More</span>`;
            }
        },

        exitFullScreenCanvas() {
            const wrapper = document.getElementById('studioCanvasWrapper');
            if (!wrapper) return;

            this.isFullScreenCanvas = false;
            wrapper.classList.remove('zw-fullscreen-canvas');

            document.getElementById('zwEnterFsBtn')?.classList.remove('hidden');
            document.getElementById('zwSaveBackFsBtn')?.classList.add('hidden');
            document.getElementById('zwFsDeleteBtn')?.classList.add('hidden');

            const label = document.getElementById('zwFsModeLabel');
            if (label) label.innerText = 'Design Canvas';
        },

        saveAndReturnToTools() {
            // Persist current item positions as draft so nothing is ever lost
            if (window.TemplatesStudio) {
                try {
                    localStorage.setItem('zw_studio_draft_items', JSON.stringify(window.TemplatesStudio.items || []));
                } catch (e) {}
            }
            this.exitFullScreenCanvas();

            // Scroll smoothly to top of the tools panel so the user can add the next element easily
            const leftPanel = document.querySelector('#templatesFullStudio .md\\:col-span-5');
            if (leftPanel) leftPanel.scrollTo({ top: 0, behavior: 'smooth' });
        },

        // =========================================================================
        // 2. TOP "DOMAIN" BUTTON (TinyURL, .com, .net + CUSTOM DOMAIN CONNECTION)
        // =========================================================================
        injectTopDomainButton() {
            const topPreviewBtn = document.getElementById('topPreviewBtn');
            if (!topPreviewBtn || !topPreviewBtn.parentElement || document.getElementById('topDomainBtn')) return;

            const btn = document.createElement('button');
            btn.id = 'topDomainBtn';
            btn.className = "px-3 py-1.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 text-xs font-extrabold flex items-center gap-1.5 hover:bg-cyan-600/30 transition shrink-0 shadow";
            btn.innerHTML = `<i class="fa-solid fa-globe"></i> <span>Domain</span>`;
            btn.onclick = () => this.openDomainModal();

            topPreviewBtn.parentElement.insertBefore(btn, topPreviewBtn);
            this.buildDomainModal();
            this.hookPublicLinkWithCustomDomain();
        },

        buildDomainModal() {
            if (document.getElementById('zenoDomainModal')) return;

            const modal = document.createElement('div');
            modal.id = 'zenoDomainModal';
            modal.className = "hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4";
            modal.innerHTML = `
                <div class="card-bg w-full max-w-md rounded-3xl p-5 md:p-6 border border-white/15 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
                    <div class="flex items-center justify-between border-b border-white/10 pb-3">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold">
                                <i class="fa-solid fa-globe"></i>
                            </div>
                            <div>
                                <h3 class="font-extrabold text-base">Domain & Short Link Manager</h3>
                                <p class="text-[11px] text-gray-400">Get TinyURL, .com, or .net & connect to your site</p>
                            </div>
                        </div>
                        <button onclick="document.getElementById('zenoDomainModal').classList.add('hidden')" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <!-- 3 Direct Provider Buttons: TinyURL, .com, .net -->
                    <div class="space-y-2">
                        <label class="text-xs font-bold text-cyan-300 block">1. Choose a Domain or Short Link Service:</label>
                        <div class="grid grid-cols-3 gap-2">
                            <button onclick="window.ZenoProExtras.openExternalDomainService('tinyurl')" class="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/35 text-center transition flex flex-col items-center gap-1">
                                <i class="fa-solid fa-link text-blue-400 text-lg"></i>
                                <span class="text-xs font-extrabold text-white">TinyURL</span>
                                <span class="text-[10px] text-blue-300">Free Short Link</span>
                            </button>

                            <button onclick="window.ZenoProExtras.openExternalDomainService('com')" class="p-3 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/35 text-center transition flex flex-col items-center gap-1">
                                <i class="fa-solid fa-earth-americas text-emerald-400 text-lg"></i>
                                <span class="text-xs font-extrabold text-white">.com</span>
                                <span class="text-[10px] text-emerald-300">Official Domain</span>
                            </button>

                            <button onclick="window.ZenoProExtras.openExternalDomainService('net')" class="p-3 rounded-2xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/35 text-center transition flex flex-col items-center gap-1">
                                <i class="fa-solid fa-network-wired text-purple-400 text-lg"></i>
                                <span class="text-xs font-extrabold text-white">.net</span>
                                <span class="text-[10px] text-purple-300">Network Domain</span>
                            </button>
                        </div>
                        <p id="zwDomainCopyNotice" class="hidden text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5"></p>
                    </div>

                    <hr class="border-white/10">

                    <!-- Connect Custom Domain / TinyURL to Current Website -->
                    <div class="space-y-2.5">
                        <label class="text-xs font-bold text-gray-200 block">2. Connect Your Domain / TinyURL to This Website:</label>
                        <input id="zwCustomDomainInput" type="text" placeholder="e.g. myshop.com, mysite.net, or tinyurl.com/myshop"
                            class="w-full bg-black/50 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-400">
                        
                        <div class="flex gap-2">
                            <button onclick="window.ZenoProExtras.saveCustomDomain()" class="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-lg transition">
                                <i class="fa-solid fa-plug mr-1"></i> Connect Domain to Site
                            </button>
                            <button onclick="window.ZenoProExtras.removeCustomDomain()" class="px-3 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold" title="Reset Domain">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>

                    <!-- GitHub Pages CNAME Helper (for .com / .net domains) -->
                    <div id="zwCnameBox" class="hidden p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-2 text-[11px] text-gray-300">
                        <p class="font-bold text-emerald-400"><i class="fa-solid fa-circle-check mr-1"></i> Domain Connected! GitHub Pages Setup:</p>
                        <p>To make your <b id="zwConnectedDomainLabel" class="text-white"></b> domain live on GitHub Pages, upload this <b>CNAME</b> file to your repository and point your domain's DNS A-Records to <code class="text-cyan-300">185.199.108.153</code>.</p>
                        <button onclick="window.ZenoProExtras.downloadCnameFile()" class="w-full py-2 rounded-xl bg-emerald-600/25 border border-emerald-500/40 hover:bg-emerald-600/40 text-emerald-300 font-bold text-xs">
                            <i class="fa-solid fa-download mr-1"></i> Download CNAME File for GitHub
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        },

        openDomainModal() {
            const modal = document.getElementById('zenoDomainModal');
            if (!modal) return;
            const currentSlug = window.state?.currentSiteName || 'default';
            const savedDomain = this.customDomains[currentSlug] || localStorage.getItem('zw_active_custom_domain') || '';
            const inp = document.getElementById('zwCustomDomainInput');
            if (inp) inp.value = savedDomain;
            this.refreshCnameBox(savedDomain);
            modal.classList.remove('hidden');
        },

        openExternalDomainService(type) {
            const siteSlug = (window.state?.currentSiteName || 'myzoneweb').replace(/[^a-z0-9-]/gi, '');
            const urlBox = document.getElementById('publicUrlBox');
            const fullPublicUrl = urlBox?.dataset?.fullUrl || window.location.href;

            if (type === 'tinyurl') {
                // Copy current website public link automatically so user can paste straight into TinyURL
                try { navigator.clipboard.writeText(fullPublicUrl); } catch (e) {}
                const notice = document.getElementById('zwDomainCopyNotice');
                if (notice) {
                    notice.innerText = "✓ Your website link was copied! Paste it into TinyURL, then paste the short link below.";
                    notice.classList.remove('hidden');
                }
                window.open('https://tinyurl.com/app/', '_blank');
            } else if (type === 'com') {
                window.open(`https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(siteSlug + '.com')}`, '_blank');
            } else if (type === 'net') {
                window.open(`https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(siteSlug + '.net')}`, '_blank');
            }
        },

        saveCustomDomain() {
            const raw = (document.getElementById('zwCustomDomainInput')?.value || '').trim();
            if (!raw) return alert("Please enter a valid .com, .net, or TinyURL link.");

            const formattedUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
            const currentSlug = window.state?.currentSiteName || 'default';

            this.customDomains[currentSlug] = formattedUrl;
            localStorage.setItem('zw_custom_domains', JSON.stringify(this.customDomains));
            localStorage.setItem('zw_active_custom_domain', formattedUrl);

            // Apply custom domain to top Public Link bar
            const banner = document.getElementById('publicLinkBanner');
            const urlBox = document.getElementById('publicUrlBox');
            if (banner && urlBox) {
                banner.classList.remove('hidden');
                urlBox.value = formattedUrl;
                urlBox.dataset.fullUrl = formattedUrl;
            }

            this.refreshCnameBox(formattedUrl);
            alert(`✅ Domain connected: ${formattedUrl}`);
        },

        removeCustomDomain() {
            const currentSlug = window.state?.currentSiteName || 'default';
            delete this.customDomains[currentSlug];
            localStorage.setItem('zw_custom_domains', JSON.stringify(this.customDomains));
            localStorage.removeItem('zw_active_custom_domain');

            const inp = document.getElementById('zwCustomDomainInput');
            if (inp) inp.value = '';
            this.refreshCnameBox('');

            if (window.state?.currentSiteHtml && typeof window.updatePublicLinkUI === 'function') {
                window.updatePublicLinkUI(window.state.currentSiteName || 'website', window.state.currentSiteHtml);
            }
        },

        refreshCnameBox(domainUrl) {
            const box = document.getElementById('zwCnameBox');
            const label = document.getElementById('zwConnectedDomainLabel');
            if (!box || !label) return;

            const cleanHost = (domainUrl || '').replace(/^https?:\/\//i, '').split('/')[0];
            if (cleanHost && (cleanHost.endsWith('.com') || cleanHost.endsWith('.net') || cleanHost.includes('.')) && !cleanHost.includes('tinyurl.com')) {
                label.innerText = cleanHost;
                box.classList.remove('hidden');
            } else {
                box.classList.add('hidden');
            }
        },

        downloadCnameFile() {
            const raw = (document.getElementById('zwCustomDomainInput')?.value || '').trim();
            const cleanHost = raw.replace(/^https?:\/\//i, '').split('/')[0];
            if (!cleanHost) return;
            const blob = new Blob([cleanHost], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'CNAME';
            a.click();
        },

        hookPublicLinkWithCustomDomain() {
            const origUpdateLink = window.updatePublicLinkUI;
            if (typeof origUpdateLink !== 'function') return;

            window.updatePublicLinkUI = (siteName, html) => {
                origUpdateLink(siteName, html);
                const savedDomain = this.customDomains[siteName];
                if (savedDomain) {
                    const urlBox = document.getElementById('publicUrlBox');
                    if (urlBox) {
                        urlBox.value = savedDomain;
                        urlBox.dataset.fullUrl = savedDomain;
                    }
                }
            };
        },

        // =========================================================================
        // 3. TRASH CAN (تەنەکەی خۆڵ) FOR INBOX PROJECTS & CHAT ITEMS
        // =========================================================================
        upgradeInboxWithTrashButtons() {
            // A. Upgrade Saved Projects Inbox inside 3-Dots Drawer with Trash Can per project
            window.renderProjectsList = () => {
                const container = document.getElementById('savedProjectsList');
                if (!container) return;

                const projects = window.state?.projects || [];
                if (!projects.length) {
                    container.innerHTML = `<p class="text-gray-500 px-2">No websites built yet</p>`;
                    return;
                }

                container.innerHTML = projects.map((p, idx) => {
                    const safeName = String(p.name || 'project').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    return `
                    <div class="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-xl hover:bg-white/10 transition group">
                        <button onclick="window.loadSavedProject(${idx})" class="flex-1 flex items-center justify-between text-left overflow-hidden pr-1">
                            <span class="truncate font-medium text-gray-200"><i class="fa-solid fa-globe mr-1.5 accent-text"></i>${safeName}</span>
                            <span class="text-[10px] text-gray-500 ml-2 shrink-0">${p.date || ''}</span>
                        </button>
                        <button onclick="event.stopPropagation(); window.ZenoProExtras.deleteSavedProject(${idx})"
                            class="w-7 h-7 rounded-lg bg-red-500/15 hover:bg-red-600 text-red-400 hover:text-white flex items-center justify-center shrink-0 transition"
                            title="Delete project from Inbox">
                            <i class="fa-solid fa-trash-can text-[11px]"></i>
                        </button>
                    </div>`;
                }).join('');
            };

            // B. Upgrade Main Chat Inbox Feed with a Trash Can button on every Inbox Card
            window.renderChatHistory = () => {
                const feed = document.getElementById('chatFeed');
                if (!feed) return;
                const history = window.state?.chatHistory || [];

                if (history.length > 0) {
                    document.getElementById('heroPrompt')?.classList.add('hidden');
                } else {
                    document.getElementById('heroPrompt')?.classList.remove('hidden');
                }

                feed.innerHTML = history.map((msg, idx) => {
                    const safeText = String(msg.text || '')
                        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

                    return `
                    <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full">
                        <div class="relative max-w-[88%] rounded-2xl p-4 pr-10 ${msg.role === 'user' ? 'accent-bg text-white' : 'card-bg'} shadow-lg overflow-hidden break-words">
                            <button onclick="window.ZenoProExtras.deleteInboxChatItem(${idx})"
                                class="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg ${msg.role === 'user' ? 'bg-black/25 hover:bg-red-600 text-white/80 hover:text-white' : 'bg-red-500/15 hover:bg-red-600 text-red-400 hover:text-white'} flex items-center justify-center transition"
                                title="Delete from Inbox">
                                <i class="fa-solid fa-trash-can text-[11px]"></i>
                            </button>
                            ${msg.imageUrl ? `<img src="${msg.imageUrl}" class="max-h-48 rounded-xl mb-2 border border-white/20">` : ''}
                            <div class="text-sm whitespace-pre-wrap leading-relaxed break-words">${safeText}</div>
                            ${msg.hasSiteAction ? `
                                <div class="mt-3 pt-3 border-t border-gray-500/20 flex flex-wrap gap-2">
                                    <button onclick="openPreviewModal()" class="px-4 py-2 rounded-xl accent-bg text-white text-xs font-bold flex items-center gap-1.5 shadow">
                                        <i class="fa-solid fa-eye"></i> Preview Website
                                    </button>
                                    <button onclick="copyPublicLink()" class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow">
                                        <i class="fa-regular fa-copy"></i> Copy Public Link
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>`;
                }).join('');

                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            };

            // Render immediately with the new Trash Can buttons
            window.renderProjectsList();
            window.renderChatHistory();
        },

        deleteSavedProject(idx) {
            if (!window.state?.projects || !window.state.projects[idx]) return;
            const proj = window.state.projects[idx];
            if (!confirm(`Delete project "${proj.name}" permanently from your Inbox?`)) return;

            window.state.projects.splice(idx, 1);
            localStorage.setItem('zw_projects', JSON.stringify(window.state.projects));

            // If the deleted project was currently active, reset active site view cleanly
            if (window.state.currentSiteName === proj.name) {
                window.state.currentSiteName = '';
                window.state.currentSiteHtml = '';
                localStorage.removeItem('zw_current_site_name');
                localStorage.removeItem('zw_current_site_html');
                document.getElementById('publicLinkBanner')?.classList.add('hidden');
                if (typeof window.updateKeepEditingBar === 'function') window.updateKeepEditingBar();
            }

            window.renderProjectsList();
        },

        deleteInboxChatItem(idx) {
            if (!window.state?.chatHistory) return;
            window.state.chatHistory.splice(idx, 1);
            localStorage.setItem('zw_chat_history', JSON.stringify(window.state.chatHistory));
            window.renderChatHistory();
        }
    };

    ZenoProExtras.init();
})();
