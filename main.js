const canvas = document.getElementById("battleCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 700;
canvas.height = 400;

// ===== 座標変換 =====
function toCanvasX(x) {
  return canvas.width / 2 + x;
}
function toCanvasY(y) {
  return canvas.height / 2 - y;
}

// ===== ダメージ倍率 =====
function getMultiplier(atk, def) {
  const table = {
    "ドカン": { "かるーい": 2, "おもーい": 1, "まぜまぜ": 1, "ふしぎー": 0.5, "もちもち": 0.5 },
    "ズバッ": { "かるーい": 0.5, "おもーい": 2, "まぜまぜ": 1, "ふしぎー": 1, "もちもち": 1 },
    "バラバラ": { "かるーい": 0.5, "おもーい": 1.5, "まぜまぜ": 2, "ふしぎー": 1, "もちもち": 1 },
    "グルル": { "かるーい": 1, "おもーい": 0.5, "まぜまぜ": 0.5, "ふしぎー": 2, "もちもち": 1 },
    "ブルブル": { "かるーい": 1, "おもーい": 0.5, "まぜまぜ": 0.5, "ふしぎー": 1.5, "もちもち": 2 }
  };
  return table[atk]?.[def] ?? 1;
}

// ===== テンプレート =====
const templates = [];

function initTemplates() {
  templates.length = 0;

  const spacing = 60;

  for (let i = 0; i < 4; i++) {
    templates.push({
      team: "red",
      x: -300,
      y: (i - 1.5) * spacing,
      speed: 2,
      range: 120,
      hp: 20,
      attackType: "ドカン",
      defenseType: "かるーい"
    });
  }

  for (let i = 0; i < 4; i++) {
    templates.push({
      team: "blue",
      x: 300,
      y: (i - 1.5) * spacing,
      speed: 2,
      range: 120,
      hp: 20,
      attackType: "ズバッ",
      defenseType: "おもーい"
    });
  }
}

// ===== 実体 =====
let units = [];

function initUnits() {
  units = templates.map(t => ({
    ...t,
    alive: true,
    lastAttack: 0
  }));
}

// ===== ターゲット =====
function getNearestEnemy(unit) {
  let nearest = null;
  let minDist = Infinity;

  for (let other of units) {
    if (other.team !== unit.team && other.alive) {
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
  const now = Date.now();

  for (let u of units) {
    if (!u.alive) continue;

    const target = getNearestEnemy(u);
    if (!target) continue;

    const dx = target.x - u.x;
    const dy = target.y - u.y;
    const dist = Math.hypot(dx, dy);

    if (dist > u.range) {
      u.x += (dx / dist) * u.speed;
      u.y += (dy / dist) * u.speed;
    } else {
      if (now - u.lastAttack > 600) {
        u.lastAttack = now;

        let damage = 0;

        if (Math.random() > 0.1) {
          const mult = getMultiplier(u.attackType, target.defenseType);
          damage = 2 * mult;
        }

        target.hp -= damage;

        if (target.hp <= 0) {
          target.alive = false;
        }
      }
    }
  }
}

// ===== 描画 =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let u of units) {
    if (!u.alive) continue;

    ctx.beginPath();
    ctx.arc(toCanvasX(u.x), toCanvasY(u.y), 6, 0, Math.PI * 2);
    ctx.fillStyle = u.team === "red" ? "red" : "blue";
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.font = "10px sans-serif";
    ctx.fillText(Math.round(u.hp), toCanvasX(u.x) - 6, toCanvasY(u.y) - 10);
  }
}

// ===== ループ =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ===== UI =====
function renderPanel() {
  const panel = document.getElementById("panel");
  panel.innerHTML = "";

  templates.forEach((t, i) => {
    const div = document.createElement("div");
    div.className = "unit";

    const header = document.createElement("div");
    header.className = "header";
    header.textContent = `${t.team} ${i}`;

    const body = document.createElement("div");
    body.className = "body";

    header.onclick = () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    };

    body.innerHTML = `
      x: <input type="number" value="${t.x}" data-i="${i}" data-key="x"><br>
      y: <input type="number" value="${t.y}" data-i="${i}" data-key="y"><br>
      HP: <input type="number" value="${t.hp}" data-i="${i}" data-key="hp"><br>
    `;

    div.appendChild(header);
    div.appendChild(body);
    panel.appendChild(div);
  });

  panel.querySelectorAll("input").forEach(input => {
    input.oninput = e => {
      const i = e.target.dataset.i;
      const key = e.target.dataset.key;
      templates[i][key] = Number(e.target.value);
    };
  });
}

// ===== スタート =====
document.getElementById("startBtn").onclick = () => {
  initUnits();
};

// ===== 実行 =====
initTemplates();
initUnits();
renderPanel();
loop();
