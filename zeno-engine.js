/**
 * ZENO-ENGINE.JS - Real Interactive Project Requirement Collector
 * Asks the user for the exact tokens, phone numbers, or API keys needed so their website works 100% in reality.
 */
(function () {
    const ZenoEngine = {
        collectedData: JSON.parse(localStorage.getItem('zeno_collected_data') || '{}'),

        init() {
            window.ZenoEngine = this;
        },

        // Checks if the user's prompt requires real-world credentials/data to function
        analyzePromptRequirements(promptText) {
            const p = (promptText || '').toLowerCase();

            // Do not ask again if the user is just editing colors/background of an already-built website
            if (window.state?.currentSiteHtml && !/(new website|new site|build a|create a|وێبسایتێکی)/i.test(p)) {
                return null;
            }

            // 1. Movie / Anime / Drama Website Requirements
            if (/(movie|film|anime|drama|series|stream|netflix|rebenflix|zoneflix|cinema|فیلم|ئەنیمی|ئەنەمی|دراما)/i.test(p)) {
                return {
                    id: 'streaming_req',
                    title: '🎬 زانیارییە پێویستەکان بۆ کارکردنی ڕاستەقینەی وێبسایتی فیلم و ئەنیمی',
                    helpUrl: 'https://www.themoviedb.org/settings/api',
                    helpText: '🔑 کلیک لێرە بکە بۆ هێنانی TMDB API Key بە خۆڕایی',
                    fields: [
                        { key: 'siteName', label: 'ناوی وێبسایتەکەت چییە؟', placeholder: 'بۆ نموونە: RebenFlix یان KurdCinema', required: true },
                        { key: 'tmdbKey', label: 'کۆدی TMDB API Key (بۆ هێنانی فیلم و زنجیرەکان بە ڕاستی):', placeholder: 'Paste TMDB API Key (v3 auth)...', required: false }
                    ]
                };
            }

            // 2. Shopping / E-Commerce Store Requirements
            if (/(shop|shopping|store|ecommerce|e-commerce|market|buy|sell|شۆپینگ|شۆپ|فرۆشگا|بازاڕ)/i.test(p)) {
                return {
                    id: 'shopping_req',
                    title: '🛍️ زانیارییە پێویستەکان بۆ کارکردنی ڕاستەقینەی فرۆشگای ئۆنلاین',
                    helpUrl: 'https://t.me/BotFather',
                    helpText: '🤖 دروستکردنی بۆتی تێلیگرام (ئارەزوومەندانە)',
                    fields: [
                        { key: 'storeName', label: 'ناوی فرۆشگاکەت چییە؟', placeholder: 'بۆ نموونە: Rabar Store', required: true },
                        { key: 'whatsappPhone', label: 'ژمارەی WhatsApp یان مۆبایل (بۆ ئەوەی داواکاریی کڕیارەکانت بۆ بێت):', placeholder: 'بۆ نموونە: 9647516165051', required: true },
                        { key: 'currency', label: 'دراوی فرۆشتن:', placeholder: 'USD ($) یان IQD (دینار)', required: false }
                    ]
                };
            }

            // 3. Social / Contact / Business Bio Website Requirements
            if (/(tiktok|contact|bio|profile|phone|تیکتۆک|پەیوەندی|پڕۆفایل)/i.test(p) && !/\d{7,}/.test(p)) {
                return {
                    id: 'social_req',
                    title: '📱 زانیارییەکانی پەیوەندی و هەژمارەکانت',
                    fields: [
                        { key: 'ownerName', label: 'ناو یان یوزەرنەیمی تیکتۆک / سۆشیاڵ میدیا:', placeholder: 'بۆ نموونە: rabar2008r', required: true },
                        { key: 'phoneNumber', label: 'ژمارەی تەلەفۆن بۆ پەیوەندی ڕاستەوخۆ:', placeholder: 'بۆ نموونە: 0751 616 5051', required: true }
                    ]
                };
            }

            return null;
        },

        // Renders an interactive requirement card inside the chat so user fills in the needed info
        promptUserForRequirements(reqConfig, originalUserPrompt, onCompleteCallback) {
            const feed = document.getElementById('chatFeed');
            document.getElementById('heroPrompt')?.classList.add('hidden');

            const cardId = 'req_card_' + Date.now();
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
                <div id="${cardId}" class="w-full max-w-[90%] rounded-2xl p-4 card-bg border-2 border-blue-500/40 shadow-2xl space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                        <h3 class="text-xs md:text-sm font-extrabold text-blue-400">${reqConfig.title}</h3>
                        ${reqConfig.helpUrl ? `<a href="${reqConfig.helpUrl}" target="_blank" class="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-extrabold text-[11px]">${reqConfig.helpText}</a>` : ''}
                    </div>
                    <p class="text-xs text-gray-300">بۆ ئەوەی وێبسایتەکەت بە ڕاستی و بە کردار کار بکات، ئەم زانیارییانە پڕ بکەرەوە تا زیرەکی دەستکردەکە ڕاستەوخۆ بیبەستێتەوە:</p>
                    <div class="space-y-2.5">${fieldsHtml}</div>
                    <button id="btn_${cardId}" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg">
                        <i class="fa-solid fa-bolt mr-1"></i> ناردنی زانیارییەکان بۆ AI و دروستکردنی وێبسایتەکە
                    </button>
                </div>
            `;

            feed.appendChild(wrapper);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

            document.getElementById(`btn_${cardId}`).onclick = () => {
                const collected = {};
                for (const f of reqConfig.fields) {
                    const val = document.getElementById(`${cardId}_${f.key}`)?.value.trim() || '';
                    collected[f.key] = val;
                    if (val) this.collectedData[f.key] = val;
                }
                localStorage.setItem('zeno_collected_data', JSON.stringify(this.collectedData));

                const enrichedPrompt = `${originalUserPrompt}\n\n[USER PROVIDED REAL CONFIGURATION DATA TO WIRE INTO THE WEBSITE]:\n` +
                    Object.entries(collected).map(([k, v]) => `- ${k}: ${v}`).join('\n');

                onCompleteCallback(enrichedPrompt, collected, reqConfig.id);
            };
        }
    };

    ZenoEngine.init();
})();
