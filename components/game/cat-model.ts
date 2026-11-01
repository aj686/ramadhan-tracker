import type * as ThreeModule from 'three';
import type { CharacterPose } from '@/services/game/character-motion';

// three.js arrives as a parameter, so importing this file does not load it.
// Colours here are the character's own, like a colour swatch in a game: content, not theme.
const FUR = 0xf59e42;
const STRIPE = 0xd97b1f;
const CREAM = 0xfff1dc;
const PINK = 0xf9a8b8;
const DARK = 0x2b2140;
const WHITE = 0xffffff;

type Three = typeof ThreeModule;
type Vec3 = [number, number, number];

export interface CharacterModel {
  root: ThreeModule.Object3D;
  apply: (pose: CharacterPose, lookX: number, lookY: number) => void;
  dispose: () => void;
}

export type BuildCharacter = (three: Three) => CharacterModel;

// A sitting kitten made of smooth shapes, with no textures and no model file.
export const buildCat: BuildCharacter = (THREE) => {
  const big = new THREE.SphereGeometry(1, 24, 16);
  const medium = new THREE.SphereGeometry(1, 16, 12);
  const small = new THREE.SphereGeometry(1, 12, 8);
  const cone = new THREE.ConeGeometry(1, 1, 12);
  const disc = new THREE.CircleGeometry(1, 32);
  const smileArc = new THREE.TorusGeometry(0.06, 0.013, 6, 12, Math.PI);
  const whisker = new THREE.CylinderGeometry(0.007, 0.007, 0.5, 5);
  const tailTube = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(
      ([[0, 0, 0], [0.36, 0.08, 0], [0.64, 0.4, 0], [0.72, 0.84, 0], [0.6, 1.14, 0]] as Vec3[]).map(
        (point) => new THREE.Vector3(...point),
      ),
    ),
    20,
    0.13,
    8,
  );

  const soft = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 });
  const fur = soft(FUR);
  const stripe = soft(STRIPE);
  const cream = soft(CREAM);
  const pink = soft(PINK);
  const dark = new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.35 });
  const white = new THREE.MeshBasicMaterial({ color: WHITE });
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: DARK, transparent: true, opacity: 0.16, depthWrite: false });

  const part = (
    parent: ThreeModule.Object3D,
    geometry: ThreeModule.BufferGeometry,
    material: ThreeModule.Material,
    position: Vec3,
    scale: Vec3,
  ) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  };

  const group = (parent: ThreeModule.Object3D, position: Vec3) => {
    const pivot = new THREE.Group();
    pivot.position.set(...position);
    parent.add(pivot);
    return pivot;
  };

  const root = new THREE.Group();

  // A soft circle on the ground, far cheaper than real-time shadows.
  const shadow = part(root, disc, shadowMaterial, [0, 0.01, 0.1], [1.15, 1.15, 1]);
  shadow.rotation.x = -Math.PI / 2;

  const body = group(root, [0, 0, 0]);
  part(body, big, fur, [0, 0.92, 0], [0.92, 1.0, 0.82]);
  part(body, medium, cream, [0, 0.82, 0.5], [0.56, 0.68, 0.42]);
  part(body, medium, fur, [-0.34, 0.15, 0.68], [0.26, 0.16, 0.32]);
  part(body, medium, fur, [0.34, 0.15, 0.68], [0.26, 0.16, 0.32]);
  part(body, medium, fur, [-0.72, 0.3, 0.12], [0.34, 0.3, 0.44]);
  part(body, medium, fur, [0.72, 0.3, 0.12], [0.34, 0.3, 0.44]);

  const tail = group(body, [0.62, 0.3, -0.5]);
  part(tail, tailTube, fur, [0, 0, 0], [1, 1, 1]);
  part(tail, medium, stripe, [0.6, 1.14, 0], [0.135, 0.135, 0.135]);

  const head = group(body, [0, 1.72, 0.12]);
  part(head, big, fur, [0, 0.42, 0], [0.86, 0.76, 0.76]);

  // Tabby stripes lying flat on the forehead.
  ([[0, 0.97, 0.47], [-0.22, 0.93, 0.47], [0.22, 0.93, 0.47]] as Vec3[]).forEach((position, i) => {
    const mark = part(head, small, stripe, position, i === 0 ? [0.05, 0.15, 0.03] : [0.045, 0.12, 0.03]);
    mark.rotation.x = -0.85;
    mark.rotation.z = position[0] * -0.9;
  });

  const ear = (side: 1 | -1) => {
    const pivot = group(head, [side * 0.5, 0.92, 0]);
    pivot.rotation.z = side * -0.22;
    part(pivot, cone, fur, [0, 0.24, 0], [0.27, 0.56, 0.2]);
    part(pivot, cone, pink, [0, 0.2, 0.09], [0.15, 0.36, 0.1]);
    return pivot;
  };
  const earLeft = ear(-1);
  const earRight = ear(1);

  const eye = (side: 1 | -1) => {
    const pivot = group(head, [side * 0.34, 0.5, 0.66]);
    part(pivot, medium, dark, [0, 0, 0], [0.15, 0.19, 0.09]);
    part(pivot, small, white, [side * -0.04 - 0.02, 0.07, 0.08], [0.05, 0.06, 0.02]);
    return pivot;
  };
  const eyeLeft = eye(-1);
  const eyeRight = eye(1);

  part(head, medium, cream, [-0.15, 0.19, 0.66], [0.22, 0.16, 0.14]);
  part(head, medium, cream, [0.15, 0.19, 0.66], [0.22, 0.16, 0.14]);
  part(head, small, pink, [0, 0.29, 0.8], [0.07, 0.05, 0.04]);
  const mouth = part(head, small, dark, [0, 0.08, 0.73], [0.12, 0.02, 0.06]);

  // The cat's smile, two small curves side by side. It gives way to the open mouth when chewing.
  const smile = group(head, [0, 0.14, 0.785]);
  [-0.06, 0.06].forEach((x) => {
    const curve = part(smile, smileArc, dark, [x, 0, 0], [1, 1, 1]);
    curve.rotation.z = Math.PI;
  });

  ([[-1, 0.24], [-1, 0.14], [1, 0.24], [1, 0.14]] as const).forEach(([side, y], i) => {
    const hair = part(head, whisker, dark, [side * 0.52, y, 0.64], [1, 1, 1]);
    hair.rotation.z = Math.PI / 2 + side * (i % 2 === 0 ? -0.14 : 0.14);
  });

  const earRest = { left: earLeft.rotation.z, right: earRight.rotation.z };

  return {
    root,
    apply: (pose, lookX, lookY) => {
      body.position.y = pose.lift;
      body.scale.set(pose.squash, 2 - pose.squash, pose.squash);
      body.rotation.y = lookX * 0.14;

      head.rotation.set(pose.headPitch + lookY * 0.4, pose.headYaw + lookX * 0.65, pose.headRoll);

      earLeft.rotation.z = earRest.left + pose.ears * 0.6;
      earRight.rotation.z = earRest.right - pose.ears * 0.6;

      tail.rotation.z = pose.tail * 0.22;

      const eyeOpen = Math.max(0.08, 1 - pose.blink);
      eyeLeft.scale.y = eyeOpen;
      eyeRight.scale.y = eyeOpen;

      const isOpen = pose.jaw > 0.08;
      smile.visible = !isOpen;
      mouth.visible = isOpen;
      mouth.scale.y = 0.02 + pose.jaw * 0.17;
      mouth.position.y = 0.08 - pose.jaw * 0.07;

      const shadowSize = 1.15 - pose.lift * 0.5;
      shadow.scale.set(shadowSize, shadowSize, 1);
    },
    dispose: () => {
      [big, medium, small, cone, disc, smileArc, whisker, tailTube].forEach((geometry) => geometry.dispose());
      [fur, stripe, cream, pink, dark, white, shadowMaterial].forEach((material) => material.dispose());
    },
  };
};
