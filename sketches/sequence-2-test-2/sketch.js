import { createEngine } from "../../shared/engine.js";
import Utils from "./Utils.js";

const { renderer, input, run } = createEngine();
const { ctx, canvas } = renderer;

run(update);

// Variables globales
let CouteauxImage; // Déclarez sans initialiser
let pathPoints = [];
let liquidLevel = 0; // Niveau de liquide initial à 0
let isFilling = false;
let offsetX = 0;
let offsetY = 0;
let scaleFactor = 1;

// Variables pour la position de l'image des couteaux
let knifeX = 0; // Position X de l'image
let knifeY = 0; // Position Y de l'image
let knifeAngle = 0; // Angle de rotation initial
let rotationSteps = [-Math.PI / 5, 0]; // Étapes de rotation (45 degrés vers la gauche et retour à la position initiale)
let currentStep = 0; // Étape actuelle de la rotation
let stepDuration = 0.08; // Durée de chaque étape réduite pour une rotation plus rapide
let stepTimer = 0; // Timer pour suivre le temps écoulé
let isRotating = false; // Indique si le couteau est en rotation

// Tableau pour stocker les gouttes d'eau
const drops = []; // Tableau pour stocker les gouttes d'eau
let clickCount = 0; // Compteur de clics

// Chargez les ressources nécessaires
await initializeAssets();

async function initializeAssets() {
  CouteauxImage = await loadImage('./image/knife.png'); // Assurez-vous que le chemin est correct
  pathPoints = await Utils.loadSVG("./deux.svg"); // Assurez-vous que le chemin est correct
  calculateOffsets();
}

// Fonction pour charger une image
async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.error(`Erreur lors du chargement de l'image : ${src}`, err);
      reject(err);
    };
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
canvas.addEventListener("mousedown", (event) => {
  isFilling = true;
  isRotating = true; // Commencer la rotation
  currentStep = 0; // Réinitialiser l'étape actuelle
  stepTimer = 0; // Réinitialiser le timer
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const dropX = (event.clientX - rect.left) * scaleX;
  const dropY = (event.clientY - rect.top) * scaleY;

  drops.push({ x: dropX, y: dropY, height: 0 });
  clickCount++; // Incrémenter le compteur de clics

  // Réduire progressivement le niveau de liquide
  if (liquidLevel > 0) {
    liquidLevel -= 0.05; // Ajustez la valeur pour la vitesse de réduction
    if (liquidLevel < 0) liquidLevel = 0; // Limiter à 0
  }
});

canvas.addEventListener("mouseup", () => (isFilling = false));
canvas.addEventListener("mouseleave", () => (isFilling = false));

// Écoutez les mouvements de la souris
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  knifeX = event.clientX - rect.left; // Position X de la souris
  knifeY = event.clientY - rect.top;   // Position Y de la souris
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

  // Définissez la couleur de la lettre ici
  ctx.fillStyle = "black"; // Changez "black" par la couleur souhaitée
  ctx.fill(); // Remplissez la lettre avec la couleur spécifiée
  ctx.restore(); // Restaurer l'état du contexte
}

// Fonction pour dessiner les gouttes d'eau
function drawDrops(ctx) {
  ctx.fillStyle = "rgba(255, 33, 0, 1)"; // Couleur des gouttes d'eau
  drops.forEach((drop) => {
    // Dessiner la goutte avec une hauteur qui simule l'écoulement
    ctx.fillRect(drop.x - 5, drop.y, 10, drop.height); // Dessiner la goutte
  });
}

// Fonction de mise à jour/dessin
function update(dt) {
  ctx.fillStyle = "black"; // Couleur de fond
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1. Dessiner le fluide (arrière-plan)
  const liquidHeight = canvas.height * liquidLevel; // Définir la hauteur du liquide
  ctx.fillStyle = "rgba(255, 33, 0, 1)"; // Couleur du fluide
  ctx.fillRect(0, canvas.height - liquidHeight, canvas.width, liquidHeight); // Dessiner le fluide
  
  // 2. Mettre à jour les gouttes d'eau
  drops.forEach((drop) => {
    // Augmenter la hauteur de la goutte pour simuler un écoulement
    if (drop.height < canvas.height) { // Limiter la hauteur maximale
      drop.height += 3; // Augmenter progressivement la hauteur
    }
  });

  // Dessiner les gouttes d'eau
  drawDrops(ctx); // Dessiner les gouttes d'eau

  // 3. Dessiner la lettre (milieu)
  drawLetter(ctx); // Dessiner la lettre

  ctx.save(); // Sauvegarder l'état du contexte
  ctx.translate(knifeX, knifeY); // Déplacer le contexte à la position du couteau

  // Gérer la rotation par étapes
  if (isRotating) {
    stepTimer += dt; // Incrémenter le timer
    if (stepTimer >= stepDuration) {
      // Passer à l'étape suivante
      knifeAngle = rotationSteps[currentStep]; // Appliquer l'angle de l'étape actuelle
      currentStep++; // Passer à l'étape suivante

      // Vérifier si nous avons atteint la fin des étapes
      if (currentStep >= rotationSteps.length) {
        isRotating = false; // Arrêter la rotation si toutes les étapes sont complètes
        knifeAngle = 0; // Réinitialiser à la position initiale
      }
      
      stepTimer = 0; // Réinitialiser le timer
    }
  }

  ctx.save();
  ctx.translate(knifeX, knifeY); // Déplace le contexte à la position du couteau
  ctx.rotate(knifeAngle);        // Applique une rotation si nécessaire
  ctx.scale(0.5, 0.5);           // Applique une échelle (facultatif)
  ctx.drawImage(CouteauxImage, -CouteauxImage.width / 2 , -CouteauxImage.height / 2); // Centre l'image
  ctx.restore();
}


//change l'image de couteau 
// faire en sorte q'il decoupe 
// quand on laisse appuier le sang coule