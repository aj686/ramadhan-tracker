import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { type ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { type CharacterClip, clipFinished, nextClip, poseAt } from '@/services/game/character-motion';
import type { BuildCharacter } from './cat-model';

const IDLE_FRAME_MS = 1000 / 30; // full speed during a clip or drag, 30 fps while nothing much is happening
const LOOK_EASING = 0.18;

export interface LookTarget {
  x: number;
  y: number;
}

interface Character3DProps {
  build: BuildCharacter;
  clip: CharacterClip;
  playId: number;
  size: number;
  // A ref, not a prop value: dragging moves the head on every frame without a React render.
  lookTarget: React.RefObject<LookTarget | null>;
  onClipChange: (clip: CharacterClip) => void;
  onReady: () => void;
  onFail: () => void;
}

// Hermes, the JavaScript engine on phones, has no FinalizationRegistry, and three.js creates one in its
// renderer. three.js only uses it to tidy its caches after garbage collection. This game disposes everything
// itself on exit, so stand-ins that keep nothing extra alive are safe. Browsers keep their real ones.
const prepareForThree = () => {
  const host = globalThis as unknown as Record<string, unknown>;
  host.FinalizationRegistry ??= class {
    register() {}
    unregister() {}
  };
  host.WeakRef ??= class<T> {
    constructor(private readonly target: T) {}
    deref() {
      return this.target;
    }
  };
};

// A real 3D scene, drawn with three.js on the WebGL context from expo-gl, on Android, iOS and web.
// three.js only loads when this mounts, so the rest of the app never runs it.
export const Character3D: React.FC<Character3DProps> = ({
  build,
  clip,
  playId,
  size,
  lookTarget,
  onClipChange,
  onReady,
  onFail,
}) => {
  const playing = useRef({ clip, startedAt: Date.now() });
  const latest = useRef({ onClipChange, onReady, onFail });
  const foreground = useRef(true);
  const unmounted = useRef(false);
  const stopScene = useRef<(() => void) | null>(null);

  useEffect(() => {
    latest.current = { onClipChange, onReady, onFail };
  });

  useEffect(() => {
    playing.current = { clip, startedAt: Date.now() };
  }, [clip, playId]);

  useEffect(() => {
    unmounted.current = false;
    const subscription = AppState.addEventListener('change', (state) => {
      foreground.current = state === 'active';
    });
    return () => {
      unmounted.current = true;
      subscription.remove();
      stopScene.current?.();
    };
  }, [unmounted, stopScene]);

  const handleContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    try {
      prepareForThree();
      const THREE = await import('three');
      if (unmounted.current) return;

      const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

      // three.js expects a canvas. expo-gl only gives a context, so this stands in for the canvas.
      const canvas = {
        width,
        height,
        clientWidth: width,
        clientHeight: height,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        getContext: () => gl,
      };
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas as unknown as HTMLCanvasElement,
        context: gl as unknown as WebGL2RenderingContext,
        alpha: true,
        antialias: true,
      });
      renderer.setSize(width, height, false);
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 50);
      camera.position.set(0, 1.9, 8.6);
      camera.lookAt(0, 1.55, 0);

      scene.add(new THREE.HemisphereLight(0xffffff, 0xe8d5b5, 2.1));
      const sun = new THREE.DirectionalLight(0xffffff, 1.7);
      sun.position.set(2.5, 5, 6);
      scene.add(sun);

      const model = build(THREE);
      scene.add(model.root);

      let frameId = 0;
      let lastDrawn = 0;
      let hasDrawn = false;
      const look = { x: 0, y: 0 };

      const stop = () => {
        cancelAnimationFrame(frameId);
        stopScene.current = null;
        model.dispose();
        renderer.dispose();
      };
      stopScene.current = stop;

      const draw = (now: number) => {
        frameId = requestAnimationFrame(draw);
        if (!foreground.current) return;

        const target = lookTarget.current;
        const current = playing.current;
        const isBusy =
          current.clip !== 'idle' || target !== null || Math.abs(look.x) > 0.01 || Math.abs(look.y) > 0.01;
        if (!isBusy && now - lastDrawn < IDLE_FRAME_MS) return;
        lastDrawn = now;

        try {
          const elapsed = Date.now() - current.startedAt;
          if (hasDrawn && clipFinished(current.clip, elapsed)) {
            latest.current.onClipChange(nextClip(current.clip));
          }

          look.x += ((target?.x ?? 0) - look.x) * LOOK_EASING;
          look.y += ((target?.y ?? 0) - look.y) * LOOK_EASING;

          model.apply(poseAt(current.clip, elapsed), look.x, look.y);
          renderer.render(scene, camera);
          gl.endFrameEXP();

          if (!hasDrawn) {
            hasDrawn = true;
            latest.current.onReady();
          }
        } catch {
          stop();
          latest.current.onFail();
        }
      };
      frameId = requestAnimationFrame(draw);
    } catch {
      // No usable WebGL here. The emoji carries on, and the game stays playable.
      latest.current.onFail();
    }
  };

  return <GLView style={{ width: size, height: size }} msaaSamples={4} onContextCreate={handleContextCreate} />;
};
