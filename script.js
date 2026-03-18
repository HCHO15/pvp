// ===== 既存コードそのまま =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let units = [];
let running = false;
let paused = false;
let lastTime = 0;

const ATTACK_INTERVAL = 600;
const SPEED = 1.5;

// ===== 初期化 =====
function createUnits() {
  units = [];

  for (let i = 0; i < 4; i++) {
    units.push(createUnit(i, "red", 50, 100 + i * 80));
  }

  for (let i = 0; i < 4; i++) {
    units.push(createUnit(i + 4, "blue", WIDTH - 50, 100 + i * 80));
  }

  renderPanel();
}

function createUnit(id, team, x, y) {
  return {
    id,
    team,
    x,
    y,
    hp: 30,
    range: 200,
    attackType: "ドカン",
    defenseType: "かるーい",
    state: "move",
    lastAttack: 0
  };
}

// ===== UI生成 =====
function renderPanel() {
  const panel = document.getElementById("panel");
  panel.innerHTML = "";

  units.forEach(unit => {
    const card = document.createElement("div");
    card.className = "unit-card";

    const header = document.createElement("div");
    header.className = "unit-header";
    header.textContent = `${unit.team.toUpperCase()}-${unit.id}`;

    const body = document.createElement("div");
    body.className = "unit-body";

    header.onclick = () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    };

    body.innerHTML = `
      X: <input type="number" value="${unit.x}" onchange="updateUnit(${unit.id}, 'x', this.value)">
      Y: <input type="number" value="${unit.y}" onchange="updateUnit(${unit.id}, 'y', this.value)">
      
      HP:
      <select onchange="updateUnit(${unit.id}, 'hp', this.value)">
        ${[10,20,30,40,50].map(v => `<option ${v==unit.hp?'selected':''}>${v}</option>`)}
      </select>

      射程:
      <select onchange="updateUnit(${unit.id}, 'range', this.value)">
        ${Array.from({length:10},(_,i)=>350+i*50)
          .map(v => `<option ${v==unit.range?'selected':''}>${v}</option>`)}
      </select>
    `;

    card.appendChild(header);
    card.appendChild(body);
    panel.appendChild(card);
  });
}

function updateUnit(id, key, value) {
  const unit = units.find(u => u.id === id);
  if (!unit) return;

  unit[key] = Number(value);
}

// ===== 以下はPhase1と同じ =====
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function findTarget(unit) {
  let enemies = units.filter(u => u.team !== unit.team && u.hp > 0);
  if (enemies.length === 0) return null;

  return enemies.reduce((a, b) =>
    distance(unit, a) < distance(unit, b) ? a : b
  );
}

function update(delta) {
  for (let unit of units) {
    if (unit.hp <= 0) continue;

    let target = findTarget(unit);
    if (!target) continue;

    let dist = distance(unit, target);

    if (dist <= unit.range) {
      unit.lastAttack += delta;

      if (unit.lastAttack >= ATTACK_INTERVAL) {
        unit.lastAttack = 0;

        if (Math.random() < 0.1) continue;

        target.hp -= 2;
      }
    } else {
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
    document.getElementById("result").textContent =
      redAlive ? "赤の勝利！" : "青の勝利！";
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  units.forEach(unit => {
    if (unit.hp <= 0) return;

    ctx.beginPath();
    ctx.arc(unit.x, unit.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = unit.team === "red" ? "red" : "blue";
    ctx.fill();
  });
}

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

function startGame() {
  createUnits();
  running = true;
  paused = false;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function togglePause() {
  paused = !paused;
}

function skipGame() {
  let safety = 0;
  while (running && safety < 100000) {
    update(50);
    safety++;
  }
}

// 初期表示（これを追加）
createUnits();
renderPanel();
draw();
