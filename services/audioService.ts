
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
      case 'crystal-morning': // 맑은 아침의 종소리 - 아이폰 스타일 (더 길고 풍성하게)
        const crystalMelody = [
          { f: 659.25, t: 0 }, { f: 783.99, t: 0.4 }, { f: 1046.50, t: 0.8 }, 
          { f: 783.99, t: 1.2 }, { f: 880.00, t: 1.6 }, { f: 659.25, t: 2.0 },
          { f: 783.99, t: 2.4 }, { f: 659.25, t: 2.8 }, { f: 523.25, t: 3.2 }
        ];
        crystalMelody.forEach(n => {
          this.playNote(ctx, n.f, now + n.t, 1.2, g, 'sine');
          this.playNote(ctx, n.f * 2, now + n.t, 0.8, g * 0.3, 'sine'); // Shimmer
        });
        break;

      case 'horizon-echo': // 지평선의 메아리 - 갤럭시 스타일 (웅장한 오케스트라 느낌)
        const horizonMelody = [
          { f: 493.88, t: 0 }, { f: 659.25, t: 0.5 }, { f: 739.99, t: 1.0 }, 
          { f: 987.77, t: 1.5 }, { f: 880.00, t: 2.2 }, { f: 739.99, t: 2.7 }, 
          { f: 659.25, t: 3.2 }, { f: 493.88, t: 4.0 }, { f: 659.25, t: 4.5 }
        ];
        horizonMelody.forEach(n => {
          this.playNote(ctx, n.f, now + n.t, 1.5, g, 'triangle');
          this.playNote(ctx, n.f / 2, now + n.t, 1.5, g * 0.5, 'sine'); // Bass layer
        });
        break;

      case 'nostalgic-melody': // 추억의 폴더폰 - 노키아 튠 (완전한 멜로디)
        const nokiaTune = [
          { f: 659.25, t: 0 }, { f: 587.33, t: 0.2 }, { f: 369.99, t: 0.4 }, { f: 415.30, t: 0.6 },
          { f: 554.37, t: 0.8 }, { f: 493.88, t: 1.0 }, { f: 293.66, t: 1.2 }, { f: 329.63, t: 1.4 },
          { f: 440.00, t: 1.6 }, { f: 392.00, t: 1.8 }, { f: 246.94, t: 2.0 }, { f: 261.63, t: 2.2 }
        ];
        nokiaTune.forEach(n => {
          this.playNote(ctx, n.f, now + n.t, 0.25, g, 'square');
        });
        break;

      case 'warm-piano': // 따스한 햇살 피아노 - 풍성한 코드와 멜로디
        const pianoProgression = [
          { chord: [261.63, 329.63, 392.00], t: 0, mel: 523.25 },
          { chord: [349.23, 440.00, 523.25], t: 1.5, mel: 659.25 },
          { chord: [392.00, 493.88, 587.33], t: 3.0, mel: 783.99 },
          { chord: [261.63, 329.63, 392.00], t: 4.5, mel: 523.25 }
        ];
        pianoProgression.forEach(p => {
          p.chord.forEach(f => this.playNote(ctx, f, now + p.t, 3.0, g * 0.3, 'sine'));
          this.playNote(ctx, p.mel, now + p.t + 0.3, 2.0, g * 0.5, 'sine');
        });
        break;

      case 'sunrise-edm': // 활기찬 시작 EDM - 4마디 빌드업과 드롭
        for (let i = 0; i < 32; i++) {
          const t = now + i * 0.125;
          const freq = i < 16 ? 110 : 55;
          this.playNote(ctx, freq, t, 0.1, g * (i < 16 ? 1.0 : 1.5), 'sawtooth');
          if (i % 4 === 0) this.playNote(ctx, 440, t, 0.05, g * 0.5, 'square');
          if (i > 16 && i % 2 === 0) this.playNote(ctx, 880, t + 0.06, 0.05, g * 0.3, 'sine');
        }
        break;

      case 'nature-chorus': // 숲속의 아침 산책 - 레이어드 자연음
        for (let i = 0; i < 20; i++) {
          const t = now + i * 0.3;
          // 새소리 1
          this.playSlide(ctx, 2500 + Math.sin(i) * 500, 3500, 0.15, g * 0.15, 'sine', t);
          // 새소리 2
          if (i % 2 === 0) this.playSlide(ctx, 4000, 3000, 0.2, g * 0.1, 'sine', t + 0.1);
          // 바람 소리
          if (i % 5 === 0) this.playNote(ctx, 100, t, 2.0, g * 0.05, 'sine');
        }
        break;

      case 'zen-sanctuary': // 명상 힐링 벨 - 싱잉볼 스타일
        const bowls = [146.83, 220.00, 293.66, 440.00];
        bowls.forEach((f, i) => {
          const t = now + i * 2.0;
          this.playNote(ctx, f, t, 8.0, g * 0.7, 'sine');
          this.playNote(ctx, f * 1.5, t + 0.1, 6.0, g * 0.2, 'sine');
          this.playNote(ctx, f * 2, t + 0.2, 4.0, g * 0.1, 'sine');
        });
        break;

      case 'pixel-quest': // 8비트 레트로 모험 - 경쾌한 게임 테마
        const marioStyle = [
          659.25, 659.25, 0, 659.25, 0, 523.25, 659.25, 0, 783.99, 0, 0, 0, 392.00
        ];
        marioStyle.forEach((f, i) => {
          if (f > 0) this.playNote(ctx, f, now + i * 0.15, 0.1, g, 'square');
        });
        break;

      case 'midnight-jazz': // 세련된 재즈 라운지 - 스윙 리듬 베이스와 코드
        const jazzNotes = [
          { f: 146.83, t: 0 }, { f: 220.00, t: 0.4 }, { f: 185.00, t: 0.75 }, { f: 146.83, t: 1.15 },
          { f: 164.81, t: 1.5 }, { f: 246.94, t: 1.9 }, { f: 220.00, t: 2.25 }, { f: 164.81, t: 2.65 }
        ];
        jazzNotes.forEach(n => {
          this.playNote(ctx, n.f, now + n.t, 0.4, g, 'triangle');
          if (n.t % 1.5 === 0) {
            [n.f * 1.5, n.f * 2].forEach(f => this.playNote(ctx, f, now + n.t, 1.0, g * 0.2, 'sine'));
          }
        });
        break;

      case 'panic-pulse': // 절대 못 자는 경고음 - 사이렌과 긴박한 비트
        for (let i = 0; i < 24; i++) {
          const t = now + i * 0.2;
          const freq = i % 2 === 0 ? 987.77 : 880.00;
          this.playSlide(ctx, freq, freq * 1.2, 0.15, g * 2.5, 'sawtooth', t);
          if (i % 4 === 0) this.playNote(ctx, 60, t, 0.1, g * 3, 'sine');
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

      case 'k-pop-morning': // 상큼발랄 K-POP - 밝고 빠른 신스 멜로디
        const kpop = [
          { f: 523.25, t: 0 }, { f: 523.25, t: 0.15 }, { f: 587.33, t: 0.3 }, { f: 659.25, t: 0.45 },
          { f: 783.99, t: 0.6 }, { f: 880.00, t: 0.75 }, { f: 783.99, t: 0.9 }, { f: 659.25, t: 1.05 },
          { f: 523.25, t: 1.2 }, { f: 523.25, t: 1.35 }, { f: 587.33, t: 1.5 }, { f: 659.25, t: 1.65 },
          { f: 783.99, t: 1.8 }, { f: 1046.50, t: 2.1 }
        ];
        kpop.forEach(n => {
          this.playNote(ctx, n.f, now + n.t, 0.15, g, 'sine');
          this.playNote(ctx, n.f * 1.01, now + n.t + 0.02, 0.15, g * 0.5, 'sine'); // Chorus effect
        });
        for (let i = 0; i < 16; i++) {
          this.playNote(ctx, 60, now + i * 0.2, 0.05, g * 1.5, 'sine'); // Kick
        }
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
