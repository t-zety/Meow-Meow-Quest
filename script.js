
(() => {
"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const $ = id => document.getElementById(id);

const cats = [
  {name:"Peaches", fur:"#ffb2c9", clothes:"#ff6f91"},
  {name:"Mochi", fur:"#fff0d5", clothes:"#a6d8ff"},
  {name:"Pepper", fur:"#aeb7c8", clothes:"#b8e986"},
  {name:"Boba", fur:"#bd8c69", clothes:"#d9a7ff"},
  {name:"Sprout", fur:"#c7e8a0", clothes:"#ffcf8b"}
];

const worlds = [
  "Dewdrop Meadow","Cotton Candy Woods","Moonberry Garden",
  "Twinkle Toadstools","Cloudpaw Valley","Honeydew Hills",
  "Crystal Creek","Daisy Dreamland","Starlight Forest",
  "Bubblegum Grove","Little Acorn Woods","Rainbow Hollow",
  "Sleepy Mushroom Town","Moonflower Meadow","Jellybean Jungle",
  "Silverleaf Forest","Candycap Caverns","Dreamy Moss Valley",
  "Golden Mushroom Kingdom","The Enchanted Heart"
];

let chosen = 0;
let level = 1;
let stars = 0;
let lives = 3;
let playing = false;
let paused = false;
let gameEnded = false;
let frame = 0;
let lastTime = 0;
let keys = {};
let platforms = [];
let mushrooms = [];
let treasures = [];
let player;
let goal;
let message = "";

function drawCat(x, y, scale, catIndex, bob = 0) {
  const c = cats[catIndex];

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale, scale);

  // Shadow
  ctx.fillStyle = "rgba(55,55,80,.18)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = c.fur;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-12, -25);
  ctx.quadraticCurveTo(-39, -34, -29, -52);
  ctx.stroke();

  // Ears
  ctx.fillStyle = c.fur;
  ctx.beginPath();
  ctx.moveTo(-23,-43);
  ctx.lineTo(-25,-72);
  ctx.lineTo(-5,-55);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(7,-55);
  ctx.lineTo(26,-72);
  ctx.lineTo(23,-42);
  ctx.closePath();
  ctx.fill();

  // Inner ears
  ctx.fillStyle = "#ff9fc4";
  ctx.beginPath();
  ctx.moveTo(-19,-54);
  ctx.lineTo(-21,-65);
  ctx.lineTo(-11,-57);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(14,-57);
  ctx.lineTo(22,-65);
  ctx.lineTo(19,-52);
  ctx.fill();

  // Body
  ctx.fillStyle = c.fur;
  ctx.beginPath();
  ctx.ellipse(0,-27,22,25,0,0,Math.PI*2);
  ctx.fill();

  // Clothes
  ctx.fillStyle = c.clothes;
  ctx.beginPath();
  ctx.ellipse(0,-23,21,15,0,0,Math.PI*2);
  ctx.fill();

  // Head
  ctx.fillStyle = c.fur;
  ctx.beginPath();
  ctx.ellipse(0,-51,29,25,0,0,Math.PI*2);
  ctx.fill();

  // Hairstyle tuft
  ctx.fillStyle = c.clothes;
  ctx.beginPath();
  ctx.moveTo(-10,-70);
  ctx.quadraticCurveTo(-18,-88,-3,-79);
  ctx.quadraticCurveTo(8,-91,10,-72);
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#49335e";
  ctx.beginPath();
  ctx.ellipse(-10,-52,3,5,0,0,Math.PI*2);
  ctx.ellipse(10,-52,3,5,0,0,Math.PI*2);
  ctx.fill();

  // Nose
  ctx.fillStyle = "#f47ba5";
  ctx.beginPath();
  ctx.moveTo(-3,-44);
  ctx.lineTo(3,-44);
  ctx.lineTo(0,-41);
  ctx.fill();

  // Smile
  ctx.strokeStyle = "#49335e";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0,-41);
  ctx.quadraticCurveTo(-5,-36,-8,-40);
  ctx.moveTo(0,-41);
  ctx.quadraticCurveTo(5,-36,8,-40);
  ctx.stroke();

  ctx.restore();
}

function drawMiniCat(index) {
  const mini = document.createElement("canvas");
  mini.width = 90;
  mini.height = 90;
  const c = mini.getContext("2d");

  const old = ctx;
  // Draw the preview using the main canvas context temporarily.
  ctx = c;
  drawCat(45, 84, 0.65, index);
  ctx = old;

  return mini;
}

