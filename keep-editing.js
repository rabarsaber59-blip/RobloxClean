/**
 * KEEP-EDITING.JS - Continuous In-Tab Website Editor & Deep Universal Intent Recognizer
 */
(function () {
    const KeepEditingEngine = {
        init() {
            window.classifyUserIntent = this.classifyUniversalIntent.bind(this);
            this.enhanceEditingFunctions();
            console.log("🛠️ KeepEditing & Universal Intent Engine Active.");
        },

        // Deep Intent Recognition for ANY website type OR live in-tab edit command
        classifyUniversalIntent(text) {
            const p = (text || '').toLowerCase();
            const hasActiveSite = Boolean(window.state && window.state.currentSiteHtml && window.state.currentSiteHtml.length > 60);

            // Check if user explicitly wants to edit the existing site in the current tab
            const isEditCommand = hasActiveSite && !/(new website|new site|start fresh|create a new|build a shopping|build a movie|وێبسایتێکی نوێ)/i.test(p) &&
                /(change|edit|make the|add|color|background|back ground|black|blacl|blue|red|green|gold|purple|star|falling|button|text|title|font|header|footer|section|بگۆڕە|زیاد بکە|ڕەنگ|باکگراوند|ئەستێرە|دوگمە)/i.test(p);

            if (isEditCommand) {
                return { type: 'edit', label: '🛠️ Keep Editing: Live Update on Current Website', isNewSite: false };
            }

            if (/(shop|shopping|store|ecommerce|e-commerce|market|buy|sell|product|cart|fashion|clothes|shoes|شۆپینگ|شۆپ|فرۆشگا|بازاڕ|کڕین)/i.test(p)) {
                return { type: 'shopping', label: '🛍️ Full E-Commerce Shopping Store', isNewSite: true };
            }
            if (/(movie|film|anime|drama|stream|netflix|rebenflix|cinema|watch|فیلم|ئەنیمی|ئەنەمی|دراما|سینەما)/i.test(p)) {
                return { type: 'streaming', label: '🎬 Movie, Anime & Drama Streaming Hub', isNewSite: true };
            }
            if (/(tiktok|username|phone|call|whatsapp|instagram|snapchat|rabar|075|077|078|تیکتۆک|تەلەفۆن|پەیوەندی)/i.test(p)) {
                return { type: 'social', label: '📱 TikTok & Direct Phone Contact Hub', isNewSite: !hasActiveSite };
            }
            if (/(game|gaming|gta|god of war|roblox|pubg|esports|یاری|گەیمینگ)/i.test(p)) {
                return { type: 'gaming', label: '🎮 Gaming & Esports Portal', isNewSite: true };
            }
            if (/(gym|fitness|workout|bodybuilding|trainer|جیم|وەرزش|لەشجوانی)/i.test(p)) {
                return { type: 'gym', label: '🏋️ Gym & Fitness Training Club', isNewSite: true };
            }
            if (/(restaurant|cafe|coffee|food|pizza|burger|menu|چێشتخانە|کافێ|خواردن)/i.test(p)) {
                return { type: 'restaurant', label: '🍔 Restaurant & Online Food Ordering', isNewSite: true };
            }

            return {
                type: hasActiveSite ? 'edit' : 'custom',
                label: hasActiveSite ? '🛠️ Keep Editing Current Website' : '🌐 Custom Interactive Website',
                isNewSite: !hasActiveSite
            };
        },

        // Applies instant DOM-level edits (colors, falling stars, buttons, text) while preserving existing site structure
        applySmartInstantEdit(currentHtml, promptText) {
            let html = currentHtml;
            const p = (promptText || '').toLowerCase();

            // 1. Falling Stars / Space / Galaxy Animation
            if (/(star|falling|ئەستێرە|space|galaxy)/i.test(p) && !html.includes('zwStarCanvas')) {
                const starsScript = `
                <canvas id="zwStarCanvas" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;"></canvas>
                <script>
                    (function(){
                        const c = document.getElementById('zwStarCanvas');
                        if(!c) return;
                        const ctx = c.getContext('2d');
                        const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
                        window.addEventListener('resize', resize); resize();
                        const stars = Array.from({length:150}, () => ({x:Math.random()*c.width, y:Math.random()*c.height, r:Math.random()*2+0.6, s:Math.random()*2.5+0.8}));
                        function loop(){
                            ctx.clearRect(0,0,c.width,c.height);
                            ctx.fillStyle = '#ffffff';
                            for(const st of stars){
                                ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI*2); ctx.fill();
                                st.y += st.s; if(st.y > c.height) { st.y = -5; st.x = Math.random()*c.width; }
                            }
                            requestAnimationFrame(loop);
                        }
                        loop();
                    })();
                <\/script>`;
                html = html.replace(/<\/body>/i, `${starsScript}\n</body>`);
            }

            // 2. Background & Theme Color Changes
            if (/(black|blacl|dark|ڕەش)/i.test(p)) {
                html = html.replace(/bg-slate-\d+|bg-zinc-\d+|bg-gray-\d+|bg-white/g, 'bg-black');
                html = html.replace(/<body([^>]*)>/i, '<body$1 style="background-color:#000000 !important; color:#ffffff;">');
            }
            if (/(blue|شین)/i.test(p)) html = html.replace(/rose-|emerald-|amber-|violet-|red-/g, 'blue-');
            if (/(red|crimson|سوور)/i.test(p)) html = html.replace(/blue-|emerald-|amber-|violet-/g, 'rose-');
            if (/(green|emerald|سەوز)/i.test(p)) html = html.replace(/blue-|rose-|amber-|violet-/g, 'emerald-');
            if (/(purple|violet|مۆر)/i.test(p)) html = html.replace(/blue-|rose-|emerald-|amber-/g, 'violet-');
            if (/(gold|yellow|amber|زێڕین|زەرد)/i.test(p)) html = html.replace(/blue-|rose-|emerald-|violet-/g, 'amber-');

            // 3. Inject TikTok button if user adds a TikTok username during Keep Editing
            const tiktokMatch = promptText.match(/(?:username|tiktok|@)\s*[:=-]?\s*([a-zA-Z0-9._]{3,30})/i);
            if (tiktokMatch) {
                const u = tiktokMatch[1].replace(/^@/, '');
                const btn = `<div class="my-4 text-center relative z-20"><a href="https://www.tiktok.com/@${u}" target="_blank" class="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-extrabold text-sm shadow-xl"><i class="fa-brands fa-tiktok"></i> Follow @${u} on TikTok</a></div>`;
                html = html.replace(/<\/body>/i, `${btn}\n</body>`);
            }

            // 4. Inject Phone Call button if user mentions a phone number during Keep Editing
            const phoneMatch = promptText.match(/(\+?\d[\d\s-]{7,16}\d)/);
            if (phoneMatch) {
                const num = phoneMatch[1].trim();
                const btn = `<div class="my-4 text-center relative z-20"><a href="tel:${num.replace(/[\s-]/g, '')}" class="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm shadow-xl"><i class="fa-solid fa-phone"></i> Call ${num}</a></div>`;
                html = html.replace(/<\/body>/i, `${btn}\n</body>`);
            }

            return html;
        },

        enhanceEditingFunctions() {
            window.applySmartInstantEdit = this.applySmartInstantEdit.bind(this);
        }
    };

    window.KeepEditingEngine = KeepEditingEngine;
    KeepEditingEngine.init();
})();
