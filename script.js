
(() => {
"use strict";

const canvas = document.getElementById("gameCanvas");
if (!canvas) {
  document.body.innerHTML = "<h2>Meow-Meow-Quest</h2><p>Please add a canvas with id=\"gameCanvas\" in index.html.</p>";
  return;
}
const ctx = canvas.getContext("2d");

const cats = [
  {name:"Peaches",fur:"#ffb2c9",shirt:"#ff6f91"},
  {name:"Mochi",fur:"#fff0d5",shirt:"#a6d8ff"},
  {name:"Pepper",fur:"#aeb7c8",shirt:"#b8e986"},
  {name:"Boba",fur:"#bd8c69",shirt:"#d9a7ff"},
  {name:"Sprout",fur:"#c7e8a0",shirt:"#ffcf8b"}
];

const worlds = [
"Mushroom Meadow","Cotton Candy Woods","Moonberry Garden",
"Twinkle Toadstools","Cloudpaw Valley","Honeydew Hills",
"Crystal Creek","Daisy Dreamland","Starlight Forest",
"Bubblegum Grove","Little Acorn Woods","Rainbow Hollow",
"Sleepy Mushroom Town","Moonflower Meadow","Jellybean Jungle",
"Silverleaf Forest","Candycap Caverns","Dreamy Moss Valley",
"Golden Mushroom Kingdom","The Enchanted Heart"
];

let catIndex = 0, level = 1, stars = 0, lives = 3;
let playing = false, paused = false, frame = 0;
let keys = {}, platforms = [], mushrooms = [], treasures = [];
let player, goal, lastTime = 0;

canvas.width = 800;
canvas.height = 450;
canvas.style.maxWidth = "100%";
canvas.style.height = "auto";
canvas.style.borderRadius = "18px";
canvas.style.background = "#c5efff";
canvas.style.touchAction = "none";

function cat(x,y,scale=1) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);

  ctx.fillStyle = "rgba(40,50,50,.15)";
  ctx.beginPath();
  ctx.ellipse(0,0,22,6,0,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle=cats[catIndex].fur;
  ctx.lineWidth=9;
  ctx.lineCap="round";
  ctx.beginPath();
  ctx.moveTo(-10,-28);
  ctx.quadraticCurveTo(-35,-42,-25,-55);
  ctx.stroke();

  ctx.fillStyle=cats[catIndex].fur;
  ctx.beginPath();
  ctx.moveTo(-22,-43); ctx.lineTo(-23,-68); ctx.lineTo(-5,-54);
  ctx.moveTo(7,-54); ctx.lineTo(25,-68); ctx.lineTo(22,-42);
  ctx.fill();

  ctx.fillStyle=cats[catIndex].shirt;
  ctx.beginPath();
  ctx.ellipse(0,-23,19,20,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle=cats[catIndex].fur;
  ctx.beginPath();
  ctx.ellipse(0,-49,27,24,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle=cats[catIndex].shirt;
  ctx.beginPath();
  ctx.arc(0,-73,7,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#49335e";
  ctx.beginPath();
  ctx.ellipse(-9,-50,3,5,0,0,Math.PI*2);
  ctx.ellipse(9,-50,3,5,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#f47ba5";
  ctx.beginPath();
  ctx.arc(0,-43,3,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle="#49335e";
  ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(0,-40); ctx.lineTo(-5,-37);
  ctx.moveTo(0,-40); ctx.lineTo(5,-37);
  ctx.stroke();
  ctx.restore();
}

function mushroom(x,y) {
  ctx.fillStyle="#fff0d8";
  ctx.fillRect(x-9,y-8,18,19);
  ctx.fillStyle=level%2?"#ff7189":"#a97bea";
  ctx.beginPath();
  ctx.ellipse(x,y-10,22,15,0,Math.PI,Math.PI*2);
  ctx.fill();
  ctx.fillStyle="white";
  ctx.beginPath();
  ctx.arc(x-8,y-15,4,0,Math.PI*2);
  ctx.arc(x+7,y-12,3,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle="#49335e";
  ctx.beginPath();
  ctx.arc(x-4,y-2,2,0,Math.PI*2);
  ctx.arc(x+4,y-2,2,0,Math.PI*2);
  ctx.fill();
}

function setup() {
  platforms=[
    {x:0,y:390,w:800,h:60},
    {x:120,y:320,w:130,h:15},
    {x:300,y:270,w:125,h:15},
    {x:490,y:320,w:120,h:15},
    {x:640,y:245,w:100,h:15}
  ];

  player={x:45,y:320,w:40,h:65,vx:0,vy:0,onGround:false,invincible:0};

  mushrooms=[];
  for(let i=0;i<Math.min(2+Math.floor(level/2),8);i++){
    mushrooms.push({
      x:180+i*(470/Math.min(2+Math.floor(level/2),8)),
      y:372,dir:i%2?1:-1,alive:true
    });
  }

  treasures=[];
  for(let i=0;i<5;i++){
    treasures.push({
      x:100+i*140,
      y:[350,285,235,285,210][i],
      found:false
    });
  }

  goal={x:745,y:355};
}

function background() {
  const g=ctx.createLinearGradient(0,0,0,450);
  g.addColorStop(0,"#bcecff");
  g.addColorStop(1,"#f9e3ff");
  ctx.fillStyle=g;
  ctx.fillRect(0,0,800,450);

  ctx.fillStyle="#b9e8c3";
  ctx.beginPath();
  ctx.moveTo(0,350);
  ctx.quadraticCurveTo(200,210,400,350);
  ctx.quadraticCurveTo(600,220,800,320);
  ctx.lineTo(800,450);ctx.lineTo(0,450);
  ctx.fill();

  ctx.fillStyle="#80d59b";
  ctx.fillRect(0,390,800,60);

  ctx.fillStyle="#fff0a6";
  for(let i=0;i<18;i++){
    ctx.beginPath();
    ctx.arc((i*47+20)%800,415+(i%3)*9,3,0,Math.PI*2);
    ctx.fill();
  }

  platforms.forEach(p=>{
    ctx.fillStyle="#9bdb8c";
    ctx.fillRect(p.x,p.y,p.w,p.h);
    ctx.fillStyle="#64bd7b";
    ctx.fillRect(p.x,p.y+p.h-4,p.w,4);
  });
}

function draw() {
  background();

  treasures.forEach(t=>{
    if(t.found)return;
    ctx.fillStyle="#ffe16b";
    ctx.strokeStyle="#ffb94d";
    ctx.lineWidth=2;
    ctx.beginPath();
    for(let i=0;i<10;i++){
      const a=-Math.PI/2+i*Math.PI/5;
      const r=i%2?6:13;
      const px=t.x+Math.cos(a)*r;
      const py=t.y+Math.sin(a)*r;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.closePath();ctx.fill();ctx.stroke();
  });

  mushrooms.forEach(m=>{if(m.alive)mushroom(m.x,m.y);});

  ctx.fillStyle="#ffdc67";
  ctx.beginPath();
  ctx.ellipse(goal.x,goal.y,18,24,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle="#72bb6c";
  ctx.beginPath();
  ctx.ellipse(goal.x+8,goal.y-22,10,5,-.5,0,Math.PI*2);
  ctx.fill();

  cat(player.x+20,player.y+player.h-5,.75);

  if(paused){
    ctx.fillStyle="rgba(50,40,70,.6)";
    ctx.fillRect(0,0,800,450);
    ctx.fillStyle="white";
    ctx.font="bold 36px sans-serif";
    ctx.textAlign="center";
    ctx.fillText("PAUSED",400,220);
  }
}
