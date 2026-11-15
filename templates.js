/**
 * TEMPLATES.JS - Ready-Made Screens, Interactive Buttons, Styles, Color Studio & Command Builder
 */
(function () {
    const TemplatesStudio = {
        activeTab: 'buttons',
        selectedStyle: 'neon',
        selectedColor: '#3b82f6',
        selectedTextColor: '#ffffff',

        // Pre-made visual style presets (combinable with any color & command)
        stylePresets: {
            neon: "shadow-[0_0_25px_var(--btn-color)] border-2 border-[var(--btn-color)] font-extrabold tracking-wide uppercase transition-all duration-300 hover:scale-105",
            glass: "backdrop-blur-xl bg-white/10 border border-white/25 shadow-xl font-bold transition-all duration-300 hover:bg-white/20",
            threeD: "border-b-4 border-black/50 active:border-b-0 active:translate-y-1 font-extrabold shadow-lg transition-all",
            gradient: "bg-gradient-to-r from-[var(--btn-color)] to-purple-600 font-extrabold shadow-lg hover:opacity-95 transition-all hover:-translate-y-0.5",
            cyberpunk: "clip-path-polygon border-l-4 border-yellow-400 font-black uppercase tracking-widest shadow-xl",
            pill: "rounded-full px-8 py-4 font-extrabold shadow-xl hover:scale-105 transition-all",
            minimal: "border border-current bg-transparent hover:bg-white/10 font-semibold tracking-wide transition-all"
        },

        // Ready-made Full Screens & Sections
        readyScreens: [
            {
                id: 'hero_modern',
                name: '🚀 Modern SaaS Hero Screen',
                desc: 'Full hero screen with badge, gradient headline, and dual action buttons',
                build: (color, title, sub, btnText, cmdJs) => `
                <section class="py-20 px-6 text-center relative overflow-hidden" style="background: radial-gradient(circle at top, ${color}33, #05070c 70%);">
                    <span class="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border" style="border-color:${color}; color:${color}; background:${color}15;">✨ Featured Platform</span>
                    <h1 class="text-4xl md:text-6xl font-black mt-6 mb-4 text-white">${title || 'Welcome to Our Platform'}</h1>
                    <p class="text-slate-300 max-w-2xl mx-auto text-sm md:text-lg mb-8">${sub || 'Experience next-generation speed, modern design, and instant interactive features.'}</p>
                    <button onclick="${cmdJs}" style="background:${color};" class="px-8 py-4 rounded-2xl text-white font-extrabold text-sm shadow-2xl hover:scale-105 transition transform">
                        ${btnText || 'Get Started Now'}
                    </button>
                </section>`
            },
            {
                id: 'screen_login',
                name: '🔐 Glass Login & Signup Screen',
                desc: 'Complete authentication screen with email, password, and social login',
                build: (color, title, sub, btnText, cmdJs) => `
                <section class="py-16 px-4 flex justify-center items-center bg-black/90">
                    <div class="w-full max-w-md rounded-3xl p-8 backdrop-blur-xl bg-zinc-900/80 border border-white/15 shadow-2xl text-white">
                        <h2 class="text-2xl font-extrabold text-center mb-2">${title || 'Welcome Back'}</h2>
                        <p class="text-xs text-zinc-400 text-center mb-6">${sub || 'Sign in to access your dashboard'}</p>
                        <div class="space-y-4">
                            <input type="email" placeholder="Email Address" class="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm focus:outline-none">
                            <input type="password" placeholder="Password" class="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm focus:outline-none">
                            <button onclick="${cmdJs}" style="background:${color};" class="w-full py-3.5 rounded-xl text-white font-extrabold text-sm shadow-lg hover:opacity-90 transition">
                                ${btnText || 'Sign In'}
                            </button>
                        </div>
                    </div>
                </section>`
            },
            {
                id: 'screen_pricing',
                name: '💎 3-Tier VIP Pricing Screen',
                desc: 'Ready-made Basic, Pro, and Enterprise pricing cards with checkout buttons',
                build: (color, title, sub, btnText, cmdJs) => `
                <section class="py-16 px-6 bg-zinc-950 text-white">
                    <div class="max-w-6xl mx-auto text-center">
                        <h2 class="text-3xl md:text-5xl font-black mb-3">${title || 'Choose Your Plan'}</h2>
                        <p class="text-zinc-400 text-sm mb-12">${sub || 'Unlock full access with our flexible pricing'}</p>
                        <div class="grid md:grid-cols-3 gap-6">
                            <div class="p-6 rounded-3xl bg-zinc-900 border border-white/10 text-left">
                                <h3 class="font-bold text-lg">Starter</h3>
                                <p class="text-3xl font-black my-4">$9<span class="text-xs text-zinc-400">/mo</span></p>
                                <button onclick="${cmdJs}" class="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-xs">${btnText || 'Select Plan'}</button>
                            </div>
                            <div class="p-6 rounded-3xl bg-zinc-900 border-2 text-left transform md:-translate-y-2 shadow-2xl" style="border-color:${color};">
                                <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full text-white" style="background:${color};">Most Popular</span>
                                <h3 class="font-bold text-lg mt-3">Pro VIP</h3>
                                <p class="text-3xl font-black my-4">$29<span class="text-xs text-zinc-400">/mo</span></p>
                                <button onclick="${cmdJs}" style="background:${color};" class="w-full py-3 rounded-xl text-white font-extrabold text-xs shadow-lg">${btnText || 'Upgrade Now'}</button>
                            </div>
                            <div class="p-6 rounded-3xl bg-zinc-900 border border-white/10 text-left">
                                <h3 class="font-bold text-lg">Enterprise</h3>
                                <p class="text-3xl font-black my-4">$99<span class="text-xs text-zinc-400">/mo</span></p>
                                <button onclick="${cmdJs}" class="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-xs">${btnText || 'Contact Sales'}</button>
                            </div>
                        </div>
                    </div>
                </section>`
            },
            {
                id: 'screen_contact',
                name: '📱 Social & Direct Contact Screen',
                desc: 'Ready-made contact hub with TikTok, WhatsApp, Phone call & message box',
                build: (color, title, sub, btnText, cmdJs) => `
                <section class="py-16 px-6 bg-black text-white">
                    <div class="max-w-lg mx-auto rounded-3xl p-8 bg-zinc-900 border border-white/15 text-center shadow-2xl">
                        <h2 class="text-2xl font-extrabold mb-2">${title || 'Connect With Us'}</h2>
                        <p class="text-xs text-zinc-400 mb-6">${sub || 'Click below to chat or call directly'}</p>
                        <button onclick="${cmdJs}" style="background:${color};" class="w-full py-4 rounded-2xl text-white font-extrabold text-sm shadow-xl hover:scale-105 transition">
                            ${btnText || 'Contact Now'}
                        </button>
                    </div>
                </section>`
            },
            {
                id: 'screen_gallery',
                name: '🖼️ Product & Portfolio Showcase Grid',
                desc: '4-column interactive showcase cards with action triggers',
                build: (color, title, sub, btnText, cmdJs) => `
                <section class="py-16 px-6 bg-zinc-950 text-white">
                    <div class="max-w-6xl mx-auto">
                        <h2 class="text-3xl font-black mb-2">${title || 'Featured Collection'}</h2>
                        <p class="text-zinc-400 text-sm mb-8">${sub || 'Explore our top selected items'}</p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            ${[1, 2, 3].map(n => `
                            <div class="rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden p-5 flex flex-col justify-between">
                                <div class="h-40 rounded-xl mb-4 flex items-center justify-center text-4xl" style="background:${color}22; color:${color};">★</div>
                                <h3 class="font-bold text-base">Premium Item #${n}</h3>
                                <button onclick="${cmdJs}" style="background:${color};" class="mt-4 w-full py-2.5 rounded-xl text-white font-bold text-xs">${btnText || 'View Item'}</button>
                            </div>`).join('')}
                        </div>
                    </div>
                </section>`
            }
        ],

        init() {
            window.addEventListener('DOMContentLoaded', () => {
                this.injectTopTemplatesButton();
                this.createStudioModal();
            });
        },

        // Adds the "Templates" button to the top header bar
        injectTopTemplatesButton() {
            const topPreviewBtn = document.getElementById('topPreviewBtn');
            if (!topPreviewBtn || !topPreviewBtn.parentElement) return;

            const btn = document.createElement('button');
            btn.id = 'topTemplatesBtn';
            btn.className = "px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:opacity-95 transition shrink-0";
            btn.innerHTML = `<i class="fa-solid fa-layer-group"></i> <span>Templates</span>`;
            btn.onclick = () => this.openModal();

            topPreviewBtn.parentElement.insertBefore(btn, topPreviewBtn);
        },

        createStudioModal() {
            const modal = document.createElement('div');
            modal.id = 'templatesStudioModal';
            modal.className = "hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 md:p-6";
            modal.innerHTML = `
                <div class="card-bg w-full max-w-5xl rounded-3xl border border-white/15 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
                    <!-- Modal Header -->
                    <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center font-bold">
                                <i class="fa-solid fa-layer-group"></i>
                            </div>
                            <div>
                                <h2 class="font-extrabold text-base md:text-lg">ZoneWeb Templates & Command Studio</h2>
                                <p class="text-[11px] text-gray-400">Hundreds of customizable Buttons, Ready-Made Screens, Colors & Button Commands</p>
                            </div>
                        </div>
                        <button onclick="window.TemplatesStudio.closeModal()" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/30 text-gray-300 flex items-center justify-center">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <!-- Studio Body -->
                    <div class="flex-1 overflow-y-auto p-4 md:p-6 grid md:grid-cols-12 gap-6">
                        
                        <!-- Left Controls: Style, Color & Button Action Command -->
                        <div class="md:col-span-5 space-y-4 bg-black/30 p-4 rounded-2xl border border-white/10">
                            <h3 class="text-xs font-extrabold uppercase tracking-wider text-violet-400">1. Customize Color & Style</h3>
                            
                            <!-- Color Swatches + Custom Color Picker -->
                            <div>
                                <label class="text-[11px] text-gray-400 block mb-1.5">Pick Any Primary Color:</label>
                                <div class="flex flex-wrap items-center gap-2">
                                    ${['#3b82f6', '#e11d48', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#eab308'].map(c => `
                                        <button onclick="window.TemplatesStudio.setColor('${c}')" style="background:${c};" class="w-7 h-7 rounded-full border-2 border-white/40 hover:scale-110 transition"></button>
                                    `).join('')}
                                    <input type="color" id="tplCustomColor" value="#3b82f6" onchange="window.TemplatesStudio.setColor(this.value)" class="w-8 h-8 rounded cursor-pointer bg-transparent">
                                </div>
                            </div>

                            <!-- Style Selector -->
                            <div>
                                <label class="text-[11px] text-gray-400 block mb-1">Select Visual Style:</label>
                                <select id="tplStyleSelect" onchange="window.TemplatesStudio.updateLivePreview()" class="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white">
                                    <option value="neon">⚡ Neon Glow Style</option>
                                    <option value="gradient">🌈 Royal Gradient Style</option>
                                    <option value="glass">❄️ Frosted Glassmorphism</option>
                                    <option value="threeD">🎲 3D Push Button Style</option>
                                    <option value="pill">💊 Rounded Pill Style</option>
                                    <option value="cyberpunk">🤖 Cyberpunk Edge Style</option>
                                    <option value="minimal">✨ Clean Minimal Outline</option>
                                </select>
                            </div>

                            <!-- Text Labels -->
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="text-[11px] text-gray-400 block mb-1">Button / Action Text:</label>
                                    <input id="tplBtnText" type="text" value="Click Here Now" oninput="window.TemplatesStudio.updateLivePreview()" class="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs">
                                </div>
                                <div>
                                    <label class="text-[11px] text-gray-400 block mb-1">Screen Heading:</label>
                                    <input id="tplScreenTitle" type="text" value="Welcome to ZoneWeb" oninput="window.TemplatesStudio.updateLivePreview()" class="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs">
                                </div>
                            </div>

                            <hr class="border-white/10">

                            <!-- BUTTON COMMAND BUILDER -->
                            <h3 class="text-xs font-extrabold uppercase tracking-wider text-emerald-400">2. Assign Button Command (فەرمانی دوگمە)</h3>
                            <div>
                                <label class="text-[11px] text-gray-400 block mb-1">What should happen when clicked?</label>
                                <select id="tplCommandType" onchange="window.TemplatesStudio.updateCommandPlaceholder()" class="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white mb-2">
                                    <option value="url">🌐 Open Website / TikTok / Social Link</option>
                                    <option value="phone">📞 Direct Phone Call (tel:)</option>
                                    <option value="whatsapp">💬 Open WhatsApp Chat</option>
                                    <option value="alert">🔔 Show Popup Message / Alert</option>
                                    <option value="bg_color">🎨 Change Page Background Color</option>
                                    <option value="stars">✨ Trigger Falling Stars Animation</option>
                                    <option value="custom_js">💻 Run Custom JavaScript Command</option>
                                </select>
                                <input id="tplCommandTarget" type="text" value="https://www.tiktok.com/@rabar2008r" oninput="window.TemplatesStudio.updateLivePreview()" placeholder="Enter URL, phone number, message, or JS..." class="w-full bg-zinc-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono">
                            </div>

                            <!-- Live Interactive Button Preview Box -->
                            <div class="p-4 rounded-2xl bg-zinc-950 border border-white/10 text-center space-y-2">
                                <p class="text-[10px] text-gray-400 uppercase">Live Interactive Button Preview (Click to Test):</p>
                                <div id="tplLiveButtonPreview" class="py-2 flex justify-center"></div>
                                <button onclick="window.TemplatesStudio.injectCustomButton()" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg">
                                    <i class="fa-solid fa-plus-circle mr-1"></i> Add This Button to My Website
                                </button>
                            </div>
                        </div>

                        <!-- Right Gallery: Pre-Made Screens & Quick Component Templates -->
                        <div class="md:col-span-7 space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="text-xs font-extrabold uppercase tracking-wider text-blue-400">3. Ready-Made Screens & Full Templates</h3>
                                <span class="text-[11px] text-gray-400">Applies your selected color & button command!</span>
                            </div>

                            <div id="tplScreensList" class="grid sm:grid-cols-2 gap-3.5"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            this.updateLivePreview();
            this.renderScreensList();
        },

        openModal() {
            document.getElementById('templatesStudioModal')?.classList.remove('hidden');
            this.updateLivePreview();
        },

        closeModal() {
            document.getElementById('templatesStudioModal')?.classList.add('hidden');
        },

        setColor(color) {
            this.selectedColor = color;
            const picker = document.getElementById('tplCustomColor');
            if (picker) picker.value = color;
            this.updateLivePreview();
            this.renderScreensList();
        },

        updateCommandPlaceholder() {
            const type = document.getElementById('tplCommandType').value;
            const input = document.getElementById('tplCommandTarget');
            const placeholders = {
                url: 'https://www.tiktok.com/@rabar2008r',
                phone: '07516165051',
                whatsapp: '9647516165051',
                alert: 'Welcome to my official website!',
                bg_color: '#000000',
                stars: 'Falling stars activated!',
                custom_js: 'document.body.style.filter = "hue-rotate(90deg)";'
            };
            input.value = placeholders[type] || '';
            this.updateLivePreview();
        },

        buildCommandJsString() {
            const type = document.getElementById('tplCommandType')?.value || 'url';
            const val = (document.getElementById('tplCommandTarget')?.value || '').replace(/'/g, "\\'");

            if (type === 'url') return `window.open('${val.startsWith('http') ? val : 'https://' + val}', '_blank')`;
            if (type === 'phone') return `window.location.href='tel:${val.replace(/\\s+/g, '')}'`;
            if (type === 'whatsapp') return `window.open('https://wa.me/${val.replace(/[^0-9]/g, '')}', '_blank')`;
            if (type === 'alert') return `alert('${val}')`;
            if (type === 'bg_color') return `document.body.style.background='${val}'`;
            if (type === 'stars') return `if(window.activateFallingStars) window.activateFallingStars(); else alert('${val}');`;
            return val;
        },

        buildButtonHtml() {
            const styleKey = document.getElementById('tplStyleSelect')?.value || 'neon';
            const text = document.getElementById('tplBtnText')?.value || 'Click Here';
            const cmdJs = this.buildCommandJsString();
            const c = this.selectedColor;
            const presetClass = this.stylePresets[styleKey] || this.stylePresets.neon;

            return `<button onclick="${cmdJs.replace(/"/g, '&quot;')}" style="--btn-color:${c}; background-color:${styleKey === 'minimal' || styleKey === 'glass' ? 'transparent' : c}; color:#ffffff;" class="px-6 py-3.5 rounded-2xl text-sm ${presetClass}">${text}</button>`;
        },

        updateLivePreview() {
            const container = document.getElementById('tplLiveButtonPreview');
            if (container) {
                container.innerHTML = this.buildButtonHtml();
            }
            this.renderScreensList();
        },

        renderScreensList() {
            const list = document.getElementById('tplScreensList');
            if (!list) return;
            list.innerHTML = this.readyScreens.map(scr => `
                <div class="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between hover:border-violet-500/50 transition">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-extrabold text-xs text-white">${scr.name}</span>
                            <span class="w-4 h-4 rounded-full" style="background:${this.selectedColor};"></span>
                        </div>
                        <p class="text-[11px] text-gray-400 mb-4">${scr.desc}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.TemplatesStudio.injectScreen('${scr.id}', false)" class="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs">
                            + Add to Current Site
                        </button>
                        <button onclick="window.TemplatesStudio.injectScreen('${scr.id}', true)" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold" title="Replace & Create New Site">
                            New
                        </button>
                    </div>
                </div>
            `).join('');
        },

        injectCustomButton() {
            const btnHtml = `<div class="my-6 text-center relative z-20">${this.buildButtonHtml()}</div>`;
            this.appendHtmlToWebsite(btnHtml, false);
            this.closeModal();
        },

        injectScreen(screenId, asNewSite) {
            const scr = this.readyScreens.find(s => s.id === screenId);
            if (!scr) return;
            const title = document.getElementById('tplScreenTitle')?.value || 'Welcome';
            const btnText = document.getElementById('tplBtnText')?.value || 'Get Started';
            const cmdJs = this.buildCommandJsString().replace(/"/g, '&quot;');
            const sectionHtml = scr.build(this.selectedColor, title, 'Customized with ZoneWeb Studio', btnText, cmdJs);

            this.appendHtmlToWebsite(sectionHtml, asNewSite);
            this.closeModal();
        },

        appendHtmlToWebsite(snippetHtml, replaceAll) {
            if (!window.state) return;
            let current = window.state.currentSiteHtml;

            if (!current || replaceAll) {
                current = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZoneWeb Studio Site</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-black text-white min-h-screen font-sans">
    ${snippetHtml}
</body>
</html>`;
            } else if (current.includes('</body>')) {
                current = current.replace(/<\/body>/i, `\n${snippetHtml}\n</body>`);
            } else {
                current += snippetHtml;
            }

            window.state.currentSiteHtml = current;
            window.state.currentSiteName = window.state.currentSiteName || 'studio-custom-site';
            localStorage.setItem('zw_current_site_html', current);
            localStorage.setItem('zw_current_site_name', window.state.currentSiteName);

            if (typeof window.updatePublicLinkUI === 'function') {
                window.updatePublicLinkUI(window.state.currentSiteName, current);
            }
            if (typeof window.updateKeepEditingBar === 'function') {
                window.updateKeepEditingBar();
            }
            if (typeof window.appendMessage === 'function') {
                window.appendMessage('ai', `✨ **Template & Custom Command Injected!** Click **Preview Website** to test your new interactive design.`, null, true);
            }
        }
    };

    window.TemplatesStudio = TemplatesStudio;
    TemplatesStudio.init();
})();
