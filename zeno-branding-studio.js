/**
 * ZENO-BRANDING-STUDIO.JS
 * 1. Custom 3D Blue-Purple Diamond Logo on Welcome Screen ("Welcome to ZoneWeb") & Top of All Screens
 * 2. Templates Studio Upgrade: Website Name, Title Design Styles & Color Customizer
 * 3. Full Save Integration: Adds to Inbox (Chat Feed & Saved Projects), Generates Named Public Link & Opens Clean Preview
 */
(function () {
    const ZenoBrandingStudio = {
        siteName: '',
        titleStyle: 'gradient',
        titleColor: '#6366f1',
        accentThemeColor: '#7c3aed',
        showHeaderOnSite: true,

        // High-definition transparent SVG matching the 3D faceted blue-to-purple diamond logo
        getLogoSvg(sizeClass = 'w-10 h-10', idSuffix = 'main') {
            return `
            <svg viewBox="0 0 120 150" class="${sizeClass} shrink-0 drop-shadow-[0_0_16px_rgba(99,102,241,0.65)]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="zwTopFace_${idSuffix}" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stop-color="#3b63f6"/>
                        <stop offset="100%" stop-color="#3730a3"/>
                    </linearGradient>
                    <linearGradient id="zwBotFace_${idSuffix}" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stop-color="#4c1d95"/>
                        <stop offset="100%" stop-color="#7e22ce"/>
                    </linearGradient>
                    <linearGradient id="zwBevelTL_${idSuffix}" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#60a5fa"/>
                        <stop offset="50%" stop-color="#818cf8"/>
                        <stop offset="100%" stop-color="#4f46e5"/>
                    </linearGradient>
                    <linearGradient id="zwBevelTR_${idSuffix}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#c084fc"/>
                        <stop offset="60%" stop-color="#7c3aed"/>
                        <stop offset="100%" stop-color="#38bdf8"/>
                    </linearGradient>
                    <linearGradient id="zwBevelBL_${idSuffix}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#4338ca"/>
                        <stop offset="100%" stop-color="#6b21a8"/>
                    </linearGradient>
                    <linearGradient id="zwBevelBR_${idSuffix}" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#a855f7"/>
                        <stop offset="100%" stop-color="#581c87"/>
                    </linearGradient>
                </defs>
                <!-- Outer Beveled Facets -->
                <polygon points="60,2 60,16 14,75 2,75" fill="url(#zwBevelTL_${idSuffix})"/>
                <polygon points="60,2 118,75 106,75 60,16" fill="url(#zwBevelTR_${idSuffix})"/>
                <polygon points="2,75 14,75 60,134 60,148" fill="url(#zwBevelBL_${idSuffix})"/>
                <polygon points="118,75 60,148 60,134 106,75" fill="url(#zwBevelBR_${idSuffix})"/>
                <!-- Inner Upper & Lower Crystal Faces -->
                <polygon points="60,16 106,75 14,75" fill="url(#zwTopFace_${idSuffix})"/>
                <polygon points="14,75 106,75 60,134" fill="url(#zwBotFace_${idSuffix})"/>
                <!-- Crisp Specular Rim Highlights -->
                <polyline points="2,75 60,2 118,75 60,148 2,75" fill="none" stroke="rgba(196,181,253,0.45)" stroke-width="1.5"/>
                <line x1="14" y1="75" x2="106" y2="75" stroke="rgba(147,197,253,0.22)" stroke-width="1"/>
            </svg>`;
        },

        init() {
            window.ZenoBrandingStudio = this;
            // Apply Welcome Screen & Top Logos immediately to prevent flicker
            this.applyBrandingToAllScreens();
            this.setBrowserFavicon();

            const setupStudio = () => {
                this.applyBrandingToAllScreens();
                this.upgradeTemplatesWithNameDesignAndInboxSave();
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupStudio);
            } else {
                setupStudio();
            }
            console.log("💎 ZenoBrandingStudio Active (Custom Diamond Logo + Templates Naming & Inbox Sync).");
        },

        // =========================================================================
        // 1. WELCOME SCREEN & TOP-OF-SCREEN DIAMOND LOGO BRANDING
        // =========================================================================
        setBrowserFavicon() {
            try {
                const svgRaw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150"><polygon points="60,4 116,75 60,146 4,75" fill="#4f46e5" stroke="#a855f7" stroke-width="8"/><polygon points="60,16 104,75 16,75" fill="#3b82f6"/><polygon points="16,75 104,75 60,134" fill="#7e22ce"/></svg>`;
                let link = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                }
                link.href = 'data:image/svg+xml;base64,' + btoa(svgRaw);
            } catch (e) {}
        },

        applyBrandingToAllScreens() {
            // A. Screen 1: Welcome Splash Screen
            const screen1 = document.getElementById('screen1');
            if (screen1 && !screen1.dataset.diamondBranded) {
                screen1.dataset.diamondBranded = 'true';
                screen1.style.background = 'radial-gradient(circle at center, #13112b 0%, #06070c 72%)';
                screen1.innerHTML = `
                    <div class="welcome-anim flex flex-col items-center text-center px-4">
                        <div class="mb-6 relative flex items-center justify-center">
                            <div class="absolute w-36 h-36 rounded-full bg-indigo-600/25 blur-3xl"></div>
                            ${this.getLogoSvg('w-28 h-36 md:w-32 md:h-40 relative z-10', 'splash')}
                        </div>
                        <h1 class="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
                            Welcome to ZoneWeb
                        </h1>
                        <p class="mt-3 text-indigo-300/75 text-xs md:text-sm tracking-widest uppercase font-semibold">
                            Autonomous AI Website Studio
                        </p>
                    </div>
                    <div class="w-52 h-1.5 bg-white/10 rounded-full overflow-hidden mt-9 border border-white/10">
                        <div id="splashProgress" class="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-[4000ms] ease-linear w-0"></div>
                    </div>
                `;
                setTimeout(() => {
                    const bar = document.getElementById('splashProgress');
                    if (bar) bar.style.width = '100%';
                }, 60);
            }

            // B. Screen 2: Top of API Key Setup Screen
            const screen2Card = document.querySelector('#screen2 .card-bg');
            if (screen2Card && !document.getElementById('screen2DiamondLogo')) {
                const topBrand = document.createElement('div');
                topBrand.id = 'screen2DiamondLogo';
                topBrand.className = "flex items-center justify-center gap-2.5 pb-4 mb-5 border-b border-white/10";
                topBrand.innerHTML = `
                    ${this.getLogoSvg('w-8 h-10', 'scr2')}
                    <span class="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent">ZoneWeb</span>
                `;
                screen2Card.insertBefore(topBrand, screen2Card.firstChild);
            }

            // C. Screen 3: Top Header Bar next to "ZoneWeb"
            const screen3BrandSpan = document.querySelector('#screen3 header span.font-extrabold');
            if (screen3BrandSpan && !document.getElementById('headerDiamondLogo')) {
                const logoWrap = document.createElement('span');
                logoWrap.id = 'headerDiamondLogo';
                logoWrap.className = "inline-flex items-center mr-0.5";
                logoWrap.innerHTML = this.getLogoSvg('w-7 h-8', 'hdr3');
                screen3BrandSpan.parentElement.insertBefore(logoWrap, screen3BrandSpan);
            }

            // D. 3-Dots Drawer Header
            const drawerBrandSpan = document.querySelector('#drawerOverlay span.text-xl.font-bold');
            if (drawerBrandSpan && !document.getElementById('drawerDiamondLogo')) {
                const wrap = document.createElement('div');
                wrap.id = 'drawerDiamondLogo';
                wrap.className = "flex items-center gap-2";
                wrap.innerHTML = `${this.getLogoSvg('w-6 h-8', 'drw')} <span class="text-xl font-extrabold tracking-wide">ZoneWeb</span>`;
                drawerBrandSpan.replaceWith(wrap);
            }

            // E. Preview Modal Top Header
            const previewTitle = document.getElementById('previewSiteTitle');
            if (previewTitle && !document.getElementById('previewDiamondLogo')) {
                const logoEl = document.createElement('span');
                logoEl.id = 'previewDiamondLogo';
                logoEl.className = "inline-flex items-center";
                logoEl.innerHTML = this.getLogoSvg('w-5 h-6', 'prv');
                previewTitle.parentElement.insertBefore(logoEl, previewTitle);
            }
        },

        // =========================================================================
        // 2. TEMPLATES STUDIO: WEBSITE NAME + DESIGN & COLOR + INBOX / PREVIEW / PUBLIC LINK
        // =========================================================================
        upgradeTemplatesWithNameDesignAndInboxSave() {
            const attachToStudio = () => {
                if (!window.TemplatesStudio) return;
                const TS = window.TemplatesStudio;

                // Ensure Templates Studio DOM is built before enhancing it
                if (!document.getElementById('templatesFullStudio') && typeof TS.buildStudioView === 'function') {
                    TS.buildStudioView();
                }

                // Add Diamond Logo to Templates Studio Top Bar
                const studio = document.getElementById('templatesFullStudio');
                if (studio && !document.getElementById('studioDiamondLogo')) {
                    const topLeft = studio.querySelector('.card-bg > div:first-child');
                    if (topLeft) {
                        const brandBadge = document.createElement('div');
                        brandBadge.id = 'studioDiamondLogo';
                        brandBadge.className = "flex items-center gap-1.5 pl-1";
                        brandBadge.innerHTML = `${this.getLogoSvg('w-6 h-7', 'tpl')} <span class="font-extrabold text-xs md:text-sm bg-gradient-to-r from-blue-300 to-purple-400 bg-clip-text text-transparent">ZoneWeb Studio</span>`;
                        topLeft.appendChild(brandBadge);
                    }
                }

                // Inject "Website Name, Design & Color" Panel at the top of Templates Left Sidebar
                const leftSidebar = document.querySelector('#templatesFullStudio .md\\:col-span-5');
                if (leftSidebar && !document.getElementById('tplSiteIdentityPanel')) {
                    const identityPanel = document.createElement('div');
                    identityPanel.id = 'tplSiteIdentityPanel';
                    identityPanel.className = "p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border-2 border-indigo-500/40 space-y-3";
                    identityPanel.innerHTML = `
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                                <i class="fa-solid fa-signature mr-1"></i> Website Name & Title Design
                            </span>
                            <label class="flex items-center gap-1.5 text-[10px] text-gray-300 cursor-pointer">
                                <input id="tplShowBrandHeader" type="checkbox" checked onchange="window.ZenoBrandingStudio.updateBrandPreview()" class="accent-indigo-500 rounded">
                                Show on Site
                            </label>
                        </div>

                        <div>
                            <label class="text-[11px] text-gray-300 block mb-1">Website Name (Also used for Public Link & Inbox):</label>
                            <input id="tplCustomSiteName" type="text" value="" oninput="window.ZenoBrandingStudio.updateBrandPreview()" placeholder="e.g. Rabar Store, ReboFlix, My Portfolio..."
                                class="w-full bg-black/50 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-semibold">
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-[10px] text-gray-400 block mb-1">Title Design Style:</label>
                                <select id="tplTitleStyle" onchange="window.ZenoBrandingStudio.updateBrandPreview()" class="w-full bg-zinc-900 border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white">
                                    <option value="gradient">🌈 Gradient Glow</option>
                                    <option value="neon">⚡ Cyber Neon</option>
                                    <option value="glass">❄️ Glass Header Bar</option>
                                    <option value="gold">👑 Gold Luxury</option>
                                    <option value="minimal">✨ Clean Minimal</option>
                                    <option value="badge">💎 Diamond Pill Badge</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-[10px] text-gray-400 block mb-1">Title & Theme Color:</label>
                                <div class="flex items-center gap-1.5 pt-1">
                                    ${['#3b82f6', '#8b5cf6', '#e11d48', '#10b981', '#f59e0b'].map(c => `
                                        <button type="button" onclick="window.ZenoBrandingStudio.setTitleColor('${c}')" style="background:${c};" class="w-5 h-5 rounded-full border border-white/40 hover:scale-110 transition"></button>
                                    `).join('')}
                                    <input id="tplTitleColorPicker" type="color" value="#6366f1" onchange="window.ZenoBrandingStudio.setTitleColor(this.value)" class="w-6 h-6 rounded bg-transparent cursor-pointer">
                                </div>
                            </div>
                        </div>
                    `;
                    leftSidebar.insertBefore(identityPanel, leftSidebar.firstChild);
                }

                // Enhance renderCanvas to show the designed Website Name Header live inside the Templates Canvas
                if (!TS.__brandingRenderHooked) {
                    TS.__brandingRenderHooked = true;
                    const origRender = TS.renderCanvas.bind(TS);
                    TS.renderCanvas = () => {
                        origRender();
                        this.renderLiveSiteHeaderInCanvas();
                    };
                }

                // Override publishToWebsite so Save adds to Inbox (Chat + Saved Projects), creates named Public Link & opens clean Preview
                if (!TS.__brandingPublishHooked) {
                    TS.__brandingPublishHooked = true;
                    TS.publishToWebsite = () => this.publishDesignedTemplateSite();
                }
            };

            attachToStudio();
            // Also re-hook right when openStudio is called in case studio was built lazily
            if (window.TemplatesStudio && !window.TemplatesStudio.__brandingOpenHooked) {
                window.TemplatesStudio.__brandingOpenHooked = true;
                const origOpen = window.TemplatesStudio.openStudio.bind(window.TemplatesStudio);
                window.TemplatesStudio.openStudio = () => {
                    origOpen();
                    attachToStudio();
                    this.renderLiveSiteHeaderInCanvas();
                };
            }
        },

        setTitleColor(color) {
            this.titleColor = color;
            const picker = document.getElementById('tplTitleColorPicker');
            if (picker) picker.value = color;
            this.updateBrandPreview();
        },

        updateBrandPreview() {
            const nameInp = document.getElementById('tplCustomSiteName');
            const styleSel = document.getElementById('tplTitleStyle');
            const showChk = document.getElementById('tplShowBrandHeader');

            this.siteName = (nameInp?.value || '').trim();
            this.titleStyle = styleSel?.value || 'gradient';
            this.showHeaderOnSite = showChk ? showChk.checked : true;

            this.renderLiveSiteHeaderInCanvas();
        },

        buildDesignedTitleHtml(displayName, style, color) {
            const safeName = (displayName || 'My Website').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (style === 'neon') {
                return `
                <header style="width:100%;padding:22px 16px;text-align:center;position:relative;z-index:20;">
                    <h1 style="color:#ffffff;text-shadow:0 0 12px ${color}, 0 0 28px ${color};" class="text-3xl md:text-5xl font-black tracking-wider uppercase">${safeName}</h1>
                </header>`;
            }
            if (style === 'glass') {
                return `
                <header style="width:100%;padding:16px 24px;position:relative;z-index:20;background:rgba(10,12,22,0.55);backdrop-filter:blur(16px);border-bottom:1px solid ${color}55;display:flex;align-items:center;justify-content:center;gap:12px;">
                    <span style="width:12px;height:12px;border-radius:50%;background:${color};box-shadow:0 0 12px ${color};"></span>
                    <h1 style="color:#ffffff;" class="text-xl md:text-3xl font-extrabold tracking-tight">${safeName}</h1>
                </header>`;
            }
            if (style === 'gold') {
                return `
                <header style="width:100%;padding:22px 16px;text-align:center;position:relative;z-index:20;">
                    <h1 style="background:linear-gradient(90deg,#fde68a,#f59e0b,#fbbf24);-webkit-background-clip:text;color:transparent;" class="text-3xl md:text-5xl font-black tracking-widest uppercase drop-shadow-lg">👑 ${safeName}</h1>
                </header>`;
            }
            if (style === 'badge') {
                return `
                <header style="width:100%;padding:20px 16px;text-align:center;position:relative;z-index:20;">
                    <div style="display:inline-flex;align-items:center;gap:10px;padding:10px 26px;border-radius:9999px;background:${color}22;border:2px solid ${color};box-shadow:0 0 25px ${color}44;">
                        <span style="color:${color};font-size:18px;">◆</span>
                        <h1 class="text-xl md:text-3xl font-black text-white tracking-wide">${safeName}</h1>
                    </div>
                </header>`;
            }
            if (style === 'minimal') {
                return `
                <header style="width:100%;padding:20px 16px;text-align:center;position:relative;z-index:20;border-bottom:1px solid rgba(255,255,255,0.12);">
                    <h1 style="color:${color};" class="text-2xl md:text-4xl font-bold tracking-tight">${safeName}</h1>
                </header>`;
            }
            // Default: gradient glow
            return `
            <header style="width:100%;padding:22px 16px;text-align:center;position:relative;z-index:20;">
                <h1 style="background:linear-gradient(90deg,#ffffff,${color},#c084fc);-webkit-background-clip:text;color:transparent;" class="text-3xl md:text-5xl font-black tracking-tight drop-shadow-lg">${safeName}</h1>
            </header>`;
        },

        renderLiveSiteHeaderInCanvas() {
            const canvas = document.getElementById('studioLiveCanvas');
            if (!canvas) return;
            const old = document.getElementById('studioLiveBrandHeader');
            if (old) old.remove();

            if (!this.showHeaderOnSite || !this.siteName) return;

            const wrap = document.createElement('div');
            wrap.id = 'studioLiveBrandHeader';
            wrap.className = "absolute top-0 inset-x-0 pointer-events-none z-20";
            wrap.innerHTML = this.buildDesignedTitleHtml(this.siteName, this.titleStyle, this.titleColor);
            canvas.insertBefore(wrap, canvas.firstChild);
        },

        // Clean Publish Flow -> Saves to Inbox (Chat + Saved Projects), Sets Named Public Link & Opens Clean Preview
        publishDesignedTemplateSite() {
            const TS = window.TemplatesStudio;
            if (!TS) return;

            if (!TS.backgroundSelected) {
                TS.selectBackground('solid', '#090d16');
            }

            const rawName = (document.getElementById('tplCustomSiteName')?.value || this.siteName || '').trim();
            const displayName = rawName || 'My ZoneWeb Site';
            const cleanSlug = displayName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 28) || ('zoneweb-site-' + Math.floor(Math.random() * 999));

            let bgCss = `background: ${TS.bgConfig.value};`;
            if (TS.bgConfig.type === 'gallery' && TS.bgConfig.imageData) {
                bgCss = `background: url('${TS.bgConfig.imageData}') center/cover no-repeat fixed;`;
            } else if (TS.bgConfig.type === 'matrix') {
                bgCss = `background: linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px), #050806; background-size: 28px 28px;`;
            }

            const starsScript = `
                <canvas id="zwStarCanvas" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;display:${TS.bgConfig.type === 'stars' ? 'block' : 'none'};"></canvas>
                <script>
                    window.toggleStudioStars = function(){
                        const c = document.getElementById('zwStarCanvas');
                        if(c) c.style.display = c.style.display === 'none' ? 'block' : 'none';
                    };
                    (function(){
                        const c=document.getElementById('zwStarCanvas'),ctx=c.getContext('2d');
                        const r=()=>{c.width=innerWidth;c.height=innerHeight;};addEventListener('resize',r);r();
                        const st=Array.from({length:150},()=>({x:Math.random()*c.width,y:Math.random()*c.height,rad:Math.random()*2.2+0.6,sp:Math.random()*2.5+0.8}));
                        function d(){
                            ctx.clearRect(0,0,c.width,c.height);
                            ctx.fillStyle='#ffffff';
                            for(const s of st){
                                ctx.beginPath();ctx.arc(s.x,s.y,s.rad,0,Math.PI*2);ctx.fill();
                                s.y+=s.sp;if(s.y>c.height){s.y=-5;s.x=Math.random()*c.width;}
                            }
                            requestAnimationFrame(d);
                        }
                        d();
                    })();
                <\/script>`;

            const headerHtml = this.showHeaderOnSite
                ? this.buildDesignedTitleHtml(displayName, this.titleStyle, this.titleColor)
                : '';

            const positionedItemsHtml = TS.items.map(i => `
                <div style="position:absolute; left:${i.x}%; top:${i.y}%; z-index:10; max-width:92vw;">
                    ${i.html}
                </div>
            `).join('\n');

            const fullHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${displayName.replace(/</g, '&lt;')}</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        html, body { margin: 0; padding: 0; width: 100%; min-height: 100vh; overflow-x: hidden; }
    </style>
</head>
<body style="${bgCss}" class="text-white min-h-screen w-full relative overflow-x-hidden font-sans">
    ${starsScript}
    ${headerHtml}
    <main class="relative w-full min-h-[85vh]">
        ${positionedItemsHtml}
    </main>
</body>
</html>`;

            const finalHtml = typeof window.injectAdsAndPremium === 'function'
                ? window.injectAdsAndPremium(fullHtml)
                : fullHtml;

            // 1. Update Global State & LocalStorage
            if (window.state) {
                window.state.currentSiteName = cleanSlug;
                window.state.currentSiteHtml = finalHtml;
                localStorage.setItem('zw_current_site_name', cleanSlug);
                localStorage.setItem('zw_current_site_html', finalHtml);
            }

            // 2. Add to Saved Projects Inbox (3-Dots Drawer)
            if (typeof window.saveOrUpdateProjectInHistory === 'function') {
                window.saveOrUpdateProjectInHistory(cleanSlug, finalHtml, false);
            }

            // 3. Update Public Link Bar at the Top with the Website's Custom Name
            if (typeof window.updatePublicLinkUI === 'function') {
                window.updatePublicLinkUI(cleanSlug, finalHtml);
            }
            if (typeof window.updateKeepEditingBar === 'function') {
                window.updateKeepEditingBar();
            }

            // 4. Add Confirmation Card to the Main Chat Inbox (Just like AI-built websites!)
            if (typeof window.appendMessage === 'function') {
                window.appendMessage(
                    'ai',
                    `🎨 **Templates Website Saved to Inbox: "${displayName}"** (\`/${cleanSlug}\`)\n✅ Your custom design, colors, and interactive buttons are live! Use **Preview Website** or **Copy Public Link** below.`,
                    null,
                    true
                );
            }

            if (typeof window.triggerWebsiteReadyNotification === 'function') {
                window.triggerWebsiteReadyNotification(displayName);
            }

            // 5. Close Templates Studio & Immediately Show Clean Preview
            TS.closeStudio();
            setTimeout(() => {
                if (typeof window.openPreviewModal === 'function') {
                    window.openPreviewModal();
                }
            }, 120);
        }
    };

    ZenoBrandingStudio.init();
})();
