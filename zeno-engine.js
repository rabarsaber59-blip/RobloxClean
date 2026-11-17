/**
 * ZENO-ENGINE.JS - Real-World Project Requirements Wizard & Live API Integration Engine
 * Strictly in English. Detects when a requested website needs external tokens, API keys,
 * or contact endpoints (TMDB for Movies/Series, Jikan for Anime, WhatsApp/Telegram for Shopping,
 * TikTok/Phone for Social Hubs) and instructs the AI to wire them into working production code.
 */
(function () {
    const ZenoEngine = {
        collectedData: JSON.parse(localStorage.getItem('zeno_collected_data') || '{}'),

        init() {
            window.ZenoEngine = this;
            window.addEventListener('DOMContentLoaded', () => {
                this.injectTokensHeaderButton();
            });
            console.log("🔑 ZenoEngine Loaded (Real-World API & Token Wizard Active).");
        },

        saveField(key, value) {
            this.collectedData[key] = (value || '').trim();
            localStorage.setItem('zeno_collected_data', JSON.stringify(this.collectedData));
        },

        // Adds a quick "Project Tokens" button in the top bar for managing external keys anytime
        injectTokensHeaderButton() {
            const topPreviewBtn = document.getElementById('topPreviewBtn');
            if (!topPreviewBtn || !topPreviewBtn.parentElement || document.getElementById('zenoTokensBtn')) return;

            const btn = document.createElement('button');
            btn.id = 'zenoTokensBtn';
            btn.className = "px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold flex items-center gap-1.5 hover:bg-amber-500/30 transition shrink-0";
            btn.innerHTML = `<i class="fa-solid fa-plug"></i> <span class="hidden sm:inline">API Tokens</span>`;
            btn.title = "Manage External Project Tokens (TMDB, WhatsApp, Telegram)";
            btn.onclick = () => this.openTokensModal();

            topPreviewBtn.parentElement.insertBefore(btn, topPreviewBtn);
        },

        openTokensModal() {
            let modal = document.getElementById('zenoTokensModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'zenoTokensModal';
                modal.className = "fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4";
                document.body.appendChild(modal);
            }

            modal.classList.remove('hidden');
            modal.innerHTML = `
                <div class="card-bg w-full max-w-md rounded-3xl p-6 border border-white/15 shadow-2xl text-white space-y-4">
                    <div class="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 class="font-extrabold text-base text-amber-400"><i class="fa-solid fa-plug mr-1.5"></i> External Project API Tokens</h3>
                        <button onclick="document.getElementById('zenoTokensModal').classList.add('hidden')" class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <p class="text-xs text-gray-400">Save your external keys here so the AI automatically wires them into your generated websites:</p>
                    
                    <div class="space-y-3 text-xs">
                        <div>
                            <div class="flex justify-between mb-1">
                                <label class="font-bold text-gray-300">TMDB API Key (Movies & Series):</label>
                                <a href="https://www.themoviedb.org/settings/api" target="_blank" class="text-blue-400 hover:underline">Get Free Key ↗</a>
                            </div>
                            <input id="modal_tmdbKey" type="text" value="${this.collectedData.tmdbKey || ''}" placeholder="Paste TMDB v3 API Key..." class="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white font-mono">
                        </div>

                        <div>
                            <label class="font-bold text-gray-300 block mb-1">WhatsApp Phone (For Store Orders):</label>
                            <input id="modal_whatsappPhone" type="text" value="${this.collectedData.whatsappPhone || ''}" placeholder="e.g. 9647516165051" class="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white font-mono">
                        </div>

                        <div>
                            <div class="flex justify-between mb-1">
                                <label class="font-bold text-gray-300">Telegram Bot (BOT_TOKEN|CHAT_ID):</label>
                                <a href="https://t.me/BotFather" target="_blank" class="text-blue-400 hover:underline">@BotFather ↗</a>
                            </div>
                            <input id="modal_telegramBot" type="text" value="${this.collectedData.telegramBot || ''}" placeholder="123456:ABC-DEF...|987654321" class="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white font-mono">
                        </div>
                    </div>

                    <button onclick="window.ZenoEngine.saveModalTokens()" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg">
                        Save Project Tokens
                    </button>
                </div>
            `;
        },

        saveModalTokens() {
            this.saveField('tmdbKey', document.getElementById('modal_tmdbKey')?.value);
            this.saveField('whatsappPhone', document.getElementById('modal_whatsappPhone')?.value);
            this.saveField('telegramBot', document.getElementById('modal_telegramBot')?.value);
            document.getElementById('zenoTokensModal')?.classList.add('hidden');
            alert("✅ External Project Tokens saved!");
        },

        // Analyzes the user's prompt to check if real-world credentials/tokens are needed
        analyzePromptRequirements(promptText) {
            const p = (promptText || '').toLowerCase();

            // Do not interrupt if the user is editing an existing website in the current tab
            const isEditing = window.KeepEditingEngine
                ? window.KeepEditingEngine.isEditingCurrentTabSite(promptText)
                : Boolean(window.state?.currentSiteHtml);

            if (isEditing) return null;

            // 1. Movie, Anime & Drama Streaming Website
            if (/(movie|film|anime|drama|series|stream|netflix|rebenflix|zoneflix|cinema|watch)/i.test(p)) {
                return {
                    id: 'streaming_req',
                    title: '🎬 Movie, Anime & Drama Streaming Setup',
                    description: 'To make your streaming website fetch real movies, posters, and live video streams, provide the details below (or click Skip to build immediately with open Anime & Movie APIs):',
                    helpUrl: 'https://www.themoviedb.org/settings/api',
                    helpText: '🔑 Get Free TMDB API Key',
                    fields: [
                        { key: 'siteName', label: 'Streaming Platform Name', placeholder: 'e.g. RebenFlix or ZoneCinema' },
                        { key: 'tmdbKey', label: 'TMDB API Key (Optional - for millions of Movies & Series)', placeholder: 'Paste TMDB v3 API Key or leave blank for Open API...' }
                    ],
                    buildTechnicalSpec: (data) => `
REAL STREAMING TECHNICAL SPECIFICATION TO IMPLEMENT IN CODE:
- Platform Name: "${data.siteName || 'ZoneFlix'}"
- TMDB API Key: "${data.tmdbKey || ''}"
- Connect live Anime catalog & search directly to Jikan REST API (\`https://api.jikan.moe/v4/top/anime\` and \`https://api.jikan.moe/v4/anime?q=...\`).
- ${data.tmdbKey ? `Connect live Movies & TV Series to TMDB API (\`https://api.themoviedb.org/3/trending/all/week?api_key=${data.tmdbKey}\` and search endpoint).` : `Include a built-in "🔑 Set TMDB API Key" button in the header so the user can paste their TMDB key anytime, and pre-load real trending movies with working TMDB IDs.`}
- Include a real working Video Player Modal that embeds \`https://vidsrc.xyz/embed/movie?tmdb=ID\` and \`https://vidsrc.xyz/embed/tv?tmdb=ID&season=1&episode=1\` with server switchers.`
                };
            }

            // 2. Online Shopping / E-Commerce Store
            if (/(shop|shopping|store|ecommerce|e-commerce|market|boutique|catalog)/i.test(p)) {
                return {
                    id: 'shopping_req',
                    title: '🛍️ E-Commerce Store & Live Order Setup',
                    description: 'Enter your store details below so customer checkout orders are sent directly to your WhatsApp or Telegram:',
                    helpUrl: 'https://t.me/BotFather',
                    helpText: '🤖 Telegram @BotFather',
                    fields: [
                        { key: 'storeName', label: 'Store / Brand Name', placeholder: 'e.g. NovaShop or Rabar Store' },
                        { key: 'whatsappPhone', label: 'WhatsApp Phone Number (for receiving orders)', placeholder: 'e.g. 9647516165051' },
                        { key: 'currency', label: 'Store Currency', placeholder: 'e.g. USD ($) or IQD' }
                    ],
                    buildTechnicalSpec: (data) => `
REAL E-COMMERCE TECHNICAL SPECIFICATION TO IMPLEMENT IN CODE:
- Store Name: "${data.storeName || 'ZoneShop'}"
- Currency: "${data.currency || '$'}"
- Owner WhatsApp Number: "${(data.whatsappPhone || '9647516165051').replace(/[^0-9]/g, '')}"
- Build a complete, working online store with live product search, category filtering, product grid with real Unsplash product images, an interactive slide-over Shopping Cart drawer with +/- quantity controls, an "+ Add New Product" modal for the store owner, and a real Checkout button that formats the customer's cart items, total price, name, and address and opens \`https://wa.me/${(data.whatsappPhone || '9647516165051').replace(/[^0-9]/g, '')}?text=...\` to send the real order.`
                };
            }

            // 3. Social Bio / TikTok / Direct Phone Contact Hub (only ask if username/phone not already in prompt)
            if (/(tiktok|social hub|bio link|contact page)/i.test(p) && !/\d{7,}/.test(p)) {
                return {
                    id: 'social_req',
                    title: '📱 Social Profile & Direct Contact Setup',
                    description: 'Enter your social username and phone number so the AI wires all buttons to your real profiles:',
                    fields: [
                        { key: 'tiktokUser', label: 'TikTok / Social Username', placeholder: 'e.g. rabar2008r' },
                        { key: 'phoneNumber', label: 'Direct Phone Number', placeholder: 'e.g. 0751 616 5051' }
                    ],
                    buildTechnicalSpec: (data) => `
REAL SOCIAL & CONTACT SPECIFICATION TO IMPLEMENT IN CODE:
- TikTok Username: "${(data.tiktokUser || 'rabar2008r').replace(/^@/, '')}" -> Wire button to open \`https://www.tiktok.com/@${(data.tiktokUser || 'rabar2008r').replace(/^@/, '')}\` in a new tab.
- Phone Number: "${data.phoneNumber || '0751 616 5051'}" -> Wire call button directly to \`tel:${(data.phoneNumber || '07516165051').replace(/[\s-]/g, '')}\`.`
                };
            }

            return null;
        },

        // Renders an English interactive requirement card inside the chat feed
        promptUserForRequirements(reqConfig, originalUserPrompt, onCompleteCallback) {
            const feed = document.getElementById('chatFeed');
            document.getElementById('heroPrompt')?.classList.add('hidden');

            const cardId = 'zeno_req_' + Date.now();
            const fieldsHtml = reqConfig.fields.map(f => `
                <div>
                    <label class="block text-xs font-bold text-gray-200 mb-1">${f.label}</label>
                    <input id="${cardId}_${f.key}" type="text" value="${this.collectedData[f.key] || ''}" placeholder="${f.placeholder}"
                        class="w-full bg-black/50 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400">
                </div>
            `).join('');

            const wrapper = document.createElement('div');
            wrapper.className = "flex justify-start w-full my-2";
            wrapper.innerHTML = `
                <div id="${cardId}" class="w-full max-w-[92%] rounded-2xl p-4 md:p-5 card-bg border-2 border-blue-500/40 shadow-2xl space-y-3.5">
                    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                        <div class="flex items-center gap-2">
                            <span class="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                <i class="fa-solid fa-sliders"></i>
                            </span>
                            <h3 class="text-xs md:text-sm font-extrabold text-blue-400">${reqConfig.title}</h3>
                        </div>
                        ${reqConfig.helpUrl ? `<a href="${reqConfig.helpUrl}" target="_blank" class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] flex items-center gap-1"><i class="fa-solid fa-up-right-from-square"></i> ${reqConfig.helpText}</a>` : ''}
                    </div>

                    <p class="text-xs text-gray-300 leading-relaxed">${reqConfig.description}</p>

                    <div class="space-y-2.5">${fieldsHtml}</div>

                    <div class="flex flex-wrap items-center gap-2 pt-2">
                        <button id="submit_${cardId}" class="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5 transition">
                            <i class="fa-solid fa-bolt"></i>
                            <span>Connect & Build Website with AI</span>
                        </button>
                        <button id="skip_${cardId}" class="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs transition">
                            Skip & Build Now
                        </button>
                    </div>
                </div>
            `;

            feed.appendChild(wrapper);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

            const triggerBuild = () => {
                const collected = {};
                for (const f of reqConfig.fields) {
                    const val = document.getElementById(`${cardId}_${f.key}`)?.value.trim() || '';
                    collected[f.key] = val;
                    if (val) this.saveField(f.key, val);
                }

                const techSpec = reqConfig.buildTechnicalSpec
                    ? reqConfig.buildTechnicalSpec(collected)
                    : Object.entries(collected).map(([k, v]) => `- ${k}: ${v}`).join('\n');

                const enrichedPrompt = `${originalUserPrompt}\n\n${techSpec}`;
                onCompleteCallback(enrichedPrompt, collected, reqConfig.id);
            };

            document.getElementById(`submit_${cardId}`).onclick = triggerBuild;
            document.getElementById(`skip_${cardId}`).onclick = triggerBuild;
        }
    };

    ZenoEngine.init();
})();
