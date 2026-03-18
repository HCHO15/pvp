const canvas = document.getElementById("battleCanvas");
const ctx = canvas.getContext("2d");

// 解像度設定（見た目と内部を一致）
canvas.width = 700;
canvas.height = 400;

// 中央座標系
function toCanvasX(x) {
  return canvas.width / 2 + x;
}
function toCanvasY(y) {
  return canvas.height / 2 - y;
}

// ユニット
const units = [];

// 初期配置
function initUnits() {
  units.length = 0;

  const spacing = 60;

  // 赤（左）
  for (let i = 0; i < 4; i++) {
    units.push({
      team: "red",
      x: -300,
      y: (i - 1.5) * spacing
    });
  }

  // 青（右）
  for (let i = 0; i < 4; i++) {
    units.push({
      team: "blue",
      x: 300,
      y: (i - 1.5) * spacing
    });
  }
}

// 描画
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  units.forEach(u => {
    ctx.beginPath();
    ctx.arc(toCanvasX(u.x), toCanvasY(u.y), 6, 0, Math.PI * 2);
    ctx.fillStyle = u.team === "red" ? "red" : "blue";
    ctx.fill();
  });
}

// 初期化
initUnits();
draw();
