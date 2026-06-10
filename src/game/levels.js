// Star positions are normalized (0–1). Connections are pairs of star indices.
// decoys are extra non-constellation stars scattered per level.

export const LEVELS = [
  {
    id: 1,
    name: 'Orion',
    hint: 'The Hunter — find his belt',
    starColor: '#7EB8FF',
    lineColor: '#A8D4FF',
    glowColor: 'rgba(126,184,255,0.35)',
    decoyCount: 8,
    stars: [
      { id: 0, label: 'Betelgeuse', x: 0.38, y: 0.28 },
      { id: 1, label: 'Bellatrix',  x: 0.62, y: 0.25 },
      { id: 2, label: 'Alnitak',    x: 0.42, y: 0.52 },
      { id: 3, label: 'Alnilam',    x: 0.50, y: 0.50 },
      { id: 4, label: 'Mintaka',    x: 0.58, y: 0.48 },
      { id: 5, label: 'Saiph',      x: 0.40, y: 0.76 },
      { id: 6, label: 'Rigel',      x: 0.64, y: 0.74 },
    ],
    connections: [
      [0, 2], [1, 4],
      [2, 3], [3, 4],
      [2, 5], [4, 6],
    ],
  },
  {
    id: 2,
    name: 'Big Dipper',
    hint: 'Seven stars — four in the bowl, three in the handle',
    starColor: '#FFD97D',
    lineColor: '#FFE9A0',
    glowColor: 'rgba(255,217,125,0.35)',
    decoyCount: 10,
    stars: [
      { id: 0, label: 'Dubhe',   x: 0.32, y: 0.22 },
      { id: 1, label: 'Merak',   x: 0.40, y: 0.34 },
      { id: 2, label: 'Phecda',  x: 0.52, y: 0.36 },
      { id: 3, label: 'Megrez',  x: 0.56, y: 0.24 },
      { id: 4, label: 'Alioth',  x: 0.65, y: 0.28 },
      { id: 5, label: 'Mizar',   x: 0.74, y: 0.36 },
      { id: 6, label: 'Alkaid',  x: 0.82, y: 0.50 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [3, 4], [4, 5], [5, 6],
    ],
  },
  {
    id: 3,
    name: 'Cassiopeia',
    hint: 'The Queen — trace her W throne',
    starColor: '#C8A4FF',
    lineColor: '#DEC4FF',
    glowColor: 'rgba(200,164,255,0.35)',
    decoyCount: 12,
    stars: [
      { id: 0, label: 'Caph',    x: 0.22, y: 0.38 },
      { id: 1, label: 'Schedar', x: 0.36, y: 0.54 },
      { id: 2, label: 'Gamma',   x: 0.50, y: 0.40 },
      { id: 3, label: 'Ruchbah', x: 0.64, y: 0.56 },
      { id: 4, label: 'Segin',   x: 0.78, y: 0.40 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 4],
    ],
  },
];
