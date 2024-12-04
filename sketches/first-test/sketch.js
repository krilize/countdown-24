import { createEngine } from "../../shared/engine.js";

const { renderer, run } = createEngine();
const { ctx, canvas } = renderer;

// Assurez-vous que le canvas fait la taille de l'écran
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Change le curseur du canvas
canvas.style.cursor = 'url(./image/cursor.png), auto'; // Remplacez par le chemin de votre image de curseur

run(update);

let clickCount = 0;
const maxClicks = 5;
let fillHeight = 0;

// Image à afficher
const imageSrc = './image/flies.png'; // Assurez-vous que le chemin est correct
const image = new Image();
image.src = imageSrc;

// Variable pour la "particule" de l'image
let particle = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 100,
    height: 100,
    velocityX: (Math.random() - 0.5) * 12,
    velocityY: (Math.random() - 0.5) * 12,
    angle: 0, // Angle initial
    isHovered: false,
};

// Fonction pour ajuster les coordonnées en fonction de l'échelle du canvas
function getMousePosition(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
    };
}

// Fonction pour repositionner la particule
function randomizeParticlePosition() {
    particle.x = Math.random() * (canvas.width - particle.width);
    particle.y = Math.random() * (canvas.height - particle.height);
}

// Fonction pour mettre à jour la position de la particule
function updateParticle() {
    particle.x += particle.velocityX;
    particle.y += particle.velocityY;

    if (particle.x <= 0 || particle.x + particle.width >= canvas.width) {
        particle.velocityX *= -1;
    }
    if (particle.y <= 0 || particle.y + particle.height >= canvas.height) {
        particle.velocityY *= -1;
    }

    // Calculer l'angle de rotation en fonction de la direction
    particle.angle = Math.atan2(particle.velocityY, particle.velocityX);
}

// Fonction pour dessiner l'image avec rotation
function drawRotatedImage(image, x, y, width, height, angle) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(angle);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
}

// Événement pour le clic sur le canvas
canvas.addEventListener('click', (event) => {
    const { x: mouseX, y: mouseY } = getMousePosition(event);

    const { x, y, width, height } = particle;

    if (
        mouseX >= x && mouseX <= x + width &&
        mouseY >= y && mouseY <= y + height
    ) {
        clickCount++;
        console.log(`Clic détecté ! Total : ${clickCount}`);
        
        randomizeParticlePosition();
    }
});

// Événement pour détecter le survol
canvas.addEventListener('mousemove', (event) => {
    const { x: mouseX, y: mouseY } = getMousePosition(event);

    const { x, y, width, height } = particle;

    particle.isHovered = (
        mouseX >= x && mouseX <= x + width &&
        mouseY >= y && mouseY <= y + height
    );
});

const waveHeight = 20;
const waveFrequency = 0.05;
const waveSpeed = 0.1;
let offset = 0;

function update(dt) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const fillProgress = Math.min(clickCount / maxClicks, 1);
    fillHeight = canvas.height * fillProgress;

    ctx.fillStyle = "red";
    for (let i = 0; i < canvas.width; i++) {
        const waveOffset = Math.sin(i * waveFrequency + offset) * waveHeight;
        ctx.fillRect(i, canvas.height - fillHeight + waveOffset, 1, fillHeight);
    }

    updateParticle();

    if (particle.isHovered) {
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 5;
        ctx.strokeRect(particle.x, particle.y, particle.width, particle.height);
    }

    drawRotatedImage(
        image,
        particle.x,
        particle.y,
        particle.width,
        particle.height,
        particle.angle
    );

    // Dessiner la lettre "A"
    ctx.fillStyle = "black"; // Couleur de la lettre
    ctx.font = "700px Helvetica Neue, Arial, sans-serif"; // Taille de la police
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const letterX = canvas.width / 2;
    const letterY = canvas.height / 2;

    // Afficher la lettre uniquement si le nombre de clics est supérieur à 0
    if (clickCount > 0) {
        ctx.fillText("A", letterX, letterY); // Dessiner la lettre
    }

    offset += waveSpeed;
}

// Charger l'image
image.onload = () => {
    console.log("Image chargée !");
};

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});


// ajouter une petite boucle d'animation quand on click sur la mouche 
// changer l'image de la mouche 
// quand le canvas et full rouge faire disparaitre les mouches et remettre le fond en noir. 