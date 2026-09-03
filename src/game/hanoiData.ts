/**
 * 汉诺塔游戏数据结构与常量定义
 *
 * 数据结构约定：使用数组模拟栈结构存储圆盘状态，
 * 数组末尾为栈顶（柱子最上层圆盘），数组开头为栈底（最下层圆盘）。
 * 数字代表圆盘大小：数字越大圆盘越大。
 */

/** 难度选项：圆盘数量 */
export const DISK_COUNT_OPTIONS = [3, 4, 5, 6] as const;
export type DiskCount = (typeof DISK_COUNT_OPTIONS)[number];

/** 默认难度：5 个圆盘 */
export const DEFAULT_DISK_COUNT: DiskCount = 5;

/** 圆盘大小：1（最小）~ 6（最大） */
export type DiskSize = 1 | 2 | 3 | 4 | 5 | 6;

/** 柱子编号：左 A、中 B、右 C */
export type TowerId = "A" | "B" | "C";

/** 三根柱子的圆盘状态：键为柱子编号，值为该柱的圆盘大小栈 */
export type TowersState = Record<TowerId, DiskSize[]>;

/** 柱子展示顺序（左 → 中 → 右） */
export const TOWER_ORDER: TowerId[] = ["A", "B", "C"];

/**
 * 创建初始状态：count 个圆盘全部堆叠在柱 A 上，
 * 大圆盘在下（栈底）、小圆盘在上（栈顶），即 [count, ..., 2, 1]。
 */
export const createInitialTowers = (count: DiskCount): TowersState => ({
  A: Array.from({ length: count }, (_, i) => count - i) as DiskSize[],
  B: [],
  C: [],
});

/**
 * 圆盘配色（渐变上下色，增强立体感）：
 * 键为圆盘大小，值为 Tailwind 渐变止色类（配合 bg-gradient-to-b 使用），支持 6 种颜色。
 */
export const DISK_COLORS: Record<DiskSize, string> = {
  6: "from-rose-500 to-red-700",
  5: "from-orange-400 to-orange-600",
  4: "from-amber-300 to-amber-600",
  3: "from-emerald-400 to-green-600",
  2: "from-sky-400 to-blue-600",
  1: "from-violet-400 to-purple-600",
};

/**
 * 圆盘宽度比例因子（0 ~ 1）：最小盘 0、最大盘 1，中间按当前难度线性递减。
 * 实际宽度由 CSS 变量换算：--disk-min-pct% ~ --disk-max-pct%（以柱子槽位为基准容器），
 * 禁用固定像素值；小屏断点由 CSS 媒体查询自动下调最小阈值，防止挤压变形。
 */
export const diskSizeRatio = (size: DiskSize, count: DiskCount): number =>
  (size - 1) / (count - 1);

/**
 * 规则校验：判断从 from 柱顶端移动圆盘到 to 柱是否合法。
 * - 只能移动源柱最顶端的圆盘（本函数操作对象即栈顶元素）
 * - 源柱为空：无圆盘可移，非法
 * - 目标柱为空：总是合法
 * - 目标柱非空：仅当目标顶端圆盘 > 被移动圆盘时合法（大圆盘不能压在小圆盘上）
 */
export const canMoveDisk = (towers: TowersState, from: TowerId, to: TowerId): boolean => {
  if (from === to) return false;
  const source = towers[from];
  if (source.length === 0) return false;
  const moving = source[source.length - 1];
  const targetTop = towers[to][towers[to].length - 1];
  return targetTop === undefined || targetTop > moving;
};

/**
 * 胜利判定：所有圆盘按规则堆叠到柱 B（中）或柱 C（右）即通关。
 * 数量等于总圆盘数且从栈底到栈顶按大→小排列。
 */
export const isWin = (towers: TowersState, count: DiskCount): boolean =>
  [towers.B, towers.C].some(
    (tower) =>
      tower.length === count && tower.every((size, index) => size === count - index),
  );

/** 理论最少步数：2^n - 1 */
export const minMoves = (count: DiskCount): number => 2 ** count - 1;
