const canvas = document.getElementById("battleCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 700;
canvas.height = 400;

const CENTER_X = canvas.width / 2;
const CENTER_Y = canvas.height / 2;

let running = false;
let paused = false;

const ATTACK_INTERVAL = 600;
const SPEED = 1.5; // v1では少し調整

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

  updateTarget(units) {
    const newTarget = this.findClosestEnemy(units);
    if (newTarget !== this.target) {
      this.target = newTarget;
      this.inRangeSince = null; // ターゲット変更でリセット
    }
  }

  moveToward(target) {
    let dx = target.x - this.x;
    let dy = target.y - this.y;
    let dist = Math.hypot(dx, dy);

    if (dist === 0) return;

    this.x += (dx / dist) * SPEED;
    this.y += (dy / dist) * SPEED;
  }

  tryAttack(time) {
    if (!this.target || !this.target.alive) return;

    // 射程チェック
    const dist = this.distanceTo(this.target);

    if (dist > this.range) {
      this.inRangeSince = null;
      this.moveToward(this.target);
      return;
    }

    // 射程内に入った瞬間を記録
    if (this.inRangeSince === null) {
      this.inRangeSince = time;
      return;
    }

    // 0.6秒待機
    if (time - this.inRangeSince < ATTACK_INTERVAL) {
      return;
    }

    // 攻撃間隔
    if (time - this.lastAttack < ATTACK_INTERVAL) return;

    this.lastAttack = time;

    // 10%ミス
    if (Math.random() < 0.1) return;

    let damage = 2 * getMultiplier(this.attackType, this.target.defenseType);

    this.target.hp -= damage;

    if (this.target.hp <= 0) {
      this.target.alive = false;
      this.target = null;
    }
  }

update(units, time) {
  if (!this.alive) return;

  // HPが外部変更された場合の復帰
  if (this.hp > 0 && !this.alive) {
    this.alive = true;
  }

  if (this.hp <= 0) {
    this.alive = false;
    return;
  }

  // 毎フレームターゲット更新（重要）
  this.target = this.findClosestEnemy(units);

  if (!this.target) return;

  const dist = this.distanceTo(this.target);

  // 射程外なら移動
  if (dist > this.range) {
    this.inRangeSince = null;
    this.moveToward(this.target);
    return;
  }

  // 射程内
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

    // 本体
    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.team === "red" ? "red" : "blue";
    ctx.fill();

    // HPバー
    const barWidth = 20;
    const hpRatio = this.hp / this.maxHp;

    ctx.fillStyle = "black";
    ctx.fillRect(this.x - barWidth / 2, this.y - 12, barWidth, 3);

    ctx.fillStyle = "lime";
    ctx.fillRect(this.x - barWidth / 2, this.y - 12, barWidth * hpRatio, 3);
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

// 勝敗
function checkWin() {
  let redAlive = units.some(u => u.team === "red" && u.alive);
  let blueAlive = units.some(u => u.team === "blue" && u.alive);

  if (!redAlive || !blueAlive) {
    running = false;
    setTimeout(() => {
      alert(redAlive ? "赤の勝ち！" : "青の勝ち！");
    }, 50);
  }
}

// UI
document.getElementById("startBtn").onclick = () => {
  running = true;
  paused = false;
  requestAnimationFrame(loop);
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

// パネル
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

    // プルダウン生成関数
    const createSelect = (options, value, onChange) => {
      const select = document.createElement("select");
      options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        if (opt === value) o.selected = true;
        select.appendChild(o);
      });
      select.onchange = () => onChange(select.value);
      return select;
    };

    // 射程
    const rangeOptions = [];
    for (let i = 350; i <= 800; i += 50) {
      rangeOptions.push(i);
    }

    const container = document.createElement("div");

    // X
    const xInput = document.createElement("input");
    xInput.type = "number";
    xInput.value = Math.round(u.x - CENTER_X);
    xInput.onchange = () => {
      u.x = Number(xInput.value) + CENTER_X;
    };

    // Y
    const yInput = document.createElement("input");
    yInput.type = "number";
    yInput.value = Math.round(u.y - CENTER_Y);
    yInput.onchange = () => {
      u.y = Number(yInput.value) + CENTER_Y;
    };

    container.append("x:", xInput, document.createElement("br"));
    container.append("y:", yInput, document.createElement("br"));

    // 射程
    container.append("射程:");
    container.append(
      createSelect(rangeOptions, u.range, v => {
 　　　 u.range = Number(v);
 　　　 u.inRangeSince = null; // 再判定させる
　　});
    container.append(document.createElement("br"));

    // 遮蔽
    container.append("遮蔽:");
    container.append(
      createSelect(["使う", "使わない"], "使わない", v => {})
    );
    container.append(document.createElement("br"));

    // 役割
    container.append("役割:");
    container.append(
      createSelect(["アタック", "ディフェンス", "ヒール"], "アタック", v => {})
    );
    container.append(document.createElement("br"));

    // 特殊挙動
    container.append("特殊:");
    container.append(createSelect(["なし"], "なし", v => {}));
    container.append(document.createElement("br"));

    // HP
    const hpOptions = [];
    for (let i = 10; i <= 50; i++) hpOptions.push(i);

    container.append(
  　　createSelect(hpOptions, u.hp, v => {
    　　u.hp = Number(v);
   　　 u.maxHp = Number(v);

    　　if (u.hp > 0) {
      　　u.alive = true;
   　　 }
  　　})
　　);

    // 武器
    container.append("武器:");
    container.append(createSelect(["なし"], "なし", v => {}));
    container.append(document.createElement("br"));

    // 攻撃
    container.append("攻撃:");
    container.append(
      createSelect(
 　　　　 ["ドカン", "ズバッ", "グルル", "ブルブル", "バラバラ"],
 　　　　 u.attackType,
 　　　　 v => {
   　　　　 u.attackType = v;
    　　　　console.log(u.id, "attack:", v);
　　　　  }
　　　　);
    container.append(document.createElement("br"));

    // 防御
    container.append("防御:");
    container.append(
      createSelect(
        ["かるーい", "おもーい", "ふしぎー", "もちもち", "まぜまぜ"],
        u.defenseType,
        v => (u.defenseType = v)
      )
    );

    body.appendChild(container);

    header.onclick = () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    };

    div.appendChild(header);
    div.appendChild(body);
    list.appendChild(div);
  });
}

initUnits();
draw();
