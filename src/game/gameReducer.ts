import {
  canMoveDisk,
  createInitialTowers,
  DEFAULT_DISK_COUNT,
  isWin,
  type DiskCount,
  type DiskSize,
  type TowerId,
  type TowersState,
} from "./hanoiData";

/** 非法移动反馈目标：disk 为被移动的圆盘，seq 递增用于重播抖动动画 */
export interface ShakeTarget {
  disk: DiskSize;
  seq: number;
}

/** 游戏核心状态（唯一权威数据源，UI 只读渲染） */
export interface GameState {
  /** 三根柱子的圆盘栈：数组末尾为栈顶（最上层圆盘） */
  towers: TowersState;
  /** 当前难度的圆盘总数 */
  diskCount: DiskCount;
  /** 已执行的合法移动步数 */
  moves: number;
  /** 当前选中的源柱编号（其顶端圆盘高亮），null 表示未选中 */
  selected: TowerId | null;
  /** 非法移动的视觉反馈目标，null 表示无反馈 */
  shake: ShakeTarget | null;
  /** 是否已胜利（全部圆盘移到柱 B 或柱 C，胜利后锁定棋盘） */
  won: boolean;
}

export type GameAction =
  /** 点击柱子：统一入口，reducer 内分流 选中 / 取消 / 校验移动 */
  | { type: "TOWER_CLICK"; towerId: TowerId }
  /** 抖动动画结束后清除反馈状态 */
  | { type: "CLEAR_SHAKE" }
  /** 切换难度：圆盘数量改为 count 并重置游戏 */
  | { type: "SET_DISK_COUNT"; count: DiskCount }
  /** 重新开始：圆盘归位柱 A、步数清零、取消选中（保持当前难度） */
  | { type: "RESET" };

export const createInitialState = (count: DiskCount = DEFAULT_DISK_COUNT): GameState => ({
  towers: createInitialTowers(count),
  diskCount: count,
  moves: 0,
  selected: null,
  shake: null,
  won: false,
});

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "TOWER_CLICK": {
      const { towerId } = action;
      // 胜利后锁定棋盘，需点击"再玩一次"或"重新开始"
      if (state.won) return state;

      // 第一次点击：选中该柱顶端圆盘（空柱无圆盘可选中）
      if (state.selected === null) {
        if (state.towers[towerId].length === 0) return state;
        return { ...state, selected: towerId, shake: null };
      }

      // 再次点击同一柱：取消选中
      if (state.selected === towerId) {
        return { ...state, selected: null };
      }

      // 点击目标柱：移动前必须执行规则校验
      const from = state.selected;
      const moving: DiskSize = state.towers[from][state.towers[from].length - 1];
      if (!canMoveDisk(state.towers, from, towerId)) {
        // 非法移动（大压小）：不更新数据，被移动圆盘抖动 + Toast 提示，保持选中状态
        return { ...state, shake: { disk: moving, seq: (state.shake?.seq ?? 0) + 1 } };
      }

      // 合法移动：源柱弹出栈顶，目标柱压入栈顶，步数+1
      const towers: TowersState = {
        ...state.towers,
        [from]: state.towers[from].slice(0, -1),
        [towerId]: [...state.towers[towerId], moving],
      };
      return {
        ...state,
        towers,
        moves: state.moves + 1,
        selected: null,
        shake: null,
        won: isWin(towers, state.diskCount),
      };
    }
    case "CLEAR_SHAKE":
      return state.shake === null ? state : { ...state, shake: null };
    case "SET_DISK_COUNT":
      // 切换难度自动重置游戏；重复点击当前难度不产生副作用
      if (action.count === state.diskCount) return state;
      return createInitialState(action.count);
    case "RESET":
      return createInitialState(state.diskCount);
    default:
      return state;
  }
};
