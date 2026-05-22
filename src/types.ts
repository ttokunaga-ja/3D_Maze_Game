// 0=床, 1=外壁, 2=ゴール, 3=部屋境界壁
export type MapCell = 0 | 1 | 2 | 3;
export type MapGrid = MapCell[][];

export type ItemKind = 'wallBreaker' | 'healPotion' | 'timeBonus';

export interface Inventory {
  wallBreaker: number;
}

export interface ToastMessage {
  text: string;
  color: string;
  expiresAt: number;
}

export type GameResult = 'win' | 'lose' | 'timeup';
