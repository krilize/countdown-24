class Utils {
  async loadSVG(svgFile) {
    const response = await fetch(svgFile);
    const svgData = await response.text();

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgData, "image/svg+xml");
    const paths = svgDoc.querySelectorAll("path");

    const pathPoints = [];

    paths.forEach((path) => {
      const points = [];
      const pathLength = path.getTotalLength();
      const numPoints = 100;

      for (let i = 0; i <= numPoints; i++) {
        const point = path.getPointAtLength((i * pathLength) / numPoints);
        points.push({ x: point.x, y: point.y });
      }

      pathPoints.push(points);
    });

    return pathPoints;
  }
}

export default new Utils();
