// @file game.js
// 目的：ゲームの司令塔。初期化・ゲームループ・シーン管理・入力配線を担う。
// 依存：paddle.js / ball.js / bricks.js / collision.js / utils.js

/* 設計メモ
  - GameState（'title' | 'playing' | 'paused' | 'clear' | 'gameover'）
  - システム：init() → start() → loop(update/draw)
  - 入力：マウス/タッチ/キーボードを Paddle に渡す
  - スコア、ライフ、ステージ進行の管理
*/

import { Paddle } from './paddle.js';
import { Ball } from './ball.js';
import { Bricks } from './bricks.js';
import { Collision } from './collision.js';
import * as U from './utils.js';

// TODO: 構造スケッチ
class Game {
  constructor(canvas) {
    // Canvasと描画コンテキスト
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 画面サイズ（DPR対応は後でutilsに切り出す）
    this.width = canvas.width;
    this.height = canvas.height;

    // 時間管理
    this._last = performance.now();
    this._running = false;

    // 状態（今日はほぼ使わない）
    this.state = 'title'; // title | ready | playing | paused | clear | gameover
  }

  init() {
    // 画面境界
    // ボールが動ける空間の限界座標を定義
    const bounds = { left: 0, right: this.width, top: 0, bottom: this.height };

    // パドルの初期位置：幅は画面の25%、高さは12px、底から40pxあたり
    const pw = Math.floor(this.width * 0.25);
    const ph = 12;
    const px = Math.floor(this.width / 2);      // 中心x
    const py = this.height - 100;                // yは上からのpx（下寄せ）
    // パドル操作 マウス＆スワイプ使用準備
    this.paddle = new Paddle(px, py, pw, ph, bounds);
    this.paddle.attachInput(this.canvas);

    // ボールの初期位置
    this.ball = new Ball(this.width / 2, this.height / 2, 8, bounds);
    this.ball.stickToPaddle(this.paddle); // ← 準備状態に入れる
    this.state = 'ready';

    // --- 発射入力（Canvasクリック/タップ） ---
    this._onCanvasClick = () => {
      if (this.state === 'ready') {
        // 角度は固定でもランダムでもOK。ここでは -45〜-135 をランダムにしてみる。
        const angle = -45 - Math.random() * 90; // 上向きの扇形にばらける
        this.ball.launch(angle);
        this.state = 'playing';
      }
    };
    this.canvas.addEventListener('click', this._onCanvasClick);

    // --- キーボード（Spaceで発射） ---
    this._onKeyDown = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        if (this.state === 'ready') {
          this.ball.launch(-60); // キー操作は固定角度でも扱いやすい
          this.state = 'playing';
        }
      }
    };
    window.addEventListener('keydown', this._onKeyDown);

    // ステージ初期化（Bricks 生成）
    // ブロック：列×行とタイルサイズ
    const cols = 10;
    const rows = 6;
    const tileW = Math.floor(this.width / cols);
    const tileH = 24;
    const offsetX = 0;
    const offsetY = 60; // ちょい下げて見やすく

    this.bricks = new Bricks(cols, rows, tileW, tileH, offsetX, offsetY);

    // スコアなど
    this.score = 0;
    // スコア/ライフ/メッセージ初期化
    // 入力イベント購読の設定
  }

  start() {
    // タイトル → プレイングへ遷移
    // ループ開始（requestAnimationFrame）
    if (this._running) return;
    this._running = true;
    this._last = performance.now();
    requestAnimationFrame(this._loop.bind(this));
  }

  _loop(now) {
    if (!this._running) return;

    // 経過時間（秒）
    let dt = (now - this._last) / 1000;
    this._last = now;
    // 可変fps対策：暴れたらクランプ（例: 最大1/30秒）
    if (dt > 1 / 30) dt = 1 / 30;

    this.update(dt);
    this.draw(this.ctx);

    requestAnimationFrame(this._loop.bind(this));
  }

  update(dt) {
    // 今日の時点では何もしない
    // TODO: 次フェーズで paddle.update(dt), ball.update(dt) などを呼ぶ
    // パドル更新
    if (this.paddle) this.paddle.update(dt);

    // ボール更新　下以外の壁の衝突処理はボールJS
    // 発射前はボールをパドルに吸着させ続ける（追従）
    if (this.ball) {
      if (this.state === 'ready' && this.paddle) {
        this.ball.stickToPaddle(this.paddle);
      } else {
        this.ball.update(dt);
      }
    }

    // パドル/ブロック衝突 → スコア加算/ブロック破壊/反射
    if (this.ball && this.paddle && this.state === 'playing') {
      Collision.ballWithPaddle(this.ball, this.paddle);
    }

    if (this.state === 'playing' && this.ball && this.bricks) {
      Collision.ballWithBricks(this.ball, this.bricks, (_c, _r, brick) => {
        // ここで加点やエフェクト
        this.score += brick.score ?? 50;
        // 難易度上げ：ヒット毎にちょっとスピードUPしたいならここで
        // const s = Math.hypot(this.ball.vx, this.ball.vy) * 1.02;
        // const ang = Math.atan2(this.ball.vy, this.ball.vx);
        // this.ball.vx = Math.cos(ang) * s;
        // this.ball.vy = Math.sin(ang) * s;
      });

      // クリア判定
      if (this.bricks.remaining() === 0) {
        this.state = 'clear';
      }
    }

    // ライフ減少・ゲームオーバー判定
  }

  draw() {
    const ctx = this.ctx;
    // 画面クリア（背景）
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#0b0f13';
    ctx.fillRect(0, 0, this.width, this.height);

    // ブロック → パドル → ボール の順で描画（重なりの都合）
    if (this.bricks) this.bricks.draw(ctx);

    // パドルの描画更新
    if (this.paddle) this.paddle.draw(ctx);

    // ボールの描画更新
    if (this.ball) this.ball.draw(ctx);
    
    // HUD テキスト描画（Canvas or DOM）
    ctx.fillStyle = '#9ad';
    ctx.font = '14px monospace';
    ctx.fillText(`SCORE: ${String(this.score ?? 0).padStart(6, '0')}`, 12, 20);

    // ヒント（準備中のみ）
    if (this.state === 'ready') {
      ctx.fillStyle = '#9ad';
      ctx.font = '14px monospace';
      ctx.fillText('クリック or Space で発射', 200, 380);
    }
  }

  // 後片付け（シーン遷移などで使う用）
  dispose() {
    if (this._onCanvasClick) this.canvas.removeEventListener('click', this._onCanvasClick);
    if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
    if (this.paddle) this.paddle.detachInput(this.canvas);
  }

  pause() { this._running = false; }
  resume() { this.start(); }
  restart() {
    // TODO: スコア/ライフ/盤面初期化
  }
}


// IIFE: 即時実行関数式
(() => {
    // DOM 参照（Canvas と HUD）
    const canvas = document.getElementById('game');
    const btnStart = document.getElementById('btnStart');

    const game = new Game(canvas);
    game.init(); 

    if (btnStart) btnStart.addEventListener('click', () => game.start());
    // - コンテキストを確保
    // - 画面リサイズ対応（将来）
    // - DPR（Device Pixel Ratio）対応は必要に応じて U.fitCanvas() などで
})();

// イベント配線（Start/Pause/Restart ボタン）
// - 押下で Game のメソッド呼び出し
// - キーボード（Space: pause、Enter: start など）
// - マウス/タッチ移動を Paddle へ委譲



