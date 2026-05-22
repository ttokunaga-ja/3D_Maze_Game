# Javascript-3D-Maze-Game

Three.js + TypeScript + Vite で実装した 3D 迷路探索ゲームです。Cloudflare Pages での公開を前提に静的サイトとしてビルドします。

## 特徴

- **3D 迷路探索**: タンクコントロール（前進・後退・旋回）で迷路を探索
- **ミニマップ**: 視界範囲が自動で探索済み化、敵・アイテム位置も表示
- **アイテム 3 種**: 壁破壊ハンマー（能動）、HP 回復ポーション、時間延長砂時計（取得で自動効果）
- **敵 AI**: 視線が通れば追跡、壁越しは最後に見た位置へ向かう。頭上に HP バー表示
- **InstancedMesh による描画最適化**: 迷路全体を数 draw call で描画

## 操作方法

| キー / 操作 | 効果 |
|---|---|
| `W` | 前進（押下中ずっと） |
| `S` | 後退 |
| `A` | 左旋回 |
| `D` | 右旋回 |
| `Space` / 左クリック / 画面右下のボタン（モバイル） | 視線上の敵を攻撃、敵がいなければ壁を破壊（要 WallBreaker） |

## ゲームの遊び方

1. 迷路内を探索してゴール（緑タイル）を目指す
2. アイテムを拾うと効果発動：
   - 🔨 **WallBreaker**: 所持後、Space で目の前の壁を 1 個破壊
   - ❤ **HealPotion**: HP 回復（自動、満タン時は拾わない）
   - ⏱ **TimeBonus**: 残時間 +30 秒（自動）
3. 敵に接触されるとダメージ
4. 制限時間内にゴールタイルに到達すればクリア

## 開発

```bash
nvm use            # Node 20
npm install
npm run dev        # ローカル開発（HMR）
npm run typecheck  # TypeScript 型チェック
npm run build      # 本番ビルド → dist/
npm run preview    # 本番ビルドのローカル確認
```

## デプロイ（Cloudflare Pages）

リポジトリを Cloudflare Pages に接続し、以下を設定するだけで自動デプロイされます。

| 設定 | 値 |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |
| Environment variables | `NODE_VERSION=20` |

- `public/_headers` で `index.html` を `no-cache`、ハッシュ付き `assets/*` を `max-age=31536000, immutable` に分離
- `three` は独立 chunk として出力され、長期キャッシュが効きます
- feature ブランチを push すると自動でプレビュー URL が発行されます

## ファイル構成

```
.
├─ index.html              # エントリ HTML
├─ public/_headers         # Cloudflare Pages 配信制御
├─ src/
│  ├─ main.ts              # エントリ
│  ├─ Game.ts              # ゲームライフサイクル
│  ├─ styles.css
│  ├─ config/constants.ts  # 全チューニング値
│  ├─ types.ts
│  ├─ maze/                # 迷路生成（部屋分割アルゴリズム）
│  ├─ world/MapUtils.ts    # 座標変換と壁判定
│  ├─ scene/               # Renderer / Lighting / MazeMeshBuilder
│  ├─ entities/            # Robot / Enemy / Item
│  ├─ controls/            # InputState / PlayerController
│  └─ ui/                  # HUD / Minimap
├─ vite.config.ts
├─ tsconfig.json
└─ package.json
```

## ライセンス

[MIT License](https://opensource.org/licenses/MIT)
