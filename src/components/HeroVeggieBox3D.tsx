import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { motion } from 'motion/react';
import { Pill, Droplets, Flame } from 'lucide-react';

interface HeroVeggieBox3DProps {
  scrollProgress?: number;
}

function createKraftTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm kraft cardboard gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#D49E6A');
  grad.addColorStop(1, '#BE8652');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle cardboard grain fibres
  for (let i = 0; i < 1600; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const w = 2 + Math.random() * 14;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(90, 52, 22, 0.08)' : 'rgba(255, 232, 200, 0.09)';
    ctx.fillRect(x, y, w, 1.5);
  }

  // Organic farmers market stamp
  ctx.strokeStyle = 'rgba(72, 42, 18, 0.35)';
  ctx.lineWidth = 4;
  ctx.strokeRect(110, 190, 292, 120);
  ctx.fillStyle = 'rgba(72, 42, 18, 0.45)';
  ctx.font = 'bold 34px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FRESH MARKET', 256, 248);
  ctx.font = '600 20px Poppins, sans-serif';
  ctx.fillText('FARM HARVEST', 256, 286);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 16, 128, 128, 124);
  grad.addColorStop(0, 'rgba(20, 46, 10, 0.52)');
  grad.addColorStop(0.55, 'rgba(20, 46, 10, 0.22)');
  grad.addColorStop(1, 'rgba(20, 46, 10, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export const HeroVeggieBox3D: React.FC<HeroVeggieBox3DProps> = ({ scrollProgress = 0 }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 390;
    const height = container.clientHeight || 380;
    renderer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    camera.position.set(0, 1.85, 5.4);
    camera.lookAt(0, 0.45, 0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    // Studio 3-point warm/cool lighting
    const hemi = new THREE.HemisphereLight(0xf3ffe8, 0x3b6e16, 1.05);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff5df, 2.2);
    keyLight.position.set(3.2, 5.4, 4.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 16;
    const d = 3.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd9f99d, 0.9);
    rimLight.position.set(-3.5, 2.8, -3.0);
    scene.add(rimLight);

    // Track disposable resources
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };

    const kraftTex = createKraftTexture();
    textures.push(kraftTex);
    const shadowTex = createContactShadowTexture();
    textures.push(shadowTex);

    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    // Contact shadow grounded under the box
    const contactShadow = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(3.8, 2.6)),
      trackMat(
        new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          depthWrite: false,
          opacity: 0.72,
        })
      )
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, -0.78, 0.1);
    heroGroup.add(contactShadow);

    // 1) Composite Cardboard Box (bottom + 4 walls + 4 open flaps)
    const boxGroup = new THREE.Group();
    boxGroup.position.set(0, -0.75, 0);
    heroGroup.add(boxGroup);

    const cardboardMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: kraftTex,
        roughness: 0.85,
        metalness: 0.02,
      })
    );
    const cardboardInnerMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xa67447,
        roughness: 0.92,
        metalness: 0.0,
      })
    );

    const boxW = 2.05;
    const boxH = 1.05;
    const boxD = 1.38;
    const wallT = 0.07;

    const bottom = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(boxW, wallT, boxD)), cardboardInnerMat);
    bottom.position.y = wallT / 2;
    bottom.receiveShadow = true;
    boxGroup.add(bottom);

    const frontWall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(boxW, boxH, wallT)), cardboardMat);
    frontWall.position.set(0, boxH / 2, boxD / 2 - wallT / 2);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    boxGroup.add(frontWall);

    const backWall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(boxW, boxH, wallT)), cardboardInnerMat);
    backWall.position.set(0, boxH / 2, -boxD / 2 + wallT / 2);
    backWall.castShadow = true;
    boxGroup.add(backWall);

    const leftWall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(wallT, boxH, boxD)), cardboardMat);
    leftWall.position.set(-boxW / 2 + wallT / 2, boxH / 2, 0);
    leftWall.castShadow = true;
    boxGroup.add(leftWall);

    const rightWall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(wallT, boxH, boxD)), cardboardMat);
    rightWall.position.set(boxW / 2 - wallT / 2, boxH / 2, 0);
    rightWall.castShadow = true;
    boxGroup.add(rightWall);

    // Open outward flaps
    const frontFlap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(boxW * 0.96, 0.42, wallT * 0.8)), cardboardMat);
    frontFlap.position.set(0, boxH + 0.06, boxD / 2 + 0.14);
    frontFlap.rotation.x = 0.95;
    frontFlap.castShadow = true;
    boxGroup.add(frontFlap);

    const leftFlap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, wallT * 0.8, boxD * 0.94)), cardboardMat);
    leftFlap.position.set(-boxW / 2 - 0.14, boxH + 0.08, 0);
    leftFlap.rotation.z = 0.55;
    boxGroup.add(leftFlap);

    const rightFlap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, wallT * 0.8, boxD * 0.94)), cardboardMat);
    rightFlap.position.set(boxW / 2 + 0.14, boxH + 0.08, 0);
    rightFlap.rotation.z = -0.55;
    boxGroup.add(rightFlap);

    // Floating veggies container (each veggie bobs independently!)
    interface BobItem {
      group: THREE.Group;
      baseY: number;
      amp: number;
      speed: number;
      phase: number;
      baseRotZ: number;
    }
    const bobs: BobItem[] = [];

    // 2) Glossy 3D Carrot (Lathe body + 4 frond leaves)
    const carrotGroup = new THREE.Group();
    carrotGroup.position.set(0.45, 0.82, -0.18);
    carrotGroup.rotation.set(0.08, 0.2, -0.24);
    heroGroup.add(carrotGroup);

    const carrotPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.08, 0.14),
      new THREE.Vector2(0.16, 0.45),
      new THREE.Vector2(0.24, 0.82),
      new THREE.Vector2(0.27, 1.05),
      new THREE.Vector2(0.22, 1.18),
      new THREE.Vector2(0.0, 1.22),
    ];
    const carrotMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xf97316,
        roughness: 0.22,
        clearcoat: 0.85,
        clearcoatRoughness: 0.15,
      })
    );
    const carrotBody = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(carrotPts, 24)), carrotMat);
    carrotBody.position.y = -0.55;
    carrotBody.castShadow = true;
    carrotGroup.add(carrotBody);

    const frondMat = trackMat(
      new THREE.MeshPhysicalMaterial({ color: 0x55a630, roughness: 0.35, clearcoat: 0.4 })
    );
    for (let i = 0; i < 4; i++) {
      const frond = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.055, 0.48, 10)), frondMat);
      frond.position.set(Math.cos(i * 1.5) * 0.08, 0.82, Math.sin(i * 1.5) * 0.08);
      frond.rotation.set((i % 2 === 0 ? 1 : -1) * 0.25, i * 0.9, (i - 1.5) * 0.18);
      carrotGroup.add(frond);
    }
    bobs.push({ group: carrotGroup, baseY: 0.82, amp: 0.06, speed: 1.5, phase: 0.2, baseRotZ: -0.24 });

    // 3) Glossy 3D Broccoli (stalk + 8 floret spheres)
    const brocGroup = new THREE.Group();
    brocGroup.position.set(-0.56, 0.58, -0.05);
    brocGroup.rotation.set(0.12, 0.1, 0.22);
    heroGroup.add(brocGroup);

    const stalkMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x8fd14f, roughness: 0.55 })
    );
    const floretMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x3a7d1e,
        roughness: 0.32,
        clearcoat: 0.55,
      })
    );
    const stalk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.16, 0.12, 0.62, 16)), stalkMat);
    stalk.position.y = -0.12;
    stalk.castShadow = true;
    brocGroup.add(stalk);

    const floretOffsets: [number, number, number, number][] = [
      [0, 0.35, 0, 0.28],
      [-0.22, 0.25, 0.1, 0.21],
      [0.22, 0.26, 0.08, 0.22],
      [0.05, 0.24, 0.22, 0.21],
      [-0.08, 0.25, -0.2, 0.21],
      [0.18, 0.16, -0.15, 0.18],
      [-0.2, 0.14, -0.12, 0.18],
    ];
    for (const [fx, fy, fz, fr] of floretOffsets) {
      const f = new THREE.Mesh(trackGeo(new THREE.IcosahedronGeometry(fr, 2)), floretMat);
      f.position.set(fx, fy, fz);
      f.castShadow = true;
      brocGroup.add(f);
    }
    bobs.push({ group: brocGroup, baseY: 0.58, amp: 0.055, speed: 1.25, phase: 1.4, baseRotZ: 0.22 });

    // 4) Glossy 3D Tomatoes (main + side cherry tomato)
    const createTomato = (radius: number, pos: [number, number, number]) => {
      const tGroup = new THREE.Group();
      tGroup.position.set(...pos);
      const tMat = trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0xe4572e,
          roughness: 0.12,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
        })
      );
      const body = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(radius, 24, 20)), tMat);
      body.scale.set(1.08, 0.88, 1.08);
      body.castShadow = true;
      tGroup.add(body);

      const calyxMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x3d7a1c, roughness: 0.45 }));
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(radius * 0.14, radius * 0.42, 6)), calyxMat);
        const angle = (i / 5) * Math.PI * 2;
        leaf.position.set(Math.cos(angle) * radius * 0.22, radius * 0.84, Math.sin(angle) * radius * 0.22);
        leaf.rotation.z = -Math.cos(angle) * 1.1;
        leaf.rotation.x = Math.sin(angle) * 1.1;
        tGroup.add(leaf);
      }
      const stem = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(radius * 0.06, radius * 0.07, radius * 0.3, 8)), calyxMat);
      stem.position.y = radius * 0.96;
      tGroup.add(stem);
      return tGroup;
    };

    const bigTomato = createTomato(0.32, [-0.42, 0.36, 0.38]);
    heroGroup.add(bigTomato);
    bobs.push({ group: bigTomato, baseY: 0.36, amp: 0.045, speed: 1.7, phase: 2.3, baseRotZ: 0 });

    const miniTomato = createTomato(0.2, [0.58, 0.24, 0.46]);
    heroGroup.add(miniTomato);
    bobs.push({ group: miniTomato, baseY: 0.24, amp: 0.05, speed: 1.9, phase: 0.8, baseRotZ: 0 });

    // 5) Fresh Pea / Green Grape Cluster in front center
    const peaGroup = new THREE.Group();
    peaGroup.position.set(0.05, 0.35, 0.42);
    heroGroup.add(peaGroup);
    const peaMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x8dc63f,
        roughness: 0.16,
        clearcoat: 0.9,
        clearcoatRoughness: 0.1,
      })
    );
    const peaPositions: [number, number, number][] = [
      [0, 0.08, 0.12],
      [-0.16, 0.02, 0.06],
      [0.16, 0.03, 0.08],
      [-0.08, -0.09, 0.14],
      [0.09, -0.08, 0.15],
      [0, 0.19, 0.02],
      [-0.12, 0.15, -0.04],
      [0.12, 0.14, -0.03],
    ];
    for (const [px, py, pz] of peaPositions) {
      const pea = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.115, 18, 16)), peaMat);
      pea.position.set(px, py, pz);
      pea.castShadow = true;
      peaGroup.add(pea);
    }
    bobs.push({ group: peaGroup, baseY: 0.35, amp: 0.04, speed: 1.4, phase: 3.1, baseRotZ: 0 });

    // 6) Layered Leafy Greens (ExtrudeGeometry curved leaves)
    const leavesGroup = new THREE.Group();
    leavesGroup.position.set(0.08, 0.62, -0.06);
    heroGroup.add(leavesGroup);
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(0.28, 0.16, 0.3, 0.55, 0, 0.78);
    leafShape.bezierCurveTo(-0.3, 0.55, -0.28, 0.16, 0, 0);
    const leafGeo = trackGeo(
      new THREE.ExtrudeGeometry(leafShape, {
        depth: 0.025,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 2,
      })
    );
    const leafMat1 = trackMat(new THREE.MeshPhysicalMaterial({ color: 0x4f9d28, roughness: 0.32, clearcoat: 0.45 }));
    const leafMat2 = trackMat(new THREE.MeshPhysicalMaterial({ color: 0x6ec138, roughness: 0.28, clearcoat: 0.5 }));
    const leafConfigs = [
      { x: -0.18, y: 0.02, z: -0.06, rx: -0.22, ry: 0.2, rz: 0.35, mat: leafMat1 },
      { x: 0.18, y: 0.05, z: -0.04, rx: -0.18, ry: -0.25, rz: -0.32, mat: leafMat2 },
      { x: 0.0, y: 0.14, z: -0.15, rx: -0.28, ry: 0.0, rz: 0.05, mat: leafMat1 },
    ];
    for (const lc of leafConfigs) {
      const m = new THREE.Mesh(leafGeo, lc.mat);
      m.position.set(lc.x, lc.y, lc.z);
      m.rotation.set(lc.rx, lc.ry, lc.rz);
      m.castShadow = true;
      leavesGroup.add(m);
    }
    bobs.push({ group: leavesGroup, baseY: 0.62, amp: 0.05, speed: 1.35, phase: 4.0, baseRotZ: 0 });

    // 7) Golden Corn Cob on right side
    const cornGroup = new THREE.Group();
    cornGroup.position.set(0.68, 0.52, 0.14);
    cornGroup.rotation.set(0.18, 0.1, -0.42);
    heroGroup.add(cornGroup);

    const cornMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xffc53d,
        roughness: 0.28,
        clearcoat: 0.7,
      })
    );
    const cornBody = new THREE.Mesh(trackGeo(new THREE.CapsuleGeometry(0.14, 0.46, 8, 16)), cornMat);
    cornBody.castShadow = true;
    cornGroup.add(cornBody);

    const husk1 = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.16, 0.45, 10)), frondMat);
    husk1.position.set(-0.08, -0.24, 0.06);
    husk1.rotation.z = 0.25;
    cornGroup.add(husk1);
    const husk2 = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.16, 0.42, 10)), leafMat2);
    husk2.position.set(0.08, -0.24, -0.04);
    husk2.rotation.z = -0.25;
    cornGroup.add(husk2);
    bobs.push({ group: cornGroup, baseY: 0.52, amp: 0.055, speed: 1.6, phase: 5.1, baseRotZ: -0.42 });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 390;
      const h = container.clientHeight || 380;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(0.05, clock.getDelta());
      const elapsed = clock.getElapsedTime();

      // Gentle bobbing on each vegetable
      for (const item of bobs) {
        item.group.position.y = item.baseY + Math.sin(elapsed * item.speed + item.phase) * item.amp;
        item.group.rotation.z = item.baseRotZ + Math.sin(elapsed * item.speed * 0.7 + item.phase) * 0.04;
      }

      // Smooth pointer & scroll parallax on the hero group
      const targetRotY = pointerRef.current.x * 0.16 + Math.sin(elapsed * 0.55) * 0.06;
      const targetRotX = pointerRef.current.y * 0.08 + scrollRef.current * 0.12;
      heroGroup.rotation.y = THREE.MathUtils.damp(heroGroup.rotation.y, targetRotY, 4, delta);
      heroGroup.rotation.x = THREE.MathUtils.damp(heroGroup.rotation.x, targetRotX, 4, delta);
      heroGroup.position.y = THREE.MathUtils.damp(heroGroup.position.y, -scrollRef.current * 0.35, 5, delta);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[330px] sm:h-[390px] flex items-center justify-center select-none overflow-visible">
      {/* Three.js Canvas Mount */}
      {!webglFailed ? (
        <div ref={mountRef} className="w-full h-full relative z-10" />
      ) : (
        /* Graceful 2D Illustrated Fallback if WebGL unavailable */
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="w-56 h-44 rounded-3xl bg-[#C98E59] shadow-2xl flex items-center justify-center border-t-8 border-[#DFAA76]">
            <span className="font-display font-bold text-[#5C3A1B] text-lg tracking-wide">FRESH MARKET</span>
          </div>
        </div>
      )}

      {/* Dotted curved SVG connectors from glass pills into vegetables */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full z-20"
        viewBox="0 0 390 360"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M 110 82 Q 152 96 168 148"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        <path d="M 162 142 L 168 150 L 175 141" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        <path
          d="M 284 74 Q 245 92 232 146"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        <circle cx="232" cy="146" r="3.5" fill="#FFFFFF" />

        <path
          d="M 275 262 Q 248 228 224 218"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        <circle cx="224" cy="218" r="3.5" fill="#FFFFFF" />
      </svg>

      {/* Floating 3D-style Glass Nutrient Pills (solid/translucent rgba without backdrop-filter over WebGL) */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute top-11 left-4 sm:left-10 z-30 flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 shadow-[0_10px_24px_rgba(28,43,26,0.16)] border border-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF0EC] text-[#E4572E]">
          <Pill className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-bold text-[#1C2B1A] whitespace-nowrap">Vitamin B3</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="pointer-events-none absolute top-9 right-4 sm:right-10 z-30 flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 shadow-[0_10px_24px_rgba(28,43,26,0.16)] border border-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF7DF] text-[#D98200]">
          <Flame className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-bold text-[#1C2B1A] whitespace-nowrap">Protein 32g</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
        className="pointer-events-none absolute bottom-10 right-6 sm:right-14 z-30 flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 shadow-[0_10px_24px_rgba(28,43,26,0.16)] border border-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8F4FD] text-[#2B82C9]">
          <Droplets className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-bold text-[#1C2B1A] whitespace-nowrap">Minerale</span>
      </motion.div>
    </div>
  );
};
