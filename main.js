const canvas = document.getElementById("battleCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 700;
canvas.height = 400;

const CENTER_X = canvas.width / 2;
const CENTER_Y = canvas.height / 2;

let running = false;
let paused = false;
let initialized = false;

const ATTACK_INTERVAL = 600;
const SPEED = 1.5;

let units = [];
let openState = {};

// ======================
// Unit
// ======================
class Unit {
  constructor(id, team, x, y) {
    this.id = id;
    this.team = team;
    this.x = x;
    this.y = y;

    this.hp = 30;
    this.maxHp = 30;
    this.range = 500;

    this.attackType = "ドカン";
    this.defenseType = "かるーい";

    this.lastAttack = 0;
    this.inRangeSince = null;

    this.target = null;
    this.alive = true;
  }

  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }

  findClosestEnemy(units) {
    let enemies = units.filter(u => u.team !== this.team && u.alive);
    if (enemies.length === 0) return null;

    return enemies.reduce((a, b) =>
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

  update(units, time) {
    if (!this.alive) return;

    if (this.hp <= 0) {
      this.alive = false;
      return;
    } else {
      this.alive = true;
    }

    this.target = this.findClosestEnemy(units);
    if (!this.target) return;

    const dist = this.distanceTo(this.target);

    if (dist > this.range) {
      this.inRangeSince = null;
      this.moveToward(this.target);
      return;
    }

    if (this.inRangeSince === null) {
      this.inRangeSince = time;
      return;
    }

    if (time - this.inRangeSince < ATTACK_INTERVAL) return;
    if (time - this.lastAttack < ATTACK_INTERVAL) return;

    this.lastAttack = time;

    if (Math.random() < 0.1) return;

    let damage = 2 * getMultiplier(this.attackType, this.target.defenseType);

    this.target.hp -= damage;

    if (this.target.hp <= 0) {
      this.target.alive = false;
      this.target = null;
    }
  }

  draw() {
    if (!this.alive) return;

    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.team === "red" ? "red" : "blue";
    ctx.fill();

    const barWidth = 20;
    const hpRatio = this.hp / this.maxHp;

    ctx.fillStyle = "black";
    ctx.fillRect(this.x - barWidth / 2, this.y - 12, barWidth, 3);

    ctx.fillStyle = "lime";
    ctx.fillRect(this.x - barWidth / 2, this.y - 12, barWidth * hpRatio, 3);
  }
}

// ======================
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

// ======================
function initUnits() {
  if (initialized) return;
  initialized = true;

  for (let i = 0; i < 4; i++) {
    units.push(new Unit("R"+i, "red", 50, 80 + i * 60));
    units.push(new Unit("B"+i, "blue", 650, 80 + i * 60));
  }
}

function resetBattle() {
  units = [];
  initialized = false;
  initUnits();
}

// ======================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  units.forEach(u => u.draw());
}

// ======================
function loop(time) {
  if (!running) return;

  if (!paused) {
    units.forEach(u => u.update(units, time));
  }

  draw();
  checkWin();

  requestAnimationFrame(loop);
}

// ======================
function checkWin() {
  let redAlive = units.some(u => u.team === "red" && u.alive);
  let blueAlive = units.some(u => u.team === "blue" && u.alive);

  if (!redAlive || !blueAlive) {
    running = false;
    alert(redAlive ? "赤の勝ち！" : "青の勝ち！");
  }
}

// ======================
document.getElementById("startBtn").onclick = () => {
  if (!running) {
    let redAlive = units.some(u => u.team === "red" && u.alive);
    let blueAlive = units.some(u => u.team === "blue" && u.alive);

    if (!redAlive || !blueAlive) {
      resetBattle();
      renderPanel();
    }
    
    running = true;
    paused = false;
    requestAnimationFrame(loop);
  }
};

document.getElementById("pauseBtn").onclick = () => {
  paused = !paused;
};

document.getElementById("skipBtn").onclick = () => {
  for (let i = 0; i < 2000; i++) {
    units.forEach(u => u.update(units, performance.now()));
    checkWin();
    if (!running) break;
  }
};

// ======================
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
    body.style.display = openState[u.id] ? "block" : "none";

    const container = document.createElement("div");

    // X
    const xLabel = document.createTextNode("x:");
    const xInput = document.createElement("input");
    xInput.type = "number";
    xInput.value = Math.round(u.x - CENTER_X);
    xInput.onchange = () => {
      u.x = Number(xInput.value) + CENTER_X;
    };

    container.appendChild(xLabel);
    container.appendChild(xInput);
    container.appendChild(document.createElement("br"));

    // Y
    const yLabel = document.createTextNode("y:");
    const yInput = document.createElement("input");
    yInput.type = "number";
    yInput.value = Math.round(u.y - CENTER_Y);
    yInput.onchange = () => {
      u.y = Number(yInput.value) + CENTER_Y;
    };

    container.appendChild(yLabel);
    container.appendChild(yInput);
    container.appendChild(document.createElement("br"));

    body.appendChild(container);

    header.onclick = () => {
      openState[u.id] = !openState[u.id];
      body.style.display = openState[u.id] ? "block" : "none";
    };

    div.appendChild(header);
    div.appendChild(body);
    list.appendChild(div);
  });
}

// ======================
initUnits();
renderPanel();
draw();
