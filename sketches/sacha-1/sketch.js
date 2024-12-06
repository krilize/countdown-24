import { createEngine } from "../../shared/engine.js";
import { createSpringSettings, Spring } from "../../shared/spring.js";

const { renderer, input, math, run, pixelRatio, finish } = createEngine();
const { ctx, canvas } = renderer;
run(update);

// Configuration du ressort
const spring = new Spring({ position: 1.5 });
const settingsBat = createSpringSettings({ frequency: 1, halfLife: 1 });
const settingsRétrécirRapide = createSpringSettings({ frequency: 1.5, halfLife: 0.1 });
const settingsRétrécirLent = createSpringSettings({ frequency: 0.5, halfLife: 1 });

const explosionScaleThreshold = 1.8;
const numberDuration = 1000; // Durée d'affichage du chiffre

// Images
const heartImage = new Image();
heartImage.src = "./image/hearth.png";
const explosionImage = new Image();
explosionImage.src = "./image/blood.png";
const cursorImage = new Image();
cursorImage.src = "./image/seringue/seringue-1.png";
const clickSound = new Audio('./image/heart-beat.mp3'); // Remplacez par le chemin de votre fichier son

// Variables générales
let cursorX = 0;
let cursorY = 0;
let cursorScale = 0.2;
let cursorRotation = -90;
let showExplosionImages = [];
let isMouseDown = false;
let showNumber = false;
let numberTimer = 0;
let wiggleOffsetX = 0;
let wiggleOffsetY = 0;
let imageVisible = true;

// Charger les images d'animation de la seringue
let syringeImages = [];
for (let i = 1; i <= 34; i++) {
  const img = new Image();
  img.src = `./image/seringue/seringue-${i}.png`;
  syringeImages.push(img);
}
let currentFrame = 0;
let frameTimer = 0;
const frameDuration = 50;

function update(dt) {
  // Animation du cœur
  if (isMouseDown) {
    spring.target = 1.5;
    spring.settings = settingsBat;
  } else {
    spring.target = 1;
    spring.settings = settingsRétrécirRapide;
  }
  spring.step(dt);

  const x = canvas.width / 2;
  const y = canvas.height / 2;
  const scale = spring.position;

  // Tremblement
  if (scale >= 1.2) {
    wiggleOffsetX = (Math.random() - 0.5) * 30;
    wiggleOffsetY = (Math.random() - 0.5) * 30;
  } else {
    wiggleOffsetX = wiggleOffsetY = 0;
  }

  // Dessiner le fond
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Explosion si seuil atteint
  if (scale >= explosionScaleThreshold && imageVisible) {
    for (let i = 0; i < 50; i++) {
      showExplosionImages.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        scale: Math.random() * 3 + 0.5,
        delay: Math.random() * 150, // Délai aléatoire entre 0 et 150 ms
        displayDuration: 4000 // Durée d'affichage de 3 secondes
      });
    }

    imageVisible = false;
    showNumber = true;
    numberTimer = 0;
  }

  // Affichage des explosions
  for (let i = showExplosionImages.length - 1; i >= 0; i--) {
    let explosion = showExplosionImages[i];

    // Réduire le délai pour chaque explosion
    if (explosion.delay > 0) {
      explosion.delay -= dt * 500; // Diminuer le délai selon le temps écoulé
      continue; // Ne pas afficher tant que le délai n'est pas écoulé
    }

    // Afficher l'explosion si le délai est écoulé
    const w = explosionImage.width * explosion.scale;
    const h = explosionImage.height * explosion.scale;

    // Dessiner l'explosion
    ctx.globalAlpha = 1; // Assurez-vous que l'opacité est 1
    ctx.drawImage(explosionImage, explosion.x - w / 2, explosion.y - h / 2, w, h);
    
    // Vérifiez si le temps d'affichage est écoulé
    explosion.displayDuration -= dt * 1000; // Décrémenter la durée d'affichage
    if (explosion.displayDuration <= 0) { // Si la durée est écoulée, retirer l'explosion
        showExplosionImages.splice(i, 1); // Retirer l'explosion
    }
  }

  // Gérer la fin de l'animation lorsque toutes les explosions ont disparu
  if (showExplosionImages.length === 0 && !imageVisible) {
    finish(); // Terminer l'animation
  }

  
  // Affichage du cœur
  if (imageVisible && scale > 0.01) {
    const w = heartImage.width * scale;
    const h = heartImage.height * scale;
    ctx.drawImage(heartImage, x - w / 2 + wiggleOffsetX, y - h / 2 + wiggleOffsetY, w, h);
  }

  // Animation de la seringue
  if (isMouseDown) {
    frameTimer += dt * 1000;
    if (frameTimer >= frameDuration) {
      frameTimer = 0;
      currentFrame = (currentFrame + 1) % syringeImages.length;
    }
  } else {
    currentFrame = 0;
  }
  if (syringeImages[currentFrame]) {
    const syringeImage = syringeImages[currentFrame];
    const w = syringeImage.width * cursorScale;
    const h = syringeImage.height * cursorScale;

    ctx.save();
    ctx.translate(cursorX, cursorY);
    ctx.rotate(cursorRotation);
    ctx.drawImage(syringeImage, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  // Affichage du chiffre "3"
  if (showNumber) {
    ctx.fillStyle = "black";
    ctx.font = `${canvas.height}px Helvetica Neue, Helvetica, bold`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("1", canvas.width / 2, canvas.height / 2);

    numberTimer += dt;
    if (numberTimer >= numberDuration) {
      showNumber = false;
    }
  }
}

// Suivre le curseur
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  cursorX = (e.clientX - rect.left) * pixelRatio;
  cursorY = (e.clientY - rect.top) * pixelRatio;
});

canvas.addEventListener("mousedown", () => {
  isMouseDown = true;
    // Réinitialiser le son et le jouer
    clickSound.currentTime = 0; // Revenir au début du fichier audio
    clickSound.play().catch((err) => {
      console.error("Erreur lors de la lecture du son :", err);
    });
});

canvas.addEventListener("mouseup", () => {
  isMouseDown = false;
    // Réinitialiser le son et le jouer
    clickSound.currentTime = 0; // Revenir au début du fichier audio
    clickSound.pause().catch((err) => {
      console.error("Erreur lors de la lecture du son :", err);
    });
});
