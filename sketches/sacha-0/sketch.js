import { createEngine } from "../../shared/engine.js";
import Utils from "./Utils.js";

const { renderer, input, run, pixelRatio, finish } = createEngine();
const { ctx, canvas } = renderer;

run(update);

// Variables globales
let knife1Image, knife2Image, knife3Image; // Images des couteaux
let currentKnifeState = 1; // 1: knife-1.png, 2: knife-2.png, 3: knife-3.png
const clickSound = new Audio('./image/stab.mp3'); 


let pathPoints = [];
let liquidLevel = 0; // Niveau de liquide initial à 0
let isFilling = false;
let offsetX = 0;
let offsetY = 0;
let scaleFactor = 1;

// Variables pour la position de l'image des couteaux
let knifeX = 0; // Position X de l'image
let knifeY = 0; // Position Y de l'image
let knifeAngle =  -Math.PI / 2; // Angle de rotation initial
let rotationSteps = [-Math.PI / 5, 0]; // Étapes de rotation (45 degrés vers la gauche et retour à la position initiale)
let currentStep = 0; // Étape actuelle de la rotation
let stepDuration = 0.08; // Durée de chaque étape réduite pour une rotation plus rapide
let stepTimer = 0; // Timer pour suivre le temps écoulé
let isRotating = false; // Indique si le couteau est en rotation

// Tableau pour stocker les gouttes d'eau
const drops = []; // Tableau pour stocker les gouttes d'eau
let clickCount = 0; // Compteur de clics

let animationEnded = false;

// Chargez les ressources nécessaires
await initializeAssets();


async function initializeAssets() {
  knife1Image = await loadImage('./image/knife-1.png');
  knife2Image = await loadImage('./image/knife-2.png');
  knife3Image = await loadImage('./image/knife-3.png');
  pathPoints = await Utils.loadSVG("./0.svg");
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

let hasDrops = false; // Ajoutez cette variable pour suivre si des gouttes ont été ajoutées

// Écoutez les événements de la souris
canvas.addEventListener("mousedown", (event) => {
  isFilling = true;
  isRotating = true; // Commencer la rotation
  currentStep = 0; // Réinitialiser l'étape actuelle
  stepTimer = 0; // Réinitialiser le timer
  currentKnifeState = 2; // Change pour knife-2.png
  knifeAngle = -Math.PI / 2; // Décaler de -22.5° vers la gauche
  knifeX -= 30;
  knifeY += 30;

  hasDrops = true; // Marquer que des gouttes ont été ajoutées

  // Utilisez les coordonnées du couteau pour ajouter des gouttes
  for (let i = 0; i < 5; i++) { // Générer 5 gouttes au début
    // Placer les gouttes juste sous le couteau
    const dropX = knifeX + (Math.random() - 0.5) * 10; // Variation aléatoire pour X
    const dropY = knifeY + 20 + Math.random() * 10; // Légèrement en dessous de la souris

    // Ajoutez une vitesse aléatoire entre 1 et 5 pour chaque goutte
    const dropSpeed = Math.random() * 4 + 1; // Vitesse entre 1 et 5
    const dropSize = Math.random() * 15 + 5; // Taille entre 5 et 20
    drops.push({ x: dropX, y: dropY, height: 0, speed: dropSpeed, size: dropSize });
  }

  // Réduire progressivement le niveau de liquide
  if (liquidLevel > 0) {
    liquidLevel -= 0.05; // Ajustez la valeur pour la vitesse de réduction
    if (liquidLevel < 0) liquidLevel = 0; // Limiter à 0
  }
  clickSound.currentTime = 0; // Revenir au début du fichier audio
  clickSound.play().catch((err) => {
    console.error("Erreur lors de la lecture du son :", err);
  });
});


// Écoutez les mouvements de la souris
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  knifeX = ((event.clientX - rect.left) * pixelRatio) - 30; // Position X de la souris
  knifeY = ((event.clientY - rect.top) * pixelRatio) + 30;   // Position Y de la souris
  
  console.log(knifeX, knifeY)
});

canvas.addEventListener("mouseup", () => {
  isFilling = false;
  currentKnifeState = 3; // Change pour knife-3.png
  knifeAngle =  -Math.PI / 2;
});

