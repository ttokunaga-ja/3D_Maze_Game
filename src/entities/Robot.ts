import * as THREE from 'three';
import { BLOCK_SIZE, PLAYER_EYE_Y } from '../config/constants';

export interface Robot {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  torchLight: THREE.SpotLight;
}

export function createRobot(): Robot {
  const group = new THREE.Group();
  const scale = BLOCK_SIZE / 40;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x00cfd1,
    roughness: 0.8,
    metalness: 0.2,
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xeac28b,
    roughness: 0.8,
    metalness: 0.1,
  });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const earMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.6 });
  const armMat = new THREE.MeshStandardMaterial({ color: 0xfacd2e, roughness: 0.7 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x884f9f, roughness: 0.7 });
  const torchMat = new THREE.MeshStandardMaterial({
    color: 0xffa500,
    emissive: 0xff7a00,
    emissiveIntensity: 1.4,
  });

  const head = new THREE.Mesh(new THREE.BoxGeometry(20, 16, 16), headMat);
  head.position.set(0, 10, 0);
  group.add(head);

  const eye1 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8), eyeMat);
  eye1.position.set(5, 13, -8);
  group.add(eye1);

  const eye2 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8), eyeMat);
  eye2.position.set(-5, 13, -8);
  group.add(eye2);

  const earGeom = new THREE.CylinderGeometry(0, 4, 6, 3);
  const ear1 = new THREE.Mesh(earGeom, earMat);
  ear1.position.set(6, 18, 0);
  ear1.rotation.set(Math.PI / 2, Math.PI / 3, 0);
  group.add(ear1);
  const ear2 = new THREE.Mesh(earGeom, earMat);
  ear2.position.set(-6, 18, 0);
  ear2.rotation.set(Math.PI / 2, -Math.PI / 3, 0);
  group.add(ear2);

  const body = new THREE.Mesh(new THREE.BoxGeometry(15, 20, 10), bodyMat);
  body.position.set(0, -8, 0);
  group.add(body);

  const armGeom = new THREE.BoxGeometry(6, 20, 6);
  const arm1 = new THREE.Mesh(armGeom, armMat);
  arm1.position.set(12, -8, 0);
  arm1.rotation.x = Math.PI / 6;
  group.add(arm1);
  const arm2 = new THREE.Mesh(armGeom, armMat);
  arm2.position.set(-12, -8, 0);
  arm2.rotation.x = -Math.PI / 6;
  group.add(arm2);

  const torch = new THREE.Mesh(new THREE.CylinderGeometry(2, 1, 8, 12), torchMat);
  torch.position.set(0, -8, 0);
  torch.rotation.x = Math.PI / 2;
  arm2.add(torch);

  const torchLight = new THREE.SpotLight(0xffd0a0, 1.2, BLOCK_SIZE * 6, Math.PI / 5, 0.4, 1);
  torchLight.position.set(0, 0, -10);
  torchLight.target.position.set(0, 0, -200);
  arm2.add(torchLight);
  arm2.add(torchLight.target);

  const legGeom = new THREE.BoxGeometry(6, 15, 10);
  const leftLeg = new THREE.Mesh(legGeom, legMat);
  leftLeg.position.set(-4, -26, 0);
  group.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeom, legMat);
  rightLeg.position.set(4, -26, 0);
  group.add(rightLeg);

  group.scale.setScalar(scale);
  group.position.y = PLAYER_EYE_Y;

  return { group, leftLeg, rightLeg, torchLight };
}

export function animateLegs(robot: Robot, walking: boolean, elapsed: number): void {
  if (walking) {
    const a = Math.sin(elapsed * 9) * 0.5;
    robot.leftLeg.rotation.x = a;
    robot.rightLeg.rotation.x = -a;
  } else {
    robot.leftLeg.rotation.x *= 0.7;
    robot.rightLeg.rotation.x *= 0.7;
  }
}
