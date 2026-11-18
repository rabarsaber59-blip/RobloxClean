/**
 * ZENO-ULTIMATE.JS - All-In-One Final Production Upgrade for ZoneWeb
 * 1. File Attachment to AI (Real downloadable files embedded into generated websites)
 * 2. Security Shield (Blocks sex/adult, hacking/exploits, and virus/malware requests)
 * 3. Pure Finger-Touch Dragging in Templates (Removes arrow buttons) + Multi-line Info Text Box
 * 4. Multilingual AI Understanding + Top "Translate" Button (Live Website & Text Translator)
 * 5. True Proportional Viewport Scaling for Mobile / Tablet / PC Preview Buttons
 */
(function () {
    const ZenoUltimate = {
        attachedFile: null, // { name, size, type, dataUrl }
        activeViewportMode: 'mobile', // 'pc' | 'tablet' | 'mobile'

        // Security Blocklist (Sex/NSFW, Hacking/Phishing, Virus/Malware across languages)
        forbiddenPattern: /\b(sex|porn|porno|xxx|nsfw|nude|nudity|hentai|erotic|onlyfans|adult\s*site|hack|hacking|hacker|phishing|keylogger|ddos|exploit|sql\s*injection|cracking|stealer|virus|malware|trojan|ransomware|spyware|worm|botnet|سێکس|پۆڕن|هاک|هاککردن|ڤایرۆس)\b/i,

        init() {
            window.ZenoUltimate = this;
            const boot = () => {
                this.injectFileUploadButtonInChat();
                this.injectTopTranslateButton();
                this.upgradeTemplatesToPureTouchAndTextBox();
                this.fixPreviewViewportButtonsAndScaling();
                this.hookSendUserMessageWithSecurityAndFiles();
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', boot);
            } else {
                boot();
            }
            console.log("🚀 ZenoUltimate All-In-One Engine Active.");
        },

        // =========================================================================
        // 1. FILE UPLOAD TO AI (FOR DOWNLOAD WEBSITES)
        // =========================================================================
        injectFileUploadButtonInChat() {
            const imgInput = document.getElementById('imageInput');
            const chatCard = document.querySelector('#bottomChatBarContainer .card-bg');
            if (!imgInput || !chatCard || document.getElementById('zenoFileInput')) return;

            const imgLabel = imgInput.parentElement;

            // Create File Preview Bar above chat input
            const filePreviewBar = document.createElement('div');
            filePreviewBar.id = 'zenoFilePreviewContainer';
            filePreviewBar.className = "hidden px-3 pt-2 pb-2 flex items-center justify-between gap-2 border-b border-emerald-500/30 bg-emerald-500/10 rounded-xl mb-2";
            filePreviewBar.innerHTML = `
                <div class="flex items-center gap-2.5 overflow-hidden">
                    <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                        <i class="fa-solid fa-file-arrow-down"></i>
                    </div>
                    <div class="text-xs overflow-hidden">
                        <p class="font-extrabold text-emerald-400 truncate" id="zenoAttachedFileName">file.zip</p>
                        <p class="text-[10px] text-gray-300" id="zenoAttachedFileSize">Ready for AI Download Button placement</p>
                    </div>
                </div>
                <button onclick="window.ZenoUltimate.clearAttachedFile()" class="w-7 h-7 rounded-lg bg-black/40 text-gray-300 hover:text-red-400 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;

            const imgPreview = document.getElementById('imagePreviewContainer');
            if (imgPreview && imgPreview.parentElement) {
                imgPreview.parentElement.insertBefore(filePreviewBar, imgPreview);
            }

            // Create File Upload Button next to Image Upload Button
            const fileLabel = document.createElement('label');
            fileLabel.className = "w-11 h-11 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 flex items-center justify-center cursor-pointer shrink-0 transition";
            fileLabel.title = "Send File to AI (For Download Buttons & File Hosting)";
            fileLabel.innerHTML = `
                <i class="fa-solid fa-paperclip text-lg"></i>
                <input id="zenoFileInput" type="file" class="hidden" onchange="window.ZenoUltimate.handleFileUpload(event)">
            `;

            imgLabel.parentNode.insertBefore(fileLabel, imgLabel.nextSibling);
        },

        handleFileUpload(event) {
            const file = event.target.files?.[0];
            if (!file) return;

            const sizeKB = (file.size / 1024).toFixed(1);
            const sizeLabel = file.size > 1048576 ? `${(file.size / 1048576).toFixed(2)} MB` : `${sizeKB} KB`;

            const reader = new FileReader();
            reader.onload = (e) => {
                this.attachedFile = {
                    name: file.name,
                    size: sizeLabel,
                    type: file.type || 'application/octet-stream',
                    dataUrl: e.target.result
                };
                document.getElementById('zenoAttachedFileName').innerText = `📦 ${file.name} (${sizeLabel})`;
                document.getElementById('zenoAttachedFileSize').innerText = `Tell the AI where to place the download button for this file!`;
                document.getElementById('zenoFilePreviewContainer')?.classList.remove('hidden');

                const chatInput = document.getElementById('chatInput');
                if (chatInput && !chatInput.value.trim()) {
                    chatInput.placeholder = `Tell AI where to place "${file.name}" (e.g. Build a download website and put this file in the main download button)...`;
                }
            };
            reader.readAsDataURL(file);
        },

        clearAttachedFile() {
            this.attachedFile = null;
            const inp = document.getElementById('zenoFileInput');
            if (inp) inp.value = '';
            document.getElementById('zenoFilePreviewContainer')?.classList.add('hidden');
        },

        // =========================================================================
        // 2. SECURITY SHIELD + MULTILINGUAL AI + FILE PLACEMENT HOOK
        // =========================================================================
        hookSendUserMessageWithSecurityAndFiles() {
            const origSend = window.sendUserMessage;
            const origApiCall = window.callUserApiKeyDirectly;

            // Hook sendUserMessage for Security Check & File Attachment Display
            window.sendUserMessage = async () => {
                const input = document.getElementById('chatInput');
                const text = (input?.value || '').trim();

                if (!text && !this.attachedFile) {
                    if (typeof origSend === 'function') return origSend();
                    return;
                }

                // A. SECURITY FILTER CHECK (Sex, Hack, Virus)
                if (this.forbiddenPattern.test(text)) {
                    input.value = '';
                    this.clearAttachedFile();
                    if (typeof window.appendMessage === 'function') {
                        window.appendMessage('user', text);
                        window.appendMessage(
                            'ai',
                            `🛡️ **Security Alert — Action Not Allowed:**\nCreating websites or content related to **adult/explicit material (sex)**, **hacking/phishing**, or **viruses/malware** is strictly prohibited by ZoneWeb Security Policy.\n\n⚠️ دروستکردنی وێبسایت دەربارەی بابەتی نەشیاو، هاککردن، یان ڤایرۆس بە هەموو شێوەیەک قەدەغەیە و ڕێگەپێدراو نییە.`
                        );
                    }
                    return;
                }

                // B. IF A FILE IS ATTACHED FOR DOWNLOAD PLACEMENT
                if (this.attachedFile) {
                    const currentFile = { ...this.attachedFile };
                    window.__pendingDownloadFile = currentFile;
                    this.clearAttachedFile();

                    const userPromptText = text || `Build a download section for my file "${currentFile.name}" (${currentFile.size}).`;
                    input.value = `${userPromptText}\n[Attached File: ${currentFile.name} (${currentFile.size})]`;
                }

                if (typeof origSend === 'function') {
                    await origSend();
                }
            };

            // Hook callUserApiKeyDirectly to inject Multilingual Understanding & Real File Download Wiring
            if (typeof origApiCall === 'function') {
                window.callUserApiKeyDirectly = async (userPrompt, imgBase64, imgMime, isEditing, abortSignal) => {
                    const pendingFile = window.__pendingDownloadFile;

                    let enhancedPrompt = `${userPrompt}\n\n[MULTILINGUAL & EXECUTION RULE]: Understand the user's request regardless of language (Kurdish, English, Arabic, Turkish, Persian, etc.) and build the exact functional HTML5 website requested.`;

                    if (pendingFile) {
                        enhancedPrompt += `\n\n[ATTACHED DOWNLOADABLE FILE INSTRUCTIONS]:
The user has uploaded a real file to be downloaded from this website:
- File Name: "${pendingFile.name}"
- File Size: "${pendingFile.size}"
- File Type: "${pendingFile.type}"
CRITICAL FILE PLACEMENT RULE:
Place a prominent, stylish download card and download button in the exact section or position requested by the user.
For the download button/link, you MUST use this exact anchor attribute:
\`<a href="__ZENO_ATTACHED_FILE_DATA__" download="${pendingFile.name}" class="...">Download ${pendingFile.name} (${pendingFile.size})</a>\`
so the user's real file downloads immediately when clicked!`;
                    }

                    let aiResult = await origApiCall(enhancedPrompt, imgBase64, imgMime, isEditing, abortSignal);

                    // Replace placeholder token with the actual DataURL of the uploaded file
                    if (pendingFile && aiResult) {
                        if (aiResult.includes('__ZENO_ATTACHED_FILE_DATA__')) {
                            aiResult = aiResult.replace(/__ZENO_ATTACHED_FILE_DATA__/g, pendingFile.dataUrl);
                        } else if (aiResult.includes('</body>')) {
                            // If AI forgot the token, inject a sleek floating download card at the top of the page automatically
                            const autoDownloadCard = `
                            <div class="max-w-md mx-auto my-6 p-5 rounded-3xl bg-zinc-900/95 border-2 border-emerald-500/50 text-white text-center shadow-2xl relative z-30">
                                <div class="w-12 h-12 rounded-2xl bg-emerald-600 mx-auto mb-3 flex items-center justify-center text-xl">
                                    <i class="fa-solid fa-file-arrow-down"></i>
                                </div>
                                <h3 class="font-extrabold text-base">${pendingFile.name}</h3>
                                <p class="text-xs text-zinc-400 mt-1 mb-4">Verified Direct Download • Size: ${pendingFile.size}</p>
                                <a href="${pendingFile.dataUrl}" download="${pendingFile.name}" class="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition">
                                    <i class="fa-solid fa-download"></i> Download ${pendingFile.name}
                                </a>
                            </div>`;
                            aiResult = aiResult.replace(/(<body[^>]*>)/i, `$1\n${autoDownloadCard}`);
                        }
                        window.__pendingDownloadFile = null;
                    }

                    return aiResult;
                };
            }
        },

        // =========================================================================
        // 3. TOP TRANSLATE BUTTON & LIVE MULTILINGUAL TRANSLATOR
        // =========================================================================
        injectTopTranslateButton() {
            const topPreviewBtn = document.getElementById('topPreviewBtn');
            if (!topPreviewBtn || !topPreviewBtn.parentElement || document.getElementById('topTranslateBtn')) return;

            const btn = document.createElement('button');
            btn.id = 'topTranslateBtn';
            btn.className = "px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold flex items-center gap-1.5 hover:bg-emerald-600/30 transition shrink-0 shadow";
            btn.innerHTML = `<i class="fa-solid fa-language text-sm"></i> <span>Translate</span>`;
            btn.onclick = () => this.openTranslateModal();

            topPreviewBtn.parentElement.insertBefore(btn, topPreviewBtn);
            this.buildTranslateModal();
        },

        buildTranslateModal() {
            if (document.getElementById('zenoTranslateModal')) return;
            const modal = document.createElement('div');
            modal.id = 'zenoTranslateModal';
            modal.className = "hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4";
            modal.innerHTML = `
                <div class="card-bg w-full max-w-md rounded-3xl p-6 border border-white/15 shadow-2xl text-white space-y-4">
                    <div class="flex items-center justify-between border-b border-white/10 pb-3">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-language text-emerald-400 text-xl"></i>
                            <h3 class="font-extrabold text-base">Live AI Translator</h3>
                        </div>
                        <button onclick="document.getElementById('zenoTranslateModal').classList.add('hidden')" class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div>
                        <label class="text-xs font-bold text-gray-300 block mb-1.5">Select Target Language:</label>
                        <select id="zenoTargetLang" class="w-full bg-zinc-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none">
                            <option value="Kurdish (Sorani - کوردی)">☀️ Kurdish (کوردی سۆرانی)</option>
                            <option value="English">🇬🇧 English</option>
                            <option value="Arabic (العربية)">🇸🇦 Arabic (العربية)</option>
                            <option value="Turkish (Türkçe)">🇹🇷 Turkish (Türkçe)</option>
                            <option value="Persian (فارسی)">🇮🇷 Persian (فارسی)</option>
                            <option value="Spanish (Español)">🇪🇸 Spanish (Español)</option>
                            <option value="French (Français)">🇫🇷 French (Français)</option>
                            <option value="German (Deutsch)">🇩🇪 German (Deutsch)</option>
                            <option value="Chinese (中文)">🇨🇳 Chinese (中文)</option>
                        </select>
                    </div>

                    <!-- Option 1: Translate the entire generated website -->
                    <button onclick="window.ZenoUltimate.translateCurrentWebsite()" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition">
                        <i class="fa-solid fa-globe"></i>
                        <span>Translate Current Generated Website</span>
                    </button>

                    <hr class="border-white/10">

                    <!-- Option 2: Instant Text Box Translator -->
                    <div class="space-y-2">
                        <label class="text-xs font-bold text-gray-300 block">Or Translate Any Text / Paragraph Instantly:</label>
                        <textarea id="zenoTranslateInput" rows="3" placeholder="Type or paste text in any language here..." class="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none"></textarea>
                        <button onclick="window.ZenoUltimate.translateCustomText()" id="zenoTranslateTextBtn" class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">
                            Translate Text Now
                        </button>
                        <div id="zenoTranslateOutput" class="hidden p-3 rounded-xl bg-black/60 border border-emerald-500/30 text-xs text-emerald-300 whitespace-pre-wrap"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        },

        openTranslateModal() {
            document.getElementById('zenoTranslateModal')?.classList.remove('hidden');
        },

        translateCurrentWebsite() {
            const lang = document.getElementById('zenoTargetLang')?.value || 'English';
            document.getElementById('zenoTranslateModal')?.classList.add('hidden');

            if (!window.state?.currentSiteHtml) {
                return alert("Please build a website first so I can translate it!");
            }

            const input = document.getElementById('chatInput');
            if (input) {
                input.value = `Translate all visible text, headings, buttons, and labels inside my current website into ${lang} while keeping all design, layout, and code functionality intact.`;
                window.sendUserMessage();
            }
        },

        async translateCustomText() {
            const text = document.getElementById('zenoTranslateInput')?.value.trim();
            const lang = document.getElementById('zenoTargetLang')?.value || 'English';
            const outBox = document.getElementById('zenoTranslateOutput');
            const btn = document.getElementById('zenoTranslateTextBtn');
            if (!text || !outBox) return;

            btn.innerText = "Translating...";
            outBox.classList.remove('hidden');
            outBox.innerText = "⏳ Translating...";

            try {
                const langCodeMap = {
                    'Kurdish': 'ckb',
                    'English': 'en',
                    'Arabic': 'ar',
                    'Turkish': 'tr',
                    'Persian': 'fa',
                    'Spanish': 'es',
                    'French': 'fr',
                    'German': 'de',
                    'Chinese': 'zh-CN'
                };
                const shortKey = Object.keys(langCodeMap).find(k => lang.includes(k)) || 'en';
                const targetCode = langCodeMap[shortKey];

                const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`);
                const data = await res.json();
                const translated = data[0].map(item => item[0]).join('');
                outBox.innerText = translated;
            } catch (e) {
                outBox.innerText = "Could not reach translation server.";
            }
            btn.innerText = "Translate Text Now";
        },

        // =========================================================================
        // 4. TEMPLATES STUDIO: PURE FINGER-TOUCH DRAGGING + MULTI-LINE INFO TEXT BOX
        // =========================================================================
        upgradeTemplatesToPureTouchAndTextBox() {
            if (!window.TemplatesStudio) return;
            const TS = window.TemplatesStudio;

            // Ensure Studio DOM is created
            if (!document.getElementById('templatesFullStudio') && typeof TS.buildStudioView === 'function') {
                TS.buildStudioView();
            }

            // A. Remove the arrow movement buttons box from the top bar so movement is strictly by Finger Touch
            const studio = document.getElementById('templatesFullStudio');
            if (studio) {
                const arrowBtns = studio.querySelectorAll('button[onclick*="nudgeSelected"], button[onclick*="centerSelected"]');
                arrowBtns.forEach(b => {
                    if (b.parentElement && b.parentElement.classList.contains('bg-black/50')) {
                        b.parentElement.remove();
                    }
                });
            }

            // B. Add Multi-line Info Text Box inside Step 2 of Templates Studio
            const step2 = document.getElementById('step2GalleryPanel');
            if (step2 && !document.getElementById('tplInfoParagraphBox')) {
                const infoDiv = document.createElement('div');
                infoDiv.className = "space-y-1.5 pt-2 border-t border-white/10";
                infoDiv.innerHTML = `
                    <label class="text-[11px] font-bold text-emerald-300 block">📝 Add Multi-Line Information Text Box:</label>
                    <textarea id="tplInfoParagraphBox" rows="2" placeholder="Write information, bio, rules, or description here..." class="w-full bg-zinc-900 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none"></textarea>
                    <button onclick="window.ZenoUltimate.addInfoTextBoxToCanvas()" class="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow">
                        + Add Info Text Box (Drag with Finger)
                    </button>
                `;
                step2.appendChild(infoDiv);
            }

            // C. Upgrade Touch Dragging to smooth, zero-jump, native finger-touch tracking
            TS.startDrag = function (event, id) {
                if (event.cancelable) event.preventDefault();
                event.stopPropagation();

                this.selectedItemId = id;
                const canvas = document.getElementById('studioLiveCanvas');
                const item = this.items.find(i => i.id === id);
                if (!canvas || !item) return;

                const touch = event.touches ? event.touches[0] : event;
                this.dragState = {
                    active: true,
                    itemId: id,
                    startX: touch.clientX,
                    startY: touch.clientY,
                    initialLeft: item.x,
                    initialTop: item.y
                };

                // Highlight selected item without destroying the DOM during active touch
                document.querySelectorAll('[id^="canvas_el_"]').forEach(el => {
                    el.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-500/10');
                });
                const activeEl = document.getElementById('canvas_el_' + id);
                if (activeEl) {
                    activeEl.classList.add('ring-2', 'ring-amber-400', 'bg-amber-500/10');
                }
                const indicator = document.getElementById('selectedIndicator');
                if (indicator) {
                    indicator.innerText = `Selected: ${item.label} (Drag with finger • Tap Delete to remove)`;
                }
            };

            // Enforce touch-action: none on canvas so finger dragging never scrolls the background page
            const origRender = TS.renderCanvas.bind(TS);
            TS.renderCanvas = function () {
                origRender();
                const canvas = document.getElementById('studioLiveCanvas');
                if (canvas) {
                    canvas.style.touchAction = 'none';
                    canvas.querySelectorAll('[id^="canvas_el_"]').forEach(el => {
                        el.style.touchAction = 'none';
                        el.style.userSelect = 'none';
                    });
                }
            };
        },

        addInfoTextBoxToCanvas() {
            const TS = window.TemplatesStudio;
            if (!TS || !TS.backgroundSelected) {
                return alert("Please select a Background in Step 1 first!");
            }
            const box = document.getElementById('tplInfoParagraphBox');
            const rawText = (box?.value || '').trim();
            if (!rawText) return alert("Please write some text inside the information box first!");

            const safeText = rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            const id = 'item_' + Date.now();
            const pos = TS.getNextDefaultPosition();
            const html = `
                <div class="max-w-xs md:max-w-md p-4 rounded-2xl backdrop-blur-xl bg-black/65 border border-white/20 text-white text-sm leading-relaxed shadow-2xl">
                    ${safeText}
                </div>
            `;
            TS.items.push({ id, type: 'infobox', html, label: 'Info Text Box', x: pos.x, y: pos.y });
            TS.selectedItemId = id;
            box.value = '';
            TS.renderCanvas();
        },

        // =========================================================================
        // 5. TRUE PROPORTIONAL PREVIEW SCALING (MOBILE / TABLET / PC BUTTONS)
        // =========================================================================
        fixPreviewViewportButtonsAndScaling() {
            // Override openPreviewModal so it always fits cleanly & applies active device viewport
            const origOpenPreview = window.openPreviewModal;
            window.openPreviewModal = () => {
                if (typeof origOpenPreview === 'function') origOpenPreview();
                setTimeout(() => {
                    this.rebuildViewportButtons();
                    this.applyTrueViewportScale(this.activeViewportMode);
                }, 60);
            };

            window.addEventListener('resize', () => {
                const modal = document.getElementById('previewModal');
                if (modal && !modal.classList.contains('hidden')) {
                    this.applyTrueViewportScale(this.activeViewportMode);
                }
            });

            if (window.DesignPro) {
                window.DesignPro.setViewport = (modeOrWidth) => {
                    if (modeOrWidth === '100%' || modeOrWidth === 'pc') this.applyTrueViewportScale('pc');
                    else if (modeOrWidth === '768px' || modeOrWidth === 'tablet') this.applyTrueViewportScale('tablet');
                    else this.applyTrueViewportScale('mobile');
                };
            }
        },

        rebuildViewportButtons() {
            const bar = document.getElementById('proViewportBar');
            if (!bar) return;

            bar.innerHTML = `
                <button id="vpBtn_pc" onclick="window.ZenoUltimate.applyTrueViewportScale('pc')" class="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition" title="PC / Desktop View (1280px Fitted)">
                    <i class="fa-solid fa-desktop"></i> <span class="hidden sm:inline">PC</span>
                </button>
                <button id="vpBtn_tablet" onclick="window.ZenoUltimate.applyTrueViewportScale('tablet')" class="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition" title="Tablet View (768px Fitted)">
                    <i class="fa-solid fa-tablet-screen-button"></i> <span class="hidden sm:inline">Tablet</span>
                </button>
                <button id="vpBtn_mobile" onclick="window.ZenoUltimate.applyTrueViewportScale('mobile')" class="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition" title="Mobile View (Responsive Fit)">
                    <i class="fa-solid fa-mobile-screen"></i> <span class="hidden sm:inline">Mobile</span>
                </button>
                <button onclick="window.DesignPro && window.DesignPro.openCodeEditor()" class="px-2.5 py-1.5 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-bold flex items-center gap-1">
                    <i class="fa-solid fa-code"></i>
                </button>
            `;
        },

        applyTrueViewportScale(mode) {
            this.activeViewportMode = mode;
            const iframe = document.getElementById('livePreviewIframe');
            if (!iframe || !iframe.parentElement) return;

            const wrapper = iframe.parentElement;
            wrapper.style.position = 'relative';
            wrapper.style.overflow = 'hidden';
            wrapper.style.display = 'flex';
            wrapper.style.justifyContent = 'center';
            wrapper.style.alignItems = 'flex-start';
            wrapper.style.background = '#090a0f';

            // Update active button highlight
            ['pc', 'tablet', 'mobile'].forEach(m => {
                const btn = document.getElementById('vpBtn_' + m);
                if (btn) {
                    btn.className = (m === mode)
                        ? "px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-extrabold flex items-center gap-1 shadow"
                        : "px-2.5 py-1.5 rounded-lg text-gray-400 hover:bg-white/10 text-xs font-bold flex items-center gap-1";
                }
            });

            const availW = wrapper.clientWidth || window.innerWidth - 16;
            const availH = wrapper.clientHeight || window.innerHeight - 100;

            let targetWidth = availW;
            if (mode === 'pc') targetWidth = 1280;
            else if (mode === 'tablet') targetWidth = 768;
            else targetWidth = Math.min(availW, 430); // Mobile natural width

            if (mode === 'mobile' && availW <= 480) {
                // Native full mobile fit without horizontal overflow
                iframe.style.width = '100%';
                iframe.style.maxWidth = '100%';
                iframe.style.height = '100%';
                iframe.style.transform = 'none';
                iframe.style.borderRadius = '0px';
                iframe.style.border = 'none';
            } else {
                // Proportional scaling so 1280px PC or 768px Tablet fits 100% cleanly inside the phone screen!
                const scale = Math.min(1, (availW - 12) / targetWidth);
                const scaledHeight = availH / scale;

                iframe.style.width = `${targetWidth}px`;
                iframe.style.maxWidth = 'none';
                iframe.style.height = `${scaledHeight}px`;
                iframe.style.transformOrigin = 'top center';
                iframe.style.transform = `scale(${scale})`;
                iframe.style.borderRadius = '16px';
                iframe.style.border = '2px solid rgba(255,255,255,0.15)';
                iframe.style.boxShadow = '0 20px 50px rgba(0,0,0,0.8)';
            }
        }
    };

    ZenoUltimate.init();
})();
