import p5 from 'p5';

// Returns a p5 instance-mode sketch factory.
// onConnect(a, b) — called when user connects two constellation stars
// onWin()         — called when all connections are made
export function createSketch({ level, onConnect, onWin }) {
  return function sketch(p) {
    const HIT_RADIUS = 28;
    const STAR_RADIUS = 6;
    const DECOY_RADIUS = 2.5;

    let canvasStars = [];      // constellation stars mapped to canvas px
    let decoyStars = [];
    let bgStars = [];
    let drawnEdges = new Set();// "a-b" strings of completed correct edges
    let wrongFlashes = [];     // { x1,y1,x2,y2, born } for red flash lines
    let dragStart = null;      // index of star being dragged from
    let mouseOnStar = null;

    const correctEdgeSet = new Set(
      level.connections.map(([a, b]) => edgeKey(a, b))
    );

    function edgeKey(a, b) {
      return `${Math.min(a, b)}-${Math.max(a, b)}`;
    }

    function toCanvas(nx, ny) {
      return { x: nx * p.width, y: ny * p.height };
    }

    function nearestStar(mx, my) {
      let best = null, bestD = Infinity;
      for (const s of canvasStars) {
        const d = p.dist(mx, my, s.x, s.y);
        if (d < HIT_RADIUS && d < bestD) { best = s.id; bestD = d; }
      }
      return best;
    }

    p.setup = function () {
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.style('display', 'block');
      p.colorMode(p.RGB, 255);

      // Place constellation stars
      canvasStars = level.stars.map(s => ({ ...s, ...toCanvas(s.x, s.y) }));

      // Scatter decoy stars — avoid landing too close to constellation stars
      decoyStars = [];
      let attempts = 0;
      while (decoyStars.length < level.decoyCount && attempts < 500) {
        attempts++;
        const nx = p.random(0.08, 0.92);
        const ny = p.random(0.12, 0.88);
        const { x, y } = toCanvas(nx, ny);
        const tooClose = canvasStars.some(s => p.dist(x, y, s.x, s.y) < 60);
        if (!tooClose) decoyStars.push({ x, y });
      }

      // Faint background star field
      bgStars = Array.from({ length: 140 }, () => ({
        x: p.random(p.width),
        y: p.random(p.height),
        r: p.random(0.4, 1.2),
        brightness: p.random(60, 160),
        phase: p.random(p.TWO_PI),
      }));
    };

    p.windowResized = function () {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      canvasStars = level.stars.map(s => ({ ...s, ...toCanvas(s.x, s.y) }));
    };

    p.draw = function () {
      p.background(4, 4, 15);

      drawBgStars();
      drawDecoys();
      drawCompletedLines();
      drawWrongFlashes();
      drawDragLine();
      drawConstellationStars();
    };

    // ── Draw helpers ────────────────────────────────────────────────────────

    function drawBgStars() {
      for (const s of bgStars) {
        const twinkle = p.map(p.sin(p.frameCount * 0.02 + s.phase), -1, 1, 0.4, 1.0);
        p.noStroke();
        p.fill(255, 255, 255, s.brightness * twinkle);
        p.ellipse(s.x, s.y, s.r * 2);
      }
    }

    function drawDecoys() {
      p.noStroke();
      for (const s of decoyStars) {
        p.fill(180, 190, 220, 90);
        p.ellipse(s.x, s.y, DECOY_RADIUS * 2);
      }
    }

    function drawCompletedLines() {
      const col = p.color(level.lineColor);
      for (const key of drawnEdges) {
        const [a, b] = key.split('-').map(Number);
        const sa = canvasStars[a], sb = canvasStars[b];
        // Outer glow
        p.stroke(p.red(col), p.green(col), p.blue(col), 40);
        p.strokeWeight(8);
        p.line(sa.x, sa.y, sb.x, sb.y);
        // Core line
        p.stroke(p.red(col), p.green(col), p.blue(col), 200);
        p.strokeWeight(1.5);
        p.line(sa.x, sa.y, sb.x, sb.y);
      }
    }

    function drawWrongFlashes() {
      wrongFlashes = wrongFlashes.filter(f => p.frameCount - f.born < 30);
      for (const f of wrongFlashes) {
        const age = p.frameCount - f.born;
        const alpha = p.map(age, 0, 30, 180, 0);
        p.stroke(255, 80, 100, alpha);
        p.strokeWeight(2);
        p.line(f.x1, f.y1, f.x2, f.y2);
      }
    }

    function drawDragLine() {
      if (dragStart === null) return;
      const s = canvasStars[dragStart];
      p.stroke(255, 255, 255, 80);
      p.strokeWeight(1.5);
      p.drawingContext.setLineDash([6, 6]);
      p.line(s.x, s.y, p.mouseX, p.mouseY);
      p.drawingContext.setLineDash([]);
    }

    function drawConstellationStars() {
      const starCol = p.color(level.starColor);

      for (const s of canvasStars) {
        const isHovered = mouseOnStar === s.id;
        const isDragSrc = dragStart === s.id;
        const pulse = p.map(p.sin(p.frameCount * 0.05 + s.id), -1, 1, 0.7, 1.0);

        // Glow halo
        p.noStroke();
        const glowSize = isHovered || isDragSrc ? 36 : 22;
        const glowAlpha = isHovered ? 100 : 55;
        p.fill(p.red(starCol), p.green(starCol), p.blue(starCol), glowAlpha * pulse);
        p.ellipse(s.x, s.y, glowSize * 2);

        // Star dot
        const dotSize = isHovered || isDragSrc ? STAR_RADIUS * 1.5 : STAR_RADIUS;
        p.fill(p.red(starCol), p.green(starCol), p.blue(starCol), 240);
        p.ellipse(s.x, s.y, dotSize * 2);

        // Bright center
        p.fill(255, 255, 255, 200);
        p.ellipse(s.x, s.y, (dotSize * 0.45) * 2);
      }
    }

    // ── Input ────────────────────────────────────────────────────────────────

    p.mouseMoved = function () {
      mouseOnStar = nearestStar(p.mouseX, p.mouseY);
    };

    p.mousePressed = function () {
      const hit = nearestStar(p.mouseX, p.mouseY);
      if (hit !== null) dragStart = hit;
    };

    p.mouseReleased = function () {
      if (dragStart === null) return;
      const hit = nearestStar(p.mouseX, p.mouseY);
      if (hit !== null && hit !== dragStart) {
        const key = edgeKey(dragStart, hit);
        if (!drawnEdges.has(key)) {
          if (correctEdgeSet.has(key)) {
            drawnEdges.add(key);
            onConnect(dragStart, hit);
            if (drawnEdges.size === correctEdgeSet.size) {
              p.noLoop();
              onWin();
            }
          } else {
            const sa = canvasStars[dragStart], sb = canvasStars[hit];
            wrongFlashes.push({ x1: sa.x, y1: sa.y, x2: sb.x, y2: sb.y, born: p.frameCount });
          }
        }
      }
      dragStart = null;
    };

    // Touch support
    p.touchStarted = function () { p.mousePressed(); return false; };
    p.touchEnded = function () { p.mouseReleased(); return false; };
    p.touchMoved = function () { return false; };
  };
}
