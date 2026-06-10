import { useEffect, useRef } from 'react';
import { Rive } from '@rive-app/canvas';

// Drop a .riv file into /public/rive/ and pass its filename as `src`.
// stateMachine — name of the SM to run (optional)
// inputs — { inputName: value } map fed to the SM (optional)
// style — override container style
export default function RiveLayer({ src, stateMachine, inputs = {}, style = {} }) {
  const canvasRef = useRef(null);
  const riveRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    const r = new Rive({
      src: `/rive/${src}`,
      canvas: canvasRef.current,
      autoplay: true,
      stateMachines: stateMachine ? [stateMachine] : undefined,
      onLoad() {
        r.resizeDrawingSurfaceToCanvas();
        applyInputs(r, stateMachine, inputs);
      },
    });

    riveRef.current = r;
    return () => r.cleanup();
  }, [src, stateMachine]);

  // Reactively push input changes without remounting
  useEffect(() => {
    if (riveRef.current && stateMachine) {
      applyInputs(riveRef.current, stateMachine, inputs);
    }
  }, [inputs, stateMachine]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        ...style,
      }}
    />
  );
}

function applyInputs(rive, smName, inputs) {
  try {
    const sm = rive.stateMachineInputs(smName);
    if (!sm) return;
    for (const input of sm) {
      if (input.name in inputs) input.value = inputs[input.name];
    }
  } catch (_) {}
}
