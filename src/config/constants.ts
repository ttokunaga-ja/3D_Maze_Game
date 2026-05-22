// 迷路サイズ
export const MAP_SIZE = 65;
export const BLOCK_SIZE = 60;
export const WALL_HEIGHT = BLOCK_SIZE * 1.6;
export const FLOOR_Y = -BLOCK_SIZE / 2;
export const PLAYER_EYE_Y = FLOOR_Y + BLOCK_SIZE * 0.5;

// 迷路生成
export const MIN_ROOM_SIZE = 6;
export const MAX_ROOM_SIZE = 10;
export const MIN_SPACE_BETWEEN_ROOM_AND_ROAD = 3;

// プレイヤー
export const MOVE_SPEED = BLOCK_SIZE * 3.2;
// 旋回角速度（押した時間に比例して回転）
export const ROTATE_SPEED = Math.PI * 0.55;
export const INITIAL_HP = 300;
export const MAX_HP = 400;

// 戦闘
export const PLAYER_DAMAGE = 30;
export const ENEMY_DAMAGE = 10;
export const ENEMY_DAMAGE_INTERVAL_MS = 1500;
export const ATTACK_RANGE = BLOCK_SIZE * 1.6;
export const BREAK_RANGE = BLOCK_SIZE * 1.4;
export const ENEMY_INITIAL_HP = INITIAL_HP / 3;
export const BLOCK_INITIAL_HP = INITIAL_HP / 3;
export const BLOCK_DAMAGE = 100;

// 敵 AI
export const ENEMY_VIEW_RANGE = BLOCK_SIZE * 10;
export const ENEMY_STOP_DISTANCE = BLOCK_SIZE * 1.2;
export const ENEMY_MOVE_SPEED = MOVE_SPEED * 0.45;
export const ENEMY_ROTATE_SPEED = Math.PI * 2;

// アイテム
export const ITEM_PICKUP_RADIUS = BLOCK_SIZE * 0.55;
export const HEAL_AMOUNT = 100;
export const TIME_BONUS_SECONDS = 30;
export const WALL_BREAKER_CHARGES_PER_PICKUP = 5;

// タイマー
export const TIME_LIMIT_SECONDS = 240;

// カメラ
export const CAMERA_FOV = 75;
export const CAMERA_NEAR = 1;
export const CAMERA_FAR = BLOCK_SIZE * 18;
export const CAMERA_HEIGHT = BLOCK_SIZE * 1.1;
export const CAMERA_DISTANCE = BLOCK_SIZE * 2.6;
export const CAMERA_LOOK_AHEAD = BLOCK_SIZE * 3.0;

// ミニマップ
export const MINIMAP_VIEW_RANGE = 10;
export const MINIMAP_UPDATE_INTERVAL_MS = 500;
