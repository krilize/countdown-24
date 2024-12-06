import Particle from "./Particle.js";

export default class ParticleSystem {
  // Initialise le système de particules avec un tableau vide et un nombre maximum de particules
  constructor() {
    this.particles = [];
    this.maxParticles = 10000;
  }

  // Ajoute une nouvelle particule au système avec une position et une cible données
  // si le nombre maximum de particules n'est pas atteint
  addParticle(x, y, targetX, targetY) {
    if (this.particles.length < this.maxParticles) {
      this.particles.push(new Particle(x, y, targetX, targetY));
    }
  }

  // Met à jour l'état de toutes les particules et supprime celles qui ont atteint leur cible
  // depuis plus d'une seconde
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update();
  
      // Si la particule a atteint sa cible
      if (particle.isAtTarget) {
        // Initialise le temps à la cible s'il n'est pas défini
        if (!particle.timeAtTarget) {
          particle.timeAtTarget = Date.now();
        }
        //Supprime la particule après 10 secondes à la cible
      }
      if (particle.isDead) {
        this.particles.splice(i, 1); // Supprime la particule
        console.log(this.particles.length);
      }
    }
  
    // Debugging : affiche le nombre de particules restantes

  }

  // Dessine toutes les particules actives sur le contexte canvas fourni
  draw(ctx) {
    this.particles.forEach((particle) => {
      particle.draw(ctx);
    });
  }
}
