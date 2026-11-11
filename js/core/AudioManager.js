/**
 * AudioManager: efectos y música sintetizados con Web Audio API.
 * No usa archivos de audio: todo se genera con osciladores y ruido.
 */
const NOTE_INDEX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

/** Convierte "A4" o "C#5" a frecuencia en Hz. */
function freq(note) {
  const m = /^([A-G]#?)(\d)$/.exec(note);
  if (!m) return 0;
  const midi = NOTE_INDEX[m[1]] + (parseInt(m[2], 10) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Separa una partitura escrita como texto: "A4 . C5 -" ( . = silencio, - = sostener ). */
const seq = (s) => s.trim().split(/\s+/);

/**
 * Pistas musicales. Cada paso es una corchea.
 * lead = melodía (onda cuadrada), bass = bajo (onda triangular).
 */
const TRACKS = {
  forest: {
    bpm: 104, wave: 'square',
    lead: seq(`A4 . C5 . E5 . D5 C5  B4 . G4 . A4 - - .  A4 . C5 . E5 . G5 F5  E5 . D5 . E5 - - .
               F5 . E5 . D5 . C5 .  B4 . C5 . D5 - - .  C5 . B4 . A4 . G#4 .  A4 - - . . . . .`),
    bass: seq(`A2 . . . A3 . . .  G2 . . . G3 . . .  F2 . . . F3 . . .  E2 . . . E3 . . .
               D2 . . . D3 . . .  G2 . . . G3 . . .  E2 . . . E3 . . .  A2 . . . A3 . . .`),
  },
  swamp: {
    bpm: 84, wave: 'triangle',
    lead: seq(`D4 . . F4 . . A4 .  G4 . F4 . E4 - - .  D4 . . F4 . . C5 .  A#4 . A4 . G4 - - .
               F4 . G4 . A4 . . .  A#4 . A4 . G4 . F4 .  E4 . . G4 . . C#4 .  D4 - - - . . . .`),
    bass: seq(`D2 . . . . . . .  A#1 . . . . . . .  D2 . . . . . . .  G1 . . . . . . .
               F2 . . . . . . .  G2 . . . . . . .  A1 . . . . . . .  D2 . . . . . . .`),
  },
  castle: {
    bpm: 118, wave: 'square',
    lead: seq(`E4 F4 E4 . G4 . E4 .  F4 E4 D4 . E4 - - .  E4 F4 E4 . A4 . G4 .  F4 E4 F4 . E4 - - .
               B4 . A4 . G4 . F4 .  E4 . F4 . G4 - - .  A4 . G4 F4 E4 . D4 .  E4 - - . . . . .`),
    bass: seq(`E2 E2 . E2 E2 . E2 .  F2 F2 . F2 F2 . F2 .  E2 E2 . E2 E2 . E2 .  D2 D2 . D2 E2 . E2 .
               G2 G2 . G2 G2 . G2 .  F2 F2 . F2 F2 . F2 .  A2 A2 . A2 G2 . F2 .  E2 E2 . E2 E2 . . .`),
  },
  battle: {
    bpm: 150, wave: 'square',
    lead: seq(`E5 E5 D5 E5 . B4 C5 D5  E5 . G5 F5 E5 D5 C5 B4  A4 A4 G4 A4 . E4 F4 G4  A4 . C5 B4 A4 G#4 A4 .`),
    bass: seq(`A2 A3 A2 A3 A2 A3 A2 A3  G2 G3 G2 G3 G2 G3 G2 G3  F2 F3 F2 F3 F2 F3 F2 F3  E2 E3 E2 E3 E2 E3 E2 E3`),
  },
  boss: {
    bpm: 168, wave: 'sawtooth',
    lead: seq(`D5 D5 C5 D5 . A4 A#4 C5  D5 . F5 E5 D5 C5 A#4 A4  G4 G4 F4 G4 . D4 E4 F4  G4 . A#4 A4 G4 F#4 G4 .`),
    bass: seq(`D2 D3 D2 D3 D2 D3 D2 D3  C2 C3 C2 C3 C2 C3 C2 C3  A#1 A#2 A#1 A#2 A#1 A#2 A#1 A#2  A1 A2 A1 A2 A1 A2 A1 A2`),
  },
  title: {
    bpm: 72, wave: 'triangle',
    lead: seq(`A4 - - . E5 - - .  D5 - C5 - B4 - - .  C5 - - . A4 - - .  B4 - G#4 - A4 - - .`),
    bass: seq(`A2 - - - - - - -  F2 - - - - - - -  C2 - - - - - - -  E2 - - - - - - -`),
  },
};

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.track = null;
    this.trackName = null;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
  }

  /** Los navegadores exigen una interacción del usuario antes de reproducir audio. */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.master);
      if (this.pendingTrack) this.playMusic(this.pendingTrack);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  /* ---------- Síntesis básica ---------- */

  tone(f, dur, { type = 'square', vol = 0.3, slide = null, when = 0, out = null } = {}) {
    if (!this.ctx || !f) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(out || this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur, { vol = 0.3, filter = 1200, when = 0 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const bq = this.ctx.createBiquadFilter();
    bq.type = 'lowpass';
    bq.frequency.value = filter;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bq).connect(g).connect(this.sfxGain);
    src.start(t);
  }

  /** Arpegio corto: lista de notas tocadas una tras otra. */
  arp(notes, stepDur, opts = {}) {
    notes.forEach((n, i) => this.tone(freq(n), stepDur * 1.4, { ...opts, when: i * stepDur }));
  }

  /* ---------- Efectos de sonido ---------- */

  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'jump': this.tone(220, 0.15, { slide: 520, vol: 0.18 }); break;
      case 'coin': this.arp(['B5', 'E6'], 0.06, { vol: 0.18 }); break;
      case 'potion': this.arp(['C5', 'E5', 'G5', 'C6'], 0.05, { type: 'triangle', vol: 0.25 }); break;
      case 'move': this.tone(660, 0.04, { vol: 0.12 }); break;
      case 'select': this.arp(['A5', 'E6'], 0.04, { vol: 0.15 }); break;
      case 'back': this.tone(330, 0.08, { vol: 0.12, slide: 220 }); break;
      case 'slash': this.noise(0.12, { vol: 0.35, filter: 4000 }); this.tone(900, 0.08, { slide: 300, vol: 0.12, type: 'sawtooth' }); break;
      case 'silver': this.noise(0.1, { vol: 0.3, filter: 6000 }); this.arp(['E6', 'B6'], 0.04, { type: 'triangle', vol: 0.15 }); break;
      case 'hit': this.noise(0.18, { vol: 0.45, filter: 900 }); this.tone(140, 0.15, { slide: 60, vol: 0.25 }); break;
      case 'crit': this.noise(0.25, { vol: 0.5, filter: 1500 }); this.tone(200, 0.25, { slide: 50, vol: 0.3, type: 'sawtooth' }); break;
      case 'fire': this.noise(0.5, { vol: 0.4, filter: 700 }); this.tone(120, 0.5, { slide: 400, vol: 0.15, type: 'sawtooth' }); break;
      case 'shield': this.arp(['G4', 'D5', 'G5'], 0.06, { type: 'triangle', vol: 0.22 }); break;
      case 'heal': this.arp(['C5', 'E5', 'G5', 'E5', 'G5', 'C6'], 0.06, { type: 'triangle', vol: 0.2 }); break;
      case 'miss': this.tone(500, 0.2, { slide: 250, vol: 0.12, type: 'triangle' }); break;
      case 'enemyAttack': this.noise(0.15, { vol: 0.35, filter: 600 }); this.tone(180, 0.12, { slide: 90, vol: 0.2, type: 'sawtooth' }); break;
      case 'battleStart': this.arp(['A4', 'C5', 'E5', 'A5', 'E5', 'A5', 'C6'], 0.05, { vol: 0.2 }); break;
      case 'victory': this.arp(['C5', 'E5', 'G5', 'C6', '-', 'G5', 'C6'], 0.1, { vol: 0.22 }); break;
      case 'levelUp': this.arp(['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'], 0.05, { type: 'triangle', vol: 0.22 }); break;
      case 'defeat': this.arp(['E4', 'D#4', 'D4', 'C#4'], 0.2, { type: 'triangle', vol: 0.25 }); break;
      case 'death': this.tone(400, 0.6, { slide: 60, vol: 0.25 }); break;
      case 'checkpoint': this.arp(['D5', 'A5', 'D6'], 0.08, { type: 'triangle', vol: 0.2 }); break;
      case 'clear': this.arp(['G4', 'C5', 'E5', 'G5', 'E5', 'G5', 'C6', '-', 'C6'], 0.09, { vol: 0.22 }); break;
      case 'locked': this.tone(110, 0.25, { vol: 0.2, type: 'sawtooth' }); break;
      case 'medallion': this.tone(1200, 0.05, { vol: 0.05, type: 'sine' }); break;
      default: break;
    }
  }

  /* ---------- Música (secuenciador con planificación anticipada) ---------- */

  playMusic(name) {
    if (this.trackName === name && this.timer) return;
    this.stopMusic();
    this.trackName = name;
    if (!this.ctx) { this.pendingTrack = name; return; }
    this.track = TRACKS[name];
    if (!this.track) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stopMusic() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.trackName = null;
    this.pendingTrack = null;
  }

  schedule() {
    const t = this.track;
    const stepDur = 60 / t.bpm / 2; // corcheas
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      const when = this.nextTime - this.ctx.currentTime;
      const i = this.step % t.lead.length;
      this.playStep(t.lead, i, stepDur, when, t.wave, 0.16);
      this.playStep(t.bass, this.step % t.bass.length, stepDur, when, 'triangle', 0.3);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  playStep(line, i, stepDur, when, type, vol) {
    const note = line[i];
    if (note === '.' || note === '-') return;
    // Calcula cuánto dura la nota contando los "-" que la siguen.
    let len = 1;
    while (line[(i + len) % line.length] === '-' && len < 8) len++;
    this.tone(freq(note), stepDur * len * 0.95, { type, vol, when: Math.max(0, when), out: this.musicGain });
  }
}
