/**
 * ZENO-SOUNDS.JS - Real Human TTS Voice Engine (Male, Female, Child) & Foley Audio Studio
 * 1. Fetches real human TTS speech audio buffers for Male, Female, and Child characters
 *    (with multi-voice Neural TTS + WebSpeech preview + Formant Vocal fallback).
 * 2. Mixes real human voices & foley effects directly into the recorded video MediaStream.
 * 3. Live AnalyserNode waveform metering drives exact character lip-sync mouth movement.
 */
(function () {
    const ZenoSounds = {
        soundLibrary: [
            { id: 'male_voice', label: 'Male Voice (TTS)' },
            { id: 'female_voice', label: 'Female Voice (TTS)' },
            { id: 'child_voice', label: 'Child Voice (TTS)' },
            { id: 'child_cry', label: 'Child Crying' },
            { id: 'laugh', label: 'Human Laugh' },
            { id: 'footsteps', label: 'Footsteps' },
            { id: 'door_slam', label: 'Door Slam' },
            { id: 'coin_jackpot', label: 'Money & Coin' },
            { id: 'sad_violin', label: 'Emotional Drama' },
            { id: 'explosion', label: 'Explosion' }
        ],

        // Distinct Human TTS Voices mapped to Male, Female, and Child roles
        ttsVoiceProfiles: {
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
            console.log("ZenoSounds Human TTS & Foley Engine Active.");
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
                            <i class="fa-solid fa-microphone-lines mr-1"></i>Human TTS Voices & Sound FX (Tap to Hear):
                        </span>
                        <span class="text-[9px] text-gray-400">Male • Female • Child</span>
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

        // Fetches a single real human TTS AudioBuffer for the given voiceType ('male' | 'female' | 'child')
        async fetchHumanTtsBuffer(audioCtx, voiceType, text) {
            const cleanText = String(text || '').trim().slice(0, 110);
            if (!cleanText || !audioCtx) return null;

            const role = (voiceType === 'female' || voiceType === 'child') ? voiceType : 'male';
            const voices = this.ttsVoiceProfiles[role] || this.ttsVoiceProfiles.male;

            for (const voiceName of voices) {
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
            return null;
        },

        // Pre-fetches real human TTS MP3 audio for EVERY dialogue line across all acts (10s, 20s, or 30s)
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

            // Fetch in parallel batches of 4 for fast startup even on 30-second (9-act) stories
            let completed = 0;
            const batchSize = 4;
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
                master.gain.value = 0.45;
                master.connect(ctx.destination);

                const session = this.createSoundSession(ctx, master, 'dramatic', false, {});

                if (soundId === 'male_voice' || soundId === 'female_voice' || soundId === 'child_voice') {
                    const role = soundId === 'female_voice' ? 'female' : (soundId === 'child_voice' ? 'child' : 'male');
                    const sampleLine = role === 'female'
                        ? 'Please listen to me, we need to talk right now.'
                        : role === 'child'
                            ? 'Mommy, daddy, please do not fight anymore!'
                            : 'I am working hard to make everything better for us.';

                    const buf = await this.fetchHumanTtsBuffer(ctx, role, sampleLine);
                    if (buf) {
                        session.setVoiceBuffers({ preview: buf });
                        session.speakHumanLine(role, sampleLine, 2.5, 'preview', 'neutral');
                    } else {
                        session.speakHumanLine(role, sampleLine, 2.2, null, 'neutral');
                    }
                    setTimeout(() => { try { ctx.close(); } catch (e) {} }, 3500);
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
                master.gain.value = 0.38;
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

                if (mood === 'action') {
                    bgOsc1.type = 'sawtooth';
                    bgOsc2.type = 'triangle';
                    bgOsc1.frequency.value = 82.41;
                    bgOsc2.frequency.value = 123.47;
                    bgGain.gain.value = 0.04;
                } else if (mood === 'sad' || mood === 'dramatic') {
                    bgOsc1.type = 'sine';
                    bgOsc2.type = 'triangle';
                    bgOsc1.frequency.value = 130.81;
                    bgOsc2.frequency.value = 155.56;
                    bgGain.gain.value = 0.055;
                } else {
                    bgOsc1.type = 'sine';
                    bgOsc2.type = 'triangle';
                    bgOsc1.frequency.value = 146.83;
                    bgOsc2.frequency.value = 220.00;
                    bgGain.gain.value = 0.05;
                }

                bgOsc1.connect(bgGain);
                bgOsc2.connect(bgGain);
                bgGain.connect(masterGain);
                bgOsc1.start();
                bgOsc2.start();
            }

            // Formant Human Vocal Synthesizer Fallback (distinct Male 115Hz, Female 220Hz, Child 320Hz)
            const synthesizeHumanSyllables = (voiceType = 'male', durationSec = 1.6, emotion = 'neutral') => {
                const now = ctx.currentTime;
                const baseFreq = voiceType === 'female' ? 220 : (voiceType === 'child' ? 320 : 115);
                const syllableDur = 0.16;
                const count = Math.max(3, Math.floor(durationSec / syllableDur));

                const vowelFormants = [
                    [730, 1090],
                    [530, 1840],
                    [390, 1990],
                    [570, 840],
                    [440, 1020]
                ];

                for (let i = 0; i < count; i++) {
                    const tStart = now + i * syllableDur;
                    const tEnd = tStart + syllableDur * 0.82;
                    const [f1Freq, f2Freq] = vowelFormants[(i + (voiceType === 'female' ? 1 : (voiceType === 'child' ? 2 : 0))) % vowelFormants.length];
                    const formantScale = voiceType === 'child' ? 1.25 : (voiceType === 'female' ? 1.12 : 1.0);

                    const pitchMod = emotion === 'angry'
                        ? baseFreq * (1.12 + 0.16 * Math.sin(i * 1.4))
                        : baseFreq * (1.0 + 0.10 * Math.sin(i * 1.1) - (i / count) * 0.10);

                    const glottis = ctx.createOscillator();
                    glottis.type = 'sawtooth';
                    glottis.frequency.setValueAtTime(pitchMod, tStart);
                    glottis.frequency.linearRampToValueAtTime(pitchMod * 0.92, tEnd);

                    const f1 = ctx.createBiquadFilter();
                    f1.type = 'bandpass';
                    f1.frequency.setValueAtTime(f1Freq * formantScale, tStart);
                    f1.Q.value = 5.5;

                    const f2 = ctx.createBiquadFilter();
                    f2.type = 'bandpass';
                    f2.frequency.setValueAtTime(f2Freq * formantScale, tStart);
                    f2.Q.value = 6.5;

                    const syllGain = ctx.createGain();
                    syllGain.gain.setValueAtTime(0.001, tStart);
                    syllGain.gain.linearRampToValueAtTime(emotion === 'angry' ? 0.52 : 0.40, tStart + 0.03);
                    syllGain.gain.exponentialRampToValueAtTime(0.001, tEnd);

                    glottis.connect(f1);
                    glottis.connect(f2);
                    f1.connect(syllGain);
                    f2.connect(syllGain);
                    syllGain.connect(voiceAnalyser);

                    glottis.start(tStart);
                    glottis.stop(tEnd + 0.01);
                }
            };

            const foley = {
                child_cry() {
                    const now = ctx.currentTime;
                    for (let i = 0; i < 4; i++) {
                        const t0 = now + i * 0.42;
                        const t1 = t0 + 0.34;
                        const osc = ctx.createOscillator();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(345, t0);
                        osc.frequency.linearRampToValueAtTime(440, t0 + 0.10);
                        osc.frequency.exponentialRampToValueAtTime(265, t1);

                        const formant = ctx.createBiquadFilter();
                        formant.type = 'bandpass';
                        formant.frequency.setValueAtTime(920, t0);
                        formant.Q.value = 4.5;

                        const g = ctx.createGain();
                        g.gain.setValueAtTime(0.001, t0);
                        g.gain.linearRampToValueAtTime(0.45, t0 + 0.06);
                        g.gain.exponentialRampToValueAtTime(0.001, t1);

                        osc.connect(formant);
                        formant.connect(g);
                        g.connect(voiceAnalyser);
                        osc.start(t0);
                        osc.stop(t1 + 0.01);
                    }
                },

                laugh() {
                    [390, 350, 420, 330, 370].forEach((freq, idx) => {
                        const t0 = ctx.currentTime + idx * 0.11;
                        const o = ctx.createOscillator();
                        const f = ctx.createBiquadFilter();
                        f.type = 'bandpass';
                        f.frequency.value = 780;
                        f.Q.value = 4;
                        const g = ctx.createGain();
                        o.type = 'sawtooth';
                        o.frequency.setValueAtTime(freq, t0);
                        g.gain.setValueAtTime(0.32, t0);
                        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
                        o.connect(f);
                        f.connect(g);
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
                    o.frequency.setValueAtTime(115, now);
                    o.frequency.exponentialRampToValueAtTime(36, now + 0.09);
                    g.gain.setValueAtTime(0.32, now);
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
                    filter.frequency.value = 260;
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
                        o.type = 'sawtooth';
                        const filter = ctx.createBiquadFilter();
                        filter.type = 'lowpass';
                        filter.frequency.value = 620;
                        o.frequency.setValueAtTime(freq, t0);
                        g.gain.setValueAtTime(0.01, t0);
                        g.gain.linearRampToValueAtTime(0.16, t0 + 0.08);
                        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
                        o.connect(filter);
                        filter.connect(g);
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
                    filter.frequency.value = 340;
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
                speakHumanLine(voiceType, lineText, durationSec = 1.6, bufferKey = null, emotion = 'neutral') {
                    if (bufferKey && voiceBuffers[bufferKey]) {
                        try {
                            const src = ctx.createBufferSource();
                            src.buffer = voiceBuffers[bufferKey];
                            src.connect(voiceAnalyser);
                            src.start(ctx.currentTime);
                            return;
                        } catch (e) {}
                    }
                    synthesizeHumanSyllables(voiceType, durationSec, emotion);
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
                        return Math.min(1, rms * 6.8);
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
