// @file utils.js
// 目的：小さな便利関数置き場。座標計算・乱数・クランプ・時間計測など。
// 注意：ゲームロジックを置かない。あくまで汎用ユーティリティ。

/* 候補関数
  - clamp(v, min, max)：値を範囲に収める
  - lerp(a, b, t)：線形補間
  - randRange(min, max)：範囲乱数
  - now()：高精度タイムスタンプ（performance.now 短縮）
  - fitCanvasToDPR(canvas, width, height)：DPR に合わせて解像度調整
  - aabbIntersect(ax,ay,aw,ah, bx,by,bw,bh)：AABB 判定
  - circleRectIntersect(cx,cy,r, rx,ry,rw,rh)：円-矩形の接触（簡易）
*/

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
// export function clamp(...) { /* 実装は最後に */ }
// export function fitCanvasToDPR(...) { /* 実装は最後に */ }
// … 必要に応じて追加
