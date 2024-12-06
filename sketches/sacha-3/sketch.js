import { createEngine } from "../../shared/engine.js";
import Utils from "./Utils.js";
import ParticleSystem from "./ParticleSystem.js";

const { renderer, input, run, finish } = createEngine();
const { ctx, canvas } = renderer;

const particleSystem = new ParticleSystem();
const pathPoints = await Utils.loadSVG("./3.svg");
calculateOffsets();

// Charger l'image à afficher
const cursorImage = new Image();
cursorImage.src = "./image/chainSaw.png"; // Remplacez par le chemin de votre image

// Charger le son
const clickSound = new Audio('./image/chainsaw.mp3'); // Remplacez par le chemin de votre fichier audio

// Retourne un point aléatoire parmi tous les chemins SVG chargés
function getRandomPathPoint() {
  const pathIndex = Math.floor(Math.random() * pathPoints.length);
  const points = pathPoints[pathIndex];
  const pointIndex = Math.floor(Math.random() * points.length);
  return points[pointIndex];
}

// Génère de nouvelles particules lorsque la souris est pressée,
// avec des points cibles aléatoires sur le SVG
function generateParticles() {
  if (input.isPressed() && pathPoints.length > 0) {
    for (let i = 0; i < 3; i++) {
      const targetPoint = getRandomPathPoint();
      particleSystem.addParticle(
        input.getX(),
        input.getY(),
        targetPoint.x + canvas.width / 2,
        targetPoint.y + canvas.height / 2
      );
    }
  }
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

  const letterWidth = (maxX - minX);
  const letterHeight = (maxY - minY);

  pathPoints.forEach((points) => {
    points.forEach((point) => {
      point.x -= (minX + letterWidth / 2);
      point.y -= (minY + letterHeight / 2);
    });
  });
}

// Met à jour leurs positions et les dessine
let animationEnded = false; // Indique si l'animation est déjà terminée
let hasStarted = false; // Indique si des particules ont été générées
let soundPlaying = false; // Indique si le son est déjà en cours de lecture

function update() {
  // Effacer l'écran avec un fond noir
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Générer des particules si l'utilisateur interagit (par exemple, clic souris)
  generateParticles();

  // Vérifier si des particules ont été ajoutées
  if (!hasStarted && particleSystem.particles.length > 0) {
    hasStarted = true; // L'animation commence officiellement
  }

  // Mettre à jour et dessiner les particules
  particleSystem.update();
  particleSystem.draw(ctx);

  // Calculer les offsets pour le wiggle
  let wiggleOffsetX = 0;
  let wiggleOffsetY = 0;

  if (input.isPressed()) {
    // Si le bouton de la souris est enfoncé, appliquez un effet de wiggle
    wiggleOffsetX = (Math.random() - 0.5) * 10; // Variation entre -5 et 5
    wiggleOffsetY = (Math.random() - 0.5) * 10; // Variation entre -5 et 5

    // Jouer le son si ce n'est pas déjà en cours
    if (!soundPlaying) {
      clickSound.currentTime = 0; // Réinitialiser le son à 0
      clickSound.play();
      soundPlaying = true; // Marquer le son comme étant en cours de lecture
    }
  } else {
    // Si le clic est relâché, réinitialiser soundPlaying
    clickSound.pause();
    clickSound.currentTime = 0;
    soundPlaying = false; // Réinitialiser lorsque le clic est relâché
    
  }

  // Dessiner l'image qui suit le curseur avec l'effet de wiggle
  ctx.drawImage(cursorImage, input.getX() - cursorImage.width / 3 + wiggleOffsetX, input.getY() - cursorImage.height / 1.5 + wiggleOffsetY);

  // Terminer l'animation uniquement si elle a commencé et que toutes les particules ont disparu
  if (hasStarted && !animationEnded && particleSystem.particles.length === 0) {
    animationEnded = true; // Marque que l'animation est terminée
    console.log("Toutes les particules ont disparu. Animation terminée.");
    finish(); // Arrêter la boucle d'animation
  }
}

// Boucle d'animation
run(update);
