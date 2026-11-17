/**
 * TEMPLATES.JS - Instant-Open Visual Studio with Free Drag & Drop Positioning,
 * Step-by-Step Workflow (Background First -> Command First -> Add Button/Widget),
 * Phone Gallery Upload, Top Trash Can, and 100% Functional Output.
 */
(function () {
    const TemplatesStudio = {
        backgroundSelected: false,
        commandConfigured: false,
        bgConfig: {
            type: 'solid',
            value: '#090d16',
            imageData: ''
        },
        items: [],
        selectedItemId: null,
        selectedColor: '#3b82f6',
        dragState: {
            active: false,
            itemId: null,
            startX: 0,
            startY: 0,
            initialLeft: 0,
            initialTop: 0
        },

        buttonStyles: {
            neon: "shadow-[0_0_25px_var(--btn-color)] border-2 border-[var(--btn-color)] font-extrabold tracking-wide uppercase transition-transform duration-200 hover:scale-105",
            gradient: "bg-gradient-to-r from-[var(--btn-color)] via-indigo-600 to-purple-600 font-extrabold shadow-xl hover:opacity-95 transition-transform duration-200 hover:scale-105",
            glass: "backdrop-blur-xl bg-white/15 border border-white/30 shadow-xl font-bold hover:bg-white/25 transition-all",
            threeD: "border-b-4 border-black/60 active:border-b-0 active:translate-y-1 font-extrabold shadow-lg transition-all",
            pill: "rounded-full px-8 py-4 font-extrabold shadow-xl hover:scale-105 transition-all",
            cyberpunk: "border-l-4 border-r-4 border-yellow-400 font-black uppercase tracking-widest shadow-2xl",
            goldVip: "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)]",
            minimal: "border-2 border-white/80 bg-transparent hover:bg-white hover:text-black font-bold tracking-wide transition-all",
            pulse: "animate-pulse shadow-[0_0_30px_var(--btn-color)] font-extrabold tracking-wide",
            metallic: "bg-gradient-to-b from-zinc-700 via-zinc-800 to-black border border-zinc-500 font-bold shadow-inner"
        },

        readyWidgets: [
            {
                id: 'widget_bio',
                name: '👤 Glass Social Profile Card',
                build: (color) => `
                <div class="w-72 p-6 rounded-3xl backdrop-blur-xl bg-zinc-900/85 border border-white/15 text-center shadow-2xl text-white">
                    <div class="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black shadow-lg" style="background:${color};">
                        <i class="fa-solid fa-user-astronaut"></i>
                    </div>
                    <h3 class="font-extrabold text-lg">Official Creator</h3>
                    <p class="text-xs text-zinc-400 mt-1 mb-4">Digital Entrepreneur & Web Studio</p>
                    <div class="flex justify-center gap-3">
                        <a href="https://tiktok.com" target="_blank" class="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"><i class="fa-brands fa-tiktok"></i></a>
                        <a href="https://instagram.com" target="_blank" class="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"><i class="fa-brands fa-instagram"></i></a>
                        <a href="https://youtube.com" target="_blank" class="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"><i class="fa-brands fa-youtube"></i></a>
                    </div>
                </div>`
            },
            {
                id: 'widget_product',
                name: '🛍️ E-Commerce Product Card',
                build: (color) => `
                <div class="w-64 rounded-3xl bg-zinc-900/95 border border-white/15 overflow-hidden shadow-2xl text-white text-left">
                    <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80" class="w-full h-40 object-cover">
                    <div class="p-4">
                        <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/10" style="color:${color};">Featured Item</span>
                        <h4 class="font-extrabold text-sm mt-1.5">Luxury Smart Watch Pro</h4>
                        <div class="flex items-center justify-between mt-3">
                            <span class="text-lg font-black">$149.00</span>
                            <button onclick="alert('Added Luxury Smart Watch Pro to Cart!')" style="background:${color};" class="px-3.5 py-1.5 rounded-xl text-white font-bold text-xs shadow">Buy Now</button>
                        </div>
                    </div>
                </div>`
            },
            {
                id: 'widget_login',
                name: '🔐 Member Login Box',
                build: (color) => `
                <div class="w-72 p-6 rounded-3xl bg-zinc-900/95 border border-white/15 shadow-2xl text-white text-left space-y-3">
                    <h3 class="font-extrabold text-base text-center">Member Sign In</h3>
                    <input type="email" placeholder="Email Address" class="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs focus:outline-none">
                    <input type="password" placeholder="Password" class="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs focus:outline-none">
                    <button onclick="alert('Login verified successfully!')" style="background:${color};" class="w-full py-2.5 rounded-xl text-white font-extrabold text-xs shadow-lg">Sign In</button>
                </div>`
            },
            {
                id: 'widget_pricing',
                name: '💎 VIP Membership Plan Card',
                build: (color) => `
                <div class="w-64 p-6 rounded-3xl bg-zinc-900/95 border-2 shadow-2xl text-white text-left" style="border-color:${color};">
                    <span class="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full text-white" style="background:${color};">VIP PRO</span>
                    <h3 class="font-extrabold text-lg mt-3">All-Access Pass</h3>
                    <p class="text-3xl font-black my-2">$19<span class="text-xs text-zinc-400">/month</span></p>
                    <ul class="text-xs text-zinc-300 space-y-1.5 mb-4">
                        <li>✓ Unlimited Full HD Access</li>
                        <li>✓ 24/7 Priority Support</li>
                        <li>✓ Zero Advertisements</li>
                    </ul>
                    <button onclick="alert('Redirecting to VIP Checkout...')" style="background:${color};" class="w-full py-2.5 rounded-xl text-white font-extrabold text-xs shadow-lg">Join VIP Now</button>
                </div>`
            },
            {
                id: 'widget_search',
                name: '🔍 Interactive Search Bar',
                build: (color) => `
                <div class="w-80 flex items-center bg-zinc-900/95 border border-white/20 rounded-2xl p-1.5 shadow-xl text-white">
                    <i class="fa-solid fa-magnifying-glass text-zinc-400 text-xs px-3"></i>
                    <input type="text" placeholder="Search movies, products, games..." class="flex-1 bg-transparent text-xs focus:outline-none">
                    <button onclick="alert('Searching database...')" style="background:${color};" class="px-4 py-2 rounded-xl text-white font-bold text-xs">Search</button>
                </div>`
            },
            {
                id: 'widget_countdown',
                name: '⏳ Live Flash Sale Countdown',
                build: (color) => `
                <div class="w-72 p-4 rounded-2xl bg-zinc-900/90 border border-white/15 text-center text-white shadow-xl">
                    <p class="text-[10px] uppercase tracking-widest font-bold mb-2" style="color:${color};">⚡ Limited Time Offer Ends In</p>
                    <div class="grid grid-cols-3 gap-2 font-mono">
                        <div class="bg-black/60 p-2 rounded-xl"><span class="text-xl font-black">08</span><span class="block text-[9px] text-zinc-400">HOURS</span></div>
                        <div class="bg-black/60 p-2 rounded-xl"><span class="text-xl font-black">45</span><span class="block text-[9px] text-zinc-400">MINS</span></div>
                        <div class="bg-black/60 p-2 rounded-xl"><span class="text-xl font-black text-amber-400">29</span><span class="block text-[9px] text-zinc-400">SECS</span></div>
                    </div>
                </div>`
            }
        ],

        init() {
            window.TemplatesStudio = this;
            // Execute immediately if DOM is already ready, or on DOMContentLoaded
            const setup = () => {
                this.bindTopButton();
                this.buildStudioView();
                this.attachGlobalDragListeners();
            };
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setup);
            } else {
                setup();
            }
            console.log("🎨 TemplatesStudio Ready & Bound Immediately.");
        },

        bindTopButton() {
            const btn = document.getElementById('topTemplatesBtn');
            if (btn) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    this.openStudio();
                };
            }
        },

        // Guaranteed to build and open immediately when clicked
        openStudio() {
            if (!document.getElementById('templatesFullStudio')) {
                this.buildStudioView();
                this.attachGlobalDragListeners();
            }
            document.getElementById('templatesFullStudio')?.classList.remove('hidden');
            const chatBar = document.getElementById('bottomChatBarContainer');
            if (chatBar) chatBar.classList.add('hidden');
            this.renderCanvas();
        },

        closeStudio() {
            document.getElementById('templatesFullStudio')?.classList.add('hidden');
            const chatBar = document.getElementById('bottomChatBarContainer');
            if (chatBar) chatBar.classList.remove('hidden');
        },

        buildStudioView() {
            if (document.getElementById('templatesFullStudio') || !document.body) return;

            const studio = document.createElement('div');
            studio.id = 'templatesFullStudio';
            studio.className = "hidden fixed inset-0 z-50 bg-[#07080d] text-white flex flex-col overflow-hidden select-none";
            studio.innerHTML = `
                <!-- TOP STUDIO BAR -->
                <div class="card-bg px-3 md:px-5 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div class="flex items-center gap-2">
                        <button onclick="window.TemplatesStudio.closeStudio()" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5">
                            <i class="fa-solid fa-arrow-left"></i>
                            <span>Back to AI Chat</span>
                        </button>
                        <span class="font-extrabold text-sm hidden lg:inline text-violet-400">
                            <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>Templates & Free-Drag Studio
                        </span>
                    </div>

                    <!-- POSITION CONTROLS -->
                    <div class="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-xl border border-white/10">
                        <span class="text-[10px] text-gray-400 mr-1 hidden sm:inline">Position:</span>
                        <button onclick="window.TemplatesStudio.nudgeSelected(0, -15)" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-xs"><i class="fa-solid fa-arrow-up"></i></button>
                        <button onclick="window.TemplatesStudio.nudgeSelected(0, 15)" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-xs"><i class="fa-solid fa-arrow-down"></i></button>
                        <button onclick="window.TemplatesStudio.nudgeSelected(-15, 0)" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-xs"><i class="fa-solid fa-arrow-left"></i></button>
                        <button onclick="window.TemplatesStudio.nudgeSelected(15, 0)" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-xs"><i class="fa-solid fa-arrow-right"></i></button>
                        <button onclick="window.TemplatesStudio.centerSelected()" class="px-2 h-7 rounded-lg bg-blue-500/20 text-blue-300 text-[10px] font-bold">Center</button>
                    </div>

                    <!-- TRASH CAN (DELETE) & PUBLISH -->
                    <div class="flex items-center gap-2">
                        <button onclick="window.TemplatesStudio.deleteSelectedOrLast()" class="px-3 py-2 rounded-xl bg-red-600/20 border border-red-500/40 hover:bg-red-600 text-red-300 hover:text-white text-xs font-extrabold flex items-center gap-1.5 transition shadow">
                            <i class="fa-solid fa-trash-can"></i>
                            <span>Delete</span>
                        </button>

                        <button onclick="window.TemplatesStudio.clearAllItems()" class="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-xs font-bold" title="Reset All">
                            <i class="fa-solid fa-rotate-left"></i>
                        </button>

                        <button onclick="window.TemplatesStudio.publishToWebsite()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg">
                            <i class="fa-solid fa-check-circle"></i>
                            <span>Save & Publish</span>
                        </button>
                    </div>
                </div>

                <!-- MAIN STUDIO WORKSPACE -->
                <div class="flex-1 grid md:grid-cols-12 overflow-y-auto md:overflow-hidden">
                    
                    <!-- LEFT SIDEBAR -->
                    <div class="md:col-span-5 p-4 space-y-4 overflow-y-auto border-r border-white/10 bg-[#0b0d14]">
                        
                        <!-- STEP 1: BACKGROUND FIRST -->
                        <div class="p-3.5 rounded-2xl bg-white/5 border-2 border-violet-500/40 space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-extrabold uppercase tracking-wider text-violet-400">Step 1: Choose Background First</span>
                                <span id="step1Badge" class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">Required</span>
                            </div>

                            <div class="grid grid-cols-3 gap-1.5">
                                <button onclick="window.TemplatesStudio.selectBackground('solid', '#000000')" class="py-2 rounded-xl bg-black border border-white/20 text-[11px] font-bold hover:border-violet-400">Pitch Black</button>
                                <button onclick="window.TemplatesStudio.selectBackground('solid', '#0f172a')" class="py-2 rounded-xl bg-slate-900 border border-white/20 text-[11px] font-bold hover:border-violet-400">Deep Navy</button>
                                <button onclick="window.TemplatesStudio.selectBackground('gradient', 'linear-gradient(135deg, #1e1b4b, #311042, #090a0f)')" class="py-2 rounded-xl bg-gradient-to-r from-indigo-950 to-purple-950 border border-white/20 text-[11px] font-bold hover:border-violet-400">Cyber Neon</button>
                                <button onclick="window.TemplatesStudio.selectBackground('gradient', 'linear-gradient(135deg, #064e3b, #0f172a, #000000)')" class="py-2 rounded-xl bg-gradient-to-r from-emerald-950 to-slate-950 border border-white/20 text-[11px] font-bold hover:border-violet-400">Emerald Dark</button>
                                <button onclick="window.TemplatesStudio.selectBackground('stars', '#000000')" class="py-2 rounded-xl bg-zinc-900 border border-amber-500/40 text-amber-300 text-[11px] font-bold">✨ Falling Stars</button>
                                <button onclick="window.TemplatesStudio.selectBackground('matrix', '#000000')" class="py-2 rounded-xl bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">💻 Cyber Grid</button>
                            </div>

                            <div class="flex items-center gap-2 pt-1">
                                <label class="flex-1 py-2 px-3 rounded-xl bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-300 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition">
                                    <i class="fa-regular fa-image"></i>
                                    <span>Upload Background from Gallery</span>
                                    <input type="file" accept="image/*" class="hidden" onchange="window.TemplatesStudio.uploadGalleryBackground(event)">
                                </label>
                                <input type="color" onchange="window.TemplatesStudio.selectBackground('solid', this.value)" class="w-9 h-9 rounded-xl cursor-pointer bg-transparent border border-white/20">
                            </div>
                        </div>

                        <!-- STEP 2: GALLERY PHOTOS, TEXT & WIDGETS -->
                        <div id="step2GalleryPanel" class="opacity-40 pointer-events-none transition-all p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                            <span class="text-xs font-extrabold uppercase tracking-wider text-blue-400">Step 2: Add Gallery Photos, Text & Ready Widgets</span>
                            
                            <label class="w-full py-2 px-3 rounded-xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
                                <i class="fa-solid fa-camera"></i>
                                <span>Add Photo / Logo from Gallery</span>
                                <input type="file" accept="image/*" class="hidden" onchange="window.TemplatesStudio.addGalleryImageItem(event)">
                            </label>

                            <div class="flex gap-1.5">
                                <input id="tplHeadingInput" type="text" placeholder="Enter heading or title text..." class="flex-1 bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white">
                                <button onclick="window.TemplatesStudio.addHeadingItem()" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold shrink-0">+ Add Text</button>
                            </div>

                            <div>
                                <label class="text-[11px] text-gray-400 block mb-1">Insert Ready-Made Interactive Component:</label>
                                <div class="flex gap-1.5">
                                    <select id="tplWidgetSelect" class="flex-1 bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white">
                                        ${this.readyWidgets.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
                                    </select>
                                    <button onclick="window.TemplatesStudio.addSelectedWidget()" class="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shrink-0">+ Insert</button>
                                </div>
                            </div>
                        </div>

                        <!-- STEP 3: BUTTON COMMAND FIRST -->
                        <div id="step3ButtonPanel" class="opacity-40 pointer-events-none transition-all p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                            <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Step 3: Add Button (Set Command First)</span>

                            <div class="p-3 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2">
                                <label class="text-[11px] font-bold text-emerald-300 block">1. Select Button Action Command First:</label>
                                <select id="tplCmdType" onchange="window.TemplatesStudio.onCommandChanged()" class="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white">
                                    <option value="">-- Choose What Happens When Clicked --</option>
                                    <option value="url">🌐 Open Website / URL Link</option>
                                    <option value="tiktok">🎵 Open TikTok Profile (@username)</option>
                                    <option value="phone">📞 Direct Phone Call (tel:)</option>
                                    <option value="whatsapp">💬 Open WhatsApp Chat</option>
                                    <option value="alert">🔔 Show Popup Alert Message</option>
                                    <option value="bg_color">🎨 Change Page Background Color Live</option>
                                    <option value="stars">✨ Toggle Falling Stars Animation</option>
                                    <option value="custom_js">💻 Execute Custom JavaScript Code</option>
                                </select>
                                <input id="tplCmdValue" type="text" oninput="window.TemplatesStudio.onCommandChanged()" placeholder="Enter URL, @username, phone number, message, or JS..." class="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300">
                            </div>

                            <div id="buttonStyleSubPanel" class="opacity-40 pointer-events-none transition-all space-y-2.5 pt-1">
                                <label class="text-[11px] font-bold text-gray-300 block">2. Customize Button Text, Style & Color:</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <input id="tplBtnLabel" type="text" value="Launch Now" placeholder="Button Text..." class="bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white">
                                    <select id="tplBtnStyle" class="bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white">
                                        <option value="neon">⚡ Neon Glow</option>
                                        <option value="gradient">🌈 Royal Gradient</option>
                                        <option value="goldVip">👑 Gold VIP</option>
                                        <option value="glass">❄️ Frosted Glass</option>
                                        <option value="threeD">🎲 3D Push Button</option>
                                        <option value="pill">💊 Rounded Pill</option>
                                        <option value="cyberpunk">🤖 Cyberpunk Edge</option>
                                        <option value="minimal">✨ Minimal Outline</option>
                                        <option value="pulse">🔥 Pulse Glow</option>
                                        <option value="metallic">⚙️ Dark Metallic</option>
                                    </select>
                                </div>

                                <div class="flex items-center gap-1.5 pt-1">
                                    <span class="text-[11px] text-gray-400">Color:</span>
                                    ${['#3b82f6', '#e11d48', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'].map(c => `
                                        <button onclick="window.TemplatesStudio.setBtnColor('${c}')" style="background:${c};" class="w-5 h-5 rounded-full border border-white/40 hover:scale-110 transition"></button>
                                    `).join('')}
                                    <input type="color" onchange="window.TemplatesStudio.setBtnColor(this.value)" class="w-6 h-6 rounded bg-transparent cursor-pointer">
                                </div>

                                <button onclick="window.TemplatesStudio.addConfiguredButton()" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg">
                                    <i class="fa-solid fa-plus-circle mr-1"></i> Add Functional Button to Canvas
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT PANEL: FREE DRAG & DROP CANVAS -->
                    <div class="md:col-span-7 flex flex-col bg-black/70 p-3 md:p-4 overflow-hidden">
                        <div class="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs text-gray-400">
                            <span>🖐️ <b>Free Drag & Drop Canvas:</b> Drag any button or item to position it anywhere!</span>
                            <span id="selectedIndicator" class="text-amber-400 font-bold">No item selected</span>
                        </div>

                        <div id="studioLiveCanvas" class="flex-1 rounded-3xl border-2 border-white/15 overflow-hidden relative transition-all min-h-[420px]" style="background:#090d16;"></div>
                    </div>

                </div>
            `;
            document.body.appendChild(studio);
        },

        selectBackground(type, value, imageData = '') {
            this.bgConfig = { type, value, imageData };
            this.backgroundSelected = true;

            const badge = document.getElementById('step1Badge');
            if (badge) {
                badge.innerText = 'Completed ✓';
                badge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold';
            }

            document.getElementById('step2GalleryPanel')?.classList.remove('opacity-40', 'pointer-events-none');
            document.getElementById('step3ButtonPanel')?.classList.remove('opacity-40', 'pointer-events-none');
            this.renderCanvas();
        },

        uploadGalleryBackground(event) {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.selectBackground('gallery', '#000000', e.target.result);
            };
            reader.readAsDataURL(file);
        },

        getNextDefaultPosition() {
            const count = this.items.length;
            const x = Math.min(55, Math.max(12, 22 + (count % 3) * 8));
            const y = Math.min(78, Math.max(12, 16 + count * 14));
            return { x, y };
        },

        addGalleryImageItem(event) {
            if (!this.backgroundSelected) return alert("Please select a Background in Step 1 first!");
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const id = 'item_' + Date.now();
                const pos = this.getNextDefaultPosition();
                const imgHtml = `<img src="${e.target.result}" draggable="false" class="w-44 md:w-56 rounded-3xl shadow-2xl border-2 border-white/20 object-cover pointer-events-none">`;
                this.items.push({ id, type: 'image', html: imgHtml, label: 'Gallery Image', x: pos.x, y: pos.y });
                this.selectedItemId = id;
                this.renderCanvas();
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        },

        addHeadingItem() {
            if (!this.backgroundSelected) return alert("Please select a Background in Step 1 first!");
            const input = document.getElementById('tplHeadingInput');
            const text = (input?.value || '').trim();
            if (!text) return;
            const id = 'item_' + Date.now();
            const pos = this.getNextDefaultPosition();
            const safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const html = `<h1 class="text-3xl md:text-5xl font-black text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] whitespace-nowrap">${safeText}</h1>`;
            this.items.push({ id, type: 'heading', html, label: `Text: ${safeText.slice(0, 15)}`, x: pos.x, y: pos.y });
            this.selectedItemId = id;
            input.value = '';
            this.renderCanvas();
        },

        addSelectedWidget() {
            if (!this.backgroundSelected) return alert("Please select a Background in Step 1 first!");
            const sel = document.getElementById('tplWidgetSelect')?.value;
            const widget = this.readyWidgets.find(w => w.id === sel);
            if (!widget) return;
            const id = 'item_' + Date.now();
            const pos = this.getNextDefaultPosition();
            const html = widget.build(this.selectedColor);
            this.items.push({ id, type: 'widget', html, label: widget.name, x: pos.x, y: pos.y });
            this.selectedItemId = id;
            this.renderCanvas();
        },

        onCommandChanged() {
            const type = document.getElementById('tplCmdType')?.value || '';
            const valInput = document.getElementById('tplCmdValue');
            if (!valInput) return;

            if (type === 'stars' && !valInput.value) valInput.value = 'toggleFallingStars';
            else if (type === 'bg_color' && !valInput.value) valInput.value = '#1e1b4b';

            const val = valInput.value.trim();
            const subPanel = document.getElementById('buttonStyleSubPanel');

            if (type && val.length > 0) {
                this.commandConfigured = true;
                subPanel?.classList.remove('opacity-40', 'pointer-events-none');
            } else {
                this.commandConfigured = false;
                subPanel?.classList.add('opacity-40', 'pointer-events-none');
            }
        },

        setBtnColor(c) {
            this.selectedColor = c;
        },

        addConfiguredButton() {
            if (!this.commandConfigured) {
                return alert("Please select a Button Action Command and enter its target first!");
            }
            const cmdType = document.getElementById('tplCmdType').value;
            const rawVal = document.getElementById('tplCmdValue').value.trim().replace(/'/g, "\\'");
            const label = document.getElementById('tplBtnLabel').value.trim() || 'Action Button';
            const styleKey = document.getElementById('tplBtnStyle').value || 'neon';
            const color = this.selectedColor;

            let onclickJs = '';
            if (cmdType === 'url') {
                const targetUrl = rawVal.startsWith('http') ? rawVal : 'https://' + rawVal;
                onclickJs = `window.open('${targetUrl}', '_blank')`;
            } else if (cmdType === 'tiktok') {
                const cleanUser = rawVal.replace(/^@/, '').replace(/https?:\/\/(www\.)?tiktok\.com\/@?/i, '');
                onclickJs = `window.open('https://www.tiktok.com/@${cleanUser}', '_blank')`;
            } else if (cmdType === 'phone') {
                onclickJs = `window.location.href='tel:${rawVal.replace(/\\s+/g, '')}'`;
            } else if (cmdType === 'whatsapp') {
                onclickJs = `window.open('https://wa.me/${rawVal.replace(/[^0-9]/g, '')}', '_blank')`;
            } else if (cmdType === 'alert') {
                onclickJs = `alert('${rawVal}')`;
            } else if (cmdType === 'bg_color') {
                onclickJs = `document.body.style.background='${rawVal}'`;
            } else if (cmdType === 'stars') {
                onclickJs = `if(window.toggleStudioStars) window.toggleStudioStars();`;
            } else {
                onclickJs = rawVal;
            }

            const preset = this.buttonStyles[styleKey] || this.buttonStyles.neon;
            const id = 'item_' + Date.now();
            const pos = this.getNextDefaultPosition();
            const bgStyle = (styleKey === 'glass' || styleKey === 'minimal') ? 'transparent' : color;

            const btnHtml = `<button onclick="${onclickJs.replace(/"/g, '&quot;')}" style="--btn-color:${color}; background-color:${bgStyle}; color:#ffffff;" class="px-7 py-3.5 rounded-2xl text-sm ${preset}">${label}</button>`;

            this.items.push({ id, type: 'button', html: btnHtml, label: `Button (${label})`, x: pos.x, y: pos.y });
            this.selectedItemId = id;

            document.getElementById('tplCmdValue').value = '';
            this.onCommandChanged();
            this.renderCanvas();
        },

        startDrag(event, id) {
            this.selectedItemId = id;
            const canvas = document.getElementById('studioLiveCanvas');
            const item = this.items.find(i => i.id === id);
            if (!canvas || !item) return;

            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const clientY = event.touches ? event.touches[0].clientY : event.clientY;

            this.dragState = {
                active: true,
                itemId: id,
                startX: clientX,
                startY: clientY,
                initialLeft: item.x,
                initialTop: item.y
            };
            this.renderCanvas();
        },

        attachGlobalDragListeners() {
            if (this.__dragListenersAttached) return;
            this.__dragListenersAttached = true;

            const onMove = (event) => {
                if (!this.dragState.active || !this.dragState.itemId) return;
                const canvas = document.getElementById('studioLiveCanvas');
                const item = this.items.find(i => i.id === this.dragState.itemId);
                if (!canvas || !item) return;

                const rect = canvas.getBoundingClientRect();
                const clientX = event.touches ? event.touches[0].clientX : event.clientX;
                const clientY = event.touches ? event.touches[0].clientY : event.clientY;

                const deltaXPercent = ((clientX - this.dragState.startX) / rect.width) * 100;
                const deltaYPercent = ((clientY - this.dragState.startY) / rect.height) * 100;

                item.x = Math.min(88, Math.max(2, this.dragState.initialLeft + deltaXPercent));
                item.y = Math.min(88, Math.max(2, this.dragState.initialTop + deltaYPercent));

                const domEl = document.getElementById('canvas_el_' + item.id);
                if (domEl) {
                    domEl.style.left = item.x + '%';
                    domEl.style.top = item.y + '%';
                }
            };

            const onEnd = () => {
                this.dragState.active = false;
                this.dragState.itemId = null;
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        },

        nudgeSelected(dx, dy) {
            const item = this.items.find(i => i.id === this.selectedItemId);
            if (!item) return;
            item.x = Math.min(90, Math.max(2, item.x + dx / 4));
            item.y = Math.min(90, Math.max(2, item.y + dy / 4));
            this.renderCanvas();
        },

        centerSelected() {
            const item = this.items.find(i => i.id === this.selectedItemId);
            if (!item) return;
            item.x = 35;
            this.renderCanvas();
        },

        deleteSelectedOrLast() {
            if (this.selectedItemId) {
                this.items = this.items.filter(it => it.id !== this.selectedItemId);
                this.selectedItemId = this.items.length ? this.items[this.items.length - 1].id : null;
                this.renderCanvas();
                return;
            }
            if (this.items.length > 0) {
                this.items.pop();
                this.renderCanvas();
                return;
            }
            this.backgroundSelected = false;
            this.bgConfig = { type: 'solid', value: '#090d16', imageData: '' };
            document.getElementById('step2GalleryPanel')?.classList.add('opacity-40', 'pointer-events-none');
            document.getElementById('step3ButtonPanel')?.classList.add('opacity-40', 'pointer-events-none');
            this.renderCanvas();
        },

        clearAllItems() {
            this.items = [];
            this.selectedItemId = null;
            this.renderCanvas();
        },

        renderCanvas() {
            const canvas = document.getElementById('studioLiveCanvas');
            const indicator = document.getElementById('selectedIndicator');
            if (!canvas) return;

            canvas.style.backgroundImage = '';
            canvas.style.backgroundColor = '#090d16';

            if (this.bgConfig.type === 'solid' || this.bgConfig.type === 'gradient') {
                canvas.style.background = this.bgConfig.value;
            } else if (this.bgConfig.type === 'gallery' && this.bgConfig.imageData) {
                canvas.style.background = `url(${this.bgConfig.imageData}) center/cover no-repeat`;
            } else if (this.bgConfig.type === 'stars') {
                canvas.style.background = 'radial-gradient(circle at center, #0f172a 0%, #000000 100%)';
            } else if (this.bgConfig.type === 'matrix') {
                canvas.style.background = 'linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px), #050806';
                canvas.style.backgroundSize = '28px 28px';
            }

            const selectedObj = this.items.find(i => i.id === this.selectedItemId);
            if (indicator) {
                indicator.innerText = selectedObj
                    ? `Selected: ${selectedObj.label} (Drag to move or click Delete)`
                    : 'Tap any item to move or delete';
            }

            if (!this.backgroundSelected && this.items.length === 0) {
                canvas.innerHTML = `<div class="absolute inset-0 flex items-center justify-center pointer-events-none"><p class="text-xs text-gray-400 bg-black/60 px-4 py-2 rounded-xl">⬅ Step 1: Choose a Background first</p></div>`;
                return;
            }

            if (this.items.length === 0) {
                canvas.innerHTML = `<div class="absolute inset-0 flex items-center justify-center pointer-events-none"><p class="text-xs text-white/80 bg-black/50 px-4 py-2 rounded-xl">Background active! Now add Gallery photos, Widgets, or Buttons from Steps 2 & 3.</p></div>`;
                return;
            }

            canvas.innerHTML = this.items.map(item => {
                const isSel = item.id === this.selectedItemId;
                return `
                    <div id="canvas_el_${item.id}"
                         onmousedown="window.TemplatesStudio.startDrag(event, '${item.id}')"
                         ontouchstart="window.TemplatesStudio.startDrag(event, '${item.id}')"
                         style="position:absolute; left:${item.x}%; top:${item.y}%; cursor:grab; z-index:${isSel ? 30 : 10};"
                         class="group p-1.5 rounded-2xl transition-shadow ${isSel ? 'ring-2 ring-amber-400 bg-amber-500/10 shadow-2xl' : 'hover:ring-1 hover:ring-white/40'}">
                        ${item.html}
                        ${isSel ? `<span class="absolute -top-5 left-0 px-2 py-0.5 rounded bg-amber-400 text-black text-[9px] font-black uppercase whitespace-nowrap shadow">Drag to Move • Delete to Remove</span>` : ''}
                    </div>
                `;
            }).join('');
        },

        publishToWebsite() {
            if (!this.backgroundSelected) {
                return alert("Please select a Background in Step 1 first!");
            }

            let bgCss = `background: ${this.bgConfig.value};`;
            if (this.bgConfig.type === 'gallery' && this.bgConfig.imageData) {
                bgCss = `background: url('${this.bgConfig.imageData}') center/cover no-repeat fixed;`;
            } else if (this.bgConfig.type === 'matrix') {
                bgCss = `background: linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px), #050806; background-size: 28px 28px;`;
            }

            const starsScript = `
                <canvas id="zwStarCanvas" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;display:${this.bgConfig.type === 'stars' ? 'block' : 'none'};"></canvas>
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

            const positionedItemsHtml = this.items.map(i => `
                <div style="position:absolute; left:${i.x}%; top:${i.y}%; z-index:10;">
                    ${i.html}
                </div>
            `).join('\n');

            const fullHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZoneWeb Custom Studio Site</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body style="${bgCss}" class="text-white min-h-screen w-full relative overflow-x-hidden font-sans">
    ${starsScript}
    <main class="relative w-full min-h-screen">
        ${positionedItemsHtml}
    </main>
</body>
</html>`;

            if (window.state) {
                const finalHtml = typeof window.injectAdsAndPremium === 'function' ? window.injectAdsAndPremium(fullHtml) : fullHtml;
                window.state.currentSiteName = window.state.currentSiteName || 'studio-custom-site';
                window.state.currentSiteHtml = finalHtml;
                localStorage.setItem('zw_current_site_name', window.state.currentSiteName);
                localStorage.setItem('zw_current_site_html', finalHtml);

                if (typeof window.saveOrUpdateProjectInHistory === 'function') {
                    window.saveOrUpdateProjectInHistory(window.state.currentSiteName, finalHtml, true);
                }
                if (typeof window.updatePublicLinkUI === 'function') {
                    window.updatePublicLinkUI(window.state.currentSiteName, finalHtml);
                }
                if (typeof window.updateKeepEditingBar === 'function') {
                    window.updateKeepEditingBar();
                }
            }

            this.closeStudio();
            if (typeof window.openPreviewModal === 'function') {
                window.openPreviewModal();
            }
        }
    };

    TemplatesStudio.init();
})();