canvas.addEventListener("mouseleave", () => {
  isFilling = false;
  currentKnifeState = 1; // Retour à knife-1.png
  knifeAngle = 0;
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
  ctx.fillStyle = "black"; // Changez "black" par la couleur asouhaitée
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

// Variables pour gérer le délai avant la chute des gouttes
let dropStartTime = null; // Temps où les gouttes commencent à tomber
const dropDelay = 10000; // Délai en millisecondes (par exemple, 1000 ms = 1 seconde)

// Fonction de mise à jour/dessin
// Fonction de mise à jour/dessin
// Fonction de mise à jour/dessin
function update(dt) {
  ctx.fillStyle = "black"; // Couleur de fond
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1. Dessiner le fluide (arrière-plan)
  const liquidHeight = canvas.height * liquidLevel; // Définir la hauteur du liquide
  ctx.fillStyle = "rgba(255, 33, 0, 1)"; // Couleur du fluide
  ctx.fillRect(0, canvas.height - liquidHeight, canvas.width, liquidHeight); // Dessiner le fluide
  
  // 2. Mettre à jour les gouttes d'eau
  if (isFilling) {
    for (let i = 0; i < 5; i++) { // Ajouter 5 gouttes supplémentaires à chaque mise à jour pendant que le clic est maintenu
      const dropX = knifeX + (Math.random() - 0.5) * 10; // Variation aléatoire pour la position X
      const dropY = knifeY + 20 + Math.random() * 10; // Légèrement en dessous de la souris
      
      // Ajoutez une vitesse aléatoire entre 1 et 5 pour chaque goutte
      const dropSpeed = Math.random() * 4 + 1; // Vitesse entre 1 et 5
      const dropSize = Math.random() * 15 + 5;
      drops.push({ x: dropX, y: dropY, height: 0, speed: dropSpeed, size: dropSize });
    }
  }

  // 2. Vérifier si les gouttes doivent commencer à tomber
  if (isFilling && dropStartTime === null) {
    dropStartTime = performance.now(); // Démarrer le timer lorsque le remplissage commence
  }

  // Vérifiez si le délai est dépassé pour commencer à faire tomber les gouttes
  if (dropStartTime !== null) {
    const elapsedTime = performance.now() - dropStartTime; // Temps écoulé depuis le début du remplissage
    if (elapsedTime > dropDelay) {
      // Si le délai est dépassé, mettre à jour la position des gouttes
      drops.forEach((drop) => {
        drop.y += drop.speed * 2; // Fait tomber la goutte vers le bas
      });
    }
  }

  // Mise à jour du tableau des gouttes
  drops.forEach((drop, index) => {
    // Augmenter la hauteur pour simuler l'écoulement
    if (drop.height < canvas.height) {
      drop.height += drop.speed;
    }
  });

  // Dessiner les gouttes d'eau
  drawDrops(ctx); // Dessiner les gouttes d'eau

  // 3. Dessiner la lettre (milieu)
  drawLetter(ctx); // Dessiner la lettre

  ctx.save(); // Sauvegarder l'état du contexte
  ctx.save();
  ctx.translate(knifeX, knifeY); // Déplace le contexte à la position du couteau
  ctx.scale(0.2, 0.2);           // Applique une échelle (facultatif)
  ctx.rotate(knifeAngle);       // Applique une échelle (facultatif)

  // Affiche l'image correspondant à l'état actuel du couteau
  if (currentKnifeState === 1) {
    ctx.drawImage(knife1Image, -knife1Image.width / 2, -knife1Image.height / 2);
  } else if (currentKnifeState === 2) {
    ctx.drawImage(knife2Image, -knife2Image.width / 2, -knife2Image.height / 2);
  } else if (currentKnifeState === 3) {
    ctx.drawImage(knife3Image, -knife3Image.width / 2, -knife3Image.height / 2);
  }
  ctx.restore();

  // Vérifier si toutes les gouttes ajoutées après le clic sont en dehors du canvas
  if (hasDrops && drops.every(drop => drop.y > canvas.height)) {
    console.log("Toutes les gouttes ont dépassé le canvas. Animation terminée.");
    finish(); // Arrêter la boucle d'animation
  }
}

