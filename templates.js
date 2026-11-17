/**
 * KEEP-EDITING.JS - Continuous In-Tab AI Website Editor & Version History Manager
 * Ensures that once a website is created in the current tab, every follow-up prompt
 * accurately modifies, styles, or adds features to the existing website using the user's API key
 * while preserving all custom TemplatesStudio buttons and commands.
 */
(function () {
    const KeepEditingEngine = {
        editHistoryStack: [], // Stores previous HTML versions for instant Undo

        init() {
            window.KeepEditingEngine = this;
            window.addEventListener('DOMContentLoaded', () => {
                this.injectUndoButtonIntoBanner();
                this.hookHtmlStateChanges();
            });
            console.log("🛠️ KeepEditingEngine Loaded (Continuous In-Tab Editing Active).");
        },

        // Adds an "Undo Edit" button inside the Keep Editing bar in English
        injectUndoButtonIntoBanner() {
            const banner = document.getElementById('keepEditingBanner');
            if (!banner || document.getElementById('undoLastEditBtn')) return;

            const btnContainer = document.createElement('div');
            btnContainer.className = "flex items-center gap-1.5 shrink-0";

            const undoBtn = document.createElement('button');
            undoBtn.id = 'undoLastEditBtn';
            undoBtn.onclick = () => this.undoLastEdit();
            undoBtn.className = "hidden px-2.5 py-0.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-[11px] text-blue-300 font-bold transition";
            undoBtn.innerHTML = `<i class="fa-solid fa-rotate-left mr-1"></i>Undo`;

            const newSiteBtn = banner.querySelector('button');
            if (newSiteBtn) {
                newSiteBtn.parentNode.insertBefore(btnContainer, newSiteBtn);
                btnContainer.appendChild(undoBtn);
                btnContainer.appendChild(newSiteBtn);
            }
        },

        hookHtmlStateChanges() {
            const origSave = window.saveOrUpdateProjectInHistory;
            if (typeof origSave === 'function') {
                window.saveOrUpdateProjectInHistory = (name, html, isUpdate) => {
                    if (isUpdate && window.state?.currentSiteHtml) {
                        this.pushVersionSnapshot(window.state.currentSiteHtml);
                    }
                    return origSave(name, html, isUpdate);
                };
            }
        },

        pushVersionSnapshot(html) {
            if (!html || html.length < 40) return;
            const last = this.editHistoryStack[this.editHistoryStack.length - 1];
            if (last !== html) {
                this.editHistoryStack.push(html);
                if (this.editHistoryStack.length > 10) {
                    this.editHistoryStack.shift();
                }
                const undoBtn = document.getElementById('undoLastEditBtn');
                if (undoBtn && this.editHistoryStack.length > 1) {
                    undoBtn.classList.remove('hidden');
                }
            }
        },

        undoLastEdit() {
            if (this.editHistoryStack.length <= 1) {
                return alert("No previous edit version to undo.");
            }
            this.editHistoryStack.pop(); // Remove current state
            const previousHtml = this.editHistoryStack[this.editHistoryStack.length - 1];

            if (previousHtml && window.state) {
                window.state.currentSiteHtml = previousHtml;
                localStorage.setItem('zw_current_site_html', previousHtml);
                if (typeof window.updatePublicLinkUI === 'function') {
                    window.updatePublicLinkUI(window.state.currentSiteName || 'website', previousHtml);
                }
                const previewModal = document.getElementById('previewModal');
                if (previewModal && !previewModal.classList.contains('hidden')) {
                    document.getElementById('livePreviewIframe').srcdoc = previousHtml;
                }
                if (typeof window.appendMessage === 'function') {
                    window.appendMessage('ai', `↩️ **Reverted to previous version of "${window.state.currentSiteName}".**`, null, true);
                }
            }

            if (this.editHistoryStack.length <= 1) {
                document.getElementById('undoLastEditBtn')?.classList.add('hidden');
            }
        },

        // Determines whether the user is continuing to edit the active website in the current tab
        isEditingCurrentTabSite(userPrompt) {
            if (!window.state?.currentSiteHtml || window.state.currentSiteHtml.trim().length < 50) {
                return false;
            }
            const p = (userPrompt || '').trim().toLowerCase();
            // Only start a brand new website if explicitly instructed to start fresh
            const explicitResetCommands = /\b(start fresh|reset website|build a brand new website|create a completely new website|clear current website)\b/i;
            if (explicitResetCommands.test(p)) {
                return false;
            }

            // Save current snapshot before applying the new edit
            this.pushVersionSnapshot(window.state.currentSiteHtml);
            return true;
        },

        // Builds a strict, comprehensive prompt for the AI model so it executes the exact edit requested
        buildKeepEditingPrompt(currentHtml, userInstruction) {
            return `ACTIVE MODE: CONTINUOUS IN-TAB WEBSITE EDITOR ("KEEP EDITING").
You are modifying the user's existing live website named "${window.state?.currentSiteName || 'custom-website'}".

CURRENT WORKING HTML CODE:
\`\`\`html
${currentHtml.slice(0, 22000)}
\`\`\`

USER'S NEW REQUEST / FEATURE TO IMPLEMENT:
"${userInstruction}"

MANDATORY EXECUTION RULES:
1. Execute the user's exact request immediately and accurately—never refuse or output generic placeholders.
2. Preserve all existing functional elements, custom positioned buttons, onclick commands, images, and scripts from the current HTML unless the user explicitly asks to remove or replace them.
3. If the user asks to change colors, themes, backgrounds, fonts, or animations (e.g., falling stars, neon glow, dark/light mode), apply those visual changes directly into the HTML/CSS/JS.
4. If the user asks to add a new feature, section, product, game mechanic, form, or button, integrate it seamlessly into the existing page with 100% working JavaScript.
5. Output a 1-sentence confirmation followed by the COMPLETE, updated HTML5 document inside a \`\`\`html ... \`\`\` code block.`;
        },

        // Ensures instant visual & functional enhancements are guaranteed even if the AI model misses a canvas or color tag
        applyDirectVisualPatch(htmlCode, promptText) {
            if (!htmlCode) return htmlCode;
            let html = htmlCode;
            const p = (promptText || '').toLowerCase();

            // 1. Falling Stars Animation Canvas
            if (/(falling stars|stars falling|starfield|animated stars)/i.test(p) && !html.includes('zwStarCanvas')) {
                const starScript = `
                <canvas id="zwStarCanvas" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;"></canvas>
                <script>
                    (function(){
                        const c = document.getElementById('zwStarCanvas');
                        if(!c) return;
                        const ctx = c.getContext('2d');
                        const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
                        window.addEventListener('resize', resize);
                        resize();
                        const stars = Array.from({length: 150}, () => ({
                            x: Math.random() * c.width,
                            y: Math.random() * c.height,
                            r: Math.random() * 2 + 0.6,
                            s: Math.random() * 2.5 + 0.8
                        }));
                        function animate(){
                            ctx.clearRect(0, 0, c.width, c.height);
                            ctx.fillStyle = '#ffffff';
                            for(const st of stars){
                                ctx.beginPath();
                                ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
                                ctx.fill();
                                st.y += st.s;
                                if(st.y > c.height) { st.y = -5; st.x = Math.random() * c.width; }
                            }
                            requestAnimationFrame(animate);
                        }
                        animate();
                    })();
                <\/script>`;
                html = html.replace(/<\/body>/i, `${starScript}\n</body>`);
            }

            // 2. Pitch Black Background Enforcement if explicitly requested
            if (/(background to black|background black|back ground to blacl|pitch black background)/i.test(p)) {
                html = html.replace(/<body([^>]*)>/i, '<body$1 style="background-color:#000000 !important; color:#ffffff;">');
            }

            return html;
        }
    };

    KeepEditingEngine.init();
})();
