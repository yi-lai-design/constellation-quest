import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { createSketch } from '../game/sketch';

export default function P5Canvas({ level, allLevels, completedIds, initialVp,
                                    onConnect, onWin, cameraRef, interactive = true }) {
  const containerRef = useRef(null);
  const p5Ref = useRef(null);

  useEffect(() => {
    const sketchFn = createSketch({
      level,
      allLevels,
      completedIds,
      initialVp,
      onConnect,
      onWin,
      interactive,
      onViewportRef: (api) => { if (cameraRef) cameraRef.current = api; },
    });
    p5Ref.current = new p5(sketchFn, containerRef.current);
    return () => {
      p5Ref.current?.remove();
      p5Ref.current = null;
      if (cameraRef) cameraRef.current = null;
    };
  }, [level]);

  return <div ref={containerRef} style={{ position: 'fixed', inset: 0, zIndex: 0 }} />;
}
