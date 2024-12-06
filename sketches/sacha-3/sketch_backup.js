import { createEngine } from "../../shared/engine.js";
import Utils from "./Utils.js";
import ParticleSystem from "./ParticleSystem.js";

const { renderer, input, run, pixelRatio } = createEngine();
const { ctx, canvas } = renderer;

run(update);

// Variables globales
let knife1Image, knife2Image, knife3Image;
let currentKnifeState = 1;

let pathPoints = [];
let liquidLevel = 0;
let isFilling = false;
let offsetX = 0;
let offsetY = 0;
let scaleFactor = 1;

// Variables pour la position de l'image des couteaux
let knifeX = 0;
let knifeY = 0;
let knifeAngle = -Math.PI / 2;

const particleSystem = new ParticleSystem(); // Initialisation du système de particules

// Charge les ressources nécessaires
await initializeAssets();

async function initializeAssets() {
  knife1Image = await loadImage('./image/knife-1.png');
  knife2Image = await loadImage('./image/knife-2.png');
  knife3Image = await loadImage('./image/knife-3.png');
  pathPoints = await Utils.loadSVG("./letter.svg");
  calculateOffsets();
}

// Fonction pour charger une image
async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

// Calcul des offsets pour centrer la lettre
function calculateOffsets() {
  if (pathPoints.length === 0) return;

  let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

  pathPoints.forEach((points) => {
    points.forEach((point) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
  });

  const letterWidth = (maxX - minX) * scaleFactor;
  const letterHeight = (maxY - minY) * scaleFactor;

  offsetX = canvas.width / 2 - (minX * scaleFactor + letterWidth / 2);
  offsetY = canvas.height / 2 - (minY * scaleFactor + letterHeight / 2);
}

// Ajouter des événements pour la souris
canvas.addEventListener("mousedown", () => {
  isFilling = true;
  currentKnifeState = 2;
  knifeAngle = -Math.PI / 2;
  knifeX -= 30;
  knifeY += 30;

  // Ajout de particules
  for (let i = 0; i < 10; i++) {
    const targetX = Math.random() * canvas.width;
    const targetY = canvas.height;
    particleSystem.addParticle(knifeX, knifeY, targetX, targetY);
  }
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  knifeX = (event.clientX - rect.left) * pixelRatio - 30;
  knifeY = (event.clientY - rect.top) * pixelRatio + 30;
});

canvas.addEventListener("mouseup", () => {
  isFilling = false;
  currentKnifeState = 3;
  knifeAngle = -Math.PI / 2;
});

// Fonction pour dessiner la lettre
function drawLetter(ctx) {
  if (pathPoints.length === 0) return;

  ctx.save();
  ctx.beginPath();
  pathPoints.forEach((points) => {
    points.forEach((point, index) => {
      const x = point.x * scaleFactor + offsetX;
      const y = point.y * scaleFactor + offsetY;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  });

  ctx.fillStyle = "black";
  ctx.fill();
  ctx.restore();
}

// Fonction principale de mise à jour et de rendu
function update(dt) {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Met à jour le niveau de liquide
  const liquidHeight = canvas.height * liquidLevel;
  ctx.fillStyle = "rgba(255, 33, 0, 1)";
  ctx.fillRect(0, canvas.height - liquidHeight, canvas.width, liquidHeight);

  // Mise à jour et rendu des particules
  particleSystem.update();
  particleSystem.draw(ctx);

  // Dessine la lettre
  drawLetter(ctx);

  // Dessine le couteau
  ctx.save();
  ctx.translate(knifeX, knifeY);
  ctx.scale(0.2, 0.2);
  ctx.rotate(knifeAngle);

  if (currentKnifeState === 1) {
    ctx.drawImage(knife1Image, -knife1Image.width / 2, -knife1Image.height / 2);
  } else if (currentKnifeState === 2) {
    ctx.drawImage(knife2Image, -knife2Image.width / 2, -knife2Image.height / 2);
  } else if (currentKnifeState === 3) {
    ctx.drawImage(knife3Image, -knife3Image.width / 2, -knife3Image.height / 2);
  }
  ctx.restore();
}