// Cat selection
cats.forEach((cat, index) => {
  const button = document.createElement("button");
  button.className = "catpick" + (index === 0 ? " selected" : "");
  button.type = "button";
  button.appendChild(drawMiniCat(index));

  const name = document.createElement("div");
  name.textContent = cat.name;
  button.appendChild(name);

  button.addEventListener("click", () => {
    chosen = index;
    document.querySelectorAll(".catpick").forEach((b, i) => {
      b.classList.toggle("selected", i === index);
    });
  });

  $("catgrid").appendChild(button);
});

function setupLevel() {
  platforms = [
    {x:0,y:520,w:960,h:80},
    {x:120,y:430,w:145,h:18},
    {x:315,y:350,w:135,h:18},
    {x:505,y:420,w:145,h:18},
    {x:700,y:315,w:125,h:18}
  ];

  const extra = Math.min(level - 1, 8);

  for (let i = 0; i < extra; i++) {
    platforms.push({
      x: 55 + ((i * 103 + level * 19) % 820),
      y: 260 + ((i * 31) % 150),
      w: 75 + (i % 3) * 15,
      h: 16
    });
  }

  player = {
    x: 35, y: 430, w: 42, h: 66,
    vx: 0, vy: 0, grounded: false,
    invincible: 0
  };

  mushrooms = [];
  const count = Math.min(2 + Math.floor(level / 2), 9);

  for (let i = 0; i < count; i++) {
    mushrooms.push({
      x: 150 + i * (650 / count),
      y: 505,
      dir: i % 2 === 0 ? 1 : -1,
      alive: true,
      speed: 1 + level * 0.07
    });
  }

  treasures = [];

  for (let i = 0; i < 6; i++) {
    treasures.push({
      x: 100 + i * 145,
      y: [475,390,310,380,275,460][i],
      found: false
    });
  }

  goal = {x:900,y:478};

  $("levelLabel").textContent = `LEVEL ${level} / 20`;
  $("worldLabel").textContent = "🌿 " + worlds[level - 1];
  $("starLabel").textContent = "⭐ " + stars + " stars";
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0,0,0,600);
  sky.addColorStop(0,"#bdeeff");
  sky.addColorStop(1,"#f9e5ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0,0,960,600);

  // Clouds
  ctx.fillStyle = "rgba(255,255,255,.8)";

  for (let i = 0; i < 5; i++) {
    const x = (i * 220 + 50 - frame * 0.2 + 1100) % 1050;
    const y = 70 + (i % 2) * 45;

    ctx.beginPath();
    ctx.arc(x,y,22,0,Math.PI*2);
    ctx.arc(x+25,y-10,30,0,Math.PI*2);
    ctx.arc(x+55,y,22,0,Math.PI*2);
    ctx.fill();
  }

  // Hills
  ctx.fillStyle = "#b7e8c5";
  ctx.beginPath();
  ctx.moveTo(0,480);
  ctx.quadraticCurveTo(180,320,360,480);
  ctx.quadraticCurveTo(580,300,760,465);
  ctx.quadraticCurveTo(850,375,960,440);
  ctx.lineTo(960,600);
  ctx.lineTo(0,600);
  ctx.fill();

  // Ground
  ctx.fillStyle = "#82d69d";
  ctx.fillRect(0,520,960,80);

  ctx.fillStyle = "#5cbd7e";
  ctx.fillRect(0,520,960,8);

  // Flowers
  for (let i = 0; i < 30; i++) {
    const x = (i * 37 + 12) % 950;
    const y = 545 + (i % 3) * 15;

    ctx.fillStyle = ["#ff91ba","#fff0a0","#d9a8ff"][i%3];

    for (let j = 0; j < 5; j++) {
      const a = j * Math.PI * 2 / 5;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a)*5,y + Math.sin(a)*5,4,0,Math.PI*2);
      ctx.fill();
    }

    ctx.fillStyle = "#fff6bb";
    ctx.beginPath();
    ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fill();
  }
}

function drawPlatforms() {
  platforms.forEach(p => {
    ctx.fillStyle = "#a1df8e";
    ctx.beginPath();
    ctx.roundRect(p.x,p.y,p.w,p.h,8);
    ctx.fill();

    ctx.fillStyle = "#64bd7b";
    ctx.fillRect(p.x,p.y+p.h-5,p.w,5);

    ctx.fillStyle = "#fff2c0";

    for (let x = p.x + 12; x < p.x + p.w - 8; x += 30) {
      ctx.beginPath();
      ctx.arc(x,p.y+5,2.5,0,Math.PI*2);
      ctx.fill();
    }
  });
}

