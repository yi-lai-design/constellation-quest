import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { createSketch } from '../game/sketch';

export default function P5Canvas({ level, onConnect, onWin }) {
  const containerRef = useRef(null);
  const p5Ref = useRef(null);

  useEffect(() => {
    const sketchFn = createSketch({ level, onConnect, onWin });
    p5Ref.current = new p5(sketchFn, containerRef.current);
    return () => {
      p5Ref.current?.remove();
      p5Ref.current = null;
    };
  }, [level]); // remount when level changes

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    />
  );
}
