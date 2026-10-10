const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let gameData = {
    level: 1,
    maxLevel: 20,
    mushroomsDefeated: 0,
    targetMushrooms: 5,
    selectedCat: { name: 'Mochi', color: '#f5e1da', accent: '#d48c82' }
}

function selectCat(name, color, accent) {
    gameData.selectedCat = { name, color, accent };
    document.getElementById("selected-cat-name").innerText = name;
    document.getElementById("character-select").style.display = 'none';
    startWhimsicalMusic();
}

let camera = { x: 0 };

let player = {
    x: 100, y: 100,
    width: 48, height: 60,
    vx: 0, vy: 0,
    speed: 4,
    facing: 'right'
};

// Evil Mushrooms scattered across levels
let mushrooms = [];
function initLevel() {
    mushrooms = [];
    gameData.mushroomsDefeated = 0;
    for(let i = 0; i < gameData.targetMushrooms; i++) {
        mushrooms.push({
            x: 400 + i * 350 + Math.random() * 100,
            y: canvas.height - 210,
            width: 36, height: 36,
            defeated: false,
            wobble: Math.random() * Math.PI
        });
    }
}
initLevel();

// Audio
let audioCtx = null;
let isAudioPlaying = false;
function startWhimsicalMusic() {
    if (isAudioPlaying) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 880];
    let idx = 0;
    setInterval(() => {
        if (!audioCtx || audioCtx.state === 'suspended') return;
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[idx], audioCtx.currentTime);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
        idx = (idx + 1) % notes.length;
    }, 500);
    isAudioPlaying = true;
}

let keys = { left: false, right: false };

document.getElementById("btn-left").addEventListener("touchstart", () => keys.left = true);
document.getElementById("btn-left").addEventListener("touchend", () => keys.left = false);
document.getElementById("btn-right").addEventListener("touchstart", () => keys.right = true);
document.getElementById("btn-right").addEventListener("touchend", () => keys.right = false);

document.getElementById("btn-left").addEventListener("mousedown", () => keys.left = true);
document.getElementById("btn-left").addEventListener("mouseup", () => keys.left = false);
document.getElementById("btn-right").addEventListener("mousedown", () => keys.right = true);
document.getElementById("btn-right").addEventListener("mouseup", () => keys.right = false);

document.getElementById("btn-jump").addEventListener("click", () => {
    player.vy = -11;
});

// Boop action to defeat nearby evil mushrooms
document.getElementById("btn-boop").addEventListener("click", () => {
    mushrooms.forEach(m => {
        if (!m.defeated && Math.abs(player.x - m.x) < 70) {
            m.defeated = true;
            gameData.mushroomsDefeated++;
            
            // Check level completion
            if (gameData.mushroomsDefeated >= gameData.targetMushrooms) {
                setTimeout(() => {
                    if (gameData.level < gameData.maxLevel) {
                        gameData.level++;
                        initLevel();
                        player.x = 100;
                    } else {
                        alert("🎉 You successfully cleared all 20 cozy levels and saved the mushroom forest, Zety!");
                        gameData.level = 1;
                        initLevel();
                    }
                }, 400);
            }
        }
    });
});

function update() {
    if (keys.left) { player.x -= player.speed; player.facing = 'left'; if(player.x < camera.x + 50) player.x = camera.x + 50; }
    if (keys.right) { player.x += player.speed; player.facing = 'right'; }

    if (player.x > camera.x + canvas.width * 0.4) {
        camera.x = player.x - canvas.width * 0.4;
    }

    player.y += player.vy;
    let groundY = canvas.height - 170;
    if (player.y > groundY) { player.y = groundY; player.vy = 0; }
    else { player.vy += 0.55; }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let groundY = canvas.height - 170;

    // Background 4D Parallax trees
    ctx.save();
    ctx.translate(-camera.x * 0.3, 0);
    ctx.fillStyle = "#2d2338";
    for (let i = -2; i < 30; i++) {
        ctx.beginPath();
        ctx.arc(i * 280 + 100, groundY, 85, Math.PI, 0, false);
        ctx.fill();
    }
    ctx.restore();

    // Main world layer
    ctx.save();
    ctx.translate(-camera.x, 0);

    // Ground
    ctx.fillStyle = "#221a2c";
    ctx.fillRect(-1000, groundY, canvas.width + 5000, 170);
    ctx.strokeStyle = "#8a738a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-1000, groundY);
    ctx.lineTo(canvas.width + 5000, groundY);
    ctx.stroke();

    // Draw Evil Mushrooms
    mushrooms.forEach(m => {
        if (!m.defeated) {
            m.wobble += 0.05;
            let offset = Math.sin(m.wobble) * 4;
            
            // Mushroom cap (Evil Red/Purple style with cute eyes)
            ctx.fillStyle = "#d9534f";
            ctx.beginPath();
            ctx.arc(m.x + 18, m.y + 12 + offset, 16, Math.PI, 0, false);
            ctx.fill();
            ctx.strokeStyle = "#3b2c24";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Stem
            ctx.fillStyle = "#f5efe6";
            ctx.fillRect(m.x + 12, m.y + 12 + offset, 12, 22);
            ctx.strokeRect(m.x + 12, m.y + 12 + offset, 12, 22);
        }
    });

    // Draw 4D Layered Cute Cat Hero
    let cat = gameData.selectedCat;
    
    // Soft shadow underneath
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.arc(player.x + 24, player.y + 58, 16, 0, Math.PI * 2);
    ctx.fill();

    // Cat Body (Soft rounded 4D styling)
    ctx.fillStyle = cat.color;
    ctx.strokeStyle = "#3b2c24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(player.x + 8, player.y + 18, 32, 38, [16, 16, 10, 10]);
    ctx.fill();
    ctx.stroke();

    // Cat Head
    ctx.beginPath();
    ctx.arc(player.x + 24, player.y + 14, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cat Ears
    ctx.beginPath();
    ctx.moveTo(player.x + 10, player.y + 2);
    ctx.lineTo(player.x + 16, player.y - 10);
    ctx.lineTo(player.x + 22, player.y + 4);
    ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(player.x + 26, player.y + 4);
    ctx.lineTo(player.x + 32, player.y - 10);
    ctx.lineTo(player.x + 38, player.y + 2);
    ctx.fill(); ctx.stroke();

    // Accent detail (Collar / Bow)
    ctx.fillStyle = cat.accent;
    ctx.fillRect(player.x + 18, player.y + 24, 12, 6);

    ctx.restore();

    // Update HUD
    document.getElementById("shroom-val").innerText = gameData.mushroomsDefeated;
    document.getElementById("level-val").innerText = gameData.level;
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
