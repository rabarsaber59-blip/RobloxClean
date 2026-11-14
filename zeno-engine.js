/**
 * ZENO-ENGINE.JS - Real API, Token Guide & Live Data Injection Engine for ZoneWeb
 * Automatically detects when a website needs external API tokens (Movies/TMDB, Anime/Jikan,
 * Shopping Orders/Telegram/WhatsApp, Firebase/Supabase) and guides the user step-by-step.
 */

(function () {
    const ZenoEngine = {
        tokens: JSON.parse(localStorage.getItem('zeno_external_tokens') || '{}'),

        init() {
            this.injectHeaderWizardButton();
            this.hookIntoZoneWebChat();
            console.log("⚡ ZenoEngine Live Token & API Guide Loaded.");
        },

        saveToken(keyName, value) {
            this.tokens[keyName] = (value || '').trim();
            localStorage.setItem('zeno_external_tokens', JSON.stringify(this.tokens));
        },

        // Adds a quick "⚡ API Tokens" button to the top bar so user can manage tokens anytime
        injectHeaderWizardButton() {
            window.addEventListener('DOMContentLoaded', () => {
                const topPreviewBtn = document.getElementById('topPreviewBtn');
                if (topPreviewBtn && topPreviewBtn.parentElement) {
                    const tokenBtn = document.createElement('button');
                    tokenBtn.className = "px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/30 transition shrink-0";
                    tokenBtn.innerHTML = `<i class="fa-solid fa-key"></i> <span class="hidden sm:inline">Site Tokens</span>`;
                    tokenBtn.title = "Manage External API Tokens for Movies, Anime, Shopping & Databases";
                    tokenBtn.onclick = () => ZenoEngine.showTokenManagerModal();
                    topPreviewBtn.parentElement.insertBefore(tokenBtn, topPreviewBtn);
                }
            });
        },

        // Detects if the user's prompt needs an external Token / Real Data API
        detectRequiredService(promptText) {
            const p = (promptText || '').toLowerCase();

            // 1. Movie, Anime & Drama Streaming Website
            if (/(movie|film|anime|drama|series|stream|netflix|rebenflix|cinema|watch|tmdb|فیلم|ئەنیمی|ئەنەمی|دراما|زنجیرە|سینەما)/i.test(p)) {
                return {
                    id: 'tmdb_streaming',
                    title: '🎬 وێبسایتی فیلم و ئەنیمی و دراما (Real Movie & Anime API)',
                    tokenKey: 'tmdb_api_key',
                    tokenLabel: 'TMDB API Key (v3 auth)',
                    placeholder: 'Paste your TMDB API Key here (e.g. a1b2c3d4e5f6...)...',
                    getUrl: 'https://www.themoviedb.org/settings/api',
                    getBtnText: '🔑 وەرگرتنی TMDB API Key بە خۆڕایی',
                    steps: [
                        '١. کلیک لە دوگمەی **"وەرگرتنی TMDB API Key"** بکە و لە سایتی TMDB هەژمارێکی خۆڕایی دروست بکە.',
                        '٢. بچۆ سەر بەشی **Settings > API** و کۆپی کۆدی **API Key (v3 auth)** بکە.',
                        '٣. لەم بۆکسەی خوارەوە دایبنێ بۆ ئەوەی وێبسایتەکەت بە هەزاران فیلم، دراما، پۆستەر، گەڕانی زیندوو و سێرڤەری ڤیدیۆی ڕاستەقینە (VidSrc) کار بکات (بەشی ئەنیمیش ڕاستەوخۆ بە Jikan API کار دەکات).'
                    ]
                };
            }

            // 2. Shopping Store with Real Order Receiving (Telegram Bot / WhatsApp)
            if (/(shop|shopping|store|ecommerce|e-commerce|market|order|cart|شۆپینگ|شۆپ|فرۆشگا|کڕین|داواکاری)/i.test(p)) {
                return {
                    id: 'shopping_orders',
                    title: '🛍️ سیستەمی وەرگرتنی داواکاریی کڕیار (WhatsApp & Telegram Token)',
                    tokenKey: 'shop_contact_token',
                    tokenLabel: 'ژمارەی WhatsApp یان Telegram Bot Token',
                    placeholder: 'Enter WhatsApp Phone (e.g. 9647516165051) OR Telegram Bot Token...',
                    getUrl: 'https://t.me/BotFather',
                    getBtnText: '🤖 دروستکردنی بۆتی تێلیگرام (@BotFather)',
                    steps: [
                        '١. بۆ ئەوەی کاتێک کڕیارێک لە وێبسایتەکەت کاڵا دەکڕێت داواکارییەکەی بە ڕاستی بێت بۆ مۆبایلەکەت، ژمارەی **WhatsApp** (بە کۆدی وڵات وەک `964751...`) لە بۆکسەکەدا بنووسە.',
                        '٢. یان ئەگەر دەتەوێت داواکارییەکان بێتە ناو تێلیگرام، لە `@BotFather` تۆکنێک بهێنە بە شێوازی `BOT_TOKEN|CHAT_ID` دایبنێ.'
                    ]
                };
            }

            // 3. Weather / Crypto / Live Data App
            if (/(weather|forecast|temperature|کەشوهەوا|پلەی گەرمی)/i.test(p)) {
                return {
                    id: 'weather_api',
                    title: '⛅ وێبسایتی کەشوهەوای زیندوو (OpenWeather / Open-Meteo)',
                    tokenKey: 'openweather_key',
                    tokenLabel: 'OpenWeather API Key (یان بەتاڵ جێیبھێڵە بۆ Open-Meteo)',
                    placeholder: 'Paste OpenWeather API Key (Optional)...',
                    getUrl: 'https://home.openweathermap.org/api_keys',
                    getBtnText: '🔑 وەرگرتنی OpenWeather Key',
                    steps: [
                        '١. دەتوانیت کلیلی OpenWeather بهێنیت یان ڕاستەوخۆ دوگمەی دروستکردن دابگریت بۆ بەکارهێنانی سێرڤەری زیندووی کەشوهەوای جیهانی.'
                    ]
                };
            }

            return null;
        },

        // Hooks into ZoneWeb's sendUserMessage so AI guides the user when a token is needed
        hookIntoZoneWebChat() {
            const checkInterval = setInterval(() => {
                if (typeof window.sendUserMessage === 'function' && !window.__zenoHooked) {
                    window.__zenoHooked = true;
                    clearInterval(checkInterval);

                    const originalSend = window.sendUserMessage;
                    window.sendUserMessage = async function () {
                        const input = document.getElementById('chatInput');
                        const text = (input?.value || '').trim();
                        if (!text) return originalSend.apply(this, arguments);

                        const service = ZenoEngine.detectRequiredService(text);

                        // If prompt requires external token/API and user hasn't explicitly bypassed
                        if (service && !window.__zenoBypassOnce) {
                            input.value = '';
                            if (typeof window.appendMessage === 'function') {
                                window.appendMessage('user', text);
                            }
                            ZenoEngine.renderInteractiveGuideInChat(service, text);
                            return;
                        }

                        window.__zenoBypassOnce = false;
                        return originalSend.apply(this, arguments);
                    };
                }
            }, 300);
        },

        // Renders the Interactive AI Guide Card right inside the chat feed
        renderInteractiveGuideInChat(service, originalPrompt) {
            const feed = document.getElementById('chatFeed');
            const hero = document.getElementById('heroPrompt');
            if (hero) hero.classList.add('hidden');

            const existingToken = this.tokens[service.tokenKey] || '';
            const cardId = 'zeno_card_' + Date.now();

            const stepsHtml = service.steps.map(s => `<p class="text-xs text-gray-300 leading-relaxed mb-1.5">${s.replace(/\*\*(.*?)\*\*/g, '<b class="text-white">$1</b>')}</p>`).join('');

            const guideWrapper = document.createElement('div');
            guideWrapper.className = "flex justify-start w-full my-3";
            guideWrapper.innerHTML = `
                <div id="${cardId}" class="w-full max-w-[92%] rounded-2xl p-4 md:p-5 card-bg border-2 border-amber-500/40 shadow-2xl space-y-3.5">
                    <div class="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div class="flex items-center gap-2">
                            <span class="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold">
                                <i class="fa-solid fa-wand-magic-sparkles"></i>
                            </span>
                            <div>
                                <h3 class="text-sm font-extrabold text-amber-400">${service.title}</h3>
                                <p class="text-[11px] text-gray-400">Zeno Engine — ڕێنمایی بەستنەوەی داتای ڕاستەقینە</p>
                            </div>
                        </div>
                        <a href="${service.getUrl}" target="_blank" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shrink-0 shadow">
                            <i class="fa-solid fa-up-right-from-square"></i>
                            <span>${service.getBtnText}</span>
                        </a>
                    </div>

                    <div class="bg-black/30 rounded-xl p-3 border border-white/10">
                        ${stepsHtml}
                    </div>

                    <div class="space-y-2">
                        <label class="block text-xs font-bold text-amber-300">${service.tokenLabel}:</label>
                        <div class="flex flex-wrap sm:flex-nowrap gap-2">
                            <input id="input_${cardId}" type="text" value="${existingToken}" placeholder="${service.placeholder}"
                                class="flex-1 min-w-[200px] bg-black/50 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono">
                            <button onclick="ZenoEngine.connectAndBuild('${service.id}', '${service.tokenKey}', 'input_${cardId}', \`${originalPrompt.replace(/`/g, '')}\`)"
                                class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg transition">
                                <i class="fa-solid fa-bolt"></i>
                                <span>پاشەکەوتکردن و دروستکردنی وێبسایت</span>
                            </button>
                        </div>
                    </div>

                    <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
                        <span>دەتوانیت دواتریش لە ناو خودی وێبسایتەکەدا تۆکنەکە دابنێیت یان بیگۆڕیت.</span>
                        <button onclick="ZenoEngine.connectAndBuild('${service.id}', '${service.tokenKey}', 'input_${cardId}', \`${originalPrompt.replace(/`/g, '')}\`)"
                            class="text-blue-400 hover:underline font-bold">
                            دروستکردنی خێرا بە API کراوە ⬅
                        </button>
                    </div>
                </div>
            `;

            feed.appendChild(guideWrapper);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        },

        // Saves the user's token and builds the 100% real API-powered website
        connectAndBuild(serviceId, tokenKey, inputId, originalPrompt) {
            const inputEl = document.getElementById(inputId);
            const tokenVal = inputEl ? inputEl.value.trim() : '';
            if (tokenVal) {
                this.saveToken(tokenKey, tokenVal);
            }

            let generatedHtml = '';
            let siteSlug = 'real-web-app';

            if (serviceId === 'tmdb_streaming') {
                generatedHtml = this.buildRealMovieAnimeStreamingSite(tokenVal);
                siteSlug = 'rebenflix-stream';
            } else if (serviceId === 'shopping_orders') {
                generatedHtml = this.buildRealShoppingWithOrderWebhook(tokenVal);
                siteSlug = 'zoneshop-market';
            } else if (serviceId === 'weather_api') {
                generatedHtml = this.buildRealLiveWeatherSite(tokenVal);
                siteSlug = 'live-weather-hub';
            }

            if (generatedHtml && typeof window.injectAdsAndPremium === 'function') {
                generatedHtml = window.injectAdsAndPremium(generatedHtml);
            }

            if (window.state) {
                window.state.currentSiteName = siteSlug;
                window.state.currentSiteHtml = generatedHtml;
                localStorage.setItem('zw_current_site_name', siteSlug);
                localStorage.setItem('zw_current_site_html', generatedHtml);
            }

            if (typeof window.saveOrUpdateProjectInHistory === 'function') {
                window.saveOrUpdateProjectInHistory(siteSlug, generatedHtml, false);
            }
            if (typeof window.updatePublicLinkUI === 'function') {
                window.updatePublicLinkUI(siteSlug, generatedHtml);
            }
            if (typeof window.updateKeepEditingBar === 'function') {
                window.updateKeepEditingBar();
            }

            if (typeof window.appendMessage === 'function') {
                window.appendMessage(
                    'ai',
                    `✅ **وێبسایتە ڕاستەقینەکەت (${siteSlug}) بە سەرکەوتوویی دروست کرا و بەسترایەوە بە API!**\nئێستا دەتوانیت کلیک لە **Preview Website** بکەیت بۆ بینینی فیلم و ئەنیمییە ڕاستەقینەکان و تاقیکردنەوەی سێرڤەری ڤیدیۆکان.`,
                    null,
                    true
                );
            }
            if (typeof window.triggerWebsiteReadyNotification === 'function') {
                window.triggerWebsiteReadyNotification(siteSlug);
            }
        },

        // Modal to update tokens anytime from header
        showTokenManagerModal() {
            const tmdb = this.tokens['tmdb_api_key'] || '';
            const shop = this.tokens['shop_contact_token'] || '';
            const newTmdb = prompt("🔑 Enter your TMDB API Key (for Movie/Drama websites):", tmdb);
            if (newTmdb !== null) {
                this.saveToken('tmdb_api_key', newTmdb);
            }
            const newShop = prompt("🛍️ Enter your WhatsApp Number or Telegram Bot Token (for Shopping Store orders):", shop);
            if (newShop !== null) {
                this.saveToken('shop_contact_token', newShop);
            }
            alert("✅ Tokens saved in ZenoEngine!");
        },

        // =========================================================================
        // 1. REAL MOVIE, ANIME & DRAMA STREAMING SITE (TMDB API + JIKAN API + VIDSRC PLAYER)
        // =========================================================================
        buildRealMovieAnimeStreamingSite(userTmdbKey) {
            const escapedKey = (userTmdbKey || '').replace(/"/g, '');
            return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RebenFlix Pro - Real Movies, Anime & Drama</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-[#07080d] text-white font-sans min-h-screen flex flex-col">

    <!-- Top Navigation -->
    <header class="sticky top-0 z-40 bg-[#0b0d14]/95 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-red-600/40">
                <i class="fa-solid fa-play"></i>
            </div>
            <div>
                <span class="text-xl font-black tracking-wider text-red-500">REBEN<span class="text-white">FLIX</span></span>
                <span class="block text-[10px] text-zinc-400">LIVE API STREAMING CATALOG</span>
            </div>
        </div>

        <!-- Category Tabs -->
        <div class="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-white/10">
            <button onclick="switchTab('anime')" id="tab-anime" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white">🎌 Live Anime</button>
            <button onclick="switchTab('movies')" id="tab-movies" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:text-white">🎬 Movies (TMDB)</button>
            <button onclick="switchTab('tv')" id="tab-tv" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:text-white">📺 Series & K-Drama</button>
        </div>

        <!-- Live Search + Token Setup Button -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
            <div class="flex-1 sm:w-64 flex items-center bg-zinc-900 border border-white/15 rounded-xl px-3 py-2">
                <i class="fa-solid fa-magnifying-glass text-zinc-400 text-xs mr-2"></i>
                <input id="searchBox" onkeydown="if(event.key==='Enter') runLiveSearch()" type="text" placeholder="Search any Anime, Movie, Drama..." class="w-full bg-transparent text-xs focus:outline-none">
                <button onclick="runLiveSearch()" class="text-xs text-red-400 font-bold ml-1">Go</button>
            </div>
            <button onclick="openTokenModal()" class="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold shrink-0" title="Set TMDB API Token">
                <i class="fa-solid fa-key mr-1"></i> API Key
            </button>
        </div>
    </header>

    <!-- Token Notice Banner (Shown only if TMDB key is missing when browsing Movies/TV) -->
    <div id="tmdbNoticeBanner" class="hidden bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-center text-xs text-amber-300">
        🔑 To load millions of live Movies & K-Dramas from TMDB, <button onclick="openTokenModal()" class="underline font-extrabold text-white">click here to paste your free TMDB API Key</button> (Live Anime works automatically without a key!).
    </div>

    <!-- Main Catalog Grid -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6">
        <div class="flex items-center justify-between mb-5">
            <h2 id="sectionHeading" class="text-xl md:text-2xl font-extrabold flex items-center gap-2">
                <i class="fa-solid fa-fire text-red-500"></i> Top Trending Live Catalog
            </h2>
            <span id="apiStatusBadge" class="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">Connected to Live API</span>
        </div>

        <div id="loadingSpinner" class="hidden py-16 text-center">
            <i class="fa-solid fa-spinner fa-spin text-3xl text-red-500 mb-3"></i>
            <p class="text-xs text-zinc-400">Fetching live titles from global database...</p>
        </div>

        <div id="catalogGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 pb-16"></div>
    </main>

    <!-- REAL VIDEO STREAMING PLAYER MODAL -->
    <div id="playerModal" class="hidden fixed inset-0 z-50 bg-black/95 flex flex-col p-3 md:p-6">
        <div class="max-w-5xl w-full mx-auto flex flex-col flex-1">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                    <h3 id="playerTitle" class="font-extrabold text-base md:text-lg text-white">Watching Live Stream</h3>
                    <p id="playerSub" class="text-xs text-zinc-400">Select streaming server below if one is slow</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="changeStreamServer('vidsrc')" class="px-3 py-1.5 rounded-lg bg-red-600 text-xs font-bold">Server 1 (VidSrc)</button>
                    <button onclick="changeStreamServer('embed2')" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold">Server 2 (MultiEmbed)</button>
                    <button onclick="closePlayer()" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-600 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>

            <!-- Season & Episode Controls for TV/Anime -->
            <div id="episodeControls" class="hidden py-2.5 flex flex-wrap items-center gap-3 text-xs border-b border-white/10">
                <label class="text-zinc-400">Season:</label>
                <input id="seasonInp" type="number" value="1" min="1" onchange="reloadEpisodeStream()" class="w-16 bg-zinc-900 border border-white/15 rounded-lg px-2 py-1 text-center font-bold">
                <label class="text-zinc-400">Episode:</label>
                <input id="episodeInp" type="number" value="1" min="1" onchange="reloadEpisodeStream()" class="w-16 bg-zinc-900 border border-white/15 rounded-lg px-2 py-1 text-center font-bold">
                <button onclick="reloadEpisodeStream()" class="px-3 py-1 rounded-lg bg-emerald-600 font-bold">Load Episode</button>
            </div>

            <div class="flex-1 bg-black rounded-2xl overflow-hidden mt-3 border border-white/10 relative">
                <iframe id="streamIframe" class="w-full h-full border-0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
            </div>
        </div>
    </div>

    <!-- TMDB API KEY MODAL INSIDE THE GENERATED SITE -->
    <div id="tokenModal" class="hidden fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
        <div class="bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div class="flex items-center justify-between">
                <h3 class="font-extrabold text-base text-amber-400"><i class="fa-solid fa-key mr-1.5"></i> Connect TMDB API Token</h3>
                <button onclick="document.getElementById('tokenModal').classList.add('hidden')" class="text-zinc-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <p class="text-xs text-zinc-300 leading-relaxed">
                Paste your free <b>TMDB API Key (v3 auth)</b> below to unlock live searching and streaming for all Movies & TV Series worldwide.
            </p>
            <a href="https://www.themoviedb.org/settings/api" target="_blank" class="block text-center py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30">
                🔗 Click Here to Get Free TMDB API Key
            </a>
            <input id="tmdbKeyInput" type="text" placeholder="Paste TMDB v3 API Key..." class="w-full bg-black border border-white/20 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white">
            <button onclick="saveTmdbKey()" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs">
                Save Token & Reload Live Movies
            </button>
        </div>
    </div>

    <script>
        let tmdbKey = localStorage.getItem('rebenflix_tmdb_key') || "${escapedKey}";
        let currentTab = 'anime';
        let activeMedia = { id: '', type: 'movie', title: '', trailerUrl: '' };
        let activeServer = 'vidsrc';

        function openTokenModal() {
            document.getElementById('tmdbKeyInput').value = tmdbKey;
            document.getElementById('tokenModal').classList.remove('hidden');
        }

        function saveTmdbKey() {
            tmdbKey = document.getElementById('tmdbKeyInput').value.trim();
            localStorage.setItem('rebenflix_tmdb_key', tmdbKey);
            document.getElementById('tokenModal').classList.add('hidden');
            switchTab('movies');
        }

        async function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.className = 'tab-btn px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:text-white';
            });
            document.getElementById('tab-' + tab).className = 'tab-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white';

            if (tab === 'anime') {
                document.getElementById('tmdbNoticeBanner').classList.add('hidden');
                await loadLiveAnime('');
            } else {
                if (!tmdbKey) {
                    document.getElementById('tmdbNoticeBanner').classList.remove('hidden');
                } else {
                    document.getElementById('tmdbNoticeBanner').classList.add('hidden');
                }
                await loadTmdbCatalog(tab, '');
            }
        }

        async function runLiveSearch() {
            const q = document.getElementById('searchBox').value.trim();
            if (currentTab === 'anime') {
                await loadLiveAnime(q);
            } else {
                await loadTmdbCatalog(currentTab, q);
            }
        }

        // 1. REAL LIVE ANIME API (Jikan MyAnimeList v4 - Works immediately!)
        async function loadLiveAnime(query) {
            const grid = document.getElementById('catalogGrid');
            const spinner = document.getElementById('loadingSpinner');
            spinner.classList.remove('hidden');
            grid.innerHTML = '';

            try {
                const url = query
                    ? \`https://api.jikan.moe/v4/anime?q=\${encodeURIComponent(query)}&limit=20\`
                    : \`https://api.jikan.moe/v4/top/anime?limit=20\`;
                const res = await fetch(url);
                const data = await res.json();
                spinner.classList.add('hidden');

                const list = data.data || [];
                grid.innerHTML = list.map(item => {
                    const title = (item.title_english || item.title || 'Anime').replace(/'/g, '');
                    const img = item.images?.jpg?.large_image_url || '';
                    const score = item.score || '8.8';
                    const episodes = item.episodes ? item.episodes + ' EPS' : 'SERIES';
                    const trailer = item.trailer?.embed_url || '';
                    return \`
                        <div class="bg-zinc-900/90 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-red-500/60 transition group shadow-xl">
                            <div>
                                <div class="relative h-64 overflow-hidden bg-zinc-950">
                                    <img src="\${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                                    <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold">\${episodes}</span>
                                    <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-amber-400 text-[11px] font-extrabold">★ \${score}</span>
                                </div>
                                <div class="p-3.5">
                                    <h3 class="font-bold text-xs md:text-sm line-clamp-1">\${title}</h3>
                                    <p class="text-[11px] text-zinc-400 mt-1">\${item.year || 'Anime'} • \${item.type || 'TV'}</p>
                                </div>
                            </div>
                            <div class="p-3.5 pt-0">
                                <button onclick="openAnimeStream('\${title}', '\${trailer}')" class="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow">
                                    <i class="fa-solid fa-play"></i> Watch Anime
                                </button>
                            </div>
                        </div>
                    \`;
                }).join('');
            } catch (e) {
                spinner.classList.add('hidden');
                grid.innerHTML = '<p class="text-zinc-400 text-xs col-span-full text-center">Could not reach Jikan Anime API. Check connection.</p>';
            }
        }

        // 2. REAL LIVE TMDB MOVIES & K-DRAMA SERIES API + VIDSRC EMBED STREAMING
        async function loadTmdbCatalog(type, query) {
            const grid = document.getElementById('catalogGrid');
            const spinner = document.getElementById('loadingSpinner');

            if (!tmdbKey) {
                // Show curated real TMDB IDs that stream on VidSrc immediately, while prompting user for their TMDB key for full search
                const curatedRealTmdb = [
                    { id: 12244, mediaType: 'movie', title: "9 (2009 Stitchpunk Sci-Fi)", rate: "7.8", year: "2009", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80" },
                    { id: 693134, mediaType: 'movie', title: "Dune: Part Two", rate: "8.5", year: "2024", img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&q=80" },
                    { id: 93405, mediaType: 'tv', title: "Squid Game (K-Drama)", rate: "8.4", year: "2021", img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80" },
                    { id: 157336, mediaType: 'movie', title: "Interstellar", rate: "8.7", year: "2014", img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&q=80" },
                    { id: 1396, mediaType: 'tv', title: "Breaking Bad (Full Series)", rate: "9.5", year: "2008", img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80" }
                ];
                grid.innerHTML = curatedRealTmdb.map(m => \`
                    <div class="bg-zinc-900/90 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-red-500/60 transition shadow-xl">
                        <div>
                            <div class="relative h-64 bg-zinc-950">
                                <img src="\${m.img}" class="w-full h-full object-cover">
                                <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold">TMDB #\${m.id}</span>
                                <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-amber-400 text-[11px] font-extrabold">★ \${m.rate}</span>
                            </div>
                            <div class="p-3.5">
                                <h3 class="font-bold text-xs md:text-sm">\${m.title}</h3>
                                <p class="text-[11px] text-zinc-400 mt-1">\${m.year} • Real VidSrc Stream</p>
                            </div>
                        </div>
                        <div class="p-3.5 pt-0">
                            <button onclick="openTmdbStream('\${m.id}', '\${m.mediaType}', '\${m.title}')" class="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5">
                                <i class="fa-solid fa-play"></i> Stream Full Video
                            </button>
                        </div>
                    </div>
                \`).join('');
                return;
            }

            spinner.classList.remove('hidden');
            grid.innerHTML = '';
            try {
                const mediaEndpoint = type === 'tv' ? 'tv' : 'movie';
                const url = query
                    ? \`https://api.themoviedb.org/3/search/\${mediaEndpoint}?api_key=\${encodeURIComponent(tmdbKey)}&query=\${encodeURIComponent(query)}\`
                    : \`https://api.themoviedb.org/3/trending/\${mediaEndpoint}/week?api_key=\${encodeURIComponent(tmdbKey)}\`;
                const res = await fetch(url);
                const data = await res.json();
                spinner.classList.add('hidden');

                if (!res.ok) {
                    alert("TMDB API Error: " + (data.status_message || "Invalid TMDB Key"));
                    openTokenModal();
                    return;
                }

                const results = data.results || [];
                grid.innerHTML = results.map(item => {
                    const title = (item.title || item.name || 'Untitled').replace(/'/g, '');
                    const poster = item.poster_path
                        ? \`https://image.tmdb.org/t/p/w500\${item.poster_path}\`
                        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';
                    const rate = (item.vote_average || 8.0).toFixed(1);
                    const date = (item.release_date || item.first_air_date || '').slice(0, 4);
                    return \`
                        <div class="bg-zinc-900/90 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-red-500/60 transition group shadow-xl">
                            <div>
                                <div class="relative h-64 overflow-hidden bg-zinc-950">
                                    <img src="\${poster}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                                    <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-amber-400 text-[11px] font-extrabold">★ \${rate}</span>
                                </div>
                                <div class="p-3.5">
                                    <h3 class="font-bold text-xs md:text-sm line-clamp-1">\${title}</h3>
                                    <p class="text-[11px] text-zinc-400 mt-1">\${date} • \${mediaEndpoint.toUpperCase()}</p>
                                </div>
                            </div>
                            <div class="p-3.5 pt-0">
                                <button onclick="openTmdbStream('\${item.id}', '\${mediaEndpoint}', '\${title}')" class="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow">
                                    <i class="fa-solid fa-play"></i> Stream Now
                                </button>
                            </div>
                        </div>
                    \`;
                }).join('');
            } catch (e) {
                spinner.classList.add('hidden');
            }
        }

        function openTmdbStream(id, mediaType, title) {
            activeMedia = { id, type: mediaType, title, trailerUrl: '' };
            document.getElementById('playerTitle').innerText = title;
            document.getElementById('episodeControls').classList.toggle('hidden', mediaType !== 'tv');
            document.getElementById('playerModal').classList.remove('hidden');
            reloadEpisodeStream();
        }

        function openAnimeStream(title, trailerUrl) {
            document.getElementById('playerTitle').innerText = title;
            document.getElementById('episodeControls').classList.add('hidden');
            document.getElementById('playerModal').classList.remove('hidden');
            const frame = document.getElementById('streamIframe');
            if (trailerUrl) {
                frame.src = trailerUrl;
            } else {
                frame.src = \`https://www.youtube.com/embed?listType=search&list=\${encodeURIComponent(title + ' anime episode 1')}\`;
            }
        }

        function reloadEpisodeStream() {
            const s = document.getElementById('seasonInp').value || 1;
            const e = document.getElementById('episodeInp').value || 1;
            const frame = document.getElementById('streamIframe');
            if (activeMedia.type === 'tv') {
                frame.src = activeServer === 'vidsrc'
                    ? \`https://vidsrc.xyz/embed/tv?tmdb=\${activeMedia.id}&season=\${s}&episode=\${e}\`
                    : \`https://multiembed.mov/?video_id=\${activeMedia.id}&tmdb=1&s=\${s}&e=\${e}\`;
            } else {
                frame.src = activeServer === 'vidsrc'
                    ? \`https://vidsrc.xyz/embed/movie?tmdb=\${activeMedia.id}\`
                    : \`https://multiembed.mov/?video_id=\${activeMedia.id}&tmdb=1\`;
            }
        }

        function changeStreamServer(srv) {
            activeServer = srv;
            if (activeMedia.id) reloadEpisodeStream();
        }

        function closePlayer() {
            document.getElementById('streamIframe').src = '';
            document.getElementById('playerModal').classList.add('hidden');
        }

        // Load live Anime immediately on startup
        loadLiveAnime('');
    <\/script>
</body>
</html>`;
        },

        // =========================================================================
        // 2. REAL SHOPPING STORE WITH LIVE PRODUCT API + WHATSAPP/TELEGRAM ORDER WEBHOOK
        // =========================================================================
        buildRealShoppingWithOrderWebhook(contactToken) {
            const escapedToken = (contactToken || '9647516165051').replace(/"/g, '');
            return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZoneShop Live - Real API E-Commerce Store</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-zinc-950 text-white font-sans min-h-screen">
    <header class="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-white/10 px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center font-bold text-lg"><i class="fa-solid fa-bag-shopping"></i></div>
            <span class="text-xl font-extrabold">Zone<span class="text-rose-500">Shop</span> Live</span>
        </div>
        <div class="flex-1 max-w-md flex items-center bg-zinc-900 border border-white/15 rounded-xl px-3 py-2">
            <i class="fa-solid fa-magnifying-glass text-zinc-400 text-xs mr-2"></i>
            <input id="shopSearch" oninput="searchLiveProducts()" type="text" placeholder="Search 100+ real live products from API..." class="w-full bg-transparent text-xs focus:outline-none">
        </div>
        <button onclick="document.getElementById('cartModal').classList.remove('hidden')" class="px-4 py-2 rounded-xl bg-rose-600 font-bold text-xs flex items-center gap-2">
            <i class="fa-solid fa-cart-shopping"></i> Cart (<span id="cartCount">0</span>)
        </button>
    </header>

    <main class="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div id="prodGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"></div>
    </main>

    <!-- Checkout Modal (Sends Real Order to Owner's WhatsApp or Telegram Bot) -->
    <div id="cartModal" class="hidden fixed inset-0 z-50 bg-black/80 flex justify-end">
        <div class="w-full max-w-md bg-zinc-900 h-full p-6 flex flex-col justify-between border-l border-white/10">
            <div>
                <div class="flex items-center justify-between pb-4 border-b border-white/10">
                    <h2 class="font-extrabold text-lg">Your Shopping Order</h2>
                    <button onclick="document.getElementById('cartModal').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div id="cartItems" class="mt-4 space-y-2.5 max-h-[45vh] overflow-y-auto"></div>
            </div>
            <div class="space-y-2.5 pt-4 border-t border-white/10">
                <div class="flex justify-between font-extrabold text-lg"><span>Total:</span><span id="cartTotal" class="text-rose-500">$0.00</span></div>
                <input id="custName" type="text" placeholder="Your Full Name..." class="w-full bg-zinc-950 border border-white/15 rounded-xl px-3 py-2 text-xs">
                <input id="custPhone" type="text" placeholder="Your Phone Number..." class="w-full bg-zinc-950 border border-white/15 rounded-xl px-3 py-2 text-xs">
                <input id="custCity" type="text" placeholder="Delivery City & Address..." class="w-full bg-zinc-950 border border-white/15 rounded-xl px-3 py-2 text-xs">
                <button onclick="sendRealOrder()" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs">
                    <i class="fa-brands fa-whatsapp mr-1"></i> Send Real Order Now
                </button>
            </div>
        </div>
    </div>

    <script>
        let ownerToken = "${escapedToken}";
        let allProducts = [];
        let cart = [];

        async function loadLiveProducts() {
            const res = await fetch('https://dummyjson.com/products?limit=28');
            const data = await res.json();
            allProducts = data.products || [];
            renderGrid(allProducts);
        }

        function searchLiveProducts() {
            const q = document.getElementById('shopSearch').value.toLowerCase();
            renderGrid(allProducts.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
        }

        function renderGrid(list) {
            document.getElementById('prodGrid').innerHTML = list.map(p => \`
                <div class="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between p-4">
                    <div>
                        <img src="\${p.thumbnail}" class="w-full h-44 object-cover rounded-xl mb-3 bg-zinc-950">
                        <span class="text-[10px] uppercase text-rose-400 font-bold">\${p.category}</span>
                        <h3 class="font-bold text-sm mt-0.5 line-clamp-1">\${p.title}</h3>
                        <p class="text-lg font-extrabold mt-2">$\${p.price}</p>
                    </div>
                    <button onclick="addCart(\${p.id})" class="mt-3 w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs">Add to Cart</button>
                </div>
            \`).join('');
        }

        function addCart(id) {
            const p = allProducts.find(x => x.id === id);
            cart.push(p);
            document.getElementById('cartCount').innerText = cart.length;
            const total = cart.reduce((s, i) => s + i.price, 0);
            document.getElementById('cartTotal').innerText = '$' + total.toFixed(2);
            document.getElementById('cartItems').innerHTML = cart.map(i => \`
                <div class="flex justify-between text-xs bg-zinc-950 p-2.5 rounded-lg">
                    <span>\${i.title}</span><b class="text-rose-400">$\${i.price}</b>
                </div>
            \`).join('');
        }

        async function sendRealOrder() {
            if (!cart.length) return alert("Your cart is empty!");
            const name = document.getElementById('custName').value || 'Customer';
            const phone = document.getElementById('custPhone').value || 'N/A';
            const addr = document.getElementById('custCity').value || 'N/A';
            const itemsText = cart.map(i => '- ' + i.title + ' ($' + i.price + ')').join('\\n');
            const total = cart.reduce((s, i) => s + i.price, 0).toFixed(2);
            const msg = \`🛍️ NEW ORDER\\nCustomer: \${name}\\nPhone: \${phone}\\nAddress: \${addr}\\nItems:\\n\${itemsText}\\nTotal: $\${total}\`;

            if (ownerToken.includes('|')) {
                const [botToken, chatId] = ownerToken.split('|');
                await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: msg })
                });
                alert("✅ Order sent directly to store owner's Telegram!");
            } else {
                const waNum = ownerToken.replace(/[^0-9]/g, '') || '9647516165051';
                window.open(\`https://wa.me/\${waNum}?text=\${encodeURIComponent(msg)}\`, '_blank');
            }
        }

        loadLiveProducts();
    <\/script>
</body>
</html>`;
        },

        // =========================================================================
        // 3. REAL LIVE WEATHER FORECAST SITE
        // =========================================================================
        buildRealLiveWeatherSite() {
            return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZenoWeather - Real-Time Global Weather</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6">
    <div class="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
        <h1 class="text-2xl font-extrabold">⛅ Live Global Weather</h1>
        <div class="flex gap-2">
            <input id="cityInp" type="text" value="Sulaymaniyah" placeholder="Enter city name..." class="flex-1 bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm">
            <button onclick="fetchWeather()" class="px-4 py-2 rounded-xl bg-blue-600 font-bold text-xs">Check</button>
        </div>
        <div id="weatherResult" class="p-6 rounded-2xl bg-slate-950 border border-white/10">Loading live satellite data...</div>
    </div>
    <script>
        async function fetchWeather() {
            const city = document.getElementById('cityInp').value.trim() || 'Sulaymaniyah';
            const geoRes = await fetch(\`https://geocoding-api.open-meteo.com/v1/search?name=\${encodeURIComponent(city)}&count=1\`);
            const geoData = await geoRes.json();
            if (!geoData.results?.length) return;
            const { latitude, longitude, name, country } = geoData.results[0];
            const wRes = await fetch(\`https://api.open-meteo.com/v1/forecast?latitude=\${latitude}&longitude=\${longitude}&current_weather=true\`);
            const wData = await wRes.json();
            const cw = wData.current_weather;
            document.getElementById('weatherResult').innerHTML = \`
                <h2 class="text-xl font-bold">\${name}, \${country}</h2>
                <p class="text-5xl font-extrabold text-blue-400 my-3">\${cw.temperature}°C</p>
                <p class="text-xs text-slate-400">Wind Speed: \${cw.windspeed} km/h</p>
            \`;
        }
        fetchWeather();
    <\/script>
</body>
</html>`;
        }
    };

    window.ZenoEngine = ZenoEngine;
    ZenoEngine.init();
})();
