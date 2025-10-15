// @file collision.js
// 目的：衝突判定と応答（反射）を集約するユニット。

import { clamp } from './utils.js';

export const Collision = {
  ballWithPaddle(ball, paddle) {
    const halfW = paddle.w / 2;
    const withinX = (ball.x > paddle.x - halfW) && (ball.x < paddle.x + halfW);
    const hitY = (ball.y + ball.r >= paddle.y) && (ball.y < paddle.y + paddle.h);

    if (withinX && hitY && ball.vy > 0) { // 下向きに落ちてきた時だけ反射
      const hitPos = (ball.x - paddle.x) / halfW; // -1〜+1
      const maxAngle = 75 * (Math.PI / 180);
      const angle = hitPos * maxAngle;

      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      ball.vx = speed * Math.sin(angle);
      ball.vy = -Math.abs(speed * Math.cos(angle));
      ball.y = paddle.y - ball.r - 1;
    }
  },

  // ボール×ブロック群
  ballWithBricks(ball, bricks, onHit) {
    // 単純化：1フレームにつき「最初に当たった1個」だけ処理
    let hitFound = false;

    bricks.forEachAlive((c, r, b) => {
      if (hitFound) return; // もう当たってたらスキップ（多重反射を防ぐ）

      const rect = bricks.worldRectOf(c, r);

      // 円と矩形の衝突：円の中心を矩形にクランプして最近点を取る
      const closestX = clamp(ball.x, rect.x, rect.x + rect.w);
      const closestY = clamp(ball.y, rect.y, rect.y + rect.h);
      const dx = ball.x - closestX;
      const dy = ball.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq <= ball.r * ball.r) {
        // 当たっている。どの面に近いかを「めり込み量」で判定
        const overlapLeft   = (ball.x + ball.r) - rect.x;           // 左面に対するオーバーラップ
        const overlapRight  = (rect.x + rect.w) - (ball.x - ball.r);// 右面
        const overlapTop    = (ball.y + ball.r) - rect.y;           // 上面
        const overlapBottom = (rect.y + rect.h) - (ball.y - ball.r);// 下面

        // 最小めり込み方向を選ぶ（X or Y）
        const minX = Math.min(overlapLeft, overlapRight);
        const minY = Math.min(overlapTop, overlapBottom);

        if (minX < minY) {
          // 横から当たった → X方向反転
          if (overlapLeft < overlapRight) {
            // 左面に当たった：ボールを左外へ押し戻す
            ball.x = rect.x - ball.r - 0.1;
          } else {
            // 右面
            ball.x = rect.x + rect.w + ball.r + 0.1;
          }
          ball.vx *= -1;
        } else {
          // 縦から当たった → Y方向反転
          if (overlapTop < overlapBottom) {
            // 上面
            ball.y = rect.y - ball.r - 0.1;
          } else {
            // 下面
            ball.y = rect.y + rect.h + ball.r + 0.1;
          }
          ball.vy *= -1;
        }

        // 破壊＆コールバック
        bricks.hit(c, r);
        if (onHit) onHit(c, r, b);
        hitFound = true;
      }
    });
  },
};

