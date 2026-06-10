// All star positions are in world space (0–1 across the full sky).
// region defines where in the sky the constellation lives.
// Stars are placed within their region using:
//   world_x = region.x + local_x * region.w

export const LEVELS = [
  {
    id: 1,
    name: 'Orion',
    hint: 'The Hunter — find his belt',
    starColor: '#7EB8FF',
    lineColor: '#A8D4FF',
    glowColor: 'rgba(126,184,255,0.35)',
    decoyCount: 8,
    region: { x: 0.52, y: 0.55, w: 0.30, h: 0.38 },
    stars: [
      { id: 0, label: 'Betelgeuse', x: 0.634, y: 0.666 },
      { id: 1, label: 'Bellatrix',  x: 0.706, y: 0.655 },
      { id: 2, label: 'Alnitak',    x: 0.646, y: 0.758 },
      { id: 3, label: 'Alnilam',    x: 0.670, y: 0.750 },
      { id: 4, label: 'Mintaka',    x: 0.694, y: 0.742 },
      { id: 5, label: 'Saiph',      x: 0.640, y: 0.849 },
      { id: 6, label: 'Rigel',      x: 0.712, y: 0.841 },
    ],
    connections: [[0,2],[1,4],[2,3],[3,4],[2,5],[4,6]],
  },
  {
    id: 2,
    name: 'Big Dipper',
    hint: 'Seven stars — four in the bowl, three in the handle',
    starColor: '#FFD97D',
    lineColor: '#FFE9A0',
    glowColor: 'rgba(255,217,125,0.35)',
    decoyCount: 10,
    region: { x: 0.55, y: 0.07, w: 0.36, h: 0.38 },
    stars: [
      { id: 0, label: 'Dubhe',  x: 0.675, y: 0.164 },
      { id: 1, label: 'Merak',  x: 0.704, y: 0.209 },
      { id: 2, label: 'Phecda', x: 0.747, y: 0.217 },
      { id: 3, label: 'Megrez', x: 0.762, y: 0.171 },
      { id: 4, label: 'Alioth', x: 0.794, y: 0.186 },
      { id: 5, label: 'Mizar',  x: 0.826, y: 0.217 },
      { id: 6, label: 'Alkaid', x: 0.855, y: 0.270 },
    ],
    connections: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
  },
  {
    id: 3,
    name: 'Cassiopeia',
    hint: "The Queen — trace her W throne",
    starColor: '#C8A4FF',
    lineColor: '#DEC4FF',
    glowColor: 'rgba(200,164,255,0.35)',
    decoyCount: 12,
    region: { x: 0.10, y: 0.07, w: 0.38, h: 0.34 },
    stars: [
      { id: 0, label: 'Caph',    x: 0.195, y: 0.189 },
      { id: 1, label: 'Schedar', x: 0.237, y: 0.240 },
      { id: 2, label: 'Gamma',   x: 0.290, y: 0.199 },
      { id: 3, label: 'Ruchbah', x: 0.336, y: 0.247 },
      { id: 4, label: 'Segin',   x: 0.385, y: 0.199 },
    ],
    connections: [[0,1],[1,2],[2,3],[3,4]],
  },
];

// Full-sky viewport for the map view
export const SKY_VIEWPORT = { cx: 0.5, cy: 0.5, zoom: 1 };

// Compute zoom level to fill 85% of view with a region
export function regionViewport(region) {
  return {
    cx: region.x + region.w / 2,
    cy: region.y + region.h / 2,
    zoom: 0.85 / Math.max(region.w, region.h),
  };
}
