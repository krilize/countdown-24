import { createEngine } from "../../shared/engine.js";
import Utils from "./Utils.js";
import Matter from "matter-js"; // Assurez-vous que Matter.js est importé

const { renderer, input, run } = createEngine();
const { ctx, canvas } = renderer;
const { Engine, Render, World, Bodies } = Matter;


// Initialisation du moteur Matter.js
const engine = Matter.Engine.create();
const world = engine.world;

// Variables globales
let CouteauxImage;
let pathPoints = [];
let knifeX = 0;
let knifeY = 0;
let knifeAngle = 0;

// Tableau pour stocker les gouttes d'eau
const drops = [];

// Chargez les ressources nécessaires
await initializeAssets();

async function initializeAssets() {
  CouteauxImage = await loadImage('./image/couteaux.png');
  pathPoints = await Utils.loadSVG("./deux.svg");
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

// Créer un corps pour le fluide au bas du canvas
const liquidBody = Matter.Bodies.rectangle(canvas.width / 2, canvas.height, canvas.width, 10, { 
  isStatic: true, // Le liquide est statique
  render: { fillStyle: 'rgba(255, 33, 0, 1)' } // Couleur du fluide
});
Matter.World.add(world, liquidBody); // Ajouter le corps de liquide au monde

// Événements de souris
canvas.addEventListener("mousedown", (event) => {
  // Ajouter une goutte d'eau à la position du clic
  const rect = canvas.getBoundingClientRect();
  const dropX = event.clientX - rect.left;
  const dropY = event.clientY - rect.top;

  // Créer un corps pour la goutte de fluide
  const drop = Matter.Bodies.circle(dropX, dropY, 5, {
    restitution: 0.8, // Élasticité
    friction: 0.5, // Frottement
    render: {
      fillStyle: "rgba(255, 33, 0, 1)" // Couleur de la goutte
    }
  });
  
  Matter.World.add(world, drop); // Ajouter la goutte au monde Matter.js
});

// Fonction de mise à jour/dessin
function update(dt) {
  // Mettre à jour le moteur de physique
  Matter.Engine.update(engine);

  // Effacer le canvas
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dessiner les gouttes de fluide
  for (let drop of Matter.Composite.allBodies(world)) {
    if (drop !== liquidBody) { // Éviter de dessiner le corps du liquide
      ctx.beginPath();
      ctx.arc(drop.position.x, drop.position.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = drop.render.fillStyle;
      ctx.fill();
      ctx.closePath();
    }
  }

  // Dessiner le liquide au bas du canvas
  ctx.fillStyle = liquidBody.render.fillStyle; // Couleur du liquide
  ctx.fillRect(0, canvas.height - 10, canvas.width, 10); // Dessiner le rectangle représentant le liquide

  // Dessiner le couteau (avant-plan)
  const knifeWidth = 125; 
  const knifeHeight = 50;  
  ctx.save(); 

  // Vérifiez si l'image du couteau est chargée avant de l'utiliser
  if (CouteauxImage) {
    ctx.translate(knifeX, knifeY);
    ctx.rotate(knifeAngle); 

    // Dessiner l'image du couteau centré sur le point (0, 0)
    ctx.drawImage(
      CouteauxImage,
      -knifeWidth / 2, 
      -knifeHeight / 2, 
      knifeWidth, 
      knifeHeight 
    );
  } else {
    console.error("L'image du couteau n'est pas encore chargée.");
  }

  ctx.restore(); 
}
