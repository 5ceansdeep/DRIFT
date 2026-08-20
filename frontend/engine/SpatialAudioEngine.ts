// Web Audio API 기반 HRTF 공간 음향 엔진.
// 브라우저 전용 API(AudioContext)에 의존하므로 클라이언트 컴포넌트에서만 사용할 것.
export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private pannerNodes: Map<string, PannerNode> = new Map();
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private analyser: AnalyserNode | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
    }
  }

  public registerAndPlay(
    trackId: string,
    url: string,
    position: [number, number, number]
  ) {
    this.init();
    if (!this.ctx || !this.analyser) return;

    if (this.audioElements.has(trackId)) {
      this.audioElements.get(trackId)?.play().catch(() => {});
      return;
    }

    const audio = new Audio(url);
    audio.crossOrigin = "anonymous";
    audio.loop = true;

    const source = this.ctx.createMediaElementSource(audio);
    const panner = this.ctx.createPanner();

    panner.panningModel = "HRTF";
    panner.distanceModel = "exponential";
    panner.refDistance = 10;
    panner.maxDistance = 120;

    panner.positionX.setValueAtTime(position[0], this.ctx.currentTime);
    panner.positionY.setValueAtTime(position[1], this.ctx.currentTime);
    panner.positionZ.setValueAtTime(position[2], this.ctx.currentTime);

    source.connect(panner);
    panner.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // 샘플 음원이 아직 없는 트랙(404 등)에서도 조용히 무시하고 계속 진행.
    audio.play().catch(() => {});
    this.audioElements.set(trackId, audio);
    this.pannerNodes.set(trackId, panner);
  }

  public stop(trackId: string) {
    this.audioElements.get(trackId)?.pause();
  }

  public updateListenerPosition(pos: [number, number, number]) {
    if (!this.ctx) return;
    const l = this.ctx.listener;
    l.positionX.setValueAtTime(pos[0], this.ctx.currentTime);
    l.positionY.setValueAtTime(pos[1], this.ctx.currentTime);
    l.positionZ.setValueAtTime(pos[2], this.ctx.currentTime);
  }

  public stopAll() {
    this.audioElements.forEach((audio) => audio.pause());
  }

  public getAnalyser() {
    return this.analyser;
  }
}

// 싱글턴 — 여러 컴포넌트에서 같은 AudioContext를 공유한다.
export const spatialAudioEngine = new SpatialAudioEngine();
