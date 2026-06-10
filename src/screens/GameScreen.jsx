import { useState, useCallback, useRef } from 'react';
import P5Canvas from '../components/P5Canvas';
import { LEVELS } from '../game/levels';
import styles from './GameScreen.module.css';

// phase: 'playing' → win → 'level-complete' (1.2s flash) → 'playing' (next level)
//        last level win → onComplete()

export default function GameScreen({ onComplete }) {
  const [levelIndex,   setLevelIndex]   = useState(0);
  const [resetCount,   setResetCount]   = useState(0);
  const [connections,  setConnections]  = useState(0);
  const [phase,        setPhase]        = useState('playing');
  const [completedIds, setCompletedIds] = useState(new Set());
  const [showHint,     setShowHint]     = useState(true);

  const cameraRef   = useRef(null);
  const levelIdxRef = useRef(0);
  levelIdxRef.current = levelIndex;

  const level      = LEVELS[levelIndex];
  const isPlaying  = phase === 'playing';
  const totalConns = level.connections.length;

  const handleConnect = useCallback(() => {
    setConnections(c => c + 1);
    setShowHint(false);
  }, []);

  const handleWin = useCallback(() => {
    cameraRef.current?.disableInput();
    const idx = levelIdxRef.current;
    const isLast = idx === LEVELS.length - 1;
    setPhase('level-complete');

    setTimeout(() => {
      setCompletedIds(prev => new Set(prev).add(LEVELS[idx].id));
      if (isLast) { onComplete(); return; }
      setLevelIndex(idx + 1);
      setConnections(0);
      setShowHint(true);
      setPhase('playing');
    }, 1200);
  }, [onComplete]);

  function restart() {
    setResetCount(c => c + 1);
    setConnections(0);
    setPhase('playing');
    setShowHint(true);
  }

  return (
    <div className={styles.root}>
      <P5Canvas
        key={`${levelIndex}-${resetCount}`}
        level={level}
        allLevels={LEVELS}
        completedIds={completedIds}
        initialVp={null}
        onConnect={handleConnect}
        onWin={handleWin}
        cameraRef={cameraRef}
      />

      {/* HUD */}
      {isPlaying && (
        <div className={styles.hud}>
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

      {/* Bottom bar */}
      {isPlaying && (
        <div className={styles.bottomBar}>
          {showHint && <p className={styles.hint}>{level.hint}</p>}
          <button className={styles.resetBtn} onClick={restart}>↺ RESTART</button>
        </div>
      )}

      {/* Level-complete flash */}
      {phase === 'level-complete' && (
        <div className={styles.levelComplete}>
          <p className={styles.lcName} style={{ color: level.starColor }}>{level.name}</p>
          <p className={styles.lcLabel}>MAPPED</p>
        </div>
      )}
    </div>
  );
}
