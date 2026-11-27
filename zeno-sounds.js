/**
 * ZENO-SOUNDS.JS - True Neural Human TTS Voice Engine (Male, Female, Child) & Foley Studio
 * 1. Eliminates robotic buzzer oscillators — uses real Neural Human Speech Audio:
 *    - Google Gemini Native Human Audio (Charon/Fenrir for Male, Aoede/Kore for Female, Leda for Child)
 *    - OpenAI Neural TTS (onyx, nova, shimmer) if OpenAI key is active
 *    - Multi-mirror Neural TTS (Brian, Amy, Ivy & Google Neural TTS)
 * 2. Decodes both compressed audio (MP3/WAV) and raw 24kHz 16-bit PCM directly into AudioBuffers
 *    and mixes them into the recorded 3D video MediaStream.
 * 3. Real-time AnalyserNode mouth-aperture metering drives exact 3D jaw & lip movement.
 */
(function () {
    const ZenoSounds = {
        soundLibrary: [
            { id: 'male_voice', label: 'Male Human Voice' },
            { id: 'female_voice', label: 'Female Human Voice' },
            { id: 'child_voice', label: 'Child Human Voice' },
            { id: 'child_cry', label: 'Child Crying' },
            { id: 'laugh', label: 'Human Laugh' },
            { id: 'footsteps', label: 'Footsteps' },
            { id: 'door_slam', label: 'Door Slam' },
            { id: 'coin_jackpot', label: 'Money & Coin' },
            { id: 'sad_violin', label: 'Emotional Drama' },
            { id: 'explosion', label: 'Explosion' }
        ],

        geminiVoices: {
            male: 'Charon',
            female: 'Aoede',
            child: 'Leda'
        },

        streamElementsVoices: {
            male: ['Brian', 'Matthew', 'Russell'],
            female: ['Amy', 'Joanna', 'Emma'],
            child: ['Ivy', 'Justin', 'Kevin']
        },

        init() {
            window.ZenoSounds = this;
            const boot = () => {
                this.injectSoundPreviewBar();
            };
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', boot);
            } else {
                boot();
            }
            console.log("Neural Human TTS Voice Engine Ready.");
        },

        injectSoundPreviewBar() {
            const tryAttach = () => {
                const videoPanel = document.getElementById('zenoVideoChatPanel');
                if (!videoPanel || document.getElementById('zenoSoundFxBar')) return;

                const bar = document.createElement('div');
                bar.id = 'zenoSoundFxBar';
                bar.className = "pt-2 border-t border-white/10 space-y-1.5";
                bar.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">
                            <i class="fa-solid fa-microphone-lines mr-1"></i>Neural Human Voices & Sound FX (Tap to Hear):
                        </span>
                        <span class="text-[9px] text-gray-400">3D Lip-Synced</span>
                    </div>
                    <div class="flex gap-1.5 overflow-x-auto pb-1">
                        ${this.soundLibrary.map(s => `
                            <button type="button" onclick="window.ZenoSounds.previewSingleSound('${s.id}')"
                                class="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-emerald-600/30 border border-white/15 hover:border-emerald-400/50 text-[10px] text-gray-200 font-bold whitespace-nowrap shrink-0 transition">
                                <i class="fa-solid fa-volume-high text-[8px] mr-1 text-emerald-400"></i>${s.label}
                            </button>
                        `).join('')}
                    </div>
                `;
                videoPanel.appendChild(bar);
            };

            tryAttach();
            setTimeout(tryAttach, 600);
        },

        // Decodes raw 16-bit Linear PCM (returned by Gemini Native Audio) into an AudioBuffer
        decodeLinear16PcmToAudioBuffer(audioCtx, base64Data, mimeType = '') {
            const rateMatch = String(mimeType).match(/rate=(\d+)/i);
            const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

            const binaryStr = atob(base64Data);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }

            const sampleCount = Math.floor(bytes.byteLength / 2);
            const view = new DataView(bytes.buffer);
            const float32 = new Float32Array(sampleCount);
            for (let i = 0; i < sampleCount; i++) {
                const int16 = view.getInt16(i * 2, true);
                float32[i] = int16 / 32768.0;
            }

            const audioBuffer = audioCtx.createBuffer(1, sampleCount, sampleRate);
            audioBuffer.copyToChannel(float32, 0);
            return audioBuffer;
        },

        // Fetches genuine human speech AudioBuffer from Gemini Native Audio -> OpenAI TTS -> StreamElements -> Google TTS
        async fetchHumanTtsBuffer(audioCtx, voiceType, text) {
            const cleanText = String(text || '').trim().slice(0, 130);
            if (!cleanText || !audioCtx) return null;

            const role = (voiceType === 'female' || voiceType === 'child') ? voiceType : 'male';
            const rawKey = (window.state?.apiKey || localStorage.getItem('zw_api_key') || '').replace(/[\s"'`]/g, '').trim();

            // 1. GOOGLE GEMINI NATIVE HUMAN AUDIO (Uses user's Gemini API Key — Studio-Grade Natural Human Voice)
            if (rawKey.startsWith('AIza')) {
                const geminiVoice = this.geminiVoices[role] || 'Charon';
                const styleCue = role === 'child'
                    ? 'Speak in a natural, emotional young child voice:'
                    : role === 'female'
                        ? 'Speak in a natural, expressive adult woman voice:'
                        : 'Speak in a natural, expressive adult man voice:';

                for (const model of ['gemini-2.5-flash', 'gemini-2.0-flash']) {
                    try {
                        const controller = new AbortController();
                        const timer = setTimeout(() => controller.abort(), 6500);
                        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(rawKey)}`;
                        const res = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: `${styleCue} "${cleanText}"` }] }],
                                generationConfig: {
                                    responseModalities: ['AUDIO'],
                                    speechConfig: {
                                        voiceConfig: {
                                            prebuiltVoiceConfig: { voiceName: geminiVoice }
                                        }
                                    }
                                }
                            }),
                            signal: controller.signal
                        });
                        clearTimeout(timer);

                        if (res.ok) {
                            const data = await res.json();
                            const parts = data.candidates?.[0]?.content?.parts || [];
                            for (const p of parts) {
                                const inline = p.inlineData || p.inline_data;
                                if (inline && inline.data) {
                                    const mime = inline.mimeType || inline.mime_type || '';
                                    if (mime.includes('pcm') || mime.includes('L16')) {
                                        return this.decodeLinear16PcmToAudioBuffer(audioCtx, inline.data, mime);
                                    } else {
                                        const bin = atob(inline.data);
                                        const arr = new Uint8Array(bin.length);
                                        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
                                        return await audioCtx.decodeAudioData(arr.buffer);
                                    }
                                }
                            }
                        }
                    } catch (e) {}
                }
            }

            // 2. OPENAI NEURAL TTS (If user connected an OpenAI key)
            if (rawKey.startsWith('sk-') && !rawKey.startsWith('sk-ant-') && !rawKey.startsWith('sk-or-')) {
                try {
                    const oaVoice = role === 'female' ? 'nova' : (role === 'child' ? 'shimmer' : 'onyx');
                    const res = await fetch('https://api.openai.com/v1/audio/speech', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${rawKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: 'tts-1',
                            voice: oaVoice,
                            input: cleanText
                        })
                    });
                    if (res.ok) {
                        const arr = await res.arrayBuffer();
                        return await audioCtx.decodeAudioData(arr);
                    }
                } catch (e) {}
            }

            // 3. STREAMELEMENTS NEURAL HUMAN TTS (Free, No Key Required)
            const seVoices = this.streamElementsVoices[role] || this.streamElementsVoices.male;
            for (const voiceName of seVoices) {
                try {
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 4500);
                    const url = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voiceName)}&text=${encodeURIComponent(cleanText)}`;
                    const res = await fetch(url, { signal: controller.signal });
                    clearTimeout(timer);

                    if (res.ok) {
                        const arr = await res.arrayBuffer();
                        if (arr && arr.byteLength > 800) {
                            return await audioCtx.decodeAudioData(arr);
                        }
                    }
                } catch (e) {}
            }

            // 4. GOOGLE TRANSLATE HUMAN TTS MIRROR (With role pitch rate)
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 4000);
                const gUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=en&q=${encodeURIComponent(cleanText)}`;
                const res = await fetch(gUrl, { signal: controller.signal });
                clearTimeout(timer);
                if (res.ok) {
                    const arr = await res.arrayBuffer();
                    if (arr && arr.byteLength > 600) {
                        const buf = await audioCtx.decodeAudioData(arr);
                        buf.__playbackRate = role === 'child' ? 1.24 : (role === 'female' ? 1.08 : 0.94);
                        return buf;
                    }
                }
            } catch (e) {}

            return null;
        },

        async preloadHumanDialogueBuffers(audioCtx, acts, onProgress) {
            const buffers = {};
            if (!audioCtx || !Array.isArray(acts)) return buffers;

            const tasks = [];
            acts.forEach((act, aIdx) => {
                (act.actors || []).forEach((actor) => {
                    if (actor.speaking && actor.spokenLine && actor.spokenLine.trim().length > 0) {
                        tasks.push({
                            key: `${aIdx}_${actor.id}`,
                            voiceType: actor.voiceType || 'male',
                            text: actor.spokenLine.trim()
                        });
                    }
                });
            });

            let completed = 0;
            const batchSize = 3;
            for (let i = 0; i < tasks.length; i += batchSize) {
                const batch = tasks.slice(i, i + batchSize);
                await Promise.all(batch.map(async (item) => {
                    const buf = await this.fetchHumanTtsBuffer(audioCtx, item.voiceType, item.text);
                    if (buf) {
                        buffers[item.key] = buf;
                    }
                    completed++;
                    if (onProgress) onProgress(completed, tasks.length);
                }));
            }

            return buffers;
        },

        async previewSingleSound(soundId) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioCtx();
                if (ctx.state === 'suspended') await ctx.resume();
                const master = ctx.createGain();
                master.gain.value = 0.5;
                master.connect(ctx.destination);

                const session = this.createSoundSession(ctx, master, 'dramatic', false, {});

                if (soundId === 'male_voice' || soundId === 'female_voice' || soundId === 'child_voice') {
                    const role = soundId === 'female_voice' ? 'female' : (soundId === 'child_voice' ? 'child' : 'male');
                    const sampleLine = role === 'female'
                        ? 'Please listen to me, we need to talk right now.'
                        : role === 'child'
                            ? 'Mommy, daddy, please stop fighting, I am scared!'
                            : 'I promise I will make everything better for our family.';

                    const buf = await this.fetchHumanTtsBuffer(ctx, role, sampleLine);
                    if (buf) {
                        session.setVoiceBuffers({ preview: buf });
                        session.speakHumanLine(role, sampleLine, 2.5, 'preview');
                    } else if ('speechSynthesis' in window) {
                        const u = new SpeechSynthesisUtterance(sampleLine);
                        u.pitch = role === 'child' ? 1.55 : (role === 'female' ? 1.2 : 0.85);
                        window.speechSynthesis.speak(u);
                    }
                    setTimeout(() => { try { ctx.close(); } catch (e) {} }, 4000);
                } else {
                    session.trigger(soundId);
                    setTimeout(() => { try { ctx.close(); } catch (e) {} }, 2200);
                }
            } catch (e) {}
        },

        createRecordingSession(mood = 'dramatic') {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioCtx();
                if (ctx.state === 'suspended') ctx.resume().catch(() => {});

                const dest = ctx.createMediaStreamDestination();
                const master = ctx.createGain();
                master.gain.value = 0.42;
                master.connect(dest);
                master.connect(ctx.destination);

                const session = this.createSoundSession(ctx, master, mood, true, {});
                session.audioCtx = ctx;
                session.streamTrack = dest.stream.getAudioTracks()[0] || null;
                return session;
            } catch (e) {
                return null;
            }
        },

        createSoundSession(ctx, masterGain, mood, withBackgroundScore, preloadedBuffers = {}) {
            const voiceAnalyser = ctx.createAnalyser();
            voiceAnalyser.fftSize = 256;
            const timeDomainData = new Uint8Array(voiceAnalyser.frequencyBinCount);
            voiceAnalyser.connect(masterGain);

            let bgOsc1 = null;
            let bgOsc2 = null;
            let voiceBuffers = preloadedBuffers || {};

            if (withBackgroundScore) {
                bgOsc1 = ctx.createOscillator();
                bgOsc2 = ctx.createOscillator();
                const bgGain = ctx.createGain();

                bgOsc1.type = 'sine';
                bgOsc2.type = 'sine';
                bgOsc1.frequency.value = mood === 'action' ? 98.00 : (mood === 'sad' || mood === 'dramatic' ? 130.81 : 146.83);
                bgOsc2.frequency.value = mood === 'action' ? 146.83 : (mood === 'sad' || mood === 'dramatic' ? 155.56 : 220.00);
                bgGain.gain.value = 0.035;

                bgOsc1.connect(bgGain);
                bgOsc2.connect(bgGain);
                bgGain.connect(masterGain);
                bgOsc1.start();
                bgOsc2.start();
            }

            // Warm, Non-Robotic Soft Breath & Vowel Murmur Fallback (never uses harsh sawtooth!)
            const playSoftHumanFallback = (voiceType = 'male', durationSec = 1.5) => {
                const now = ctx.currentTime;
                const baseFreq = voiceType === 'female' ? 210 : (voiceType === 'child' ? 305 : 118);
                const count = Math.max(3, Math.floor(durationSec / 0.22));

                for (let i = 0; i < count; i++) {
                    const t0 = now + i * 0.22;
                    const t1 = t0 + 0.17;
                    const osc = ctx.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(baseFreq * (1 + 0.06 * Math.sin(i)), t0);
                    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, t1);

                    const lp = ctx.createBiquadFilter();
                    lp.type = 'lowpass';
                    lp.frequency.value = voiceType === 'child' ? 950 : (voiceType === 'female' ? 780 : 540);

                    const g = ctx.createGain();
                    g.gain.setValueAtTime(0.001, t0);
                    g.gain.linearRampToValueAtTime(0.28, t0 + 0.04);
                    g.gain.exponentialRampToValueAtTime(0.001, t1);

                    osc.connect(lp);
                    lp.connect(g);
                    g.connect(voiceAnalyser);
                    osc.start(t0);
                    osc.stop(t1 + 0.01);
                }
            };

            const foley = {
                child_cry() {
                    const now = ctx.currentTime;
                    for (let i = 0; i < 4; i++) {
                        const t0 = now + i * 0.45;
                        const t1 = t0 + 0.36;
                        const osc = ctx.createOscillator();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(340, t0);
                        osc.frequency.linearRampToValueAtTime(420, t0 + 0.12);
                        osc.frequency.exponentialRampToValueAtTime(270, t1);

                        const lp = ctx.createBiquadFilter();
                        lp.type = 'lowpass';
                        lp.frequency.value = 950;

                        const g = ctx.createGain();
                        g.gain.setValueAtTime(0.001, t0);
                        g.gain.linearRampToValueAtTime(0.35, t0 + 0.06);
                        g.gain.exponentialRampToValueAtTime(0.001, t1);

                        osc.connect(lp);
                        lp.connect(g);
                        g.connect(voiceAnalyser);
                        osc.start(t0);
                        osc.stop(t1 + 0.01);
                    }
                },

                laugh() {
                    [360, 330, 390, 310].forEach((freq, idx) => {
                        const t0 = ctx.currentTime + idx * 0.12;
                        const o = ctx.createOscillator();
                        o.type = 'triangle';
                        const lp = ctx.createBiquadFilter();
                        lp.type = 'lowpass';
                        lp.frequency.value = 820;
                        const g = ctx.createGain();
                        o.frequency.setValueAtTime(freq, t0);
                        g.gain.setValueAtTime(0.28, t0);
                        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
                        o.connect(lp);
                        lp.connect(g);
                        g.connect(voiceAnalyser);
                        o.start(t0);
                        o.stop(t0 + 0.10);
                    });
                },

                footsteps() {
                    const now = ctx.currentTime;
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(110, now);
                    o.frequency.exponentialRampToValueAtTime(36, now + 0.09);
                    g.gain.setValueAtTime(0.30, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
                    o.connect(g);
                    g.connect(masterGain);
                    o.start(now);
                    o.stop(now + 0.10);
                },

                door_slam() {
                    const now = ctx.currentTime;
                    const len = Math.floor(ctx.sampleRate * 0.28);
                    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
                    const data = buf.getChannelData(0);
                    for (let i = 0; i < len; i++) {
                        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
                    }
                    const src = ctx.createBufferSource();
                    src.buffer = buf;
                    const filter = ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 240;
                    const g = ctx.createGain();
                    g.gain.setValueAtTime(0.75, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                    src.connect(filter);
                    filter.connect(g);
                    g.connect(masterGain);
                    src.start(now);
                },

                coin_jackpot() {
                    [987.77, 1318.51, 1567.98].forEach((f, idx) => {
                        const t0 = ctx.currentTime + idx * 0.08;
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.type = 'sine';
                        o.frequency.setValueAtTime(f, t0);
                        g.gain.setValueAtTime(0.30, t0);
                        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
                        o.connect(g);
                        g.connect(masterGain);
                        o.start(t0);
                        o.stop(t0 + 0.31);
                    });
                },

                sad_violin() {
                    [293.66, 261.63, 246.94, 220.00].forEach((freq, idx) => {
                        const t0 = ctx.currentTime + idx * 0.24;
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.type = 'sine';
                        o.frequency.setValueAtTime(freq, t0);
                        g.gain.setValueAtTime(0.01, t0);
                        g.gain.linearRampToValueAtTime(0.18, t0 + 0.08);
                        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
                        o.connect(g);
                        g.connect(masterGain);
                        o.start(t0);
                        o.stop(t0 + 0.26);
                    });
                },

                explosion() {
                    const now = ctx.currentTime;
                    const len = Math.floor(ctx.sampleRate * 0.5);
                    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
                    const data = buf.getChannelData(0);
                    for (let i = 0; i < len; i++) {
                        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
                    }
                    const src = ctx.createBufferSource();
                    src.buffer = buf;
                    const filter = ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 320;
                    const g = ctx.createGain();
                    g.gain.setValueAtTime(0.75, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    src.connect(filter);
                    filter.connect(g);
                    g.connect(masterGain);
                    src.start(now);
                }
            };

            return {
                streamTrack: null,
                setVoiceBuffers(bufMap) {
                    voiceBuffers = bufMap || {};
                },
                speakHumanLine(voiceType, lineText, durationSec = 1.6, bufferKey = null) {
                    if (bufferKey && voiceBuffers[bufferKey]) {
                        try {
                            const buf = voiceBuffers[bufferKey];
                            const src = ctx.createBufferSource();
                            src.buffer = buf;
                            if (buf.__playbackRate) {
                                src.playbackRate.value = buf.__playbackRate;
                            }
                            src.connect(voiceAnalyser);
                            src.start(ctx.currentTime);
                            return;
                        } catch (e) {}
                    }
                    playSoftHumanFallback(voiceType, durationSec);
                },
                trigger(soundName) {
                    try {
                        if (typeof foley[soundName] === 'function') {
                            foley[soundName]();
                        }
                    } catch (e) {}
                },
                getLiveVoiceAperture() {
                    try {
                        voiceAnalyser.getByteTimeDomainData(timeDomainData);
                        let sumSq = 0;
                        for (let i = 0; i < timeDomainData.length; i++) {
                            const v = (timeDomainData[i] - 128) / 128;
                            sumSq += v * v;
                        }
                        const rms = Math.sqrt(sumSq / timeDomainData.length);
                        return Math.min(1, rms * 7.2);
                    } catch (e) {
                        return 0;
                    }
                },
                stopAll() {
                    try {
                        if (bgOsc1) bgOsc1.stop();
                        if (bgOsc2) bgOsc2.stop();
                        ctx.close();
                    } catch (e) {}
                }
            };
        }
    };

    ZenoSounds.init();
})();
