import type { FC, KeyboardEvent } from "react";
import clsx from "clsx";
import type { TowerId } from "./hanoiData";

interface TowerProps {
  /** 柱子编号 */
  id: TowerId;
  /** 该柱子当前圆盘数量（用于无障碍标签） */
  diskTotal: number;
  /** 该柱是否为当前选中柱（柱身提亮） */
  isSelected: boolean;
  /** 胜利后锁定柱子交互 */
  locked: boolean;
  /** 点击柱子：选中 / 取消选中 / 放置 的统一入口 */
  onSelect: (id: TowerId) => void;
}

/**
 * 柱子组件：深棕色渐变圆柱体 + 完整点击热区（整根柱子可点，触摸热区大）。
 * 柱高由 .hanoi-board 的 CSS 变量 --pole-h 控制，随视口宽度自适应缩放。
 * 圆盘由 DiskLayer 在统一坐标系中绝对定位渲染，本组件只负责柱身与交互。
 */
const Tower: FC<TowerProps> = ({ id, diskTotal, isSelected, locked, onSelect }) => {
  const handleClick = () => {
    if (!locked) onSelect(id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (locked) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault(); // 阻止空格触发页面滚动
      onSelect(id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`柱 ${id}，${diskTotal > 0 ? `${diskTotal} 个圆盘` : "空柱"}`}
      aria-disabled={locked}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        "group relative w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70",
        locked ? "cursor-default" : "cursor-pointer",
      )}
      style={{ height: "var(--pole-h)" }}
    >
      {/* 柱身：深棕色渐变圆柱体，底部与底座相接；悬停/选中时轻微提亮 */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div
          className={clsx(
            "relative w-4 rounded-t-full bg-gradient-to-b from-[#6D4C3F] to-[#4E342E] transition-all duration-150",
            !locked && "group-hover:brightness-110",
            isSelected && "brightness-125",
          )}
          style={{ height: "var(--pole-h)" }}
        >
          {/* 左侧受光面：高光条，增强圆柱立体质感 */}
          <div className="absolute top-2 bottom-2 left-[3px] w-[3px] rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
};

export default Tower;
