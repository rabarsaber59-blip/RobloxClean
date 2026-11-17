/**
 * LOADING.JS - Dedicated Interactive AI Loading Indicator & Live Progress Tracker
 * Displays a sleek animated loading card inside the chat feed and a top progress bar
 * whenever the AI is generating or editing a website.
 */
(function () {
    const ZenoLoading = {
        timerInterval: null,
        progress: 0,
        startTime: 0,
        steps: [
            "Connecting to AI Engine with your API Key...",
            "Analyzing website structure & features...",
            "Writing responsive HTML5 & Tailwind CSS...",
            "Building interactive JavaScript logic...",
            "Applying self-healing checks & finalizing preview..."
        ],

        init() {
            window.ZenoLoading = this;
            this.injectLoadingStyles();
            console.log("⏳ ZenoLoading Module Ready.");
        },

        injectLoadingStyles() {
            if (document.getElementById('zenoLoadingStyles')) return;
            const style = document.createElement('style');
            style.id = 'zenoLoadingStyles';
            style.innerHTML = `
                @keyframes zenoSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes zenoPulseBar {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .zeno-spinner {
                    width: 28px;
                    height: 28px;
                    border: 3px solid rgba(59, 130, 246, 0.25);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: zenoSpin 0.8s linear infinite;
                }
                .zeno-shimmer {
                    animation: zenoPulseBar 1.5s ease-in-out infinite;
                }
            `;
            document.head.appendChild(style);
        },

        start(customTitle = "AI is building your website...") {
            this.stop(); // Clear any existing loader first
            this.progress = 5;
            this.startTime = Date.now();

            const feed = document.getElementById('chatFeed');
            if (!feed) return;

            // Create inline chat loading bubble right below the user's message
            const loaderBubble = document.createElement('div');
            loaderBubble.id = 'zenoInlineLoader';
            loaderBubble.className = "flex justify-start w-full my-3";
            loaderBubble.innerHTML = `
                <div class="w-full max-w-[90%] rounded-2xl p-4 card-bg border border-blue-500/40 shadow-2xl space-y-3">
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <div class="zeno-spinner shrink-0"></div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <span id="zenoLoaderTitle" class="text-xs md:text-sm font-extrabold text-white">${customTitle}</span>
                                    <span id="zenoLoaderPercent" class="text-xs font-mono font-bold text-blue-400">5%</span>
                                </div>
                                <p id="zenoLoaderStep" class="text-[11px] text-gray-400 zeno-shimmer mt-0.5">${this.steps[0]}</p>
                            </div>
                        </div>
                        <button onclick="window.stopAiGeneration && window.stopAiGeneration()" class="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow">
                            <i class="fa-solid fa-stop"></i> Stop
                        </button>
                    </div>

                    <!-- Progress Bar -->
                    <div class="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                        <div id="zenoLoaderBar" class="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 transition-all duration-300" style="width: 5%;"></div>
                    </div>

                    <div class="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                        <span id="zenoLoaderModel">Engine: Active API Key</span>
                        <span id="zenoLoaderTimer">0.0s</span>
                    </div>
                </div>
            `;

            feed.appendChild(loaderBubble);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

            // Animate progress percentage, steps, and timer
            this.timerInterval = setInterval(() => {
                const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
                if (this.progress < 92) {
                    this.progress += Math.max(1, Math.floor((95 - this.progress) / 8));
                }

                const stepIdx = Math.min(this.steps.length - 1, Math.floor(this.progress / 20));
                const pctEl = document.getElementById('zenoLoaderPercent');
                const barEl = document.getElementById('zenoLoaderBar');
                const stepEl = document.getElementById('zenoLoaderStep');
                const timerEl = document.getElementById('zenoLoaderTimer');

                if (pctEl) pctEl.innerText = `${this.progress}%`;
                if (barEl) barEl.style.width = `${this.progress}%`;
                if (stepEl) stepEl.innerText = this.steps[stepIdx];
                if (timerEl) timerEl.innerText = `${elapsed}s`;
            }, 450);
        },

        updateStatus(modelText) {
            const modelEl = document.getElementById('zenoLoaderModel');
            if (modelEl && modelText) {
                modelEl.innerText = modelText;
            }
        },

        stop() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
            const existing = document.getElementById('zenoInlineLoader');
            if (existing) {
                existing.remove();
            }
        }
    };

    ZenoLoading.init();
})();
