/**
 * ZENO-SOUNDS.JS - Multi-Sound WebAudio Synthesizer & Foley Engine (12 Distinct Sounds)
 * Provides real-time procedural sound effects, background musical scores, live audio preview buttons,
 * and direct MediaStream audio mixing for recorded videos.
 */
(function () {
    const ZenoSounds = {
        soundLibrary: [
            { id: 'coin_jackpot', label: 'Money & Coin' },
            { id: 'victory_fanfare', label: 'Happy Victory' },
            { id: 'sad_violin', label: 'Sad Drama' },
            { id: 'laugh', label: 'Laughing' },
            { id: 'footsteps', label: 'Footsteps' },
            { id: 'speech', label: 'Character Voice' },
            { id: 'explosion', label: 'Explosion' },
            { id: 'laser_beam', label: 'Laser Beam' },
            { id: 'punch_impact', label: 'Action Punch' },
            { id: 'engine_whoosh', label: 'Car / Rocket' },
            { id: 'rain_thunder', label: 'Rain & Thunder' },
            { id: 'magic_sparkle', label: 'Magic Sparkle' }
        ],

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
            console.log("🔊 ZenoSounds Engine Loaded (12 Sound Effects & Music Scores Ready).");
        },

        // Adds interactive Sound Effect test buttons inside the Video Studio Panel
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
                            <i class="fa-solid fa-volume-high mr-1"></i>12 Built-In Sound FX (Tap to Preview):
                        </span>
                        <span class="text-[9px] text-gray-400">Auto-Synced to Video</span>
                    </div>
                    <div class="flex gap-1.5 overflow-x-auto pb-1">
                        ${this.soundLibrary.map(s => `
                            <button type="button" onclick="window.ZenoSounds.previewSingleSound('${s.id}')"
                                class="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-emerald-600/30 border border-white/15 hover:border-emerald-400/50 text-[10px] text-gray-200 font-bold whitespace-nowrap shrink-0 transition">
                                <i class="fa-solid fa-play text-[8px] mr-1 text-emerald-400"></i>${s.label}
                            </button>
                        `).join('')}
                    </div>
                `;
                videoPanel.appendChild(bar);
            };

            tryAttach();
            setTimeout(tryAttach, 600);
        },

        // Plays any single sound immediately when the user taps its preview button
        previewSingleSound(soundId) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioCtx();
                if (ctx.state === 'suspended') ctx.resume();
                const master = ctx.createGain();
                master.gain.value = 0.35;
                master.connect(ctx.destination);

                const session = this.createSoundSession(ctx, master, 'happy', false);
                session.trigger(soundId, 260);
                setTimeout(() => {
                    try { ctx.close(); } catch (e) {}
                }, 1400);
            } catch (e) {}
        },

        // Creates a full audio session attached to both the video recorder stream and live output
        createRecordingSession(mood = 'happy') {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioCtx();
                if (ctx.state === 'suspended') ctx.resume().catch(() => {});

                const dest = ctx.createMediaStreamDestination();
                const master = ctx.createGain();
                master.gain.value = 0.28;
                master.connect(dest);
                master.connect(ctx.destination);

                const controller = this.createSoundSession(ctx, master, mood, true);
                controller.streamTrack = dest.stream.getAudioTracks()[0] || null;
                return controller;
            } catch (e) {
                return null;
            }
        },

        createSoundSession(ctx, masterGain, mood, withBackgroundMusic) {
            let bgOsc1 = null;
            let bgOsc2 = null;

            if (withBackgroundMusic) {
                bgOsc1 = ctx.createOscillator();
                bgOsc2 = ctx.createOscillator();
                const bgGain = ctx.createGain();

                if (mood === 'action') {
                    bgOsc1.type = 'sawtooth';
                    bgOsc2.type = 'triangle';
                    bgOsc1.frequency.value = 82.41; // E2 dramatic bass
                    bgOsc2.frequency.value = 123.47; // B2
                    bgGain.gain.value = 0.08;
                } else if (mood === 'sad') {
                    bgOsc1.type = 'sine';
                    bgOsc2.type = 'triangle';
                    bgOsc1.frequency.value = 130.81; // C3 minor
                    bgOsc2.frequency.value = 155.56; // Eb3
                    bgGain.gain.value = 0.11;
                } else {
                    bgOsc1.type = 'sine';
                    bgOsc2.type = 'triangle';
                    bgOsc1.frequency.value = 146.83; // D3 warm
                    bgOsc2.frequency.value = 220.00; // A3
                    bgGain.gain.value = 0.10;
                }

                bgOsc1.connect(bgGain);
                bgOsc2.connect(bgGain);
                bgGain.connect(masterGain);
                bgOsc1.start();
                bgOsc2.start();
            }

            const sounds = {
                // 1. Footsteps
                footsteps() {
                    const now = ctx.currentTime;
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(125, now);
                    o.frequency.exponentialRampToValueAtTime(38, now + 0.09);
                    g.gain.setValueAtTime(0.38, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
                    o.connect(g);
                    g.connect(masterGain);
                    o.start(now);
                    o.stop(now + 0.10);
                },

                // 2. Character Speech Formant Blips
                speech(pitch = 250) {
                    const now = ctx.currentTime;
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.setValueAtTime(pitch + (Math.random() - 0.5) * 85, now);
                    g.gain.setValueAtTime(0.24, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
                    o.connect(g);
                    g.connect(masterGain);
                    o.start(now);
                    o.stop(now + 0.08);
                },

                // 3. Cheerful Laughing
                laugh() {
                    const notes = [440, 392, 466, 370, 415];
                    notes.forEach((freq, idx) => {
                        const t0 = ctx.currentTime + idx * 0.085;
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.type = 'sine';
                        o.frequency.setValueAtTime(freq, t0);
                        g.gain.setValueAtTime(0.30, t0);
                        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07);
                        o.connect(g);
                        g.connect(masterGain);
                        o.start(t0);
                        o.stop(t0 + 0.075);
                    });
                },

                // 4. Sad Emotional Violin Swell
                sad_violin() {
                    const notes = [293.66, 261.63, 246.94, 220.00];
                    notes.forEach((freq, idx) => {
                        const t0 = ctx.currentTime + idx * 0.22;
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.type = 'sawtooth';
                        const filter = ctx.createBiquadFilter();
                        filter.type = 'lowpass';
                        filter.frequency.value = 650;
                        o.frequency.setValueAtTime(freq, t0);
                        g.gain.setValueAtTime(0.01, t0);
                        g.gain.linearRampToValueAtTime(0.18, t0 + 0.08);
                        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
                        o.connect(filter);
                        filter.connect(g);
                        g.connect(masterGain);
                        o.start(t0);
                        o.stop(t0 + 0.25);
                    });
                },

                // 5. Money & Coin Jackpot Chime
                coin_jackpot() {
                    const freqs = [987.77, 1318.51, 1567.98, 2093.00];
                    freqs.forEach((f, idx) => {
                        const t0 = ctx.currentTime + idx * 0.07;
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.type = 'sine';
                        o.frequency.setValueAtTime(f, t0);
                        g.gain.setValueAtTime(0.32, t0);
                        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
                        o.connect(g);
                        g.connect(masterGain);
                        o.start(t0);
                        o.stop(t0 + 0.36);
                    });
                },

                // 6. Happy Victory Fanfare
                victory_fanfare() {
                    const chord = [523.25, 659.25, 783.99, 1046.50];
                    chord.forEach((f, idx) => {
                        const t0 = ctx.currentTime + idx * 0.09;
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.type = 'triangle';
                        o.frequency.setValueAtTime(f, t0);
                        g.gain.setValueAtTime(0.28, t0);
                        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
                        o.connect(g);
                        g.connect(masterGain);
                        o.start(t0);
                        o.stop(t0 + 0.56);
                    });
                },

                // 7. Heavy Explosion Boom
                explosion() {
                    const now = ctx.currentTime;
                    const len = Math.floor(ctx.sampleRate * 0.55);
                    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
                    const data = buf.getChannelData(0);
                    for (let i = 0; i < len; i++) {
                        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.16));
                    }
                    const noise = ctx.createBufferSource();
                    noise.buffer = buf;
                    const filter = ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(420, now);
                    filter.frequency.exponentialRampToValueAtTime(65, now + 0.5);
                    const g = ctx.createGain();
                    g.gain.setValueAtTime(0.75, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
                    noise.connect(filter);
                    filter.connect(g);
                    g.connect(masterGain);
                    noise.start(now);
                },

                // 8. Sci-Fi Laser Beam
                laser_beam() {
                    const now = ctx.currentTime;
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.setValueAtTime(980, now);
                    o.frequency.exponentialRampToValueAtTime(120, now + 0.22);
                    g.gain.setValueAtTime(0.30, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                    o.connect(g);
                    g.connect(masterGain);
                    o.start(now);
                    o.stop(now + 0.23);
                },

                // 9. Action Punch Impact
                punch_impact() {
                    const now = ctx.currentTime;
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'square';
                    o.frequency.setValueAtTime(190, now);
                    o.frequency.exponentialRampToValueAtTime(45, now + 0.12);
                    g.gain.setValueAtTime(0.45, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
                    o.connect(g);
                    g.connect(masterGain);
                    o.start(now);
                    o.stop(now + 0.14);
                },

                // 10. Car / Rocket Engine Whoosh
                engine_whoosh() {
                    const now = ctx.currentTime;
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.setValueAtTime(75, now);
                    o.frequency.linearRampToValueAtTime(165, now + 0.25);
                    o.frequency.linearRampToValueAtTime(90, now + 0.5);
                    g.gain.setValueAtTime(0.25, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
                    o.connect(g);
                    g.connect(masterGain);
                    o.start(now);
                    o.stop(now + 0.53);
                },

                // 11. Rain & Distant Thunder
                rain_thunder() {
                    const now = ctx.currentTime;
                    const len = Math.floor(ctx.sampleRate * 0.45);
                    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
                    const data = buf.getChannelData(0);
                    for (let i = 0; i < len; i++) {
                        data[i] = (Math.random() * 2 - 1) * 0.35;
                    }
                    const src = ctx.createBufferSource();
                    src.buffer = buf;
                    const filter = ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.value = 1200;
                    const g = ctx.createGain();
                    g.gain.setValueAtTime(0.25, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                    src.connect(filter);
                    filter.connect(g);
                    g.connect(masterGain);
                    src.start(now);
                },

                // 12. Magic Sparkle Glissando
                magic_sparkle() {
                    const notes = [880, 1174.66, 1396.91, 1760, 2349.32];
                    notes.forEach((f, idx) => {
                        const t0 = ctx.currentTime + idx * 0.055;
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.type = 'sine';
                        o.frequency.setValueAtTime(f, t0);
                        g.gain.setValueAtTime(0.22, t0);
                        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
                        o.connect(g);
                        g.connect(masterGain);
                        o.start(t0);
                        o.stop(t0 + 0.26);
                    });
                }
            };

            return {
                streamTrack: null,
                trigger(soundName, pitch = 250) {
                    try {
                        if (typeof sounds[soundName] === 'function') {
                            sounds[soundName](pitch);
                        } else {
                            sounds.speech(pitch);
                        }
                    } catch (e) {}
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
