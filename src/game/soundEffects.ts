/**
 * 汉诺塔音效模块（视图层）：
 * 基于 Web Audio API 实时合成简单音效，无外部音频资源依赖。
 * 由 HanoiGame 根据游戏状态变化触发，游戏逻辑层（hanoiData / gameReducer）不感知音效，
 * 保持逻辑与视图分离。
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

/** 音效总开关（由界面音效开关按钮切换） */
export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
};

/** 懒创建 AudioContext：首次用户交互时创建，满足浏览器自动播放策略；不支持时返回 null */
const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (Ctor === undefined) return null;
  if (audioCtx === null) {
    try {
      audioCtx = new Ctor();
    } catch {
      return null; // 浏览器不支持 Web Audio 时静默降级，不影响游戏
    }
  }
  // 被浏览器挂起时（如切后台后返回）尝试恢复
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
};

/** 播放单音：freq 频率 / delay 相对开始时间（秒）/ dur 时长（秒）/ type 波形 / peak 音量峰值 */
const playTone = (
  ctx: AudioContext,
  freq: number,
  delay: number,
  dur: number,
  type: OscillatorType,
  peak: number,
): void => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const startAt = ctx.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  // 音量包络：快速起音 + 指数衰减，避免爆音
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + dur + 0.02);
};

/** 合法移动音效：短促清脆的双音（低 → 高，模拟"拿起 → 放下"） */
export const playMoveSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (ctx === null) return;
  playTone(ctx, 520, 0, 0.09, "triangle", 0.18);
  playTone(ctx, 780, 0.07, 0.1, "triangle", 0.14);
};

/** 非法移动音效：低沉的短促提示音 */
export const playInvalidSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (ctx === null) return;
  playTone(ctx, 165, 0, 0.16, "square", 0.1);
};

/** 通关胜利音效：上行琶音（C5 → E5 → G5 → C6） */
export const playWinSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (ctx === null) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
    playTone(ctx, freq, index * 0.12, 0.22, "sine", 0.16);
  });
};