function drawMushroom(m) {
  if (!m.alive) return;

  ctx.fillStyle = "#fff0d9";
  ctx.beginPath();
  ctx.roundRect(m.x-12,m.y-8,24,25,8);
  ctx.fill();

  ctx.fillStyle = level % 3 === 0 ? "#a57bea" : "#ff7488";
  ctx.beginPath();
  ctx.ellipse(m.x,m.y-11,25,18,0,Math.PI,Math.PI*2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(m.x-9,m.y-17,4,0,Math.PI*2);
  ctx.arc(m.x+8,m.y-12,3,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle = "#49335e";
  ctx.beginPath();
  ctx.arc(m.x-4,m.y+1,2,0,Math.PI*2);
  ctx.arc(m.x+5,m.y+1,2,0,Math.PI*2);
  ctx.fill();
}

function drawStar(x,y) {
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(Math.sin(frame*0.04+x)*0.15);
  ctx.fillStyle = "#ffe16b";
  ctx.strokeStyle = "#ffb94d";
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let i = 0; i < 10; i++) {
    const a = -Math.PI/2 + i*Math.PI/5;
    const r = i%2 ? 7 : 15;
    const px = Math.cos(a)*r;
    const py = Math.sin(a)*r;

    if (i === 0) ctx.moveTo(px,py);
    else ctx.lineTo(px,py);
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGoal() {
  const bob = Math.sin(frame*0.06)*5;

  ctx.save();
  ctx.shadowColor = "#ffe36e";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#ffdb69";
  ctx.beginPath();
  ctx.ellipse(goal.x,goal.y+bob,22,29,-0.4,0,Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#c38a3e";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#73bf71";
  ctx.beginPath();
  ctx.ellipse(goal.x+10,goal.y-27+bob,12,6,-0.5,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawScene() {
  drawBackground();
  drawPlatforms();

  treasures.forEach(t => {
    if (!t.found) drawStar(t.x,t.y);
  });

  mushrooms.forEach(drawMushroom);
  drawGoal();

  drawCat(
    player.x + player.w/2,
    player.y + player.h - 3,
    0.8,
    chosen,
    player.grounded && Math.abs(player.vx) > 0
      ? Math.sin(frame*0.3)*2 : 0
  );

  if (paused || gameEnded) {
    ctx.fillStyle = "rgba(55,40,75,.62)";
    ctx.fillRect(0,0,960,600);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "bold 42px system-ui";
    ctx.fillText(gameEnded ? "Adventure complete! 🎉" : "Paused ⏸",480,280);
    ctx.font = "22px system-ui";
    ctx.fillText(gameEnded ? "You are a cat hero!" : "Press Pause to continue",480,325);
  }
}

function overlap(a,b) {
  return a.x < b.x+b.w &&
         a.x+a.w > b.x &&
         a.y < b.y+b.h &&
         a.y+a.h > b.y;
}

function update(dt) {
  if (!playing || paused || gameEnded) return;

  frame += dt;

  player.vx = 0;
  if (keys.left) player.vx = -3.8;
  if (keys.right) player.vx = 3.8;

  player.x += player.vx * dt;
  player.x = Math.max(0,Math.min(918,player.x));

  const oldBottom = player.y + player.h;

  player.vy += 0.48 * dt;
  player.y += player.vy * dt;
  player.grounded = false;

  platforms.forEach(p => {
    if (
      player.vy >= 0 &&
      player.x + player.w > p.x &&
      player.x < p.x + p.w &&
      oldBottom <= p.y + 8 &&
      player.y + player.h >= p.y
    ) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  });

  if (player.y > 650) {
    loseLife();
    return;
  }

  mushrooms.forEach(m => {
    if (!m.alive) return;

    m.x += m.dir * m.speed * dt;

    if (m.x < 25 || m.x > 935) m.dir *= -1;

    const catBox = {
      x:player.x+5,y:player.y+8,w:player.w-10,h:player.h-8
    };

    const enemyBox = {
      x:m.x-18,y:m.y-24,w:36,h:42
    };

    if (overlap(catBox,enemyBox) && player.invincible <= 0) {
      if (player.vy > 1 && player.y + player.h < m.y + 17) {
        m.alive = false;
        player.vy = -8;
        stars += 2;
        $("starLabel").textContent = "⭐ " + stars + " stars";
        message = "Boing! Mushroom defeated! 🍄";
      } else {
        loseLife();
      }
    }
  });

  if (player.invincible > 0) player.invincible -= dt;

  treasures.forEach(t => {
    if (t.found) return;

    const starBox = {x:t.x-12,y:t.y-12,w:24,h:24};
    const catBox = {
      x:player.x,y:player.y,w:player.w,h:player.h
    };

    if (overlap(catBox,starBox)) {
      t.found = true;
      stars++;
      $("starLabel").textContent = "⭐ " + stars + " stars";
    }
  });

  const goalBox = {
    x:goal.x-22,y:goal.y-28,w:44,h:56
  };

  if (overlap(
    {x:player.x,y:player.y,w:player.w,h:player.h},
    goalBox
  )) {
    completeLevel();
  }
}

function loseLife() {
  lives--;

  if (lives <= 0) {
    playing = false;
    message = "Try again, little cat!";
    $("panel").innerHTML = `
      <h2>Oh no! 💗</h2>
      <p>Your cat needs another try.</p>
      <button class="mainbtn" id="retry">Try Again ✨</button>
    `;
    $("overlay").style.display = "flex";
    $("retry").addEventListener("click", () => {
      level = 1;
      lives = 3;
      stars = 0;
      startGame();
    });
    return;
  }

  player.x = 35;
  player.y = 420;
  player.vx = 0;
  player.vy = 0;
  player.invincible = 100;
}

function completeLevel() {
  playing = false;

  if (level >= 20) {
    gameEnded = true;
    $("panel").innerHTML = `
      <h2>You did it! 🎉</h2>
      <p>You completed all 20 magical worlds!</p>
      <p>⭐ Stars collected: ${stars}</p>
      <button class="mainbtn" id="again">Play Again 🐾</button>
    `;
    $("overlay").style.display = "flex";

    $("again").addEventListener("click", () => {
      level = 1;
      stars = 0;
      lives = 3;
      gameEnded = false;
      buildMenu();
      $("overlay").style.display = "flex";
    });

  } else {
    level++;
    setupLevel();
    playing = true;
  }
}

function buildMenu() {
  $("panel").innerHTML = `
    <h2>Pick your little adventurer!</h2>
    <p>Hop through a magical forest, collect stars, squash silly evil mushrooms, and find the glowing acorn.</p>
    <p>Just 20 cozy levels!</p>
    <div class="catgrid" id="catgrid"></div>
    <p class="tips">Move with ◀ ▶ and jump with ⬆ or Space.</p>
    <button class="mainbtn" id="start">Let’s go exploring! ✨</button>
  `;

  cats.forEach((cat,index) => {
    const button = document.createElement("button");
    button.className = "catpick" + (index === chosen ? " selected" : "");
    button.type = "button";
    button.appendChild(drawMiniCat(index));

    const name = document.createElement("div");
    name.textContent = cat.name;
    button.appendChild(name);

    button.addEventListener("click",() => {
      chosen = index;
      document.querySelectorAll(".catpick").forEach((b,i) => {
        b.classList.toggle("selected",i === index);
      });
    });

    $("catgrid").appendChild(button);
  });

  $("start").addEventListener("click",startGame);
}

function startGame() {
  gameEnded = false;
  paused = false;
  playing = true;
  lives = 3;
  $("overlay").style.display = "none";
  setupLevel();
}

function bindHold(id,key) {
  const el = $(id);
  if (!el) return;

  const down = e => {
    e.preventDefault();
    keys[key] = true;
  };

  const up = e => {
    e.preventDefault();
    keys[key] = false;
  };

  el.addEventListener("pointerdown",down);
  el.addEventListener("pointerup",up);
  el.addEventListener("pointerleave",up);
  el.addEventListener("pointercancel",up);
}

bindHold("left","left");
bindHold("right","right");

$("jump").addEventListener("pointerdown",e => {
  e.preventDefault();
  if (playing && player.grounded && !paused) {
    player.vy = -12;
    player.grounded = false;
  }
});

$("pause").addEventListener("click",() => {
  if (!playing) return;
  paused = !paused;
  $("pause").textContent = paused ? "▶ Resume" : "Ⅱ Pause";
});

document.addEventListener("keydown",e => {
  if (["ArrowLeft","ArrowRight","ArrowUp"," "].includes(e.key)) {
    e.preventDefault();
  }

  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keys.right = true;

  if (
    (e.key === "ArrowUp" || e.key === " " || e.key.toLowerCase() === "w") &&
    !e.repeat && playing && player.grounded && !paused
  ) {
    player.vy = -12;
    player.grounded = false;
  }
});

document.addEventListener("keyup",e => {
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keys.right = false;
});

buildMenu();
setupLevel();
drawScene();

function loop(time) {
  const dt = lastTime ? Math.min((time-lastTime)/16.67,2) : 1;
  lastTime = time;
  update(dt);
  drawScene();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

})();

