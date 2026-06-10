import { useState, useCallback } from 'react';
import P5Canvas from '../components/P5Canvas';
import RiveLayer from '../components/RiveLayer';
import { LEVELS } from '../game/levels';
import styles from './GameScreen.module.css';

export default function GameScreen({ onComplete }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [resetCount, setResetCount] = useState(0);
  const [connections, setConnections] = useState(0);
  const [won, setWon] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const level = LEVELS[levelIndex];
  const totalConnections = level.connections.length;
  const isLastLevel = levelIndex === LEVELS.length - 1;

  const handleConnect = useCallback(() => {
    setConnections(c => c + 1);
    setShowHint(false);
  }, []);

  const handleWin = useCallback(() => {
    setWon(true);
  }, []);

  function restart() {
    setResetCount(c => c + 1);
    setConnections(0);
    setWon(false);
    setShowHint(true);
  }

  function nextLevel() {
    if (isLastLevel) {
      onComplete();
    } else {
      setLevelIndex(i => i + 1);
      setConnections(0);
      setWon(false);
      setShowHint(true);
    }
  }

  return (
    <div className={styles.root}>
      {/* p5 canvas — full screen game layer */}
      <P5Canvas
        key={`${levelIndex}-${resetCount}`}
        level={level}
        onConnect={handleConnect}
        onWin={handleWin}
      />

      {/* Rive slot — star glow / win celebration overlay */}
      {/* Drop your .riv files in /public/rive/ and uncomment: */}
      {/* <RiveLayer src="stars.riv" stateMachine="StarGlow" inputs={{ won }} /> */}

      {/* HUD */}
      <div className={styles.hud}>
        <div className={styles.levelTag}>
          <span className={styles.levelLabel}>LEVEL {level.id}</span>
          <span className={styles.levelName} style={{ color: level.starColor }}>
            {level.name}
          </span>
        </div>

        <div className={styles.progress}>
          {Array.from({ length: totalConnections }).map((_, i) => (
            <div
              key={i}
              className={styles.pip}
              style={{
                background: i < connections
                  ? level.starColor
                  : 'rgba(255,255,255,0.12)',
                boxShadow: i < connections ? `0 0 6px ${level.glowColor}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      {!won && (
        <div className={styles.bottomBar}>
          {showHint && <p className={styles.hint}>{level.hint}</p>}
          <button className={styles.resetBtn} onClick={restart}>↺ RESTART</button>
        </div>
      )}

      {/* Win overlay */}
      {won && (
        <div className={styles.winOverlay}>
          <div className={styles.winCard}>
            <p className={styles.winEyebrow}>CONSTELLATION FOUND</p>
            <h2 className={styles.winTitle} style={{ color: level.starColor }}>
              {level.name}
            </h2>
            <p className={styles.winSub}>{level.stars[0]?.label && `${level.stars.length} stars connected`}</p>
            <button className={styles.winBtn} style={{ borderColor: level.starColor, color: level.starColor }} onClick={nextLevel}>
              {isLastLevel ? 'COMPLETE' : 'NEXT CONSTELLATION →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
