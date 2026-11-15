/**
 * TEMPLATES.JS - Standalone Visual Studio
 * - Hides AI Chat when opened, restores AI Chat when closed.
 * - Step 1: Must choose Background first (Preset, Animated, or Phone Gallery Image).
 * - Step 2: Must set Button Command first before adding a button, plus Gallery Image uploader.
 * - Top Trash Can (تەنەکەی خۆڵ) to delete any selected element or reset background.
 */
(function () {
    const TemplatesStudio = {
        backgroundSelected: false,
        commandConfigured: false,
        bgConfig: {
            type: 'solid', // 'solid' | 'gradient' | 'stars' | 'gallery'
            value: '#090d16',
            imageData: ''
        },
        items: [], // Array of { id, type: 'button'|'image'|'heading', html, label }
        selectedItemId: null,
        selectedColor: '#3b82f6',

        stylePresets: {
            neon: "shadow-[0_0_25px_var(--btn-color)] border-2 border-[var(--btn-color)] font-extrabold tracking-wide uppercase transition-all duration-300 hover:scale-105",
            gradient: "bg-gradient-to-r from-[var(--btn-color)] to-purple-600 font-extrabold shadow-lg hover:opacity-95 transition-all",
            glass: "backdrop-blur-xl bg-white/15 border border-white/30 shadow-xl font-bold transition-all hover:bg-white/25",
            threeD: "border-b-4 border-black/60 active:border-b-0 active:translate-y-1 font-extrabold shadow-lg transition-all",
            pill: "rounded-full px-8 py-4 font-extrabold shadow-xl hover:scale-105 transition-all",
            cyberpunk: "border-l-4 border-yellow-400 font-black uppercase tracking-widest shadow-xl"
        },

        init() {
            window.addEventListener('DOMContentLoaded', () => {
                this.injectTopTemplatesButton();
                this.buildStudioView();
            });
        },

        injectTopTemplatesButton() {
            const topPreviewBtn = document.getElementById('topPreviewBtn');
            if (!topPreviewBtn || !topPreviewBtn.parentElement) return;
            if (document.getElementById('topTemplatesBtn')) return;

            const btn = document.createElement('button');
            btn.id = 'topTemplatesBtn';
            btn.className = "px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:opacity-95 transition shrink-0";
            btn.innerHTML = `<i class="fa-solid fa-layer-group"></i> <span>Templates</span>`;
            btn.onclick = () => this.openStudio();

            topPreviewBtn.parentElement.insertBefore(btn, topPreviewBtn);
        },

        buildStudioView() {
            const studio = document.createElement('div');
            studio.id = 'templatesFullStudio';
            studio.className = "hidden fixed inset-0 z-40 bg-[#07080d] text-white flex flex-col overflow-hidden";
            studio.innerHTML = `
                <!-- TOP STUDIO BAR WITH TRASH CAN (تەنەکەی خۆڵ) & EXIT BUTTON -->
                <div class="card-bg px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
                    <div class="flex items-center gap-2.5">
                        <button onclick="window.TemplatesStudio.closeStudio()" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5">
                            <i class="fa-solid fa-arrow-left"></i>
                            <span>گەڕانەوە بۆ چاتی AI</span>
                        </button>
                        <span class="font-extrabold text-sm md:text-base hidden sm:inline text-violet-400">🎨 ستۆدیۆی قاڵبە ئامادەکراوەکان (Templates)</span>
                    </div>

                    <!-- TOP TRASH CAN (تەنەکەی خۆڵ) & PUBLISH BUTTONS -->
                    <div class="flex items-center gap-2">
                        <button id="studioTrashBtn" onclick="window.TemplatesStudio.deleteSelectedOrLast()" class="px-3.5 py-2 rounded-xl bg-red-600/20 border border-red-500/40 hover:bg-red-600 text-red-300 hover:text-white text-xs font-extrabold flex items-center gap-1.5 transition shadow" title="سڕینەوەی بەشی دیاریکراو یان دوایین زیادکراو">
                            <i class="fa-solid fa-trash-can"></i>
                            <span id="trashBtnLabel">سڕینەوە (Trash)</span>
                        </button>

                        <button onclick="window.TemplatesStudio.clearAllItems()" class="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-xs font-bold" title="پاککردنەوەی هەمووی">
                            <i class="fa-solid fa-rotate-left"></i>
                        </button>

                        <button onclick="window.TemplatesStudio.publishToWebsite()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg">
                            <i class="fa-solid fa-check-circle"></i>
                            <span>پاشەکەوتکردن لە وێبسایت</span>
                        </button>
                    </div>
                </div>

                <!-- MAIN STUDIO WORKSPACE -->
                <div class="flex-1 grid md:grid-cols-12 overflow-y-auto md:overflow-hidden">
                    
                    <!-- LEFT PANEL: STEP-BY-STEP BUILDER -->
                    <div class="md:col-span-5 p-4 space-y-4 overflow-y-auto border-r border-white/10 bg-[#0b0d14]">
                        
                        <!-- STEP 1: CHOOSE BACKGROUND FIRST (سەرەتا هەڵبژاردنی باکگراوند) -->
                        <div class="p-4 rounded-2xl bg-white/5 border-2 border-violet-500/40 space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-extrabold uppercase tracking-wider text-violet-400">هەنگاوی ١: سەرەتا Background هەڵبژێرە</span>
                                <span id="step1Badge" class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">پێویستە</span>
                            </div>

                            <!-- Preset Solid & Gradient Backgrounds -->
                            <div class="grid grid-cols-4 gap-2">
                                <button onclick="window.TemplatesStudio.selectBackground('solid', '#000000')" class="py-2 rounded-xl bg-black border border-white/20 text-[11px] font-bold">ڕەش</button>
                                <button onclick="window.TemplatesStudio.selectBackground('solid', '#0f172a')" class="py-2 rounded-xl bg-slate-900 border border-white/20 text-[11px] font-bold">حەبیبی تاریک</button>
                                <button onclick="window.TemplatesStudio.selectBackground('gradient', 'linear-gradient(135deg, #1e1b4b, #311042, #090a0f)')" class="py-2 rounded-xl bg-gradient-to-r from-indigo-950 to-purple-950 border border-white/20 text-[11px] font-bold">گرادێنت</button>
                                <button onclick="window.TemplatesStudio.selectBackground('stars', '#000000')" class="py-2 rounded-xl bg-zinc-900 border border-amber-500/40 text-amber-300 text-[11px] font-bold">✨ ئەستێرە</button>
                            </div>

                            <!-- Custom Background Color OR Gallery Background Upload -->
                            <div class="flex items-center gap-2 pt-1">
                                <label class="flex-1 py-2.5 px-3 rounded-xl bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-300 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition">
                                    <i class="fa-regular fa-image"></i>
                                    <span>هێنانی وێنەی Gallery بۆ باکگراوند</span>
                                    <input type="file" accept="image/*" class="hidden" onchange="window.TemplatesStudio.uploadGalleryBackground(event)">
                                </label>
                                <input type="color" onchange="window.TemplatesStudio.selectBackground('solid', this.value)" class="w-10 h-10 rounded-xl cursor-pointer bg-transparent border border-white/20" title="ڕەنگی تایبەت">
                            </div>
                        </div>

                        <!-- STEP 2: ADD GALLERY PHOTOS OR TEXT (Unlocked after Step 1) -->
                        <div id="step2GalleryPanel" class="opacity-40 pointer-events-none transition-all p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                            <span class="text-xs font-extrabold uppercase tracking-wider text-blue-400">هەنگاوی ٢: زیادکردنی وێنەی ناو Gallery یان ناونیشان</span>
                            <div class="flex gap-2">
                                <label class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
                                    <i class="fa-solid fa-camera"></i>
                                    <span>زیادکردنی وێنە لە Galleryـەوە</span>
                                    <input type="file" accept="image/*" class="hidden" onchange="window.TemplatesStudio.addGalleryImageItem(event)">
                                </label>
                            </div>
                            <div class="flex gap-2">
                                <input id="tplHeadingInput" type="text" placeholder="نووسینی سەردێڕ یان ناوی سایت..." class="flex-1 bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs">
                                <button onclick="window.TemplatesStudio.addHeadingItem()" class="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold">+ سەردێڕ</button>
                            </div>
                        </div>

                        <!-- STEP 3: ADD BUTTON (MUST SET COMMAND FIRST! - سەرەتا دانانی فەرمانی دوگمە) -->
                        <div id="step3ButtonPanel" class="opacity-40 pointer-events-none transition-all p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-400">هەنگاوی ٣: زیادکردنی دوگمە (سەرەتا فەرمانەکەی دابنێ)</span>
                            </div>

                            <!-- 3A: Command First -->
                            <div class="p-3 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2">
                                <label class="text-[11px] font-bold text-emerald-300 block">١. سەرەتا فەرمانی دوگمەکە دیاری بکە:</label>
                                <select id="tplCmdType" onchange="window.TemplatesStudio.onCommandChanged()" class="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white">
                                    <option value="">-- فەرمانێک بۆ دوگمەکە هەڵبژێرە --</option>
                                    <option value="url">🌐 کردنەوەی لینک / تیکتۆک / ئینستاگرام</option>
                                    <option value="phone">📞 پەیوەندی ڕاستەوخۆی تەلەفۆنی (Phone Call)</option>
                                    <option value="whatsapp">💬 کردنەوەی چاتی WhatsApp</option>
                                    <option value="alert">🔔 پیشاندانی پەیام (Alert Message)</option>
                                    <option value="custom_js">💻 فەرمانی کۆدی JavaScript</option>
                                </select>
                                <input id="tplCmdValue" type="text" oninput="window.TemplatesStudio.onCommandChanged()" placeholder="لینک یان ژمارە تەلەفۆن یان فەرمانەکە لێرە بنووسە..." class="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300">
                            </div>

                            <!-- 3B: Button Design & Color (Unlocks ONLY after command is entered) -->
                            <div id="buttonStyleSubPanel" class="opacity-40 pointer-events-none transition-all space-y-3 pt-2">
                                <label class="text-[11px] font-bold text-gray-300 block">٢. ئێستا ناو و ڕەنگ و ستایلی دوگمەکە هەڵبژێرە:</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <input id="tplBtnLabel" type="text" value="کلیک لێرە بکە" class="bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs">
                                    <select id="tplBtnStyle" class="bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs">
                                        <option value="neon">⚡ Neon Glow</option>
                                        <option value="gradient">🌈 Gradient</option>
                                        <option value="glass">❄️ Glass</option>
                                        <option value="threeD">🎲 3D Button</option>
                                        <option value="pill">💊 Pill Rounded</option>
                                        <option value="cyberpunk">🤖 Cyberpunk</option>
                                    </select>
                                </div>

                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-gray-400">ڕەنگ:</span>
                                    ${['#3b82f6', '#e11d48', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'].map(c => `
                                        <button onclick="window.TemplatesStudio.setBtnColor('${c}')" style="background:${c};" class="w-6 h-6 rounded-full border border-white/40"></button>
                                    `).join('')}
                                    <input type="color" onchange="window.TemplatesStudio.setBtnColor(this.value)" class="w-7 h-7 rounded bg-transparent">
                                </div>

                                <button onclick="window.TemplatesStudio.addConfiguredButton()" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg">
                                    <i class="fa-solid fa-plus-circle mr-1"></i> زیادکردنی ئەم دوگمەیە بۆ سەر شاشەکە
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT PANEL: LIVE INTERACTIVE CANVAS (Click any item to select & Trash it) -->
                    <div class="md:col-span-7 flex flex-col bg-black/60 p-4 overflow-hidden">
                        <div class="flex items-center justify-between mb-2 text-xs text-gray-400">
                            <span>📱 پێشبینینی زیندووی شاشەکەت (کلیک لە هەر شتێک بکە بۆ دیاریکردن و سڕینەوەی بە تەنەکەی خۆڵەکەی سەرەوە):</span>
                            <span id="selectedIndicator" class="text-amber-400 font-bold">هیچ دیاری نەکراوە</span>
                        </div>
                        <div id="studioLiveCanvas" class="flex-1 rounded-3xl border-2 border-white/15 overflow-y-auto p-6 flex flex-col items-center justify-center gap-4 relative transition-all min-h-[380px]" style="background:#090d16;">
                            <p class="text-xs text-gray-500">سەرەتا لە لای چەپەوە Background هەڵبژێرە...</p>
                        </div>
                    </div>

                </div>
            `;
            document.body.appendChild(studio);
        },

        // Opens Templates Studio & Hides AI Chat completely
        openStudio() {
            document.getElementById('templatesFullStudio')?.classList.remove('hidden');
            const chatBar = document.getElementById('bottomChatBarContainer');
            if (chatBar) chatBar.classList.add('hidden');
            this.renderCanvas();
        },

        // Closes Templates Studio & Restores AI Chat
        closeStudio() {
            document.getElementById('templatesFullStudio')?.classList.add('hidden');
            const chatBar = document.getElementById('bottomChatBarContainer');
            if (chatBar) chatBar.classList.remove('hidden');
        },

        // STEP 1: Select Background -> Unlocks Step 2 & Step 3
        selectBackground(type, value, imageData = '') {
            this.bgConfig = { type, value, imageData };
            this.backgroundSelected = true;

            const badge = document.getElementById('step1Badge');
            if (badge) {
                badge.innerText = 'تەواو ✓';
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

        // STEP 2: Add Image from Phone Gallery onto the page
        addGalleryImageItem(event) {
            if (!this.backgroundSelected) return alert("تکایە سەرەتا باکگراوند هەڵبژێرە!");
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const id = 'item_' + Date.now();
                const imgHtml = `<img src="${e.target.result}" class="max-w-xs md:max-w-sm rounded-3xl shadow-2xl border-2 border-white/20 object-cover mx-auto">`;
                this.items.push({ id, type: 'image', html: imgHtml, label: 'وێنەی گەلەری' });
                this.selectedItemId = id;
                this.renderCanvas();
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        },

        addHeadingItem() {
            const input = document.getElementById('tplHeadingInput');
            const text = (input?.value || '').trim();
            if (!text) return;
            const id = 'item_' + Date.now();
            const html = `<h1 class="text-3xl md:text-5xl font-black text-center text-white drop-shadow-lg">${text}</h1>`;
            this.items.push({ id, type: 'heading', html, label: text });
            this.selectedItemId = id;
            input.value = '';
            this.renderCanvas();
        },

        // STEP 3: Enforce Command Before Button Creation
        onCommandChanged() {
            const type = document.getElementById('tplCmdType')?.value || '';
            const val = (document.getElementById('tplCmdValue')?.value || '').trim();
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
                return alert("تکایە سەرەتا فەرمانی دوگمەکە (Command) لە سەرەوە دیاری بکە!");
            }
            const cmdType = document.getElementById('tplCmdType').value;
            const rawVal = document.getElementById('tplCmdValue').value.trim().replace(/'/g, "\\'");
            const label = document.getElementById('tplBtnLabel').value.trim() || 'Button';
            const styleKey = document.getElementById('tplBtnStyle').value || 'neon';
            const color = this.selectedColor;

            let onclickJs = '';
            if (cmdType === 'url') onclickJs = `window.open('${rawVal.startsWith('http') ? rawVal : 'https://' + rawVal}', '_blank')`;
            else if (cmdType === 'phone') onclickJs = `window.location.href='tel:${rawVal.replace(/\\s+/g, '')}'`;
            else if (cmdType === 'whatsapp') onclickJs = `window.open('https://wa.me/${rawVal.replace(/[^0-9]/g, '')}', '_blank')`;
            else if (cmdType === 'alert') onclickJs = `alert('${rawVal}')`;
            else onclickJs = rawVal;

            const preset = this.stylePresets[styleKey] || this.stylePresets.neon;
            const id = 'item_' + Date.now();
            const btnHtml = `<button onclick="${onclickJs.replace(/"/g, '&quot;')}" style="--btn-color:${color}; background:${styleKey === 'glass' ? 'rgba(255,255,255,0.15)' : color}; color:#fff;" class="px-7 py-3.5 rounded-2xl text-sm ${preset}">${label}</button>`;

            this.items.push({ id, type: 'button', html: btnHtml, label: `دوگمەی (${label})` });
            this.selectedItemId = id;

            // Reset command inputs so next button also requires setting its command first
            document.getElementById('tplCmdValue').value = '';
            this.onCommandChanged();
            this.renderCanvas();
        },

        selectItem(id) {
            this.selectedItemId = id;
            this.renderCanvas();
        },

        // TOP TRASH CAN (تەنەکەی خۆڵ) ACTION
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
            // If no items left, reset background
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

            // Apply Background
            canvas.style.backgroundImage = '';
            canvas.style.backgroundColor = '#090d16';
            if (this.bgConfig.type === 'solid') {
                canvas.style.background = this.bgConfig.value;
            } else if (this.bgConfig.type === 'gradient') {
                canvas.style.background = this.bgConfig.value;
            } else if (this.bgConfig.type === 'gallery' && this.bgConfig.imageData) {
                canvas.style.background = `url(${this.bgConfig.imageData}) center/cover no-repeat`;
            } else if (this.bgConfig.type === 'stars') {
                canvas.style.background = '#000000';
            }

            const selectedObj = this.items.find(i => i.id === this.selectedItemId);
            if (indicator) {
                indicator.innerText = selectedObj ? `دیاریکراوە بۆ سڕینەوە: ${selectedObj.label}` : 'کلیک لە هەر دانەیەک بکە بۆ سڕینەوەی';
            }

            if (!this.backgroundSelected && this.items.length === 0) {
                canvas.innerHTML = `<p class="text-xs text-gray-400 bg-black/50 px-4 py-2 rounded-xl">⬅ سەرەتا لە هەنگاوی ١ باکگراوند هەڵبژێرە</p>`;
                return;
            }

            canvas.innerHTML = this.items.map(item => {
                const isSel = item.id === this.selectedItemId;
                return `
                    <div onclick="event.stopPropagation(); window.TemplatesStudio.selectItem('${item.id}')" 
                         class="relative group cursor-pointer p-2 rounded-2xl transition ${isSel ? 'ring-2 ring-red-500 bg-red-500/10' : 'hover:ring-1 hover:ring-white/30'}">
                        ${item.html}
                        ${isSel ? `<span class="absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold shadow">دیاریکراوە (🗑️ سەرەوە دابگرە بۆ سڕینەوە)</span>` : ''}
                    </div>
                `;
            }).join('') || `<p class="text-xs text-white/70 bg-black/40 px-4 py-2 rounded-xl">باکگراوند دیاری کرا! ئێستا لە هەنگاوی ٢ و ٣ وێنەی گەلەری یان دوگمە زیاد بکە.</p>`;
        },

        publishToWebsite() {
            if (!this.backgroundSelected) {
                return alert("تکایە سەرەتا باکگراوندێک هەڵبژێرە!");
            }

            let bgCss = `background: ${this.bgConfig.value};`;
            if (this.bgConfig.type === 'gallery' && this.bgConfig.imageData) {
                bgCss = `background: url('${this.bgConfig.imageData}') center/cover no-repeat fixed;`;
            }

            const starsCanvas = this.bgConfig.type === 'stars' ? `
                <canvas id="zwStarCanvas" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;"></canvas>
                <script>
                    (function(){
                        const c=document.getElementById('zwStarCanvas'),ctx=c.getContext('2d');
                        const r=()=>{c.width=innerWidth;c.height=innerHeight;};addEventListener('resize',r);r();
                        const st=Array.from({length:140},()=>({x:Math.random()*c.width,y:Math.random()*c.height,rad:Math.random()*2+0.6,sp:Math.random()*2.5+0.8}));
                        function d(){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#fff';for(const s of st){ctx.beginPath();ctx.arc(s.x,s.y,s.rad,0,Math.PI*2);ctx.fill();s.y+=s.sp;if(s.y>c.height)s.y=-5;}requestAnimationFrame(d);}d();
                    })();
                <\/script>` : '';

            const bodyItems = this.items.map(i => `<div class="my-3 relative z-10">${i.html}</div>`).join('\n');

            const fullHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom Studio Website</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body style="${bgCss}" class="text-white min-h-screen flex flex-col items-center justify-center p-6 relative overflow-x-hidden">
    ${starsCanvas}
    <div class="relative z-10 max-w-3xl w-full flex flex-col items-center gap-4 text-center">
        ${bodyItems}
    </div>
</body>
</html>`;

            if (window.state) {
                const finalHtml = typeof window.injectAdsAndPremium === 'function' ? window.injectAdsAndPremium(fullHtml) : fullHtml;
                window.state.currentSiteName = 'studio-custom-site';
                window.state.currentSiteHtml = finalHtml;
                localStorage.setItem('zw_current_site_name', 'studio-custom-site');
                localStorage.setItem('zw_current_site_html', finalHtml);
                if (typeof window.updatePublicLinkUI === 'function') {
                    window.updatePublicLinkUI('studio-custom-site', finalHtml);
                }
            }

            this.closeStudio();
            if (typeof window.openPreviewModal === 'function') {
                window.openPreviewModal();
            }
        }
    };

    window.TemplatesStudio = TemplatesStudio;
    TemplatesStudio.init();
})();
