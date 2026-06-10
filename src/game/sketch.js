import p5 from 'p5';
import { regionViewport } from './levels';

// createSketch — world-space camera + ghost constellation overlay.
//
// initialVp  — starting viewport (default: zoomed into level region).
//              Pass SKY_VIEWPORT to start zoomed out and animate in.
// allLevels  — all level data, used to draw ghost constellations.
// completedIds — Set of completed level IDs (draw full lines for these).
// onViewportRef({ setTarget, getViewport }) — camera control API for React.

export function createSketch({ level, allLevels = [], completedIds = new Set(),
                               initialVp, onConnect, onWin, onViewportRef }) {
  return function sketch(p) {
    const HIT_RADIUS = 30;
    const STAR_R     = 5.5;
    const DECOY_R    = 2.2;
    const LEVEL_ZOOM = regionViewport(level.region).zoom; // ~2.2

    // ── Camera ──────────────────────────────────────────────────────────────
    const defaultVp = regionViewport(level.region);
    let vp     = { ...(initialVp || defaultVp) };
    let target = { ...defaultVp }; // always animate toward level region on mount

    function worldToScreen(wx, wy) {
      return {
        x: (wx - vp.cx) * p.width  * vp.zoom + p.width  / 2,
        y: (wy - vp.cy) * p.height * vp.zoom + p.height / 2,
      };
    }

    function lerpVp() {
      const SPEED = 0.065;
      const delta = Math.abs(vp.cx - target.cx) + Math.abs(vp.cy - target.cy) + Math.abs(vp.zoom - target.zoom);
      if (delta < 0.0004) { vp = { ...target }; return; }
      vp.cx   = p.lerp(vp.cx,   target.cx,   SPEED);
      vp.cy   = p.lerp(vp.cy,   target.cy,   SPEED);
      vp.zoom = p.lerp(vp.zoom, target.zoom, SPEED);
    }

    // Ghost alpha: 0 when zoomed into level, 1 when at full sky
    function ghostA() { return p.constrain(p.map(vp.zoom, LEVEL_ZOOM * 0.8, 1.4, 0, 1), 0, 1); }
    // Level alpha: reverse — fade out interactive layer when zoomed out
    function levelA() { return p.constrain(p.map(vp.zoom, LEVEL_ZOOM * 0.75, LEVEL_ZOOM * 0.5, 1, 0), 0, 1); }

    // ── State ────────────────────────────────────────────────────────────────
    let bgStars = [], decoyStars = [], drawnEdges = new Set(), wrongFlashes = [];
    let dragStart = null, mouseOnStar = null, inputEnabled = true;

    const correctEdgeSet = new Set(level.connections.map(([a, b]) => ekey(a, b)));
    function ekey(a, b) { return `${Math.min(a,b)}-${Math.max(a,b)}`; }

    // ── Setup ────────────────────────────────────────────────────────────────
    p.setup = function () {
      p.createCanvas(p.windowWidth, p.windowHeight).style('display', 'block');

      bgStars = Array.from({ length: 240 }, () => ({
        wx: p.random(1), wy: p.random(1),
        r: p.random(0.3, 1.4), brightness: p.random(50, 165), phase: p.random(p.TWO_PI),
      }));

      const { region } = level;
      let tries = 0;
      while (decoyStars.length < level.decoyCount && tries++ < 600) {
        const wx = p.random(region.x + 0.01, region.x + region.w - 0.01);
        const wy = p.random(region.y + 0.01, region.y + region.h - 0.01);
        if (!level.stars.some(s => p.dist(wx, wy, s.x, s.y) < 0.035))
          decoyStars.push({ wx, wy });
      }

      if (onViewportRef) {
        onViewportRef({
          getViewport:    () => ({ ...vp }),
          setTarget:      (newVp) => { target = { ...newVp }; p.loop(); },
          disableInput:   () => { inputEnabled = false; },
          enableInput:    () => { inputEnabled = true; },
          resume:         () => p.loop(),
        });
      }
    };

    p.windowResized = function () { p.resizeCanvas(p.windowWidth, p.windowHeight); };

    // ── Draw helpers (atmosphere, stars) ─────────────────────────────────────
    function drawAtmosphere() {
      // Very faint radial gradient — lighter in centre, tracks constellation region
      const { x: cx, y: cy } = worldToScreen(
        level.region.x + level.region.w / 2,
        level.region.y + level.region.h / 2
      );
      const radius = Math.max(p.width, p.height) * 0.65;
      const grad = p.drawingContext.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0,   'rgba(40,50,120,0.18)');
      grad.addColorStop(0.4, 'rgba(20,25,70,0.08)');
      grad.addColorStop(1,   'rgba(0,0,0,0)');
      p.drawingContext.fillStyle = grad;
      p.drawingContext.fillRect(0, 0, p.width, p.height);
      p.drawingContext.fillStyle = '#000'; // reset
    }

    // ── Draw ─────────────────────────────────────────────────────────────────
    p.draw = function () {
      lerpVp();
      p.background(3, 3, 10);
      // Subtle radial centre-glow — matches reference app atmospheric orb feel
      drawAtmosphere();
      drawBgStars();
      drawGhostConstellations();
      drawDecoys();
      drawCompletedLines();
      drawWrongFlashes();
      drawDragLine();
      drawConstellationStars();
    };

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

    // Ghost constellations — appear as the camera zooms out to full sky
    function drawGhostConstellations() {
      const ga = ghostA();
      if (ga < 0.02) return;

      for (const lvl of allLevels) {
        const isCurrent  = lvl.id === level.id;
        const isDone     = completedIds.has(lvl.id) || (isCurrent && drawnEdges.size === correctEdgeSet.size);
        const col        = p.color(lvl.starColor);
        const r = p.red(col), g = p.green(col), b = p.blue(col);

        // Lines — completed constellations show full connections
        if (isDone) {
          const edges = isCurrent
            ? [...drawnEdges].map(k => k.split('-').map(Number))
            : lvl.connections;
          p.strokeWeight(1.2);
          p.stroke(r, g, b, 160 * ga);
          for (const [a2, b2] of edges) {
            const sa = worldToScreen(lvl.stars[a2].x, lvl.stars[a2].y);
            const sb = worldToScreen(lvl.stars[b2].x, lvl.stars[b2].y);
            p.line(sa.x, sa.y, sb.x, sb.y);
          }
        }

        // Stars — white core + colour corona, matching interactive star style
        p.noStroke();
        for (const s of lvl.stars) {
          const { x, y } = worldToScreen(s.x, s.y);
          const sr2 = isDone ? 4 : 2.5;
          p.fill(r, g, b, (isDone ? 160 : 80) * ga);
          p.ellipse(x, y, sr2 * 2);
          p.fill(255, 255, 255, (isDone ? 220 : 130) * ga);
          p.ellipse(x, y, sr2 * 0.55 * 2);
        }

        // Constellation name label
        if (ga > 0.3) {
          const { x, y } = worldToScreen(
            lvl.region.x + lvl.region.w / 2,
            lvl.region.y + lvl.region.h + 0.025
          );
          p.noStroke();
          p.fill(r, g, b, 180 * ga);
          p.textSize(9);
          p.textStyle(p.NORMAL);
          p.textAlign(p.CENTER, p.TOP);
          p.text(lvl.name.toUpperCase(), x, y);
        }
      }
    }

    function drawDecoys() {
      const la = levelA();
      if (la < 0.02) return;
      p.noStroke();
      for (const s of decoyStars) {
        const { x, y } = worldToScreen(s.wx, s.wy);
        p.fill(170, 185, 220, 85 * la);
        p.ellipse(x, y, DECOY_R * 2);
      }
    }

    function drawCompletedLines() {
      const la = levelA();
      if (la < 0.02) return;
      const col = p.color(level.lineColor);
      const r = p.red(col), g = p.green(col), b = p.blue(col);
      for (const key of drawnEdges) {
        const [a, b2] = key.split('-').map(Number);
        const sa = worldToScreen(level.stars[a].x, level.stars[a].y);
        const sb = worldToScreen(level.stars[b2].x, level.stars[b2].y);
        p.stroke(r, g, b, 38 * la); p.strokeWeight(9);
        p.line(sa.x, sa.y, sb.x, sb.y);
        p.stroke(r, g, b, 210 * la); p.strokeWeight(1.5);
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
      const { x, y } = worldToScreen(level.stars[dragStart].x, level.stars[dragStart].y);
      p.stroke(255, 255, 255, 70); p.strokeWeight(1.5);
      p.drawingContext.setLineDash([5, 7]);
      p.line(x, y, p.mouseX, p.mouseY);
      p.drawingContext.setLineDash([]);
    }

    function drawConstellationStars() {
      const la = levelA();
      if (la < 0.02) return;
      const col = p.color(level.starColor);
      const sr = p.red(col), sg = p.green(col), sb = p.blue(col);

      for (const s of level.stars) {
        const { x, y } = worldToScreen(s.x, s.y);
        const hovered  = mouseOnStar === s.id;
        const dragging = dragStart   === s.id;
        const pulse    = p.map(p.sin(p.frameCount * 0.05 + s.id * 1.3), -1, 1, 0.7, 1.0);
        const active   = hovered || dragging;

        p.noStroke();

        // Outer diffuse corona — blue-tinted, matches reference orb atmosphere
        const coronaR = active ? 44 : 28;
        const grad = p.drawingContext.createRadialGradient(x, y, 0, x, y, coronaR);
        grad.addColorStop(0,   `rgba(${sr},${sg},${sb},${0.28 * pulse * la})`);
        grad.addColorStop(0.5, `rgba(${sr},${sg},${sb},${0.10 * pulse * la})`);
        grad.addColorStop(1,   'rgba(0,0,0,0)');
        p.drawingContext.fillStyle = grad;
        p.drawingContext.beginPath();
        p.drawingContext.arc(x, y, coronaR, 0, Math.PI * 2);
        p.drawingContext.fill();

        // Inner glow ring
        const dotR = active ? STAR_R * 1.6 : STAR_R;
        p.fill(sr, sg, sb, (active ? 230 : 180) * pulse * la);
        p.ellipse(x, y, dotR * 2);

        // Bright white core — the "orb" centre
        p.fill(255, 255, 255, 240 * la);
        p.ellipse(x, y, dotR * 0.5 * 2);
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

    p.mouseMoved = () => { mouseOnStar = nearestStar(p.mouseX, p.mouseY); };

    p.mousePressed = () => {
      if (!inputEnabled) return;
      const h = nearestStar(p.mouseX, p.mouseY);
      if (h !== null) dragStart = h;
    };

    p.mouseReleased = function () {
      if (!inputEnabled || dragStart === null) return;
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
            const sb = worldToScreen(level.stars[hit].x,       level.stars[hit].y);
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
