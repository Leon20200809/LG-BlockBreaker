// @file bricks.js
// 目的：ブロック群の生成・保持・描画・破壊管理。
// API：new Bricks(cols, rows, layout?) / forEachAlive(cb) / hitAt(col,row) / draw(ctx)

/* 設計メモ
      - データ構造：
        - 2次元配列 grid[y][x] にブロック情報を格納
          例）{ alive: true, hp: 1, color: '#f66', score: 50 }
        - タイル座標 → ピクセル座標の変換（tileW, tileH, margin）
      - 初期化：
        - 行列サイズ/レイアウト（難易度別パターン）/色テーマ
      - 操作：
        - 破壊：hp-- → 0 以下で alive=false、スコア加算
        - 残存数カウント：クリア判定に利用
      - 描画：
        - 生存ブロックのみ矩形描画（影や光沢は後で）
    */

    // constructor(cols, rows, tileW, tileH, offsetX, offsetY, layout) { ... }
    // forEachAlive(cb) { /* 生きてるブロックに対して処理 */ }
    // worldRectOf(col, row) { /* ブロックの世界座標矩形を返す（衝突で使用） */ }
    // hit(col, row) { /* ダメージ処理。スコアは呼び出し元で加算 */ }
    // remaining() { /* 残数 */ }
    // draw(ctx) { /* 描画 */ }

export class Bricks {
  /**
   * @param {number} cols 列数
   * @param {number} rows 行数
   * @param {number} tileW 1ブロックの幅
   * @param {number} tileH 1ブロックの高さ
   * @param {number} offsetX 左端の描画開始X
   * @param {number} offsetY 上端の描画開始Y
   */
  constructor(cols, rows, tileW, tileH, offsetX, offsetY) {
    this.cols = cols;
    this.rows = rows;
    this.tileW = tileW;
    this.tileH = tileH;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    // 2D配列 grid[row][col] にブロック情報を格納
    // alive=true のとき描画＆当たり判定の対象
    this.grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          alive: true,
          // 見やすい色分け（行で薄暗くなるだけの簡単なグラデ）
          color: `hsl(${(c / cols) * 360}, 70%, ${60 - r * 5}%)`,
          score: 50, // 後で加点に使う用
        });
      }
      this.grid.push(row);
    }
  }

  // 生存ブロックだけコールバック
  forEachAlive(cb) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const b = this.grid[r][c];
        if (!b.alive) continue;
        cb(c, r, b);
      }
    }
  }

  // タイル座標（c,r）→ ピクセル矩形 {x,y,w,h}
  worldRectOf(c, r) {
    return {
      x: this.offsetX + c * this.tileW,
      y: this.offsetY + r * this.tileH,
      w: this.tileW,
      h: this.tileH,
    };
  }

  // ヒットで破壊（今回はHP1想定）
  hit(c, r) {
    const b = this.grid[r][c];
    if (!b || !b.alive) return false;
    b.alive = false;
    return true;
  }

  remaining() {
    let n = 0;
    this.forEachAlive(() => n++);
    return n;
  }

  draw(ctx) {
    this.forEachAlive((c, r, b) => {
      const rect = this.worldRectOf(c, r);
      ctx.fillStyle = b.color;
      ctx.fillRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2); // 1pxマージンで見やすく
    });
  }
}
