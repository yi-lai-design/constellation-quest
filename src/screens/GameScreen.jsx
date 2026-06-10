import { useState, useCallback, useRef } from 'react';
import P5Canvas from '../components/P5Canvas';
import { LEVELS, SKY_VIEWPORT, regionViewport } from '../game/levels';
import styles from './GameScreen.module.css';

// phase flow:
//  'playing' → win → 'zooming-out' → (1.4s) → 'map-view'
//  'map-view' → tap next → 'zooming-in' → (1.5s) → 'playing'

export default function GameScreen({ onComplete }) {
  const [levelIndex,   setLevelIndex]   = useState(0);
  const [resetCount,   setResetCount]   = useState(0);
  const [connections,  setConnections]  = useState(0);
  const [phase,        setPhase]        = useState('playing');
  const [completedIds, setCompletedIds] = useState(new Set());
  const [initialVp,    setInitialVp]    = useState(null);
  const [showHint,     setShowHint]     = useState(true);

  const cameraRef = useRef(null);

  const level        = LEVELS[levelIndex];
  const isLastLevel  = levelIndex === LEVELS.length - 1;
  const totalConns   = level.connections.length;
  const isPlaying    = phase === 'playing';
  const isMapView    = phase === 'map-view';

  // ── Callbacks ─────────────────────────────────────────────────────────────
  const handleConnect = useCallback(() => {
    setConnections(c => c + 1);
    setShowHint(false);
  }, []);

  const handleWin = useCallback(() => {
    setPhase('zooming-out');
    cameraRef.current?.setTarget(SKY_VIEWPORT);
    cameraRef.current?.disableInput();
    setTimeout(() => setPhase('map-view'), 1400);
  }, []);

  function restart() {
    setResetCount(c => c + 1);
    setConnections(0);
    setPhase('playing');
    setShowHint(true);
  }

  function handleNext() {
    const newCompleted = new Set(completedIds).add(levelIndex);
    setCompletedIds(newCompleted);

    if (isLastLevel) { onComplete(); return; }

    // Mount next level's sketch starting at full sky, zoom it in
    setInitialVp({ ...SKY_VIEWPORT });
    setLevelIndex(i => i + 1);
    setConnections(0);
    setShowHint(true);
    setPhase('zooming-in');
    setTimeout(() => setPhase('playing'), 1600);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      <P5Canvas
        key={`${levelIndex}-${resetCount}`}
        level={level}
        allLevels={LEVELS}
        completedIds={completedIds}
        initialVp={initialVp}
        onConnect={handleConnect}
        onWin={handleWin}
        cameraRef={cameraRef}
      />

      {/* HUD — hide during map view */}
      {(isPlaying || phase === 'zooming-in') && (
        <div className={`${styles.hud} ${phase === 'zooming-in' ? styles.hudFading : ''}`}>
          <div className={styles.levelTag}>
            <span className={styles.levelLabel}>LEVEL {level.id} / {LEVELS.length}</span>
            <span className={styles.levelName} style={{ color: level.starColor }}>{level.name}</span>
          </div>
          <div className={styles.progress}>
            {Array.from({ length: totalConns }).map((_, i) => (
              <div key={i} className={styles.pip} style={{
                background: i < connections ? level.starColor : 'rgba(255,255,255,0.12)',
                boxShadow:  i < connections ? `0 0 6px ${level.glowColor}` : 'none',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar — only while playing */}
      {isPlaying && (
        <div className={styles.bottomBar}>
          {showHint && <p className={styles.hint}>{level.hint}</p>}
          <button className={styles.resetBtn} onClick={restart}>↺ RESTART</button>
        </div>
      )}

      {/* Zooming-in label */}
      {phase === 'zooming-in' && (
        <div className={styles.zoomInLabel}>
          <p className={styles.zoomInName} style={{ color: level.starColor }}>{level.name}</p>
          <p className={styles.zoomInSub}>zooming in…</p>
        </div>
      )}

      {/* Map-view overlay — after zoom out */}
      {isMapView && (
        <div className={styles.mapOverlay}>
          <div className={styles.mapCard}>
            <p className={styles.mapEyebrow}>CONSTELLATION MAPPED</p>
            <h2 className={styles.mapTitle} style={{ color: level.starColor }}>{level.name}</h2>
            <p className={styles.mapSub}>{level.stars.length} stars · {totalConns} connections</p>
            <button
              className={styles.nextBtn}
              style={{ borderColor: level.starColor, color: level.starColor }}
              onClick={handleNext}
            >
              {isLastLevel ? 'VIEW FULL SKY →' : 'NEXT CONSTELLATION →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
