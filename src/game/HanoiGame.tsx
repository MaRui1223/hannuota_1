import { useEffect, useReducer, useState, type FC } from "react";
import clsx from "clsx";
import { MousePointerClick, RotateCcw, Trophy, Volume2, VolumeX } from "lucide-react";
import { DISK_COUNT_OPTIONS, TOWER_ORDER, minMoves, type TowerId } from "./hanoiData";
import { createInitialState, gameReducer } from "./gameReducer";
import { playInvalidSound, playMoveSound, playWinSound, setSoundEnabled } from "./soundEffects";
import Tower from "./Tower";
import DiskLayer from "./DiskLayer";

/** 抖动反馈时长（ms）：动画结束后清除反馈状态，便于下次非法移动重新触发 */
const SHAKE_DURATION = 450;
/** Toast 自动消失时长（ms） */
const TOAST_DURATION = 1800;
/** 非法移动 Toast 文案 */
const TOAST_INVALID_MOVE = "无法放置：大盘不能压小盘";

/**
 * 汉诺塔挑战 · 主组件
 * 交互：点击柱子选中顶端圆盘（高亮发光）→ 点击目标柱子平滑移动；
 * 非法移动抖动 + Toast + 音效；把全部圆盘移到柱 B 或柱 C 即通关弹出胜利卡片。
 * 响应式：棋盘尺寸 / 字号 / 间距随视口宽度自适应，手机竖屏不溢出。
 */
