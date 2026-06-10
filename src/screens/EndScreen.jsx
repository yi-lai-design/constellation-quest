import P5Canvas from '../components/P5Canvas';
import { LEVELS, SKY_VIEWPORT } from '../game/levels';
import styles from './EndScreen.module.css';

const ALL_IDS = new Set(LEVELS.map(l => l.id));

export default function EndScreen({ onRestart }) {
  return (
    <div className={styles.root}>
      <P5Canvas
        level={LEVELS[0]}
        allLevels={LEVELS}
        completedIds={ALL_IDS}
        initialVp={SKY_VIEWPORT}
        onConnect={() => {}}
        onWin={() => {}}
        interactive={false}
      />
      <div className={styles.content}>
        <p className={styles.eyebrow}>ALL CONSTELLATIONS FOUND</p>
        <h1 className={styles.title}>You read<br /><em>the sky.</em></h1>
        <p className={styles.sub}>Orion · Big Dipper · Cassiopeia</p>
        <button className={styles.btn} onClick={onRestart}>PLAY AGAIN</button>
      </div>
    </div>
  );
}
