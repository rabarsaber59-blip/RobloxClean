/**
 * ZENO-ENGINE.JS - Interactive Project Requirements & Real API Token Wizard
 */
(function () {
    const ZenoEngine = {
        tokens: JSON.parse(localStorage.getItem('zeno_external_tokens') || '{}'),

        init() {
            this.hookRequirementsChecker();
            console.log("🔑 ZenoEngine Project Requirements Wizard Ready.");
        },

        saveToken(key, val) {
            this.tokens[key] = (val || '').trim();
            localStorage.setItem('zeno_external_tokens', JSON.stringify(this.tokens));
        },

        detectMissingProjectRequirements(promptText) {
            const p = (promptText || '').toLowerCase();

            // Do not interrupt if user is just doing a visual color/star edit on an existing site
            if (window.state?.currentSiteHtml && /(background|back ground|black|blacl|star|color|ڕەنگ|ئەستێرە)/i.test(p)) {
                return null;
            }

            // 1. Movie / Anime / Drama Streaming Project
            if (/(movie|film|anime|drama|stream|netflix|rebenflix|zoneflix|cinema|فیلم|ئەنیمی|ئەنەمی|دراما)/i.test(p)) {
                return {
                    id: 'tmdb_streaming',
                    title: '🎬 پێداویستییەکانی وێبسایتی فیلم و ئەنیمی ڕاستەقینە',
                    tokenKey: 'tmdb_api_key',
                    tokenLabel: 'TMDB API Key (بۆ هێنانی هەموو فیلم و دراماکان)',
                    placeholder: 'Paste your TMDB API Key (v3 auth) or click Build to use Live Anime API...',
                    getUrl: 'https://www.themoviedb.org/settings/api',
                    getBtnText: '🔑 هێنانی TMDB API Key',
                    guide: 'بۆ ئەوەی وێبسایتەکەت بە هەزاران فیلم و زنجیرەی ڕاستەقینە و سێرڤەری ڤیدیۆی کارا دروست بێت، تۆکنی TMDB دابنێ (یان ڕاستەوخۆ دوگمەی سەوز دابگرە).'
                };
            }

            // 2. Shopping / Online Store Project
            if (/(shop|shopping|store|ecommerce|e-commerce|market|شۆپینگ|شۆپ|فرۆشگا)/i.test(p)) {
                return {
                    id: 'shopping_orders',
                    title: '🛍️ پێداویستییەکانی فرۆشگای ئۆنلاین (Real Order System)',
                    tokenKey: 'shop_whatsapp_or_bot',
                    tokenLabel: 'ژمارەی WhatsApp یان Telegram Bot Token بۆ هاتنی داواکاریی کڕیار',
                    placeholder: 'e.g. 9647516165051 (WhatsApp) or Telegram Bot Token...',
                    getUrl: 'https://t.me/BotFather',
                    getBtnText: '🤖 دروستکردنی Telegram Bot',
                    guide: 'کاتێک کڕیارێک لە فرۆشگاکەت کاڵا هەڵدەبژێرێت و Checkout دەکات، داواکارییەکەی بە ڕاستەوخۆ دێت بۆ ئەم ژمارە واتسئەپە یان تێلیگرامەی لێرەدا دایدەنێیت.'
                };
            }

            return null;
        },

        hookRequirementsChecker() {
            window.checkZenoRequirements = (promptText) => {
                return this.detectMissingProjectRequirements(promptText);
            };
        }
    };

    window.ZenoEngine = ZenoEngine;
    ZenoEngine.init();
})();
