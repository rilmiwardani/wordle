/**
 * Web Audio API Sound Effects Engine untuk TikTok Wordle Game
 * Mendukung berbagai pilihan tema suara ubin (Scrabble Wood, Bubble Pop, Card Snap, Sci-Fi Crystal, Classic).
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.soundTheme = 'wood';
        try {
            this.soundTheme = localStorage.getItem('wordle_sound_theme') || 'wood';
        } catch(e) {}
        this.radioAmbianceNode = null;
        this.radioAmbianceGain = null;
        this.ambianceBuffer = null;
        this.isRadioAmbiancePlaying = false;
        this.radioAmbianceEnabled = localStorage.getItem('wordle_radio_ambiance') === 'true';
        this.radioAmbianceVolume = parseInt(localStorage.getItem('wordle_radio_ambiance_vol')) || 20;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setEnabled(val) {
        this.enabled = !!val;
    }

    setTheme(theme) {
        this.soundTheme = theme || 'wood';
        try {
            localStorage.setItem('wordle_sound_theme', this.soundTheme);
        } catch(e) {}
    }

    getTheme() {
        return this.soundTheme;
    }

    // Suara ubin flip dan mengevaluasi tebakan berdasarkan tema aktif
    playFlip(index = 0, offsetTime = 0) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime + offsetTime;
        const theme = this.soundTheme;

        try {
            if (theme === 'wood') {
                // 🪵 ASMR Ubin Kayu (Scrabble / Tile Thud)
                // 1. Click Transient
                const oscClick = this.ctx.createOscillator();
                const gainClick = this.ctx.createGain();
                oscClick.type = 'triangle';
                oscClick.frequency.setValueAtTime(1400 + (index * 80), now);
                oscClick.frequency.exponentialRampToValueAtTime(300, now + 0.015);
                gainClick.gain.setValueAtTime(0.18, now);
                gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
                oscClick.connect(gainClick);
                gainClick.connect(this.ctx.destination);
                oscClick.start(now);
                oscClick.stop(now + 0.015);

                // 2. Woody Body Resonance
                const oscBody = this.ctx.createOscillator();
                const gainBody = this.ctx.createGain();
                oscBody.type = 'sine';
                oscBody.frequency.setValueAtTime(520 + (index * 45), now);
                oscBody.frequency.exponentialRampToValueAtTime(180, now + 0.045);
                gainBody.gain.setValueAtTime(0.22, now);
                gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
                oscBody.connect(gainBody);
                gainBody.connect(this.ctx.destination);
                oscBody.start(now);
                oscBody.stop(now + 0.045);

            } else if (theme === 'pop') {
                // 🫧 Soft Bubble Pop
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                const startFreq = 950 + (index * 90);
                osc.frequency.setValueAtTime(startFreq, now);
                osc.frequency.exponentialRampToValueAtTime(260, now + 0.055);
                gain.gain.setValueAtTime(0.20, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.055);

            } else if (theme === 'card') {
                // 🃏 Card Snap (Kartu Remi)
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1200 + (index * 70), now);
                osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.035);

            } else if (theme === 'scifi') {
                // 🔮 Kristal Sci-Fi (Harmonic Dual Chime)
                const freq1 = 880 + (index * 95);
                const freq2 = freq1 * 1.5; // 5th harmony
                
                [freq1, freq2].forEach((f, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(f, now);
                    osc.frequency.exponentialRampToValueAtTime(f * 0.9, now + 0.07);
                    gain.gain.setValueAtTime(idx === 0 ? 0.12 : 0.07, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.07);
                });

            } else {
                // 📻 Klasik Synth (Default IndoFinity)
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(420 + (index * 55), now);
                osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.06);
            }
        } catch (e) {}
    }

    // Suara ketikan keyboard (soft mechanical click)
    playKey() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320 + Math.random() * 40, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.04);
        } catch (e) {
            console.warn("Audio error:", e);
        }
    }

    // Suara tombol hapus / backspace
    playDelete() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {
            console.warn("Audio error:", e);
        }
    }

    // Suara saat tebakan salah / kata tidak ada di kamus
    playInvalid() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.setValueAtTime(110, now + 0.08);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) {}
    }

    // Suara ketika pemindaian gelombang (scan wave) melewati tiap baris
    playScanRow(index = 0) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Frekuensi naik perlahan seiring baris turun (C4, D4, E4, F4, G4)
            const freqs = [261.63, 293.66, 329.63, 349.23, 392.00];
            const freq = freqs[index % freqs.length] || 300;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq * 1.5, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.12);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        } catch (e) {}
    }

    // Suara ketika huruf hijau ditemukan
    playGreenChime() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const notes = [587.33, 880, 1174.66]; // D5, A5, D6
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const noteTime = now + (i * 0.05);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.08, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(noteTime);
                osc.stop(noteTime + 0.25);
            });
        } catch (e) {}
    }

    // Suara perayaan saat 1 baris kata tertebak lengkap (5 hijau)
    playRowSolved() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            chord.forEach((freq, idx) => {
                const noteStart = now + (idx * 0.07);
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteStart);

                gain.gain.setValueAtTime(0.12, noteStart);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(noteStart);
                osc.stop(noteStart + 0.25);
            });
        } catch (e) {}
    }

    // Suara ubin melompat pada animasi gelombang kemenangan (Win Wave Arpeggio)
    playWaveTile(index = 0, total = 5) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            // Pentatonic & Major uplifting arpeggios
            const scalePatterns = {
                3: [523.25, 659.25, 1046.50], // C5, E5, C6
                4: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6
                5: [523.25, 659.25, 783.99, 880.00, 1046.50], // C5, E5, G5, A5, C6
                6: [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50], // C5, D5, E5, G5, A5, C6
                7: [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 1046.50], // C5, D5, E5, F5, G5, A5, C6
                8: [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50]
            };

            const notes = scalePatterns[total] || scalePatterns[5];
            const freq = notes[index % notes.length] || 523.25;

            // 1. Marimba / Bell Fundamental
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.01, now + 0.05);

            gain.gain.setValueAtTime(0.20, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);

            // 2. High Shimmer Harmonics
            const oscHarm = this.ctx.createOscillator();
            const gainHarm = this.ctx.createGain();
            oscHarm.type = 'sine';
            oscHarm.frequency.setValueAtTime(freq * 2, now);

            gainHarm.gain.setValueAtTime(0.08, now);
            gainHarm.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            oscHarm.connect(gainHarm);
            gainHarm.connect(this.ctx.destination);
            oscHarm.start(now);
            oscHarm.stop(now + 0.12);
        } catch (e) {}
    }

    // Suara perayaan saat memenangkan game
    playWin() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const chord = [
                { f: 523.25, d: 0.15 }, // C5
                { f: 659.25, d: 0.15 }, // E5
                { f: 783.99, d: 0.15 }, // G5
                { f: 1046.50, d: 0.35 } // C6
            ];

            chord.forEach((item, idx) => {
                const noteStart = now + (idx * 0.12);
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(item.f, noteStart);

                gain.gain.setValueAtTime(0.18, noteStart);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + item.d + 0.1);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(noteStart);
                osc.stop(noteStart + item.d + 0.1);
            });
        } catch (e) {}
    }

    // Suara Radio FM Tuning & DJ Needle Cue saat ada request musik (!play) masuk
    playRadioRequest() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;

            // 1. FM Frequency Whistle / Static Sweep (0.09s)
            const oscStatic = this.ctx.createOscillator();
            const gainStatic = this.ctx.createGain();
            oscStatic.type = 'sawtooth';
            oscStatic.frequency.setValueAtTime(1400, now);
            oscStatic.frequency.exponentialRampToValueAtTime(2800, now + 0.04);
            oscStatic.frequency.exponentialRampToValueAtTime(700, now + 0.09);

            gainStatic.gain.setValueAtTime(0.09, now);
            gainStatic.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            oscStatic.connect(gainStatic);
            gainStatic.connect(this.ctx.destination);
            oscStatic.start(now);
            oscStatic.stop(now + 0.09);

            // 2. Vinyl Needle Scratch Cue (0.07s)
            const oscScratch = this.ctx.createOscillator();
            const gainScratch = this.ctx.createGain();
            oscScratch.type = 'triangle';
            oscScratch.frequency.setValueAtTime(450, now + 0.03);
            oscScratch.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
            oscScratch.frequency.exponentialRampToValueAtTime(180, now + 0.10);

            gainScratch.gain.setValueAtTime(0.14, now + 0.03);
            gainScratch.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

            oscScratch.connect(gainScratch);
            gainScratch.connect(this.ctx.destination);
            oscScratch.start(now + 0.03);
            oscScratch.stop(now + 0.10);

            // 3. Radio Station Broadcast Chime (Tu-ning! F5 -> C6 at 0.09s and 0.18s)
            const chimeNotes = [
                { f: 698.46, t: 0.09, d: 0.16 }, // F5
                { f: 1046.50, t: 0.18, d: 0.26 } // C6
            ];

            chimeNotes.forEach(note => {
                const noteTime = now + note.t;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(note.f, noteTime);

                gain.gain.setValueAtTime(0.18, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + note.d);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(noteTime);
                osc.stop(noteTime + note.d);
            });
        } catch (e) {}
    }

    // Radio & Vinyl Ambiance Layer Generator (Lo-fi Background for Music)
    setRadioAmbiance(enabled, vol = 20) {
        this.radioAmbianceEnabled = !!enabled;
        this.radioAmbianceVolume = parseInt(vol) || 20;
        try {
            localStorage.setItem('wordle_radio_ambiance', this.radioAmbianceEnabled ? 'true' : 'false');
            localStorage.setItem('wordle_radio_ambiance_vol', this.radioAmbianceVolume);
        } catch(e) {}

        if (!this.radioAmbianceEnabled) {
            this.stopRadioAmbiance();
        } else if (this.isRadioAmbiancePlaying && this.radioAmbianceGain) {
            const targetGain = (this.radioAmbianceVolume / 100) * 0.16;
            this.radioAmbianceGain.gain.setValueAtTime(this.radioAmbianceGain.gain.value, this.ctx.currentTime);
            this.radioAmbianceGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.1);
        }
    }

    startRadioAmbiance() {
        if (!this.enabled || !this.radioAmbianceEnabled) return;
        this.init();
        if (!this.ctx) return;
        if (this.isRadioAmbiancePlaying) return;

        try {
            if (!this.ambianceBuffer) {
                const bufferSize = this.ctx.sampleRate * 3; // 3-second seamless loop buffer
                const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
                const left = buffer.getChannelData(0);
                const right = buffer.getChannelData(1);

                let lastOutL = 0;
                let lastOutR = 0;
                for (let i = 0; i < bufferSize; i++) {
                    // Pink noise base for warm radio air
                    const whiteL = Math.random() * 2 - 1;
                    const whiteR = Math.random() * 2 - 1;
                    lastOutL = (lastOutL * 0.94) + (whiteL * 0.06);
                    lastOutR = (lastOutR * 0.94) + (whiteR * 0.06);
                    left[i] = lastOutL * 0.35;
                    right[i] = lastOutR * 0.35;

                    // Subtle vinyl crackle pops (approx 10 pops/second)
                    if (Math.random() < 0.00035) {
                        const click = (Math.random() * 2 - 1) * 0.75;
                        left[i] += click;
                        right[i] += click * 0.8;
                    }
                }
                this.ambianceBuffer = buffer;
            }

            const noiseNode = this.ctx.createBufferSource();
            noiseNode.buffer = this.ambianceBuffer;
            noiseNode.loop = true;

            // Bandpass filter to simulate AM/FM radio bandwidth (400Hz - 3600Hz)
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1800;
            filter.Q.value = 0.75;

            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            const targetGain = (this.radioAmbianceVolume / 100) * 0.16;
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.001, targetGain), now + 0.8);

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noiseNode.start(now);
            this.radioAmbianceNode = noiseNode;
            this.radioAmbianceGain = gain;
            this.isRadioAmbiancePlaying = true;
        } catch(e) {
            console.warn('[Audio] Failed to start radio ambiance', e);
        }
    }

    stopRadioAmbiance() {
        if (!this.isRadioAmbiancePlaying || !this.radioAmbianceGain || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            this.radioAmbianceGain.gain.setValueAtTime(this.radioAmbianceGain.gain.value, now);
            this.radioAmbianceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

            const node = this.radioAmbianceNode;
            setTimeout(() => {
                try { if (node) { node.stop(); node.disconnect(); } } catch(e) {}
            }, 600);

            this.radioAmbianceNode = null;
            this.radioAmbianceGain = null;
            this.isRadioAmbiancePlaying = false;
        } catch(e) {}
    }
}

window.sounds = new SoundEngine();
