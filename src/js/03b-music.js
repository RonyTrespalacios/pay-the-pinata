// ---------- MUSIC: a small procedural party band (no assets) ----------
// A sequencer on the Web Audio clock: bass, plucked guitar arpeggio, shaker and clap over a four-chord loop.
// The Backyard plays it bright; a Run lifts the tempo; when a Tab is overdue it slips into minor and drags.
const MUSIC = { on: false, ctx: null, gain: null, next: 0, step: 0, timer: null, mode: 'hub', bpm: 112, chord: 0 };
const CHORDS_MAJOR = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [5, 9, 12]];           // I IV V IV
const CHORDS_MINOR = [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-4, 0, 3]];           // i VI VII VI
const ROOT = 130.81;   // C3
const noteHz = semi => ROOT * Math.pow(2, semi / 12);
function musicBus() {
  if (!AUDIO.ctx) AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)();
  const c = AUDIO.ctx; if (c.state === 'suspended') c.resume();
  if (!MUSIC.gain) { MUSIC.gain = c.createGain(); MUSIC.gain.gain.value = 0; MUSIC.gain.connect(c.destination); }
  MUSIC.ctx = c; return c;
}
function musicVolume() { const v = S.perm.musicVol == null ? 0.5 : S.perm.musicVol; return S.perm.muted ? 0 : v; }
function applyMusicVolume() { if (MUSIC.gain) MUSIC.gain.gain.setTargetAtTime(0.22 * musicVolume(), MUSIC.ctx.currentTime, 0.3); }
function startMusic() {
  if (MUSIC.on) return; try { musicBus(); } catch (e) { return; }
  MUSIC.on = true; MUSIC.next = MUSIC.ctx.currentTime + 0.1; MUSIC.step = 0; applyMusicVolume();
  MUSIC.timer = setInterval(scheduleMusic, 90);
}
function stopMusic() { MUSIC.on = false; if (MUSIC.timer) clearInterval(MUSIC.timer); MUSIC.timer = null; if (MUSIC.gain) MUSIC.gain.gain.setTargetAtTime(0, MUSIC.ctx.currentTime, 0.4); }
function setMusicMode(mode) { MUSIC.mode = mode; }
function pluck(c, t, hz, dur, vol, type) {
  const o = c.createOscillator(), g = c.createGain(); o.type = type || 'triangle'; o.frequency.setValueAtTime(hz, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(MUSIC.gain); o.start(t); o.stop(t + dur + 0.02);
}
function shaker(c, t, vol, dur) {
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2); }
  const s = c.createBufferSource(); s.buffer = noiseBuf; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000; const g = c.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(MUSIC.gain); s.start(t); s.stop(t + dur + 0.02);
}
function scheduleMusic() {
  if (!MUSIC.on) return; const c = MUSIC.ctx;
  const dread = typeof DREAD !== 'undefined' && DREAD.on;
  const bpm = dread ? 78 : MUSIC.mode === 'run' ? 124 : 108; const beat = 60 / bpm, sixteenth = beat / 4;
  while (MUSIC.next < c.currentTime + 0.25) {
    const s = MUSIC.step % 64, bar = Math.floor((MUSIC.step % 64) / 16), pos = s % 16; const t = MUSIC.next;
    const chords = dread ? CHORDS_MINOR : CHORDS_MAJOR; const ch = chords[bar];
    // bass: root on 1 and the "and" of 2, fifth on 3 (a cumbia-ish bounce)
    if (pos === 0) pluck(c, t, noteHz(ch[0] - 12), beat * 0.9, 0.5, 'sine');
    if (pos === 6) pluck(c, t, noteHz(ch[0] - 12), beat * 0.5, 0.35, 'sine');
    if (pos === 8) pluck(c, t, noteHz(ch[2] - 12), beat * 0.9, 0.45, 'sine');
    if (pos === 12 && !dread) pluck(c, t, noteHz(ch[0] - 5), beat * 0.4, 0.3, 'sine');
    // guitar: offbeat chord stabs (hub) or a running arpeggio (run)
    if (MUSIC.mode === 'run' && !dread) { const n = ch[[0, 1, 2, 1][Math.floor(pos / 2) % 4]] + (pos % 8 >= 4 ? 12 : 0); if (pos % 2 === 0) pluck(c, t, noteHz(n + 12), sixteenth * 1.8, 0.16, 'triangle'); }
    else if (pos % 4 === 2) ch.forEach((n, i) => pluck(c, t + i * 0.012, noteHz(n + 12), beat * (dread ? 1.4 : 0.6), dread ? 0.1 : 0.14, dread ? 'sawtooth' : 'triangle'));
    // melody: a little phrase every other bar
    if (!dread && (bar === 1 || bar === 3) && [0, 3, 6, 8, 10, 12].includes(pos)) { const mel = [12, 14, 16, 19, 16, 14]; const idx = [0, 3, 6, 8, 10, 12].indexOf(pos); pluck(c, t, noteHz(ch[0] + mel[idx]), sixteenth * 3, 0.13, 'square'); }
    if (dread && pos === 0 && bar % 2 === 0) pluck(c, t, noteHz(ch[0] + 24), beat * 3.5, 0.06, 'sine');
    // percussion
    if (pos % 2 === 0) shaker(c, t, pos % 4 === 0 ? 0.12 : 0.06, 0.06);
    if (pos === 4 || pos === 12) shaker(c, t, 0.25, 0.12);   // clap-ish
    MUSIC.next += sixteenth; MUSIC.step++;
  }
}
