const canvas = document.getElementById("battleCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 700;
canvas.height = 400;

// 中央座標系
function toCanvasX(x) {
  return canvas.width / 2 + x;
}
function toCanvasY(y) {
  return canvas.height / 2 - y;
}

// ===== ユニット =====
const units = [];

function initUnits() {
  units.length = 0;

  const spacing = 60;

  // 赤
  for (let i = 0; i < 4; i++) {
    units.push({
      team: "red",
      x: -300,
      y: (i - 1.5) * spacing,
      speed: 10
    });
  }

  // 青
  for (let i = 0; i < 4; i++) {
    units.push({
      team: "blue",
      x: 300,
      y: (i - 1.5) * spacing,
      speed: 10
    });
  }
}

// ===== 最も近い敵を取得 =====
function getNearestEnemy(unit) {
  let nearest = null;
  let minDist = Infinity;

  units.forEach(other => {
    if (other.team !== unit.team) {
      const dx = other.x - unit.x;
      const dy = other.y - unit.y;
      const dist = Math.hypot(dx, dy);

      if (dist < minDist) {
        minDist = dist;
        nearest = other;
      }
    }
  });

  return nearest;
}

// ===== 移動処理 =====
function update() {
  units.forEach(u => {
    const target = getNearestEnemy(u);
    if (!target) return;

    const dx = target.x - u.x;
    const dy = target.y - u.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0) {
      u.x += (dx / dist) * u.speed;
      u.y += (dy / dist) * u.speed;
    }
  });
}

// ===== 描画 =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  units.forEach(u => {
    ctx.beginPath();
    ctx.arc(toCanvasX(u.x), toCanvasY(u.y), 6, 0, Math.PI * 2);
    ctx.fillStyle = u.team === "red" ? "red" : "blue";
    ctx.fill();
  });
}

// ===== ループ =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ===== 実行 =====
initUnits();
loop();
