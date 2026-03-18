const canvas = document.getElementById("battleCanvas");
const ctx = canvas.getContext("2d");

// ★ここ重要（CSSと一致させる）
canvas.width = 700;
canvas.height = 400;

// ===== 座標変換 =====
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
      speed: 2   // ← ★まずは小さく（重要）
    });
  }

  // 青
  for (let i = 0; i < 4; i++) {
    units.push({
      team: "blue",
      x: 300,
      y: (i - 1.5) * spacing,
      speed: 2
    });
  }

  console.log("units:", units); // デバッグ
}

// ===== 最も近い敵 =====
function getNearestEnemy(unit) {
  let nearest = null;
  let minDist = Infinity;

  for (let other of units) {
    if (other.team !== unit.team) {
      const dx = other.x - unit.x;
      const dy = other.y - unit.y;
      const dist = Math.hypot(dx, dy);

      if (dist < minDist) {
        minDist = dist;
        nearest = other;
      }
    }
  }

  return nearest;
}

// ===== 更新 =====
function update() {
  for (let u of units) {
    const target = getNearestEnemy(u);
    if (!target) continue;

    const dx = target.x - u.x;
    const dy = target.y - u.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.1) {
      u.x += (dx / dist) * u.speed;
      u.y += (dy / dist) * u.speed;
    }
  }
}

// ===== 描画 =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let u of units) {
    ctx.beginPath();
    ctx.arc(toCanvasX(u.x), toCanvasY(u.y), 6, 0, Math.PI * 2);
    ctx.fillStyle = (u.team === "red") ? "red" : "blue";
    ctx.fill();
  }
}

// ===== ループ =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ===== 起動 =====
initUnits();
draw(); // ← ★これ超重要（最初に描画）
loop();
