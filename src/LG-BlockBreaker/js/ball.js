// @file ball.js
// 目的：ボールの位置・速度・反射・加速度（将来）・描画。
// API：new Ball(x, y, r) / launch(angle, speed) / update(dt) / draw(ctx) / reset()

import { clamp } from './utils.js';

export class Ball {
    /* 設計メモ
      - 状態：
        - x, y（中心）/ r（半径）
        - vx, vy（速度）
        - speed（基準速度、難易度で上げる）
        - isLaunched（発射済みか）
      - 動作：
        - launch(angle, speed)：タイトル/準備中からの発射
        - 壁反射：左右で vx 反転、上下で vy 反転
        - 画面下に落下：ライフ減少 → ボール/パドルを初期位置へ reset
      - 当たり判定：
        - パドル：collision.js に委譲（ヒット位置で角度変更）
        - ブロック：collision.js に委譲（破壊/反射）
    */

  constructor(x, y, r, bounds) {
    this.x = x;
    this.y = y;
    this.r = r; // 半径
    this.bounds = bounds; // { top, bottom, left, right }

    // 速度（px/s）
    this.vx = 0;
    this.vy = 0;

    // 状態：発射済みか？
    this.isLaunched = false;

    // デフォルト速度（好みで調整）
    this.baseSpeed = 300;
  }

  /** パドルに吸着（準備状態）。パドル中心の真上に置く */
  stickToPaddle(paddle) {
    this.x = paddle.x;
    // パドルは左上基準で描いているので、y はそのまま上に配置
    this.y = paddle.y - this.r - 1; // 1px 隙間
    this.vx = 0;
    this.vy = 0;
    this.isLaunched = false;
  }

  /** 角度（deg）と速度で発射。上向き＝負の角度を使うと直感的 */
  launch(angleDeg = -60, speed = this.baseSpeed) {
    // rad ラジアン
    const rad = angleDeg * Math.PI / 180;
    // Canvasは下向きが+Yなので、sinが負だと“上向き”
    // 横と縦の移動速度を計算
    this.vx = Math.cos(rad) * speed;
    this.vy = Math.sin(rad) * speed;
    this.isLaunched = true;
  }

  // update(dt, bounds) { /* 移動と壁判定 */ }
  update(dt) {
    if (!this.isLaunched) {
      // 発射前は Game 側で stickToPaddle される想定（ここでは何もしない）
      return;
    }
    // 位置更新
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 壁反射（左右） *-1で反対向きに進む
    if (this.x - this.r < this.bounds.left) {
      this.x = this.bounds.left + this.r;
      this.vx *= -1;
    } else if (this.x + this.r > this.bounds.right) {
      this.x = this.bounds.right - this.r;
      this.vx *= -1;
    }

    // 壁反射（上下）
    if (this.y - this.r < this.bounds.top) {
      this.y = this.bounds.top + this.r;
      this.vy *= -1;
    } else if (this.y + this.r > this.bounds.bottom) {
      this.y = this.bounds.bottom - this.r;
      this.vy *= -1;
      // TODO: 下に抜けたらライフ減少・リスタート
    }
  }

  // draw(ctx) { /* 円描画 */ }
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.isLaunched ? '#fa3' : '#aaa'; // 発射前は色を変えて“準備中”を可視化
    ctx.fill();
  }

  // reset(x, y) { /* 位置/速度リセット */ }
}
