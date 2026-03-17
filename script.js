const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let units = [];
let running = false;
let paused = false;
let lastTime = 0;

const ATTACK_INTERVAL = 600; // ms
const SPEED = 1.5;

// ===== 初期化 =====
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

// ===== ユーティリティ =====
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

// ===== 更新（仮想時間ベース）=====
function update(delta) {
  for (let unit of units) {
    if (unit.hp <= 0) continue;

    let target = findTarget(unit);
    if (!target) continue;

    let dist = distance(unit, target);

    if (dist <= unit.range) {
      unit.state = "attack";

      // 仮想時間で攻撃管理
      unit.lastAttack += delta;

      if (unit.lastAttack >= ATTACK_INTERVAL) {
        unit.lastAttack = 0;

        // 10%ミス
        if (Math.random() < 0.1) continue;

        target.hp -= 2;
      }

    } else {
      unit.state = "move";

      let dx = target.x - unit.x;
      let dy = target.y - unit.y;
      let len = Math.hypot(dx, dy);

      if (len > 0) {
        unit.x += (dx / len) * SPEED;
        unit.y += (dy / len) * SPEED;
      }
    }
  }

  checkWin();
}

// ===== 勝敗 =====
function checkWin() {
  let redAlive = units.some(u => u.team === "red" && u.hp > 0);
  let blueAlive = units.some(u => u.team === "blue" && u.hp > 0);

  if (!redAlive || !blueAlive) {
    running = false;

    const result = document.getElementById("result");
    result.textContent = redAlive ? "赤の勝利！" : "青の勝利！";
  }
}

// ===== 描画 =====
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  for (let unit of units) {
    if (unit.hp <= 0) continue;

    ctx.beginPath();
    ctx.arc(unit.x, unit.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = unit.team === "red" ? "red" : "blue";
    ctx.fill();

    // HP表示
    ctx.fillStyle = "white";
    ctx.font = "10px sans-serif";
    ctx.fillText(unit.hp, unit.x - 6, unit.y - 10);
  }
}

// ===== メインループ =====
function loop(timestamp) {
  if (!running) return;

  if (!paused) {
    let delta = timestamp - lastTime;
    update(delta);
    draw();
  }

  lastTime = timestamp;
  requestAnimationFrame(loop);
}

// ===== 操作 =====
function startGame() {
  createUnits();
  document.getElementById("result").textContent = "";
  running = true;
  paused = false;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function togglePause() {
  paused = !paused;
}

// 🚀 超高速スキップ（修正版）
function skipGame() {
  let safety = 0;

  while (running && safety < 100000) {
    update(50); // 大きめdeltaで高速化
    safety++;
  }
}
