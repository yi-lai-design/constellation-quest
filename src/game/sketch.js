import p5 from 'p5';
import { regionViewport } from './levels';

// createSketch — p5 instance-mode sketch with a world-space camera.
//
// All star coordinates are in world space (0–1 across the full sky).
// The viewport (cx, cy, zoom) controls which part of the sky is visible.
// At zoom=1 the full sky fills the screen; higher zoom values zoom in.
//
// Exposed via callbacks:
//   onConnect(a, b) — user drew a correct connection
//   onWin()         — all connections complete
//   getViewport()   — returns current { cx, cy, zoom }
//   setTarget(vp)   — animate camera to a new viewport

export function createSketch({ level, onConnect, onWin, onViewportRef }) {
  return function sketch(p) {
    const HIT_RADIUS   = 30;   // screen-space px
    const STAR_R       = 5.5;  // screen-space px
    const DECOY_R      = 2.2;

    // ── Camera ──────────────────────────────────────────────────────────────
    // worldToScreen: converts a world coord (0–1) to canvas pixels.
    // sx = (wx - cx) * W * zoom + W/2  (same formula for y)
    let vp     = { ...regionViewport(level.region) };
    let target = { ...vp };
    let vpSettled = true; // true once lerp has converged

    function worldToScreen(wx, wy) {
      return {
        x: (wx - vp.cx) * p.width  * vp.zoom + p.width  / 2,
        y: (wy - vp.cy) * p.height * vp.zoom + p.height / 2,
      };
    }

    function lerpVp() {
      const SPEED = 0.07;
      const dx = Math.abs(vp.cx - target.cx);
      const dy = Math.abs(vp.cy - target.cy);
      const dz = Math.abs(vp.zoom - target.zoom);
      if (dx + dy + dz < 0.0005) { vp = { ...target }; vpSettled = true; return; }
      vpSettled = false;
      vp.cx   = p.lerp(vp.cx,   target.cx,   SPEED);
      vp.cy   = p.lerp(vp.cy,   target.cy,   SPEED);
      vp.zoom = p.lerp(vp.zoom, target.zoom, SPEED);
    }

    // ── State ────────────────────────────────────────────────────────────────
    let bgStars    = [];
    let decoyStars = []; // world coords
    let drawnEdges = new Set();
    let wrongFlashes = [];
    let dragStart  = null;
    let mouseOnStar = null;

    const correctEdgeSet = new Set(level.connections.map(([a, b]) => ekey(a, b)));
    function ekey(a, b) { return `${Math.min(a,b)}-${Math.max(a,b)}`; }

    // ── Setup ────────────────────────────────────────────────────────────────
    p.setup = function () {
      p.createCanvas(p.windowWidth, p.windowHeight).style('display', 'block');

      // Background stars spread across the full sky
      bgStars = Array.from({ length: 220 }, () => ({
        wx: p.random(1), wy: p.random(1),
        r:  p.random(0.3, 1.3),
        brightness: p.random(55, 160),
        phase: p.random(p.TWO_PI),
      }));

      // Decoy stars scattered within the level's region
      const { region } = level;
      let tries = 0;
      while (decoyStars.length < level.decoyCount && tries++ < 600) {
        const wx = p.random(region.x + 0.01, region.x + region.w - 0.01);
        const wy = p.random(region.y + 0.01, region.y + region.h - 0.01);
        const tooClose = level.stars.some(s => p.dist(wx, wy, s.x, s.y) < 0.035);
        if (!tooClose) decoyStars.push({ wx, wy });
      }

      // Expose camera controls to parent
      if (onViewportRef) {
        onViewportRef({
          getViewport: () => ({ ...vp }),
          setTarget:   (newVp) => { target = { ...newVp }; p.loop(); },
          resume:      () => p.loop(),
        });
      }
    };

    p.windowResized = function () { p.resizeCanvas(p.windowWidth, p.windowHeight); };

    // ── Draw loop ────────────────────────────────────────────────────────────
    p.draw = function () {
      lerpVp();
      p.background(4, 4, 15);
      drawBgStars();
      drawDecoys();
      drawCompletedLines();
      drawWrongFlashes();
      drawDragLine();
      drawConstellationStars();
    };

    // ── Drawing ──────────────────────────────────────────────────────────────
    function drawBgStars() {
      p.noStroke();
      for (const s of bgStars) {
        const { x, y } = worldToScreen(s.wx, s.wy);
        if (x < -4 || x > p.width + 4 || y < -4 || y > p.height + 4) continue;
        const twinkle = p.map(p.sin(p.frameCount * 0.018 + s.phase), -1, 1, 0.35, 1.0);
        p.fill(255, 255, 255, s.brightness * twinkle);
        p.ellipse(x, y, s.r * 2);
      }
    }

    function drawDecoys() {
      p.noStroke();
      for (const s of decoyStars) {
        const { x, y } = worldToScreen(s.wx, s.wy);
        p.fill(170, 185, 220, 85);
        p.ellipse(x, y, DECOY_R * 2);
      }
    }

    function drawCompletedLines() {
      const col = p.color(level.lineColor);
      const r = p.red(col), g = p.green(col), b = p.blue(col);
      for (const key of drawnEdges) {
        const [a, b2] = key.split('-').map(Number);
        const sa = worldToScreen(level.stars[a].x, level.stars[a].y);
        const sb = worldToScreen(level.stars[b2].x, level.stars[b2].y);
        p.stroke(r, g, b, 38); p.strokeWeight(9);
        p.line(sa.x, sa.y, sb.x, sb.y);
        p.stroke(r, g, b, 210); p.strokeWeight(1.5);
        p.line(sa.x, sa.y, sb.x, sb.y);
      }
    }

    function drawWrongFlashes() {
      wrongFlashes = wrongFlashes.filter(f => p.frameCount - f.born < 28);
      for (const f of wrongFlashes) {
        const alpha = p.map(p.frameCount - f.born, 0, 28, 200, 0);
        p.stroke(255, 75, 100, alpha); p.strokeWeight(2);
        p.line(f.x1, f.y1, f.x2, f.y2);
      }
    }

    function drawDragLine() {
      if (dragStart === null) return;
      const s = level.stars[dragStart];
      const { x, y } = worldToScreen(s.x, s.y);
      p.stroke(255, 255, 255, 70); p.strokeWeight(1.5);
      p.drawingContext.setLineDash([5, 7]);
      p.line(x, y, p.mouseX, p.mouseY);
      p.drawingContext.setLineDash([]);
    }

    function drawConstellationStars() {
      const col = p.color(level.starColor);
      const r = p.red(col), g = p.green(col), b = p.blue(col);

      for (const s of level.stars) {
        const { x, y } = worldToScreen(s.x, s.y);
        const hovered = mouseOnStar === s.id;
        const dragging = dragStart  === s.id;
        const pulse = p.map(p.sin(p.frameCount * 0.05 + s.id * 1.3), -1, 1, 0.65, 1.0);

        // Glow halo
        p.noStroke();
        const haloR = hovered || dragging ? 34 : 20;
        p.fill(r, g, b, (hovered ? 110 : 50) * pulse);
        p.ellipse(x, y, haloR * 2);

        // Star body
        const dotR = hovered || dragging ? STAR_R * 1.55 : STAR_R;
        p.fill(r, g, b, 245);
        p.ellipse(x, y, dotR * 2);

        // Bright core
        p.fill(255, 255, 255, 210);
        p.ellipse(x, y, dotR * 0.45 * 2);
      }
    }

    // ── Input ────────────────────────────────────────────────────────────────
    function nearestStar(mx, my) {
      let best = null, bestD = Infinity;
      for (const s of level.stars) {
        const { x, y } = worldToScreen(s.x, s.y);
        const d = p.dist(mx, my, x, y);
        if (d < HIT_RADIUS && d < bestD) { best = s.id; bestD = d; }
      }
      return best;
    }

    p.mouseMoved   = () => { mouseOnStar = nearestStar(p.mouseX, p.mouseY); };
    p.mousePressed = () => { const h = nearestStar(p.mouseX, p.mouseY); if (h !== null) dragStart = h; };

    p.mouseReleased = function () {
      if (dragStart === null) return;
      const hit = nearestStar(p.mouseX, p.mouseY);
      if (hit !== null && hit !== dragStart) {
        const key = ekey(dragStart, hit);
        if (!drawnEdges.has(key)) {
          if (correctEdgeSet.has(key)) {
            drawnEdges.add(key);
            onConnect(dragStart, hit);
            if (drawnEdges.size === correctEdgeSet.size) { p.noLoop(); onWin(); }
          } else {
            const sa = worldToScreen(level.stars[dragStart].x, level.stars[dragStart].y);
            const sb = worldToScreen(level.stars[hit].x, level.stars[hit].y);
            wrongFlashes.push({ x1: sa.x, y1: sa.y, x2: sb.x, y2: sb.y, born: p.frameCount });
          }
        }
      }
      dragStart = null;
    };

    p.touchStarted = () => { p.mousePressed(); return false; };
    p.touchEnded   = () => { p.mouseReleased(); return false; };
    p.touchMoved   = () => false;
  };
}
