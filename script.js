const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let units = [];
let running = false;
let paused = false;
let lastTime = 0;

const ATTACK_INTERVAL = 600; // ms
const SPEED = 1.5; // 実際の見た目速度（調整済）

function createUnits() {
  units = [];

  // 赤（左）
  for (let i = 0; i < 4; i++) {
    units.push({
      id: i,
      team: "red",
      x: 50,
      y: 100 + i * 80,
      hp: 30,
      range: 200,
      state: "move",
      target: null,
      lastAttack: 0
    });
  }

  // 青（右）
  for (let i = 0; i < 4; i++) {
    units.push({
      id: i + 4,
      team: "blue",
      x: WIDTH - 50,
      y: 100 + i * 80,
      hp: 30,
      range: 200,
      state: "move",
      target: null,
      lastAttack: 0
    });
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function findTarget(unit) {
  let enemies = units.filter(u => u.team !== unit.team && u.hp > 0);

  if (enemies.length === 0) return null;

  let nearest = enemies[0];
  let minDist = distance(unit, nearest);

  for (let e of enemies) {
    let d = distance(unit, e);
    if (d < minDist) {
      minDist = d;
      nearest = e;
    }
  }

  return nearest;
}

function update(delta) {
  for (let unit of units) {
    if (unit.hp <= 0) continue;

    let target = findTarget(unit);
    if (!target) continue;

    let dist = distance(unit, target);

    // 射程内なら攻撃
    if (dist <= unit.range) {
      unit.state = "attack";

      if (Date.now() - unit.lastAttack > ATTACK_INTERVAL) {
        unit.lastAttack = Date.now();

        // 10%ミス
        if (Math.random() < 0.1) return;

        target.hp -= 2;
      }

    } else {
      unit.state = "move";

      // 移動
      let dx = target.x - unit.x;
      let dy = target.y - unit.y;
      let len = Math.hypot(dx, dy);

      unit.x += (dx / len) * SPEED;
      unit.y += (dy / len) * SPEED;
    }
  }

  checkWin();
}

function checkWin() {
  let redAlive = units.some(u => u.team === "red" && u.hp > 0);
  let blueAlive = units.some(u => u.team === "blue" && u.hp > 0);

  if (!redAlive || !blueAlive) {
    running = false;

    const result = document.getElementById("result");
    result.textContent = redAlive ? "赤の勝利！" : "青の勝利！";
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  for (let unit of units) {
    if (unit.hp <= 0) continue;

    ctx.beginPath();
    ctx.arc(unit.x, unit.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = unit.team === "red" ? "red" : "blue";
    ctx.fill();

    // HP表示（簡易）
    ctx.fillStyle = "white";
    ctx.font = "10px sans-serif";
    ctx.fillText(unit.hp, unit.x - 6, unit.y - 10);
  }
}

function loop(timestamp) {
  if (!running) return;

  if (!paused) {
    update(timestamp - lastTime);
    draw();
  }

  lastTime = timestamp;
  requestAnimationFrame(loop);
}

// ===== ボタン操作 =====

function startGame() {
  createUnits();
  document.getElementById("result").textContent = "";
  running = true;
  paused = false;
  requestAnimationFrame(loop);
}

function togglePause() {
  paused = !paused;
}

function skipGame() {
  // 超高速シミュレーション
  while (running) {
    update(16);
  }
}
