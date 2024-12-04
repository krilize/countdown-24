import { createEngine } from "../../shared/engine.js";

const { renderer, run, input } = createEngine();
const { ctx, canvas } = renderer;

// Assurez-vous que le canvas fait la taille de l'écran
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Images des moustiques et des taches de sang
const mosquitoImageSrc = './image/moustique.png';
const bloodImageSrc = './image/blood.png';
const swatterImageSrc = './image/tappette.png';




// Configuration de la taille des taches de sang
const bloodSize = 300; // Largeur et hauteur des taches de sang

const particles = [];
const numParticles = 200; // Nombre de moustiques
const finalPositions = []; // Positions finales autour de la lettre

let animationState = "initial"; // "initial", "settling", "done"
let clickCount = 0;
const maxClicks = numParticles; // Chaque clic enlève un moustique
const letter = "3";

// Variable pour contrôler le début de l'animation
let animationStarted = false; // Pour contrôler le début de l'animation
const bloodDisappearanceTime = 3000; // Temps avant que les taches de sang commencent à disparaître
const bloodFadeSpeed = 0.02; // Vitesse à laquelle les taches de sang disparaissent

const mosquitoImage = await loadImage(mosquitoImageSrc)
const bloodImage = await loadImage(bloodImageSrc)
const swatterImage = await loadImage(swatterImageSrc)

// Initialiser les moustiques
for (let i = 0; i < numParticles; i++) {
    particles.push(createParticle());
}
setupFinalPositions();

run(update);

// Fonction pour créer les moustiques
function createParticle() {
    const size = Math.random() * (250 - 90) + 90; // Taille aléatoire entre 90 et 250
    let x, y;

    // Positionner le moustique hors de l'écran
    const side = Math.floor(Math.random() * 4); // 0: gauche, 1: droite, 2: haut, 3: bas
    switch (side) {
        case 0: // Hors à gauche
            x = -size; // Position x en dehors de l'écran à gauche
            y = Math.random() * canvas.height; // Position verticale aléatoire
            break;
        case 1: // Hors à droite
            x = canvas.width + size; // Position x en dehors de l'écran à droite
            y = Math.random() * canvas.height; // Position verticale aléatoire
            break;
        case 2: // Hors en haut
            x = Math.random() * canvas.width; // Position horizontale aléatoire
            y = -size; // Position y en dehors de l'écran en haut
            break;
        case 3: // Hors en bas
            x = Math.random() * canvas.width; // Position horizontale aléatoire
            y = canvas.height + size; // Position y en dehors de l'écran en bas
            break;
    }

    return {
        x: x,
        y: y,
        velocityX: (Math.random() - 0.5) * 30, // Vitesse initiale très rapide
        velocityY: (Math.random() - 0.5) * 30,
        targetX: 0, // Assigné plus tard
        targetY: 0,
        isSettled: false,
        isExploded: false,
        size: size, // Ajouter une taille aléatoire pour chaque moustique
        bloodAlpha: 1, // Alpha pour la tache de sang
        bloodFadeStarted: false, // Indique si la disparition a commencé
        bloodTimer: 0, // Timer pour la disparition
        disappearDelay: Math.random() * (15000 - 8000) + 8000 // Délai de disparition entre 8000 et 15000 ms
    };
}


// Définir les positions finales autour de la lettre
function setupFinalPositions() {
    const centerX = canvas.width; // Centre du canvas
    const centerY = canvas.height;
    const radius = 500; // Rayon autour du centre

    for (let i = 0; i < numParticles; i++) {
        // Générer un angle aléatoire
        const angle = Math.random() * Math.PI * 2;

        // Générer une distance aléatoire dans le rayon spécifié
        const distance = Math.random() * radius;

        // Calculer les coordonnées finales
        const x = centerX + distance * Math.cos(angle);
        const y = centerY + distance * Math.sin(angle);

        finalPositions.push({ x, y });
        particles[i].targetX = x;
        particles[i].targetY = y;
    }
}

// Fonction pour déplacer les moustiques avec un zigzag rapide
function moveParticleWithZigzag(particle) {
    particle.x += particle.velocityX;
    particle.y += particle.velocityY;

    // Ajouter un zigzag
    particle.x += (Math.random() - 0.5) * 5; // Ajustez 5 pour l'intensité du zigzag
    particle.y += (Math.random() - 0.5) * 5;

    // Si le moustique sort de l'écran, il revient de l'autre côté
    if (particle.x < -particle.size) particle.x = canvas.width + particle.size; // Reviens à droite
    if (particle.x > canvas.width + particle.size) particle.x = -particle.size; // Reviens à gauche
    if (particle.y < -particle.size) particle.y = canvas.height + particle.size; // Reviens en bas
    if (particle.y > canvas.height + particle.size) particle.y = -particle.size; // Reviens en haut
}