const HanoiGame: FC = () => {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const { towers, diskCount, moves, selected, shake, won } = state;

  // 音效开关（纯视图层状态，默认开启）
  const [soundOn, setSoundOn] = useState(true);
  // 非法移动 Toast：随抖动序号触发，自动消失
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const shakeSeq = shake?.seq ?? 0;

  /** 柱子 / 圆盘统一点击入口（圆盘点击等价于点击其所在柱子，复用 TOWER_CLICK） */
  const handleTowerClick = (id: TowerId) => dispatch({ type: "TOWER_CLICK", towerId: id });

  // 合法移动音效：步数增加时播放（重置归零不触发）
  useEffect(() => {
    if (moves > 0) playMoveSound();
  }, [moves]);

  // 非法移动：抖动动画结束后清除反馈状态
  useEffect(() => {
    if (shake === null) return;
    const timer = window.setTimeout(() => dispatch({ type: "CLEAR_SHAKE" }), SHAKE_DURATION);
    return () => window.clearTimeout(timer);
  }, [shake]);

  // 非法移动音效 + Toast 提示，超时自动隐藏
  useEffect(() => {
    if (shakeSeq === 0) return;
    playInvalidSound();
    setToastMsg(TOAST_INVALID_MOVE);
    const timer = window.setTimeout(() => setToastMsg(null), TOAST_DURATION);
    return () => window.clearTimeout(timer);
  }, [shakeSeq]);

  // 通关胜利音效（琶音）
  useEffect(() => {
    if (won) playWinSound();
  }, [won]);

  /** 切换音效开关：同步更新模块开关状态 */
  const handleToggleSound = () => {
    setSoundOn((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      return next;
    });
  };

  // 效率评价：完美通关（步数 = 理论最少）或效率百分比
  const theoryMin = minMoves(diskCount);
  const isPerfect = moves <= theoryMin;
  const efficiency = Math.round((theoryMin / moves) * 100);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#F5F6F8] px-4 dark:bg-slate-900">
      <div className="relative flex w-full max-w-3xl animate-in fade-in duration-200 ease-out flex-col items-center gap-5 sm:gap-8">
        {/* 顶部信息区：游戏标题 / 步数计数器 / 难度选择 / 音效开关 / 重新开始 */}
        <header className="flex flex-col items-center gap-2.5 sm:gap-3">
          <h1 className="text-2xl font-bold tracking-wide text-slate-900 dark:text-slate-100 sm:tracking-widest md:text-4xl">
            汉诺塔挑战
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {/* 步数计数器 */}
            <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800 sm:gap-2.5 sm:px-5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                当前步数
              </span>
              <span className="text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">
                {moves}
              </span>
            </div>
            {/* 难度选择按钮组：3 / 4 / 5 / 6 个圆盘，切换自动重置（触控尺寸 ≥32px） */}
            <div
              role="group"
              aria-label="难度选择"
              className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="px-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 sm:px-2">
                圆盘
              </span>
              {DISK_COUNT_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  aria-pressed={diskCount === count}
                  onClick={() => dispatch({ type: "SET_DISK_COUNT", count })}
                  className={clsx(
                    "h-8 w-8 rounded-full text-xs font-bold transition-all active:scale-90",
                    diskCount === count
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/40"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700",
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
            {/* 音效开关 */}
            <button
              type="button"
              onClick={handleToggleSound}
              aria-pressed={soundOn}
              aria-label={soundOn ? "关闭音效" : "开启音效"}
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-90",
                soundOn
                  ? "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  : "border-slate-200/80 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-700/60 dark:text-slate-500",
              )}
            >
              {soundOn ? (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            {/* 重新开始 */}
            <button
              type="button"
              onClick={() => dispatch({ type: "RESET" })}
              className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-800 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              重新开始
            </button>
          </div>
        </header>

        {/* 游戏区域：三根垂直柱子（左 / 中 / 右）+ 圆盘层 + 底座（尺寸随视口缩放） */}
        <main aria-label="汉诺塔游戏区域" className="w-full">
          {/* .hanoi-board 提供 --disk-h / --row-h / --pole-h 响应式尺寸变量 */}
          <div className="hanoi-board relative">
            {/* 三柱等距栅格：列间距由 --tower-gap 变量控制（与圆盘层定位共用，确保中心线对齐） */}
            <div className="grid grid-cols-3" style={{ columnGap: "var(--tower-gap)" }}>
              {TOWER_ORDER.map((id) => (
                <Tower
                  key={id}
                  id={id}
                  diskTotal={towers[id].length}
                  isSelected={selected === id}
                  locked={won}
                  onSelect={handleTowerClick}
                />
              ))}
            </div>
            {/* 圆盘层：统一坐标系绝对定位（与柱子共用 --tower-gap 对齐中心线），移动平滑过渡 */}
            <DiskLayer
              towers={towers}
              diskCount={diskCount}
              selected={selected}
              shake={shake}
              locked={won}
              onTowerClick={handleTowerClick}
            />
          </div>
          {/* 底座：横向连接三根柱子（渐变 + 投影增强质感） */}
          <div className="h-5 w-full rounded-md bg-gradient-to-b from-[#6D4C3F] to-[#4E342E] shadow-md shadow-black/20" />
          {/* 柱子编号标注（与柱子栅格共用列间距变量） */}
          <div className="mt-2.5 grid grid-cols-3" style={{ columnGap: "var(--tower-gap)" }}>
            {TOWER_ORDER.map((id) => (
              <span
                key={id}
                className="text-center text-xs font-medium tracking-wider text-slate-400 dark:text-slate-500"
              >
                柱 {id}
              </span>
            ))}
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 sm:mt-4 sm:text-xs">
            <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
            点击柱子选中顶端圆盘，再点击目标柱子放置；把全部圆盘移到柱 B 或柱 C 即可通关
          </p>
        </main>

        {/* 胜利卡片：全部圆盘按规则移至柱 B 或柱 C */}
        {won && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="胜利提示"
            className="absolute inset-0 z-20 flex animate-in fade-in duration-300 items-center justify-center rounded-2xl bg-slate-900/50 p-4 backdrop-blur-sm"
          >
            <div className="relative w-[min(92vw,400px)] animate-in zoom-in-95 duration-300 overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 dark:bg-slate-800 dark:ring-white/10">
              {/* 顶部装饰性光晕 */}
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-amber-300/40 blur-3xl dark:bg-amber-400/25" />
              <div className="relative flex flex-col items-center gap-4 px-7 py-9 sm:gap-5 sm:px-8">
                {/* 奖杯徽章 */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-400 shadow-lg shadow-amber-500/40">
                  <Trophy className="h-10 w-10 text-white" aria-hidden="true" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    恭喜通关！
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    你完成了 {diskCount} 盘汉诺塔挑战
                  </p>
                </div>
                {/* 步数统计小卡片：实际步数 / 理论最少 */}
                <div className="grid w-full grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 py-3 text-center dark:bg-slate-700/50">
                    <div className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                      {moves}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">实际步数</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 py-3 text-center dark:bg-slate-700/50">
                    <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {theoryMin}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">理论最少</div>
                  </div>
                </div>
                {/* 效率评价 */}
                <p
                  className={clsx(
                    "rounded-full px-4 py-1.5 text-sm font-semibold",
                    isPerfect
                      ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                      : "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
                  )}
                >
                  {isPerfect ? "🏅 完美通关 · 理论最少步数！" : `⏱ 效率 ${efficiency}%，试试更少的步数？`}
                </p>
                {/* 渐变主按钮 */}
                <button
                  type="button"
                  onClick={() => dispatch({ type: "RESET" })}
                  className="mt-1 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-7 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:brightness-110 active:scale-95"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  再玩一次
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 非法移动 Toast 提示：自动消失 */}
      {toastMsg !== null && (
        <div
          role="alert"
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200 rounded-full bg-slate-900/90 px-5 py-2.5 text-sm font-medium text-white shadow-lg dark:bg-slate-700/95"
        >
          ⚠ {toastMsg}
        </div>
      )}
    </div>
  );
};

export default HanoiGame;
