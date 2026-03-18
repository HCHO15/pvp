const canvas = document.getElementById("battleCanvas");
const ctx = canvas.getContext("2d");

// 解像度を実サイズに
canvas.width = 700;
canvas.height = 400;

const CENTER_X = canvas.width / 2;
const CENTER_Y = canvas.height / 2;

let running = false;
let paused = false;

const ATTACK_INTERVAL = 600;
const SPEED = 10;

class Unit {
  constructor(id, team, x, y) {
    this.id = id;
    this.team = team;
    this.x = x;
    this.y = y;

    this.hp = 30;
    this.range = 500;
    this.attackType = "ドカン";
    this.defenseType = "かるーい";

    this.lastAttack = 0;
    this.alive = true;
  }

  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }

  findTarget(units) {
    let enemies = units.filter(u => u.team !== this.team && u.alive);
    let inRange = enemies.filter(e => this.distanceTo(e) <= this.range);

    if (inRange.length === 0) return null;

    return inRange.reduce((a, b) =>
      this.distanceTo(a) < this.distanceTo(b) ? a : b
    );
  }

  moveToward(target) {
    let dx = target.x - this.x;
    let dy = target.y - this.y;
    let dist = Math.hypot(dx, dy);

    if (dist === 0) return;

    this.x += (dx / dist) * SPEED;
    this.y += (dy / dist) * SPEED;
  }

  attack(target, time) {
    if (time - this.lastAttack < ATTACK_INTERVAL) return;

    this.lastAttack = time;

    if (Math.random() < 0.1) return; // ミス

    let damage = 2 * getMultiplier(this.attackType, target.defenseType);
    target.hp -= damage;

    if (target.hp <= 0) {
      target.alive = false;
    }
  }

  update(units, time) {
    if (!this.alive) return;

    let target = this.findTarget(units);

    if (!target) {
      let enemy = units.find(u => u.team !== this.team && u.alive);
      if (enemy) this.moveToward(enemy);
      return;
    }

    this.attack(target, time);
  }

  draw() {
    if (!this.alive) return;

    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.team === "red" ? "red" : "blue";
    ctx.fill();
  }
}

// ダメージ倍率
function getMultiplier(atk, def) {
  const table = {
    "ドカン": {"かるーい":2,"おもーい":1,"まぜまぜ":1,"ふしぎー":0.5,"もちもち":0.5},
    "ズバッ": {"かるーい":0.5,"おもーい":2,"まぜまぜ":1,"ふしぎー":1,"もちもち":1},
    "バラバラ": {"かるーい":0.5,"おもーい":1.5,"まぜまぜ":2,"ふしぎー":1,"もちもち":1},
    "グルル": {"かるーい":1,"おもーい":0.5,"まぜまぜ":0.5,"ふしぎー":2,"もちもち":1},
    "ブルブル": {"かるーい":1,"おもーい":0.5,"まぜまぜ":0.5,"ふしぎー":1.5,"もちもち":2},
  };

  return table[atk]?.[def] ?? 1;
}

// 初期配置
let units = [];

function initUnits() {
  units = [];

  for (let i = 0; i < 4; i++) {
    units.push(new Unit("R"+i, "red", 50, 80 + i * 60));
    units.push(new Unit("B"+i, "blue", 650, 80 + i * 60));
  }

  renderPanel();
}

// 描画
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  units.forEach(u => u.draw());
}

// ループ
function loop(time) {
  if (!running) return;

  if (!paused) {
    units.forEach(u => u.update(units, time));
  }

  draw();

  checkWin();

  requestAnimationFrame(loop);
}

// 勝敗判定
function checkWin() {
  let redAlive = units.some(u => u.team === "red" && u.alive);
  let blueAlive = units.some(u => u.team === "blue" && u.alive);

  if (!redAlive || !blueAlive) {
    running = false;
    alert(redAlive ? "赤の勝ち！" : "青の勝ち！");
  }
}

// UI
document.getElementById("startBtn").onclick = () => {
  initUnits();
  running = true;
  paused = false;
  requestAnimationFrame(loop);
};

document.getElementById("pauseBtn").onclick = () => {
  paused = !paused;
};

document.getElementById("skipBtn").onclick = () => {
  for (let i = 0; i < 1000; i++) {
    units.forEach(u => u.update(units, performance.now()));
    checkWin();
    if (!running) break;
  }
};

// サイドパネル
function renderPanel() {
  const list = document.getElementById("entityList");
  list.innerHTML = "";

  units.forEach(u => {
    const div = document.createElement("div");
    div.className = "entity";

    const header = document.createElement("div");
    header.className = "entity-header";
    header.textContent = `${u.id} (${u.team})`;

    const body = document.createElement("div");
    body.className = "entity-body";

    body.innerHTML = `
      x: <input type="number" value="${Math.round(u.x - CENTER_X)}"><br>
      y: <input type="number" value="${Math.round(u.y - CENTER_Y)}"><br>
      HP: <input type="number" value="${u.hp}">
    `;

    header.onclick = () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    };

    div.appendChild(header);
    div.appendChild(body);
    list.appendChild(div);
  });
}

// 初期化
initUnits();
draw();
