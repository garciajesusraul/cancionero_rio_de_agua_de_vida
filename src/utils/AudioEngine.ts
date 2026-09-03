class WorshipAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private isPadActive: boolean = true;
  private isDrumActive: boolean = true;
  private bpm: number = 70;
  private drumTimer: number | null = null;

  // --- PAD WORSHIP tomado de PADCANCION.html (sawtooth + lowpass + scheduler por BPM) ---
  // NOTAS base octava 3 (C3-B3) - frecuencias del demo
  private readonly NOTAS: Record<string, number> = {
    'C': 130.81, 'C#': 138.59, 'Db': 138.59,
    'D': 146.83, 'D#': 155.56, 'Eb': 155.56,
    'E': 164.81,
    'F': 174.61, 'F#': 185.00, 'Gb': 185.00,
    'G': 196.00, 'G#': 207.65, 'Ab': 207.65,
    'A': 220.00, 'A#': 233.08, 'Bb': 233.08,
    'B': 246.94,
  };
  private readonly CHROMATIC_SCALE = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  // secuencia dinámica extraída de la canción actual (cada acorde = 4 tiempos por defecto)
  private padSequence: { acorde: string; tiempos: number }[] = [
    { acorde: 'Em', tiempos: 4 }, { acorde: 'D', tiempos: 4 }, { acorde: 'Am', tiempos: 4 }, { acorde: 'Em', tiempos: 4 },
  ];
  private padOsciladoresActivos: { osc: OscillatorNode; gainNode: GainNode }[] = [];
  private padIndiceActual = 0;
  private padProximoTiempo = 0;
  private padIntervalo: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(40, Math.min(220, newBpm));
    if (this.isPlaying && this.isDrumActive) {
      this.restartDrums();
    }
    // El pad lee bpm en vivo en el scheduler (como el slider del demo), no necesita reinicio
  }

  // Nueva API: acepta lista plana (4 tiempos) o secuencia ya con tiempos variables por acorde
  public setPadSequenceFromChords(chords: string[], tiemposPorAcorde = 4) {
    const cleaned = chords.map(c => c.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    this.padSequence = cleaned.map(c => ({ acorde: c, tiempos: tiemposPorAcorde }));
    if (this.isPlaying && this.isPadActive) {
      this.padIndiceActual = 0;
      this.padProximoTiempo = this.ctx ? this.ctx.currentTime : 0;
    }
  }
  public setPadSequence(sequence: { acorde: string; tiempos: number }[]) {
    const cleaned = sequence.filter(s => s.acorde && s.tiempos > 0);
    if (cleaned.length === 0) return;
    this.padSequence = cleaned;
    if (this.isPlaying && this.isPadActive) {
      this.padIndiceActual = 0;
      this.padProximoTiempo = this.ctx ? this.ctx.currentTime : 0;
    }
  }

  private chordToNotes(acorde: string): string[] {
    const m = acorde.match(/^([A-G][#b]?)(.*)$/);
    if (!m) return [];
    const root = m[1];
    const suffix = m[2] || '';
    // normaliza Db->C# etc
    let normRoot = root;
    if (normRoot === 'Db') normRoot = 'C#';
    if (normRoot === 'Eb') normRoot = 'D#';
    if (normRoot === 'Gb') normRoot = 'F#';
    if (normRoot === 'Ab') normRoot = 'G#';
    if (normRoot === 'Bb') normRoot = 'A#';
    const idx = this.CHROMATIC_SCALE.indexOf(normRoot);
    if (idx === -1) return [];
    const isMinor = suffix.toLowerCase().includes('m') && !suffix.toLowerCase().includes('maj');
    const thirdSemis = isMinor ? 3 : 4;
    const root2 = this.CHROMATIC_SCALE[idx];
    const third = this.CHROMATIC_SCALE[(idx + thirdSemis) % 12];
    const fifth = this.CHROMATIC_SCALE[(idx + 7) % 12];
    return [root2, third, fifth];
  }

  public setPadActive(active: boolean) {
    this.isPadActive = active;
    if (!active) {
      this.stopPad();
    } else if (this.isPlaying) {
      this.startPad();
    }
  }

  public setDrumActive(active: boolean) {
    this.isDrumActive = active;
    if (!active) {
      this.stopDrums();
    } else if (this.isPlaying) {
      this.startDrums();
    }
  }

  public togglePlay(): boolean {
    this.initCtx();
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      if (this.isPadActive) this.startPad();
      if (this.isDrumActive) this.startDrums();
    } else {
      this.stopPad();
      this.stopDrums();
    }

    return this.isPlaying;
  }

  public stopAll() {
    this.isPlaying = false;
    this.stopPad();
    this.stopDrums();
  }

  // --- PAD tomado textual de PADCANCION.html: tocarPad + scheduler ---
  private tocarPad(nombreAcorde: string, tiempoInicio: number) {
    if (!this.ctx || !this.isPlaying) return;
    const notasDelAcorde = this.chordToNotes(nombreAcorde);
    if (notasDelAcorde.length === 0) return;

    // 1. Apagar osciladores viejos suavemente (crossfade 1.2s como el demo)
    this.padOsciladoresActivos.forEach(item => {
      try {
        item.gainNode.gain.cancelScheduledValues(tiempoInicio);
        item.gainNode.gain.setValueAtTime(item.gainNode.gain.value, tiempoInicio);
        item.gainNode.gain.exponentialRampToValueAtTime(0.0001, tiempoInicio + 1.2);
        item.osc.stop(tiempoInicio + 1.2);
      } catch {}
    });
    this.padOsciladoresActivos = [];

    // 2. Filtro Lowpass 500Hz (colchón Worship)
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(500, tiempoInicio);

    // 3. Encender notas del acorde (sawtooth + ataque 1.0s a 0.08)
    notasDelAcorde.forEach(nota => {
      const f = this.NOTAS[nota];
      if (!f || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, tiempoInicio);
      gainNode.gain.setValueAtTime(0, tiempoInicio);
      gainNode.gain.linearRampToValueAtTime(0.08, tiempoInicio + 1.0);
      osc.connect(filtro);
      filtro.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      osc.start(tiempoInicio);
      this.padOsciladoresActivos.push({ osc, gainNode });
    });
  }

  private schedulerPad() {
    if (!this.ctx || !this.isPlaying) return;
    while (this.padProximoTiempo < this.ctx.currentTime + 0.1 && this.isPlaying) {
      const paso = this.padSequence[this.padIndiceActual % this.padSequence.length];
      const segPorTiempo = 60.0 / this.bpm;
      const dur = paso.tiempos * segPorTiempo;
      this.tocarPad(paso.acorde, this.padProximoTiempo);
      this.padProximoTiempo += dur;
      this.padIndiceActual = (this.padIndiceActual + 1) % this.padSequence.length;
    }
  }

  private startPad() {
    if (!this.ctx) return;
    this.stopPad();
    this.padIndiceActual = 0;
    this.padProximoTiempo = this.ctx.currentTime;
    // reloj cada 25ms como el demo (revisa BPM en vivo)
    this.padIntervalo = window.setInterval(() => this.schedulerPad(), 25);
    // dispara el primer acorde inmediatamente
    this.schedulerPad();
  }

  private stopPad() {
    if (this.padIntervalo !== null) {
      clearInterval(this.padIntervalo);
      this.padIntervalo = null;
    }
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.padOsciladoresActivos.forEach(item => {
        try {
          item.gainNode.gain.cancelScheduledValues(now);
          item.gainNode.gain.setValueAtTime(item.gainNode.gain.value, now);
          // pausa inmediata: 80ms (antes 500ms hacía parecer que no pausaba)
          item.gainNode.gain.linearRampToValueAtTime(0, now + 0.08);
          item.osc.stop(now + 0.1);
        } catch {
          try { item.osc.stop(); } catch {}
        }
      });
    } else {
      this.padOsciladoresActivos.forEach(item => { try { item.osc.stop(); } catch {} });
    }
    // limpia sync, no timeout largo
    this.padOsciladoresActivos = [];
  }

  private startDrums() {
    this.stopDrums();
    const intervalMs = (60 / this.bpm) * 1000;
    let step = 0;

    this.drumTimer = window.setInterval(() => {
      if (!this.ctx || !this.isDrumActive || !this.isPlaying) return;
      
      const now = this.ctx.currentTime;
      if (step % 4 === 0) {
        // Soft kick
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else {
        // Gentle hihat click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      }
      step = (step + 1) % 4;
    }, intervalMs);
  }

  private stopDrums() {
    if (this.drumTimer !== null) {
      clearInterval(this.drumTimer);
      this.drumTimer = null;
    }
  }

  private restartDrums() {
    if (this.isPlaying && this.isDrumActive) {
      this.startDrums();
    }
  }

  // --- PREVIEWS para Ajustes (no afectan isPlaying principal) ---
  private previewPadTimer: number | null = null;
  private previewDrumTimer: number | null = null;
  private previewPadNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private stopPreviewPad() {
    if (this.previewPadTimer !== null) { clearTimeout(this.previewPadTimer); this.previewPadTimer = null; }
    if (!this.ctx) { this.previewPadNodes.forEach(n => { try{ n.osc.stop(); }catch{} }); this.previewPadNodes=[]; return; }
    const now = this.ctx.currentTime;
    this.previewPadNodes.forEach(n => {
      try { n.gain.gain.cancelScheduledValues(now); n.gain.gain.setValueAtTime(n.gain.gain.value, now); n.gain.gain.linearRampToValueAtTime(0, now+0.12); n.osc.stop(now+0.15); } catch{}
    });
    setTimeout(()=>{ this.previewPadNodes=[]; }, 200);
  }
  private stopPreviewDrum() {
    if (this.previewDrumTimer !== null) { clearInterval(this.previewDrumTimer); this.previewDrumTimer = null; }
  }
  public stopPreviews() { this.stopPreviewPad(); this.stopPreviewDrum(); }

  public previewPadStyle(style: string, bpmForPreview?: number) {
    this.initCtx();
    if (!this.ctx) return;
    this.stopPreviews();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    // mapping estilo -> carácter sonoro
    const cfg: Record<string, { type: OscillatorType; filter: number; gain: number; attack: number }> = {
      'Bright Shimmer': { type: 'sawtooth', filter: 900, gain: 0.09, attack: 0.35 },
      'Warm Ambient': { type: 'sine', filter: 520, gain: 0.11, attack: 0.9 },
      'Deep Celestial': { type: 'triangle', filter: 380, gain: 0.08, attack: 1.1 },
      'Default': { type: 'sawtooth', filter: 500, gain: 0.08, attack: 0.7 },
    };
    const c = cfg[style] || cfg['Default'];
    // demo: acorde G mayor 2 compases (8 tiempos) para escuchar
    const demoNotes = this.chordToNotes('G'); // G-B-D
    const now = this.ctx.currentTime;
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(c.filter, now);
    demoNotes.forEach(note => {
      const f = this.NOTAS[note];
      if (!f) return;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = c.type;
      osc.frequency.setValueAtTime(f, now);
      // shimmer: leve detune en una voz
      if (style === 'Bright Shimmer' && note === 'G') osc.detune.setValueAtTime(7, now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(c.gain, now + c.attack);
      osc.connect(filtro); filtro.connect(g); g.connect(this.ctx!.destination);
      osc.start(now);
      this.previewPadNodes.push({ osc, gain: g });
    });
    // auto-stop 3.2s
    this.previewPadTimer = window.setTimeout(() => this.stopPreviewPad(), 3200);
  }

  public previewDrumStyle(style: string) {
    this.initCtx();
    if (!this.ctx) return;
    this.stopPreviews();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const bpmMap: Record<string, number> = { 'Modern Worship': 82, 'Acoustic Ballad': 68, 'Upbeat Praise': 96 };
    const b = bpmMap[style] || 82;
    const intervalMs = (60 / b) * 1000;
    let step = 0;
    let ticks = 0;
    const maxTicks = 8; // 2 compases
    this.previewDrumTimer = window.setInterval(() => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (style === 'Upbeat Praise' && step % 4 === 2) {
        // snare en tiempo 3
        const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(180, now);
        g.gain.setValueAtTime(0.22, now); g.gain.exponentialRampToValueAtTime(0.01, now+0.12);
        const filt = this.ctx.createBiquadFilter(); filt.type='bandpass'; filt.frequency.setValueAtTime(200, now);
        osc.connect(filt); filt.connect(g); g.connect(this.ctx.destination); osc.start(now); osc.stop(now+0.12);
      } else if (step % 4 === 0) {
        const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(style === 'Acoustic Ballad' ? 85 : 110, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now+0.18);
        g.gain.setValueAtTime(style === 'Acoustic Ballad' ? 0.2 : 0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now+0.18);
        osc.connect(g); g.connect(this.ctx.destination); osc.start(now); osc.stop(now+0.18);
      } else {
        const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(style === 'Acoustic Ballad' ? 650 : 820, now);
        g.gain.setValueAtTime(style === 'Acoustic Ballad' ? 0.025 : 0.045, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.05);
        osc.connect(g); g.connect(this.ctx.destination); osc.start(now); osc.stop(now+0.05);
      }
      step = (step+1)%4; ticks++;
      if (ticks >= maxTicks) this.stopPreviewDrum();
    }, intervalMs);
    // seguridad auto stop
    window.setTimeout(() => this.stopPreviewDrum(), maxTicks*intervalMs + 200);
  }
}

export const audioEngine = new WorshipAudioEngine();
