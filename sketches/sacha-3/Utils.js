class Utils {
  loadSVG(svgFile) {
    return new Promise((resolve, reject) => {
      fetch(svgFile)
        .then((response) => response.text())
        .then((svgData) => {
          console.log("Raw SVG data:", svgData);

          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgData, "image/svg+xml");
          const paths = svgDoc.querySelectorAll("path");

          console.log("Number of paths found:", paths.length);

          const pathPoints = [];

          paths.forEach((path) => {
            const points = [];
            const pathLength = path.getTotalLength();
            const numPoints = 500;

            for (let i = 0; i <= numPoints; i++) {
              const point = path.getPointAtLength((i * pathLength) / numPoints);
              points.push({ x: point.x, y: point.y });
            }

            pathPoints.push(points);
          });

          resolve(pathPoints);
        })
        .catch((error) => {
          console.error("Error loading SVG:", error);
          reject(error);
        });
    });
  }

  // Calcule la distance entre deux points
  getDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Calcule la vitesse d'un mouvement (magnitude d'un vecteur)
  getSpeed(movement) {
    return Math.sqrt(movement.x * movement.x + movement.y * movement.y);
  }

  // Normalise un vecteur et applique une vitesse donnée
  getDirection(vector, speed) {
    const length = this.getSpeed(vector);
    if (length === 0) return { x: 0, y: 0 };

    return {
      x: (vector.x / length) * speed,
      y: (vector.y / length) * speed,
    };
  }
}

export default new Utils();
