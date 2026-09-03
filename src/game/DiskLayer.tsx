import type { FC, KeyboardEvent } from "react";
import clsx from "clsx";
import {
  DISK_COLORS,
  TOWER_ORDER,
  diskSizeRatio,
  type DiskCount,
  type DiskSize,
  type TowerId,
  type TowersState,
} from "./hanoiData";
import type { ShakeTarget } from "./gameReducer";

interface DiskLayerProps {
  /** 三根柱子的圆盘栈（数组末尾为栈顶） */
  towers: TowersState;
  /** 当前难度的圆盘总数 */
  diskCount: DiskCount;
  /** 当前选中的源柱编号（null 为未选中） */
  selected: TowerId | null;
  /** 非法移动反馈目标（抖动的被移动圆盘） */
  shake: ShakeTarget | null;
  /** 胜利后锁定圆盘交互 */
  locked: boolean;
  /** 点击圆盘：等价于点击其所在柱子（复用 TOWER_CLICK 统一入口） */
  onTowerClick: (id: TowerId) => void;
}

/**
 * 圆盘层：在统一坐标系中绝对定位渲染全部圆盘（纯视图组件，只消费 gameReducer 状态）。
 *
 * 定位与对齐：
 * - left 使用与柱子 grid 完全一致的列中心公式（列宽 = (100% - 2*gap) / 3，
 *   中心 = i*(列宽+gap) + 列宽/2，gap 为 --tower-gap），配合 translateX(-50%)
 *   保证圆盘严格居中对齐柱子中心线，杜绝断点偏移。
 * - bottom 按层级 × 行高（--row-h 由 --disk-h + 2px 间隙派生）。
 * - 宽度以柱子槽位为基准容器，由 CSS 变量 --disk-min-pct ~ --disk-max-pct
 *   与比例因子线性换算（最大盘 ≤ 槽位 90%），无固定像素值，任何屏宽不溢出。
 *
 * 点击热区隔离：
 * - 容器 pointer-events-none（点击穿透到柱子热区），圆盘自身显式开启
 *   pointer-events-auto，热区 = 圆盘可见尺寸，无透明 padding 误触。
 * - z-index 严格按堆叠层级递增（顶部圆盘最高），确保上层圆盘优先响应。
 * - 点击圆盘复用柱子的 TOWER_CLICK 统一入口（等价于点击其所在柱子）。
 *
 * 动画：外层负责定位过渡（left/bottom/width 300ms 平滑），内层负责视觉状态
 * （渐变/高光/选中发光/非法抖动），避免 transform 相互覆盖。
 */
const DiskLayer: FC<DiskLayerProps> = ({
  towers,
  diskCount,
  selected,
  shake,
  locked,
  onTowerClick,
}) => {
  // 圆盘位置：所在柱编号 + 柱子索引（0/1/2）+ 层级（0 为栈底）
  const positions = new Map<
    DiskSize,
    { towerId: TowerId; towerIndex: number; level: number }
  >();
  TOWER_ORDER.forEach((id, towerIndex) => {
    towers[id].forEach((size, level) => {
      positions.set(size, { towerId: id, towerIndex, level });
    });
  });

  // 选中柱的顶端圆盘（栈顶元素）
  const selectedDisk =
    selected !== null ? towers[selected][towers[selected].length - 1] : undefined;

  return (
    // 容器穿透：空白区域点击直达柱子热区；圆盘在自身元素上显式开启 pointer-events
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: diskCount }, (_, i) => (i + 1) as DiskSize).map((size) => {
        const pos = positions.get(size);
        if (pos === undefined) return null;
        const isSelected = selectedDisk === size;
        const isShaking = shake?.disk === size;

        // 与柱子 grid 完全一致的列中心 calc（gap 共用 --tower-gap 变量）
        const towerCenter = `calc((100% - 2 * var(--tower-gap)) / 3 * ${pos.towerIndex + 0.5} + var(--tower-gap) * ${pos.towerIndex})`;
        // 宽度：以柱子槽位为基准，最小盘 --disk-min-pct% → 最大盘 --disk-max-pct% 线性
        const diskWidth = `calc((var(--disk-min-pct) + (var(--disk-max-pct) - var(--disk-min-pct)) * ${diskSizeRatio(size, diskCount)}) * 1%)`;

        const handleClick = () => {
          if (!locked) onTowerClick(pos.towerId);
        };

        const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
          if (locked) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault(); // 阻止空格触发页面滚动
            onTowerClick(pos.towerId);
          }
        };

        return (
          // 外层：定位 + 移动过渡 + 点击热区（热区 = 圆盘可见尺寸，z-index 层级递增）
          <div
            key={size}
            role="button"
            tabIndex={0}
            aria-label={`圆盘 ${size}，位于柱 ${pos.towerId}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={clsx(
              "group absolute rounded transition-all duration-300 ease-in-out focus-visible:outline-none",
              locked
                ? "pointer-events-none cursor-default"
                : "pointer-events-auto cursor-pointer",
            )}
            style={{
              left: towerCenter,
              bottom: `calc(var(--row-h) * ${pos.level})`,
              width: diskWidth,
              height: "var(--disk-h)",
              transform: "translateX(-50%)",
              // 点击热区隔离：堆叠层级越高 z-index 越大，顶部圆盘最高
              zIndex: pos.level + 1,
            }}
          >
            {/* 内层视觉圆盘：渐变 + 阴影 + 顶部高光 / 选中上浮发光 / 非法抖动，
                key 携带抖动序号以重播动画 */}
            <div
              key={isShaking ? `shake-${shake?.seq}` : "disk"}
              className={clsx(
                "relative flex h-full w-full items-center justify-center overflow-hidden rounded bg-gradient-to-b transition-all duration-150",
                DISK_COLORS[size],
                "shadow-md shadow-black/25 group-focus-visible:ring-2 group-focus-visible:ring-blue-400/70",
                isSelected &&
                  !isShaking &&
                  "-translate-y-1.5 brightness-110 ring-4 ring-white/90 shadow-[0_10px_22px_rgba(30,64,175,0.35),0_0_26px_rgba(147,197,253,0.9)]",
                isShaking &&
                  "animate-shake ring-4 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.75)]",
              )}
            >
              {/* 顶部高光条：模拟受光面，增强立体感 */}
              <div className="absolute inset-x-1.5 top-[3px] h-[3px] rounded-full bg-white/35" />
              <span className="relative z-10 text-[10px] font-bold tabular-nums text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] sm:text-xs">
                {size}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DiskLayer;
