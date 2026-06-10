import styles from './EndScreen.module.css';

export default function EndScreen({ onRestart }) {
  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>ALL CONSTELLATIONS FOUND</p>
        <h1 className={styles.title}>You read<br /><em>the sky.</em></h1>
        <p className={styles.sub}>Orion · Big Dipper · Cassiopeia</p>
        <button className={styles.btn} onClick={onRestart}>PLAY AGAIN</button>
      </div>
    </div>
  );
}
