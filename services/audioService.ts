
class AudioService {
  private audioContext: AudioContext | null = null;
  private loopInterval: number | null = null;

  private initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  play(soundId: string, volume: number = 50) {
    this.initContext();
    this.triggerSound(soundId, volume);
  }

  startAlarmLoop(soundId: string, volume: number = 50) {
    this.stopAlarmLoop();
    this.initContext();
    
    this.triggerSound(soundId, volume);
    
    // 멜로디가 길어졌으므로 반복 주기를 8초로 늘림
    this.loopInterval = window.setInterval(() => {
      this.triggerSound(soundId, volume);
    }, 8000);
  }

  stopAlarmLoop() {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    if (this.audioContext) {
      // 모든 소리를 즉시 멈추기 위해 컨텍스트를 일시 중지했다가 재개
      this.audioContext.suspend().then(() => {
        this.audioContext?.resume();
      });
    }
  }

  private triggerSound(soundId: string, volume: number) {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const g = (volume / 100) * 0.6;

    switch (soundId) {
      case 'crystal-morning': // 맑은 아침의 종소리 - 더 길고 우아하게
        const crystalNotes = [659.25, 783.99, 1046.50, 783.99, 880.00, 659.25];
        crystalNotes.forEach((f, i) => {
          this.playNote(ctx, f, now + i * 0.6, 0.8, g, 'sine');
        });
        break;

      case 'horizon-echo': // 지평선의 메아리 - 웅장한 전개
        const horizonNotes = [493.88, 659.25, 739.99, 987.77, 880.00, 739.99, 659.25];
        horizonNotes.forEach((f, i) => {
          this.playNote(ctx, f, now + i * 0.7, 1.0, g, 'triangle');
        });
        break;

      case 'nostalgic-melody': // 추억의 폴더폰 - 멜로디 반복 및 확장
        const nokia = [659.25, 587.33, 369.99, 415.30, 659.25, 587.33, 369.99, 415.30];
        nokia.forEach((f, i) => {
          this.playNote(ctx, f, now + i * 0.3, 0.25, g, 'square');
        });
        break;

      case 'warm-piano': // 따스한 햇살 피아노 - 풍성한 코드 진행
        const pianoChords = [
          [261.63, 329.63, 392.00], // C
          [349.23, 440.00, 523.25], // F
          [392.00, 493.88, 587.33], // G
          [261.63, 329.63, 392.00, 523.25] // C2
        ];
        pianoChords.forEach((chord, i) => {
          chord.forEach(f => this.playNote(ctx, f, now + i * 1.2, 2.5, g * 0.4, 'sine'));
        });
        break;

      case 'sunrise-edm': // 활기찬 시작 EDM - 비트 수 증가
        for (let i = 0; i < 16; i++) {
          this.playNote(ctx, 110, now + i * 0.2, 0.15, g * 1.5, 'sawtooth');
          if (i % 2 === 0) this.playNote(ctx, 880, now + i * 0.2 + 0.1, 0.1, g * 0.5, 'square');
          if (i % 4 === 0) this.playNote(ctx, 55, now + i * 0.2, 0.3, g * 2, 'sine');
        }
        break;

      case 'nature-chorus': // 숲속의 아침 산책 - 더 많은 새소리와 앰비언스
        for (let i = 0; i < 12; i++) {
          const t = now + i * 0.4;
          this.playSlide(ctx, 2000 + Math.random() * 1500, 3000 + Math.random() * 1000, 0.2, g * 0.2, 'sine', t);
          if (i % 3 === 0) this.playNote(ctx, 150, t, 1.0, g * 0.1, 'sine'); // 바람 소리 느낌
        }
        break;

      case 'zen-sanctuary': // 명상 힐링 벨 - 긴 여운과 배음
        const zenFreqs = [110, 164.81, 220, 329.63];
        zenFreqs.forEach((f, i) => {
          this.playNote(ctx, f, now + i * 1.5, 6.0, g * 0.6, 'sine');
          this.playNote(ctx, f + 1, now + i * 1.5, 6.0, g * 0.3, 'sine');
        });
        break;

      case 'pixel-quest': // 8비트 레트로 모험 - 긴 아르페지오 패턴
        const pixelArp = [523.25, 659.25, 783.99, 1046.50, 880.00, 698.46, 523.25];
        for (let i = 0; i < 24; i++) {
          this.playNote(ctx, pixelArp[i % pixelArp.length], now + i * 0.15, 0.12, g, 'square');
        }
        break;

      case 'midnight-jazz': // 세련된 재즈 라운지 - 워킹 베이스 라인 확장
        const jazzLine = [146.83, 185.00, 220.00, 277.18, 293.66, 220.00, 185.00, 146.83];
        jazzLine.forEach((f, i) => {
          this.playNote(ctx, f, now + i * 0.5, 0.5, g, 'triangle');
        });
        break;

      case 'panic-pulse': // 절대 못 자는 경고음 - 더 빠르고 긴박하게
        for (let i = 0; i < 12; i++) {
          const freq = i % 2 === 0 ? 880 : 440;
          this.playNote(ctx, freq, now + i * 0.3, 0.15, g * 2.5, 'sawtooth');
          this.playNote(ctx, freq * 1.5, now + i * 0.3 + 0.1, 0.1, g * 1.5, 'square');
        }
        break;

      case 'ocean-waves': // 푸른 바다의 파도소리
        for (let i = 0; i < 5; i++) {
          const t = now + i * 2.0;
          this.playSlide(ctx, 100, 50, 2.0, g * 0.3, 'sine', t); // 파도 소리 베이스
          if (i % 2 === 0) {
            this.playSlide(ctx, 3000, 2500, 0.3, g * 0.1, 'sine', t + 0.5); // 갈매기 소리 느낌
          }
        }
        break;

      case 'rainy-window': // 창밖의 빗소리
        for (let i = 0; i < 40; i++) {
          const t = now + i * 0.15;
          this.playNote(ctx, 500 + Math.random() * 1000, t, 0.05, g * 0.05, 'sine');
        }
        break;

      case 'starlight-lullaby': // 별빛 아래 자장가 (오르골)
        const lullaby = [523.25, 659.25, 783.99, 659.25, 880.00, 783.99, 659.25, 523.25];
        lullaby.forEach((f, i) => {
          this.playNote(ctx, f, now + i * 0.8, 1.5, g * 0.8, 'sine');
          this.playNote(ctx, f * 2, now + i * 0.8, 1.0, g * 0.2, 'sine'); // 배음 추가
        });
        break;

      case 'techno-pulse': // 테크노 펄스
        for (let i = 0; i < 16; i++) {
          const t = now + i * 0.25;
          this.playNote(ctx, 60, t, 0.1, g * 2, 'sine'); // 킥
          this.playNote(ctx, 440, t + 0.125, 0.05, g * 0.5, 'square'); // 하이햇 느낌
          if (i % 4 === 0) this.playNote(ctx, 220, t, 0.2, g, 'sawtooth');
        }
        break;

      case 'morning-coffee': // 카페의 아침 (보사노바 리듬)
        const bossa = [196.00, 261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 261.63];
        bossa.forEach((f, i) => {
          this.playNote(ctx, f, now + i * 0.4, 0.3, g * 0.6, 'triangle');
          if (i % 2 === 0) this.playNote(ctx, 1000, now + i * 0.4 + 0.1, 0.05, g * 0.1, 'sine'); // 컵 소리 느낌
        });
        break;

      case 'space-odyssey': // 우주 오디세이
        for (let i = 0; i < 4; i++) {
          const t = now + i * 2.0;
          this.playSlide(ctx, 100, 400, 2.0, g * 0.4, 'sine', t);
          this.playSlide(ctx, 150, 50, 2.0, g * 0.2, 'triangle', t);
        }
        break;

      default:
        this.playNote(ctx, 440, now, 1.0, g);
    }
  }

  private playNote(ctx: AudioContext, freq: number, start: number, duration: number, gainVal: number, type: OscillatorType = 'sine') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(gainVal, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  }

  private playSlide(ctx: AudioContext, startFreq: number, endFreq: number, duration: number, gainVal: number, type: OscillatorType, start: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, start);
    osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
    gain.gain.setValueAtTime(gainVal, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  }
}

export const audioService = new AudioService();