// Fonction pour ralentir les moustiques vers leurs positions finales
function moveParticleToTarget(particle) {
    // Définir une vitesse aléatoire pour chaque moustique
    const speed = Math.random() * 0.05 + 0.01; // Vitesse entre 0.01 et 0.06
    particle.x += (particle.targetX - particle.x) * speed;
    particle.y += (particle.targetY - particle.y) * speed;

    // Considérer comme "arrivé" si très proche de la cible
    if (Math.abs(particle.targetX - particle.x) < 1 && Math.abs(particle.targetY - particle.y) < 1) {
        particle.isSettled = true;
        particle.disappearTimer = performance.now(); // Démarrer le timer pour la disparition
    }
}

// Variables pour contrôler le clic maintenu et la pression prolongée
let isMouseDown = false; // État du bouton de la souris
let pressStartTime = null; // Temps où le clic a commencé
const explosionDelay = 300; // Délai (en millisecondes) avant que le moustique explose

canvas.addEventListener('mousedown', () => {
    isMouseDown = true; // Le bouton de la souris est enfoncé
    pressStartTime = performance.now(); // Enregistrer le moment où le clic a commencé
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false; // Le bouton de la souris est relâché
    pressStartTime = null; // Réinitialiser le temps de début
});

canvas.addEventListener('mousemove', (event) => {
    if (!isMouseDown) return; // Ne rien faire si le bouton de la souris n'est pas enfoncé

    const rect = canvas.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);

    particles.forEach((particle) => {
        if (
            !particle.isExploded &&
            mouseX >= particle.x &&
            mouseX <= particle.x + particle.size && // Vérifier si le curseur est sur le moustique
            mouseY >= particle.y &&
            mouseY <= particle.y + particle.size
        ) {
            // Vérifier si le clic a duré assez longtemps
            if (performance.now() - pressStartTime >= explosionDelay) {
                particle.isExploded = true;
                particle.rotation = Math.random() * 2 * Math.PI; // Rotation aléatoire lors de l'explosion
                clickCount++;
                particle.bloodFadeStarted = true; // Commencer le fade de la tache de sang
                particle.bloodTimer = performance.now(); // Démarrer le timer pour la tache de sang
            }
        }
    });

    if (clickCount === maxClicks) {
        animationState = "done";
    }
});


let allExploded = false; // Indique si tous les moustiques sont explosés
let fadeOutStarted = false; // Indique si le fade-out global a commencé
let fadeOutAlpha = 1; // Alpha global pour le fade-out

function update(dt) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vérifiez si tous les moustiques sont explosés
    if (!allExploded && particles.every(p => p.isExploded)) {
        allExploded = true; // Tous les moustiques sont explosés
        fadeOutStarted = true; // Déclenchement du fade-out
    }

    // Dessiner les taches de sang sous la lettre
    particles.forEach((particle) => {
        if (particle.isExploded) {
            // Dessiner la tache de sang avec fade-out progressif
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            ctx.globalAlpha = particle.bloodAlpha * fadeOutAlpha; // Appliquer le fade-out global
            ctx.drawImage(bloodImage, -bloodSize / 2, -bloodSize / 2, bloodSize, bloodSize);
            ctx.restore();
        }
    });

    // Dessiner la lettre au centre
    ctx.fillStyle = "black";
    ctx.font = "700px Helvetica Neue, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, canvas.width / 2, canvas.height / 2);

    // Dessiner les moustiques
    particles.forEach((particle) => {
        if (!animationStarted) {
            moveParticleWithZigzag(particle); // Mouvement zigzag
        } else if (animationState === "settling" && !particle.isSettled) {
            moveParticleToTarget(particle); // Mouvements vers les positions finales
        }

        if (!particle.isExploded) {
            // Dessiner le moustique
            ctx.drawImage(mosquitoImage, particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
        }
    });

    // Commencer l'animation vers les positions finales après 2 secondes
    if (!animationStarted && performance.now() > 2000) {
        animationStarted = true;
        animationState = "settling";
    }

    // Remettre l'écran en noir avec fade-out si tous les moustiques ont explosé
    if (fadeOutStarted) {
        fadeOutAlpha -= 0.01; // Réduire progressivement l'alpha
        if (fadeOutAlpha <= 0) {
            fadeOutAlpha = 0; // Assurez-vous que l'alpha ne devienne pas négatif
            particles.length = 0; // Supprimer les moustiques après le fade-out
        }
    }

    // Dessiner la tapette
    ctx.translate(input.getX(), input.getY());
    ctx.scale(0.05, 0.05);
    ctx.drawImage(swatterImage, -swatterImage.width / 2, -swatterImage.height / 2);
}



async function loadImage(src)
{
    return new Promise((resolve,reject)=>{

        const img = new Image()
        img.src = src
        img.onload = ()=>{
    
            resolve(img)
        }
    })
}
 


window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setupFinalPositions();
});
