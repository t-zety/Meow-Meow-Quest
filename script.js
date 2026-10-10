

(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const $ = id => document.getElementById(id);

  const cats = [
    { name: "Peaches", fur: "#ffb2c9", clothes: "#ff6f91" },
    { name: "Mochi", fur: "#fff0d5", clothes: "#a6d8ff" },
    { name: "Pepper", fur: "#aeb7c8", clothes: "#b8e986" },
    { name: "Boba", fur: "#bd8c69", clothes: "#d9a7ff" },
    { name: "Sprout", fur: "#c7e8a0", clothes: "#ffcf8b" }
  ];

  const worlds = [
    "Dewdrop Meadow", "Cotton Candy Woods", "Moonberry Garden",
    "Twinkle Toadstools", "Cloudpaw Valley", "Honeydew Hills",
    "Crystal Creek", "Daisy Dreamland", "Starlight Forest",
    "Bubblegum Grove", "Little Acorn Woods", "Rainbow Hollow",
    "Sleepy Mushroom Town", "Moonflower Meadow", "Jellybean Jungle",
    "Silverleaf Forest", "Candycap Caverns", "Dreamy Moss Valley",
    "Golden Mushroom Kingdom", "The Enchanted Heart"
  ];

  let selectedCat = 0;
  let level = 1;
  let stars = 0;
  let lives = 3;
  let playing = false;
  let paused = false;
  let keys = {};
  let frame = 0;
  let lastTime = 0;
  let player;
  let platforms = [];
  let mushrooms = [];
  let treasures = [];
  let goal;

  function drawCat(c, x, y, scale, index, bob = 0) {
    const cat = cats[index];

    c.save();
    c.translate(x, y + bob);
    c.scale(scale, scale);

    // Tail
    c.strokeStyle = cat.fur;
    c.lineWidth = 10;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-12, -25);
    c.quadraticCurveTo(-38, -35, -28, -52);
    c.stroke();

    // Ears
    c.fillStyle = cat.fur;
    c.beginPath();
    c.moveTo(-23, -43);
    c.lineTo(-25, -71);
    c.lineTo(-5, -55);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(7, -55);
    c.lineTo(25, -71);
    c.lineTo(23, -43);
    c.closePath();
    c.fill();

    // Body and outfit
    c.fillStyle = cat.fur;
    c.beginPath();
    c.ellipse(0, -25, 21, 25, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = cat.clothes;
    c.beginPath();
    c.ellipse(0, -22, 21, 15, 0, 0, Math.PI * 2);
    c.fill();

    // Head
    c.fillStyle = cat.fur;
    c.beginPath();
    c.ellipse(0, -50, 28, 25, 0, 0, Math.PI * 2);
    c.fill();

    // Cute tuft of hair
    c.fillStyle = cat.clothes;
    c.beginPath();
    c.moveTo(-10, -69);
    c.quadraticCurveTo(-17, -86, -3, -78);
    c.quadraticCurveTo(8, -89, 10, -70);
    c.fill();

    // Eyes
    c.fillStyle = "#49335e";
    c.beginPath();
    c.ellipse(-9, -51, 3, 5, 0, 0, Math.PI * 2);
    c.ellipse(9, -51, 3, 5, 0, 0, Math.PI * 2);
    c.fill();

    // Nose and smile
    c.fillStyle = "#f47ba5";
    c.beginPath();
    c.arc(0, -43, 3, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = "#49335e";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, -40);
    c.quadraticCurveTo(-5, -35, -8, -40);
    c.moveTo(0, -40);
    c.quadraticCurveTo(5, -35, 8, -40);
    c.stroke();

    c.restore();
  }

  // Draw each cat preview on its own canvas.
  cats.forEach((cat, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "catpick" +
      (index === selectedCat ? " selected" : "");

    const preview = document.createElement("canvas");
    preview.width = 100;
    preview.height = 100;

    drawCat(preview.getContext("2d"), 50, 92, 0.7, index);

    const name = document.createElement("div");
    name.textContent = cat.name;

    button.appendChild(preview);
    button.appendChild(name);

    button.addEventListener("click", () => {
      selectedCat = index;

      document.querySelectorAll(".catpick").forEach((item, i) => {
        item.classList.toggle("selected", i === index);
      });
    });

    $("catgrid").appendChild(button);
  });

  function setupLevel() {
    platforms = [
      { x: 0, y: 520, w: 960, h: 80 },
      { x: 115, y: 425, w: 140, h: 18 },
      { x: 300, y: 350, w: 135, h: 18 },
      { x: 490, y: 420, w: 145, h: 18 },
      { x: 690, y: 310, w: 130, h: 18 }
    ];

    for (let i = 0; i < Math.min(level - 1, 7); i++) {
      platforms.push({
        x: 70 + ((i * 107 + level * 23) % 780),
        y: 270 + ((i * 29) % 130),
        w: 85,
        h: 16
      });
    }

    player = {
      x: 30, y: 440, w: 42, h: 65,
      vx: 0, vy: 0, grounded: false,
      invincible: 0
    };

    mushrooms = [];
    const count = Math.min(2 + Math.floor(level / 2), 8);

    for (let i = 0; i < count; i++) {
      mushrooms.push({
        x: 180 + i * (620 / count),
        y: 505,
        dir: i % 2 ? -1 : 1,
        speed: 1 + level * 0.06,
        alive: true
      });
    }

    treasures = [];

    for (let i = 0; i < 6; i++) {
      treasures.push({
        x: 100 + i * 145,
        y: [475, 390, 315, 375, 270, 460][i],
        found: false
      });
    }

    goal = { x: 910, y: 475 };

    $("levelLabel").textContent = `LEVEL ${level} / 20`;
    $("worldLabel").textContent = "🌿 " + worlds[level - 1];
    $("starLabel").textContent = "⭐ " + stars + " stars";
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, 600);
    sky.addColorStop(0, "#bcecff");
    sky.addColorStop(1, "#f9e5ff");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 960, 600);

    // Clouds
    ctx.fillStyle = "rgba(255,255,255,0.85)";

    for (let i = 0; i < 5; i++) {
      const x = (i * 220 + 60 - frame * 0.2 + 1100) % 1050;
      const y = 65 + (i % 2) * 35;

      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.arc(x + 27, y - 9, 29, 0, Math.PI * 2);
      ctx.arc(x + 55, y, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hills
    ctx.fillStyle = "#b9e8c5";
    ctx.beginPath();
    ctx.moveTo(0, 470);
    ctx.quadraticCurveTo(180, 320, 360, 470);
    ctx.quadraticCurveTo(590, 300, 780, 465);
    ctx.quadraticCurveTo(850, 380, 960, 440);
    ctx.lineTo(960, 600);
    ctx.lineTo(0, 600);
    ctx.fill();

    // Ground
    ctx.fillStyle = "#82d69d";
    ctx.fillRect(0, 520, 960, 80);
    ctx.fillStyle = "#5cbd7e";
    ctx.fillRect(0, 520, 960, 7);

    // Little flowers
    for (let i = 0; i < 28; i++) {
      const x = (i * 37 + 15) % 950;
      const y = 545 + (i % 3) * 13;

      ctx.fillStyle = ["#ff91ba", "#fff0a0", "#d9a8ff"][i % 3];

      for (let j = 0; j < 5; j++) {
        const angle = j * Math.PI * 2 / 5;
        ctx.beginPath();
        ctx.arc(
          x + Math.cos(angle) * 5,
          y + Math.sin(angle) * 5,
          3.5, 0, Math.PI * 2
        );
        ctx.fill();
      }

      ctx.fillStyle = "#fff6bb";
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlatforms() {
    platforms.forEach(p => {
      ctx.fillStyle = "#a1df8e";
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 8);
      ctx.fill();

      ctx.fillStyle = "#64bd7b";
      ctx.fillRect(p.x, p.y + p.h - 5, p.w, 5);
    });
  }

  function drawMushroom(m) {
    if (!m.alive) return;

    ctx.fillStyle = "#fff0d9";
    ctx.beginPath();
    ctx.roundRect(m.x - 11, m.y - 8, 22, 24, 7);
    ctx.fill();

    ctx.fillStyle = level % 3 === 0 ? "#a57bea" : "#ff7488";
    ctx.beginPath();
    ctx.ellipse(m.x, m.y - 11, 24, 17, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(m.x - 8, m.y - 17, 4, 0, Math.PI * 2);
    ctx.arc(m.x + 7, m.y - 12, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#49335e";
    ctx.beginPath();
    ctx.arc(m.x - 4, m.y + 1, 2, 0, Math.PI * 2);
    ctx.arc(m.x + 4, m.y + 1, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStar(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(frame * 0.04 + x) * 0.15);
    ctx.fillStyle = "#ffe16b";
    ctx.strokeStyle = "#ffb94d";
    ctx.lineWidth = 2;

    ctx.beginPath();

    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 ? 7 : 15;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawGoal() {
    const bob = Math.sin(frame * 0.06) * 5;

    ctx.save();
    ctx.shadowColor = "#ffe36e";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#ffdb69";

    ctx.beginPath();
    ctx.ellipse(goal.x, goal.y + bob, 21, 28, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#c38a3e";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#73bf71";
    ctx.beginPath();
    ctx.ellipse(goal.x + 9, goal.y - 26 + bob, 11, 6, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawScene() {
    drawBackground();
    drawPlatforms();

    treasures.forEach(t => {
      if (!t.found) drawStar(t.x, t.y);
    });

    mushrooms.forEach(drawMushroom);
    drawGoal();

    drawCat(
      ctx,
      player.x + player.w / 2,
      player.y + player.h - 4,
      0.8,
      selectedCat,
      player.grounded && Math.abs(player.vx) > 0
        ? Math.sin(frame * 0.3) * 2 : 0
    );

    if (paused) {
      ctx.fillStyle = "rgba(55,40,75,0.6)";
      ctx.fillRect(0, 0, 960, 600);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = "bold 42px system-ui";
      ctx.fillText("PAUSED ⏸", 480, 290);
    }
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y;
  }

  function loseLife() {
    lives--;

    if (lives <= 0) {
      playing = false;
      paused = false;

      $("panel").innerHTML = `
        <h2>Oh no! 💗</h2>
        <p>Your little cat needs another try.</p>
        <button class="mainbtn" id="retry">Try Again ✨</button>
      `;

      $("overlay").style.display = "flex";

      $("retry").addEventListener("click", () => {
        level = 1;
        stars = 0;
        lives = 3;
        showMenu();
      });

      return;
    }

    player.x = 30;
    player.y = 430;
    player.vx = 0;
    player.vy = 0;
    player.invincible = 90;
  }

  function completeLevel() {
    playing = false;

    if (level >= 20) {
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
        showMenu();
      });

    } else {
      $("panel").innerHTML = `
        <h2>Level ${level} complete! 🌟</h2>
        <p>You explored ${worlds[level - 1]}!</p>
        <p>Ready for the next magical world?</p>
        <button class="mainbtn" id="next">Next Level ➜</button>
      `;

      $("overlay").style.display = "flex";

      $("next").addEventListener("click", () => {
        level++;
        paused = false;
        setupLevel();
        $("overlay").style.display = "none";
        playing = true;
        $("pause").textContent = "Ⅱ Pause";
        $("panel").innerHTML = "";
      });
    }
  }

  function update(dt) {
    if (!playing || paused) return;

    frame += dt;
    player.vx = 0;

    if (keys.left) player.vx = -3.8;
    if (keys.right) player.vx = 3.8;

    player.x += player.vx * dt;
    player.x = Math.max(0, Math.min(918, player.x));

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
        x: player.x + 5,
        y: player.y + 8,
        w: player.w - 10,
        h: player.h - 8
      };

      const enemyBox = {
        x: m.x - 17,
        y: m.y - 24,
        w: 34,
        h: 42
      };

      if (overlaps(catBox, enemyBox) && player.invincible <= 0) {
        if (player.vy > 1 && player.y + player.h < m.y + 16) {
          m.alive = false;
          player.vy = -8;
          stars += 2;
        } else {
          loseLife();
        }
      }
    });

    if (player.invincible > 0) player.invincible -= dt;

    treasures.forEach(t => {
      if (t.found) return;

      if (overlaps(
        { x: player.x, y: player.y, w: player.w, h: player.h },
        { x: t.x - 12, y: t.y - 12, w: 24, h: 24 }
      )) {
        t.found = true;
        stars++;
      }
    });

    $("starLabel").textContent = "⭐ " + stars + " stars";

    if (overlaps(
      { x: player.x, y: player.y, w: player.w, h: player.h },
      { x: goal.x - 22, y: goal.y - 28, w: 44, h: 56 }
    )) {
      completeLevel();
    }
  }

  function showMenu() {
    playing = false;
    paused = false;

    $("panel").innerHTML = `
      <h2>Pick your little adventurer!</h2>
      <p>Collect stars, jump on silly mushrooms, and find the glowing acorn.</p>
      <p>Explore 20 magical worlds!</p>
      <div class="catgrid" id="catgrid"></div>
      <p class="tips">Move with ◀ ▶ and jump with ⬆ or Space.</p>
      <button class="mainbtn" id="start">Let’s go exploring! ✨</button>
    `;

    cats.forEach((cat, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "catpick" +
        (index === selectedCat ? " selected" : "");

      const preview = document.createElement("canvas");
      preview.width = 100;
      preview.height = 100;
      drawCat(preview.getContext("2d"), 50, 92, 0.7, index);

      const name = document.createElement("div");
      name.textContent = cat.name;

      button.appendChild(preview);
      button.appendChild(name);

      button.addEventListener("click", () => {
        selectedCat = index;
        document.querySelectorAll(".catpick").forEach((item, i) => {
          item.classList.toggle("selected", i === index);
        });
      });

      $("catgrid").appendChild(button);
    });

    $("start").addEventListener("click", () => {
      setupLevel();
      $("overlay").style.display = "none";
      $("pause").textContent = "Ⅱ Pause";
      playing = true;
    });

    $("overlay").style.display = "flex";
  }

  function bindHold(id, key) {
    const button = $(id);
    if (!button) return;

    const down = event => {
      event.preventDefault();
      keys[key] = true;
    };

    const up = event => {
      event.preventDefault();
      keys[key] = false;
    };

    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointerleave", up);
    button.addEventListener("pointercancel", up);
  }

  bindHold("left", "left");
  bindHold("right", "right");

  $("jump").addEventListener("pointerdown", event => {
    event.preventDefault();

    if (playing && !paused && player.grounded) {
      player.vy = -12;
      player.grounded = false;
    }
  });

  $("pause").addEventListener("click", () => {
    if (!playing) return;

    paused = !paused;
    $("pause").textContent = paused ? "▶ Resume" : "Ⅱ Pause";
  });

  document.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(event.key)) {
      event.preventDefault();
    }

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      keys.left = true;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      keys.right = true;
    }

    if (
      ["ArrowUp", " ", "w"].includes(event.key) &&
      !event.repeat && playing && !paused && player.grounded
    ) {
      player.vy = -12;
      player.grounded = false;
    }
  });

  document.addEventListener("keyup", event => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      keys.left = false;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      keys.right = false;
    }
  });

  setupLevel();
  showMenu();

  function loop(time) {
    const dt = lastTime
      ? Math.min((time - lastTime) / 16.67, 2)
      : 1;

    lastTime = time;
    update(dt);
    drawScene();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
