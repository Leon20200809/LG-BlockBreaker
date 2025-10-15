// @file paddle.js
// 目的：パドル（バー）の位置・サイズ・速度・入力反映・描画。
// API 例：new Paddle(x, y, w, h) / update(dt) / draw(ctx) / handleInput(e)
import { clamp } from './utils.js';

export class Paddle {

    constructor(x, y, w, h, bounds) {
    // 位置（xは中心）、サイズ
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    // 画面境界
    this.bounds = bounds; // { left:0, right:canvasWidth }

    // 入力状態（マウス/タッチ）
    this._targetX = x; // 追従先（中心x）
    this._attached = false;
  }

    // attachInput(canvas) { /* addEventListener でマウス/タッチを購読 */ }
    attachInput(canvas) {
    if (this._attached) return;
    this._attached = true;

    // キャンバス内の相対座標に変換
    const toLocalX = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const ratio = canvas.width / rect.width; // CSSスケール対応
      return (clientX - rect.left) * ratio;
    };

    // マウス移動
    this._onMouseMove = (e) => {
      this._targetX = toLocalX(e.clientX);
    };
    canvas.addEventListener('mousemove', this._onMouseMove);

    // タッチ移動
    this._onTouchMove = (e) => {
      if (e.touches.length > 0) {
        this._targetX = toLocalX(e.touches[0].clientX);
      }
    };
    canvas.addEventListener('touchmove', this._onTouchMove, { passive: true });
  }
    // detachInput(canvas) { /* 片付け */ }
    detachInput(canvas) {
    if (!this._attached) return;
    this._attached = false;
    canvas.removeEventListener('mousemove', this._onMouseMove);
    canvas.removeEventListener('touchmove', this._onTouchMove);
  }

  // update(dt) { /* 入力/速度を位置に反映。画面外に出ないよう clamp */ }
  update(dt) {
    // 直接追従（スムージングは後で）
    this.x = this._targetX;

    // 画面外に出ないよう制限（中心xなので半分を引く/足す）
    const half = this.w / 2;
    this.x = clamp(this.x, this.bounds.left + half, this.bounds.right - half);
  }

  // draw(ctx) { /* 矩形描画。スキン変更はここ */ }
  draw(ctx) {
    // 中心基準 → 左上基準に変換して矩形描画
    const half = this.w / 2;
    ctx.fillStyle = '#3af';
    ctx.fillRect(this.x - half, this.y, this.w, this.h);
  }
}
