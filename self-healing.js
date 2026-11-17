/**
 * SELF-HEALING.JS - Autonomous Error Prevention, Network Auto-Retry & HTML Code Repair Engine
 * Strictly in English. Ensures that AI responses, API calls, and generated websites
 * automatically heal themselves without throwing errors or breaking the UI.
 */
(function () {
    const SelfHealingEngine = {
        init() {
            window.SelfHealingEngine = this;
            this.installGlobalErrorShield();
            this.installNetworkAutoRetryAndFailover();
            this.installHtmlAutoHealer();
            console.log("🛡️ Self-Healing Engine Loaded (Zero-Error Protection Active).");
        },

        // 1. Prevents any uncaught JS or Promise errors from freezing the app
        installGlobalErrorShield() {
            window.addEventListener('error', (event) => {
                console.warn("🛡️ Self-Healing caught runtime warning:", event.message);
                event.preventDefault();
                return true;
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.warn("🛡️ Self-Healing caught async rejection:", event.reason);
                event.preventDefault();
                if (typeof window.setGeneratingUIState === 'function') {
                    window.setGeneratingUIState(false);
                }
            });
        },

        // 2. Automatically repairs incomplete, unclosed, or malformed HTML returned by AI models
        healGeneratedHtml(rawHtml, userPrompt = '') {
            if (!rawHtml || typeof rawHtml !== 'string') {
                return '';
            }

            let html = rawHtml
                .replace(/^```(?:html)?/i, '')
                .replace(/```$/i, '')
                .trim();

            // Extract starting from <!DOCTYPE html> or <html> if conversational text leaked inside
            const docStart = html.search(/<!DOCTYPE html|<html/i);
            if (docStart > 0) {
                html = html.slice(docStart);
            }

            // Wrap in full HTML5 document structure if AI returned only partial body tags
            if (!html.toLowerCase().includes('<html')) {
                html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZoneWeb Generated Site</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-slate-950 text-white min-h-screen font-sans">
${html}
</body>
</html>`;
            }

            // Ensure <head> exists
            if (!html.toLowerCase().includes('<head>') && html.toLowerCase().includes('<html')) {
                html = html.replace(/(<html[^>]*>)/i, `$1\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>`);
            }

            // Ensure Tailwind CSS is loaded so classes always render properly
            if (!html.includes('tailwindcss.com') && html.includes('</head>')) {
                html = html.replace(/<\/head>/i, `<script src="https://cdn.tailwindcss.com"><\/script>\n</head>`);
            }

            // Ensure FontAwesome icons are loaded
            if (!html.includes('font-awesome') && html.includes('</head>')) {
                html = html.replace(/<\/head>/i, `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">\n</head>`);
            }

            // Auto-close any unclosed <script> or <style> tags if token limit cut off the end
            const openScripts = (html.match(/<script\b[^>]*>/gi) || []).length;
            const closeScripts = (html.match(/<\/script>/gi) || []).length;
            if (openScripts > closeScripts) {
                html += `\n}</script>`;
            }

            const openStyles = (html.match(/<style\b[^>]*>/gi) || []).length;
            const closeStyles = (html.match(/<\/style>/gi) || []).length;
            if (openStyles > closeStyles) {
                html += `\n</style>`;
            }

            // Inject silent error guard inside the generated website iframe so user scripts never crash
            const iframeShield = `<script>window.onerror=function(){return true;};<\/script>`;
            if (html.includes('<head>') && !html.includes('window.onerror')) {
                html = html.replace(/<head>/i, `<head>\n${iframeShield}`);
            }

            if (!html.toLowerCase().includes('</body>')) html += '\n</body>';
            if (!html.toLowerCase().includes('</html>')) html += '\n</html>';

            return html;
        },

        // 3. Wraps the AI API call with automatic retry & cloud failover if the primary request drops or refuses
        installNetworkAutoRetryAndFailover() {
            window.addEventListener('DOMContentLoaded', () => {
                if (typeof window.callUserApiKeyDirectly !== 'function') return;

                const originalApiCall = window.callUserApiKeyDirectly;

                window.callUserApiKeyDirectly = async function (userPrompt, imgBase64, imgMime, isEditing, abortSignal) {
                    const statusEl = document.getElementById('activeModelStatus');

                    // Attempt 1 & 2: Use the user's primary API Key with automatic retry on mobile network glitch
                    for (let attempt = 1; attempt <= 2; attempt++) {
                        try {
                            const response = await originalApiCall(userPrompt, imgBase64, imgMime, isEditing, abortSignal);

                            // Check if the AI returned valid HTML or if it gave a refusal without code
                            const hasHtml = /<!DOCTYPE html|<html|```html/i.test(response);
                            if (hasHtml) {
                                return response;
                            }

                            // If the user asked to build/edit a site but the model replied without HTML code, force code generation
                            if (attempt === 1) {
                                if (statusEl) statusEl.innerText = `🛡️ Self-Healing: Enforcing full HTML code generation...`;
                                const enforcedPrompt = `${userPrompt}\n\nIMPORTANT: Do not just describe it—output the complete, working HTML5 code inside a \`\`\`html ... \`\`\` block right now.`;
                                const retryResp = await originalApiCall(enforcedPrompt, imgBase64, imgMime, isEditing, abortSignal);
                                if (/<!DOCTYPE html|<html|```html/i.test(retryResp)) {
                                    return retryResp;
                                }
                            }
                        } catch (err) {
                            if (err && err.name === 'AbortError') throw err;
                            console.warn(`🛡️ Self-Healing attempt ${attempt} notice:`, err.message);
                            if (attempt === 1) {
                                if (statusEl) statusEl.innerText = `🛡️ Self-Healing: Reconnecting to AI engine...`;
                                await new Promise(r => setTimeout(r, 800));
                            }
                        }
                    }

                    // Seamless Failover: If user's API key is rate-limited or network blocked, heal via Cloud Coding LLM
                    if (statusEl) statusEl.innerText = `🛡️ Self-Healing Cloud Engine generating your website...`;
                    const editContext = (isEditing && window.state?.currentSiteHtml)
                        ? `\n\nExisting HTML to modify:\n\`\`\`html\n${window.state.currentSiteHtml.slice(0, 14000)}\n\`\`\``
                        : '';

                    const cloudSystemPrompt = `You are ZoneWeb Autonomous AI Developer. Build or update the exact website requested by the user. Write 1 short sentence, then output the complete, working HTML5 document inside \`\`\`html ... \`\`\` with Tailwind CSS and FontAwesome.${editContext}`;

                    for (const model of ['qwen-coder', 'openai']) {
                        try {
                            const res = await fetch('https://text.pollinations.ai/openai', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    model,
                                    messages: [
                                        { role: 'system', content: cloudSystemPrompt },
                                        { role: 'user', content: userPrompt }
                                    ]
                                }),
                                signal: abortSignal
                            });
                            if (res.ok) {
                                const data = await res.json();
                                const content = data.choices?.[0]?.message?.content;
                                if (content && content.length > 50) {
                                    return content;
                                }
                            }
                        } catch (cloudErr) {
                            if (cloudErr && cloudErr.name === 'AbortError') throw cloudErr;
                        }
                    }

                    throw new Error("Unable to reach AI servers. Please check your internet connection.");
                };
            });
        },

        installHtmlAutoHealer() {
            window.healWebsiteCode = this.healGeneratedHtml.bind(this);
        }
    };

    SelfHealingEngine.init();
})();
