/**
 * Web Audio API synthesizer for The Survival String.
 * Implements Low-Pass Filter sweep, heartbeat pulses, generator hum, and gunshot acoustics.
 */
class HorrorAudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.lpfNode = null;
    this.masterGain = null;
    this.generatorOsc = null;
    this.generatorGain = null;
    this.isGeneratorRunning = true;
    this.heartbeatInterval = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    // Master Low-Pass Filter for organic infection audio muffling
    this.lpfNode = this.ctx.createBiquadFilter();
    this.lpfNode.type = 'lowpass';
    this.lpfNode.frequency.setValueAtTime(22000, this.ctx.currentTime);

    this.masterGain.connect(this.lpfNode);
    this.lpfNode.connect(this.ctx.destination);

    this.startAmbientHum();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  // Sweeps low-pass filter cutoff based on infection percentage (0 to 100)
  setInfectionCutoff(infectionPct) {
    if (!this.ctx || !this.lpfNode) return;
    const norm = Math.max(0, Math.min(1, infectionPct / 100));
    // 22000 Hz down to 500 Hz
    const targetFreq = 22000 * Math.pow(1 - norm, 1.8) + 500;
    this.lpfNode.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }

  // Gunshot sound synthesis
  playGunshot() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(now);
  }

  // Heartbeat pulse synthesis
  playHeartbeat(rate = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Continuous diesel generator low-frequency hum
  startAmbientHum() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    this.generatorOsc = this.ctx.createOscillator();
    this.generatorGain = this.ctx.createGain();

    this.generatorOsc.type = 'sawtooth';
    this.generatorOsc.frequency.setValueAtTime(58, now); // ~58Hz diesel engine rumble

    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(140, now);

    this.generatorGain.gain.setValueAtTime(0.08, now);

    this.generatorOsc.connect(humFilter);
    humFilter.connect(this.generatorGain);
    this.generatorGain.connect(this.masterGain);

    this.generatorOsc.start(now);
  }

  toggleGeneratorHum(state) {
    this.isGeneratorRunning = state;
    if (this.generatorGain && this.ctx) {
      this.generatorGain.gain.setTargetAtTime(state ? 0.08 : 0.0, this.ctx.currentTime, 0.2);
    }
  }

  // Whispering frequency sweep simulation (Infection > 50)
  playWhisper() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(900, now + 0.4);
    osc.frequency.linearRampToValueAtTime(320, now + 0.9);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.Q.setValueAtTime(5, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  // Zombie gut growl when hunting/chasing player
  playZombieGrowl() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(65, now + 0.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.65);
  }

  // Fleshy bullet impact / bat thud on zombie
  playZombieHit() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Zombie death gargle / collapse
  playZombieDeath() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Warning alarm when hunted by horde/tracker
  playHuntedAlert() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.setValueAtTime(880, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Player damage grunt / flesh bite
  playPlayerDamage() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.2);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }
}

window.horrorAudio = new HorrorAudioSystem();

