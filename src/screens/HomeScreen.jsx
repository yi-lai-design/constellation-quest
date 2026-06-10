import { useState } from 'react';
import styles from './HomeScreen.module.css';

export default function HomeScreen({ onStart }) {
  const [hovering, setHovering] = useState(false);

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>STAR MAP</p>
        <h1 className={styles.title}>Constellation<br /><em>Quest</em></h1>
        <p className={styles.sub}>
          Connect the stars.<br />Reveal the sky.
        </p>
        <button
          className={`${styles.btn} ${hovering ? styles.btnHover : ''}`}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onClick={onStart}
        >
          BEGIN
        </button>
      </div>
      {/* Rive slot — drop a home-screen .riv here when ready */}
      {/* <RiveLayer src="home_bg.riv" stateMachine="Main" /> */}
    </div>
  );
}
