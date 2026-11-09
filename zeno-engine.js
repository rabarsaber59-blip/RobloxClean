/**
 * ZenoWeb Modular Power Engine (zeno-engine.js)
 * Features: Real Abort/Stop AI, Keep Editing History (Undo/Redo + Iterative Context), & Universal Multilingual Engine
 */

(function () {
    let activeAbortController = null;
    let isAbortedByUser = false;

    /* =========================================================
       1. OMNILINGUAL LANGUAGE DETECTOR & SYSTEM INSTRUCTIONS
    ========================================================= */
    function detectLanguageInfo(text) {
        if (!text) return { lang: 'Auto-Detect', dir: 'ltr', isRTL: false };
        // Kurdish / Arabic / Persian script detection
        const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
        const kurdishSpecific = /[ۆێڵڕژڤگچپ]/;
        if (rtlRegex.test(text)) {
            if (kurdishSpecific.test(text)) {
                return { lang: 'Kurdish (کوردی)', dir: 'rtl', isRTL: true };
            }
            return { lang: 'Arabic / Persian / RTL', dir: 'rtl', isRTL: true };
        }
        return { lang: 'Universal / Multi-Language', dir: 'ltr', isRTL: false };
    }

    function buildOmnilingualPrompt(basePrompt, existingCode, projectObj) {
        const langInfo = detectLanguageInfo(basePrompt);
        const historyContext = (projectObj.editLog && projectObj.editLog.length > 0)
            ? `\nPREVIOUS EDITS IN THIS SESSION:\n- ${projectObj.editLog.slice(-5).join('\n- ')}\n`
            : '';

        const multilingualRules = [
            "UNIVERSAL MULTILINGUAL & KEEP-EDITING RULES:",
            "1. You understand EVERY human language and dialect fluently (Kurdish Sorani, Kurmanji, Arabic, English, Turkish, Persian, Spanish, French, etc.).",
            "2. Always build or update the website content in the language the user requests or speaks in.",
            "3. If the website content is in Kurdish, Arabic, or Persian, you MUST set dir=\"rtl\" on the <html> tag and include Google Font 'Vazirmatn' (<link href=\"https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;700;900&display=swap\" rel=\"stylesheet\">) and apply font-family: 'Vazirmatn', sans-serif.",
            "4. KEEP EDITING MODE: When existing HTML code is provided, NEVER delete existing features, products, or sections unless asked. Surgically upgrade and add the user's new request onto the existing website."
        ].join('\n');

        if (existingCode && existingCode.length > 50) {
            return `${multilingualRules}\n${historyContext}\nCURRENT WEBSITE HTML:\n${existingCode}\n\nNEW USER KEEP-EDITING INSTRUCTION (${langInfo.lang}):\n"${basePrompt}"\n\nApply this edit accurately while preserving the rest of the website. Return ONLY the full updated HTML5 code.`;
        }

        return `${multilingualRules}\n\nUSER BUILD REQUEST (${langInfo.lang}):\n"${basePrompt}"\n\nReturn ONLY the complete raw HTML5 code.`;
    }

    /* =========================================================
       2. INTERCEPT FETCH FOR INSTANT "STOP AI" CANCELLATION
    ========================================================= */
    const originalFetch = window.fetch.bind(window);
    window.fetch = function (resource, config = {}) {
        if (activeAbortController && !config.signal) {
            config.signal = activeAbortController.signal;
        }
        return originalFetch(resource, config);
    };

    window.stopZenoAI = function () {
        isAbortedByUser = true;
        if (activeAbortController) {
            try { activeAbortController.abort(); } catch (e) {}
            activeAbortController = null;
        }
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('hidden');

        const statusBadge = document.getElementById('activeModeBadge');
        if (statusBadge) {
            statusBadge.innerHTML = '<i class="fa-solid fa-hand text-red-400"></i> Stopped by User';
        }
    };

    /* =========================================================
       3. INJECT STOP BUTTON & "KEEP EDITING" TOOLBAR INTO UI
    ========================================================= */
    function injectModularUI() {
        // A. Inject Red "STOP AI" Button inside #loadingOverlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay && !document.getElementById('stopAiBtn')) {
            const stopBtn = document.createElement('button');
            stopBtn.id = 'stopAiBtn';
            stopBtn.type = 'button';
            stopBtn.onclick = window.stopZenoAI;
            stopBtn.className = 'mt-6 bg-red-600/25 hover:bg-red-600 active:scale-95 text-red-300 hover:text-white border border-red-500/50 font-bold px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-red-600/20';
            stopBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop AI Generation';
            loadingOverlay.appendChild(stopBtn);
        }

        // B. Inject "Keep Editing" Floating Toolbar above the Chat Input
        const chatInput = document.getElementById('chatInput');
        if (chatInput && !document.getElementById('keepEditingBar')) {
            chatInput.placeholder = "Keep editing in any language (Kurdish, English, Arabic...)";

            const chatWrapper = chatInput.closest('.max-w-2xl');
            if (chatWrapper) {
                const keepBar = document.createElement('div');
                keepBar.id = 'keepEditingBar';
                keepBar.className = 'hidden flex items-center justify-between gap-1.5 mb-2 bg-[#12131c]/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-cyan-500/30 shadow-lg overflow-x-auto';
                keepBar.innerHTML = `
                    <div class="flex items-center gap-1.5 shrink-0">
                        <span class="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <i class="fa-solid fa-pen-to-square"></i> Keep Editing
                        </span>
                        <button type="button" onclick="zenoUndo()" id="zenoUndoBtn" class="px-2 py-1 rounded-lg bg-[#1e1e2a] hover:bg-gray-700 text-gray-300 text-[11px] disabled:opacity-40" title="Undo Last Edit">
                            <i class="fa-solid fa-rotate-left"></i>
                        </button>
                        <button type="button" onclick="zenoRedo()" id="zenoRedoBtn" class="px-2 py-1 rounded-lg bg-[#1e1e2a] hover:bg-gray-700 text-gray-300 text-[11px] disabled:opacity-40" title="Redo Edit">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <button type="button" onclick="quickKeepEdit('Add a new interactive section with modern cards and smooth animations')" class="bg-[#1e1e2a] hover:bg-blue-600/30 border border-gray-700 text-gray-200 text-[10px] px-2 py-1 rounded-lg transition whitespace-nowrap">
                            + Add Section
                        </button>
                        <button type="button" onclick="quickKeepEdit('Upgrade the color palette, typography, and glassmorphism styling to look ultra-luxury')" class="bg-[#1e1e2a] hover:bg-purple-600/30 border border-gray-700 text-gray-200 text-[10px] px-2 py-1 rounded-lg transition whitespace-nowrap">
                            🎨 Upgrade UI
                        </button>
                        <button type="button" onclick="promptTranslateSite()" class="bg-[#1e1e2a] hover:bg-emerald-600/30 border border-gray-700 text-gray-200 text-[10px] px-2 py-1 rounded-lg transition whitespace-nowrap">
                            🌍 Translate
                        </button>
                    </div>
                `;
                chatWrapper.insertBefore(keepBar, chatWrapper.firstChild);
            }
        }
    }

    /* =========================================================
       4. KEEP EDITING VERSION HISTORY (UNDO / REDO / QUICK EDIT)
    ========================================================= */
    function syncKeepEditingUI(proj) {
        const bar = document.getElementById('keepEditingBar');
        if (!bar) return;

        if (proj && proj.code && proj.code.length > 20) {
            bar.classList.remove('hidden');
            const undoBtn = document.getElementById('zenoUndoBtn');
            const redoBtn = document.getElementById('zenoRedoBtn');
            if (undoBtn) undoBtn.disabled = !(proj.history && proj.historyIndex > 0);
            if (redoBtn) redoBtn.disabled = !(proj.history && proj.historyIndex < proj.history.length - 1);
        } else {
            bar.classList.add('hidden');
        }
    }

    function pushVersionSnapshot(proj, newCode, editSummary) {
        if (!proj.history) {
            proj.history = proj.code ? [proj.code] : [];
            proj.historyIndex = proj.history.length - 1;
        }
        if (!proj.editLog) proj.editLog = [];

        // Trim forward history if user undid and then made a new edit
        if (proj.historyIndex < proj.history.length - 1) {
            proj.history = proj.history.slice(0, proj.historyIndex + 1);
        }

        proj.history.push(newCode);
        if (proj.history.length > 12) proj.history.shift(); // Keep last 12 versions to save storage
        proj.historyIndex = proj.history.length - 1;

        if (editSummary) {
            proj.editLog.push(editSummary.substring(0, 80));
        }
    }

    window.zenoUndo = async function () {
        const proj = projects.find(p => p.id === currentProjectId);
        if (!proj || !proj.history || proj.historyIndex <= 0) return;

        proj.historyIndex--;
        proj.code = proj.history[proj.historyIndex];
        proj.liveUrl = await createInstantLiveLink(proj.code);
        saveToStorage();
        loadProject(proj.id);
    };

    window.zenoRedo = async function () {
        const proj = projects.find(p => p.id === currentProjectId);
        if (!proj || !proj.history || proj.historyIndex >= proj.history.length - 1) return;

        proj.historyIndex++;
        proj.code = proj.history[proj.historyIndex];
        proj.liveUrl = await createInstantLiveLink(proj.code);
        saveToStorage();
        loadProject(proj.id);
    };

    window.quickKeepEdit = function (instructionText) {
        const input = document.getElementById('chatInput');
        if (!input) return;
        input.value = instructionText;
        sendChatPrompt();
    };

    window.promptTranslateSite = function () {
        const targetLang = prompt("Translate the entire website into which language? (e.g., Kurdish, English, Arabic, Turkish):", "Kurdish (کوردی)");
        if (!targetLang) return;
        window.quickKeepEdit(`Translate all text, buttons, and headings of this website into ${targetLang} while keeping the design and functionality intact.`);
    };

    /* =========================================================
       5. UPGRADE CORE GENERATION & PROJECT LOADER
    ========================================================= */
    function hookCoreFunctions() {
        const origLoadProject = window.loadProject;
        if (origLoadProject) {
            window.loadProject = function (id) {
                origLoadProject(id);
                const proj = projects.find(p => p.id === id);
                syncKeepEditingUI(proj);
            };
        }

        // Override generateWithAI to support Stop Button, Keep Editing History, & Omnilingual Prompts
        window.generateWithAI = async function (prompt, existingCode, projectObj, attachedImages = []) {
            isAbortedByUser = false;
            activeAbortController = new AbortController();

            const provider = localStorage.getItem('wm_provider') || 'gemini';
            const apiKey = localStorage.getItem('wm_api_key') || '';

            document.getElementById('loadingOverlay').classList.remove('hidden');
            document.getElementById('streamProgressBar').style.width = '12%';

            // Initialize history stack with initial code if not already present
            if (existingCode && (!projectObj.history || projectObj.history.length === 0)) {
                projectObj.history = [existingCode];
                projectObj.historyIndex = 0;
            }

            let cleanExisting = existingCode || '';
            if (cleanExisting && projectObj.products) {
                projectObj.products.forEach((p, idx) => {
                    if (p.b64) cleanExisting = cleanExisting.split(p.b64).join(`RAW_IMG_TARGET_${idx}`);
                });
            }
            if (cleanExisting && projectObj.chatImages) {
                projectObj.chatImages.forEach(img => {
                    if (img.b64) cleanExisting = cleanExisting.split(img.b64).join(`CHAT_IMG_${img.id}`);
                });
            }

            const finalPrompt = buildOmnilingualPrompt(prompt, cleanExisting, projectObj);

            try {
                let rawResponse = null;

                // 1. Try User API Key if set
                if (!isAbortedByUser && apiKey && provider === 'gemini') {
                    rawResponse = await callGeminiAllModels(apiKey, finalPrompt, attachedImages);
                } else if (!isAbortedByUser && apiKey && provider === 'openai') {
                    try {
                        const res = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                            body: JSON.stringify({
                                model: 'gpt-4o-mini',
                                messages: [
                                    { role: 'system', content: getSystemPromptForQuality() },
                                    { role: 'user', content: finalPrompt }
                                ]
                            })
                        });
                        const data = await res.json();
                        if (data?.choices?.[0]?.message?.content) rawResponse = data.choices[0].message.content;
                    } catch (e) {}
                }

                // Check if user pressed STOP
                if (isAbortedByUser) return;

                // 2. Try Free Cloud AI Nodes
                if (!rawResponse && !isAbortedByUser) {
                    rawResponse = await callFreePublicNodes(finalPrompt);
                }

                if (isAbortedByUser) return;

                // 3. Built-in Fallback if offline
                if (!rawResponse || !rawResponse.includes('<')) {
                    document.getElementById('loadingSubText').innerText = "⚡ Synthesizing with Built-in Neural Engine...";
                    await sleep(400);
                    if (isAbortedByUser) return;
                    rawResponse = buildLocalNeuralWebsite(prompt, projectObj);
                }

                let cleanCode = rawResponse.replace(/```html/gi, '').replace(/```/g, '').trim();
                const docIdx = cleanCode.indexOf('<!DOCTYPE');
                if (docIdx > 0) cleanCode = cleanCode.substring(docIdx);

                if (projectObj.products && projectObj.products.length > 0) {
                    projectObj.products.forEach((p, index) => {
                        cleanCode = cleanCode.split(`RAW_IMG_TARGET_${index}`).join(p.b64);
                    });
                }

                if (projectObj.chatImages && projectObj.chatImages.length > 0) {
                    projectObj.chatImages.forEach(img => {
                        cleanCode = cleanCode.split(`CHAT_IMG_${img.id}`).join(img.b64);
                    });
                }

                // Save snapshot for Keep Editing Undo/Redo
                pushVersionSnapshot(projectObj, cleanCode, prompt);
                projectObj.code = cleanCode;

                document.getElementById('loadingSubText').innerText = "🔗 Updating live shareable website link...";
                projectObj.liveUrl = await createInstantLiveLink(cleanCode);

                saveToStorage();
                loadProject(projectObj.id);
                syncKeepEditingUI(projectObj);
                notifyProjectReady();

            } catch (err) {
                if (!isAbortedByUser && err.name !== 'AbortError') {
                    console.warn('Generation interrupted:', err);
                }
            } finally {
                activeAbortController = null;
                document.getElementById('loadingOverlay').classList.add('hidden');
            }
        };
    }

    /* =========================================================
       6. INITIALIZE ENGINE ON PAGE LOAD
    ========================================================= */
    function initZenoEngine() {
        injectModularUI();
        hookCoreFunctions();
        if (typeof currentProjectId !== 'undefined' && currentProjectId) {
            const proj = projects.find(p => p.id === currentProjectId);
            syncKeepEditingUI(proj);
        }
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initZenoEngine);
    } else {
        initZenoEngine();
    }
})();
