import { createEngine } from "../../shared/engine.js";
import Utils from "./Utils.js";
import ParticleSystem from "./ParticleSystem.js";

const { renderer, input, run, finish } = createEngine();
const { ctx, canvas } = renderer;


const  particleSystem = new ParticleSystem();
const  pathPoints = await Utils.loadSVG("./3.svg");
calculateOffsets();

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
        targetPoint.x+canvas.width/2,
        targetPoint.y+canvas.height/2
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
    })
  });
}

// met à jour leurs positions et les dessine
let animationEnded = false; // Indique si l'animation est déjà terminée
let hasStarted = false; // Indique si des particules ont été générées

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

  // Debugging : vérifier l'état du système
  // console.log({
  //   hasStarted,
  //   particleCount: particleSystem.particles.length,
  //   animationEnded,
  // });

  // Terminer l'animation uniquement si elle a commencé et que toutes les particules ont disparu
  if (hasStarted && !animationEnded && particleSystem.particles.length === 0) {
    animationEnded = true; // Marque que l'animation est terminée
    console.log("Toutes les particules ont disparu. Animation terminée.");
    finish(); // Arrêter la boucle d'animation
  }
}

// Boucle d'animation
run(update);

