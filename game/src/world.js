// The map: "Foundry Yard", an original 44 x 28 m decommissioned foundry.
// Three lanes — Long A (west), Mid (centre, through the furnace hall) and
// Short B (east) — join two bomb sites. Every box is a collider for players
// and bots and a surface a bullet stops on. Procedural canvas textures
// (no external assets) give the floor/walls detail at a modest cost:
// 512px textures, one 2048px shadow map, a handful of point lights.
import * as THREE from 'three';
import { PALETTE } from './palette.js';

export const SITES = {
  A: { x: -17, z: -10, label: 'A' },
  B: { x: 17, z: -10, label: 'B' },
};
export const SPAWNS = {
  vanguard: [[-14, 11], [-8, 12], [-2, 12], [4, 12], [10, 11], [16, 12]],
  cinder: [[-16, -11], [-8, -12], [0, -12], [8, -12], [16, -11], [-20, -6]],
};
// Waypoint graph bots walk: spawn -> mid/lanes -> sites. Edges are implicit:
// each node lists its neighbours by index.
export const WAYPOINTS = [
  { x: -14, z: 11 }, { x: -8, z: 12 }, { x: -2, z: 12 }, { x: 4, z: 12 }, { x: 10, z: 11 },
  { x: -16, z: 0 }, { x: -8, z: 2 }, { x: 0, z: 2 }, { x: 8, z: 2 }, { x: 16, z: 0 },
  { x: -17, z: -10 }, { x: 17, z: -10 },
  { x: -16, z: -11 }, { x: -8, z: -12 }, { x: 0, z: -12 }, { x: 8, z: -12 }, { x: 16, z: -11 },
  { x: 0, z: -6 }, { x: -12, z: -6 }, { x: 12, z: -6 },
];
export const ROUTES = {
  A: [5, 18, 10],
  B: [9, 19, 11],
  MID: [7, 17, 14],
};

// Deterministic pseudo-random so the same seed renders the same map.
function srand(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(w, h, draw, repeatX = 1, repeatY = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 4; // modest: sharper at grazing angles, cheap on GPU
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function floorTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    const r = srand(11);
    g.fillStyle = '#2e241a'; g.fillRect(0, 0, w, h);
    // Concrete slabs.
    g.strokeStyle = '#1d150e'; g.lineWidth = 3;
    for (let i = 0; i <= 4; i += 1) {
      g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke();
      g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke();
    }
    // Speckle, stains and faint tyre / drag marks.
    for (let i = 0; i < 2600; i += 1) {
      g.fillStyle = r() > 0.5 ? 'rgba(0,0,0,0.16)' : 'rgba(240,200,140,0.07)';
      g.fillRect(r() * w, r() * h, 2, 2);
    }
    for (let i = 0; i < 12; i += 1) {
      g.fillStyle = 'rgba(0,0,0,0.10)';
      g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = 'rgba(240,168,48,0.55)'; g.lineWidth = 5; g.setLineDash([26, 18]);
    g.beginPath(); g.moveTo(0, 256); g.lineTo(w, 256); g.stroke();
    g.setLineDash([]);
  }, 6, 4);
}

function wallTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    const r = srand(23);
    g.fillStyle = '#3a2c1e'; g.fillRect(0, 0, w, h);
    // Corrugated metal panels.
    for (let x = 0; x < w; x += 32) {
      g.fillStyle = x % 64 === 0 ? 'rgba(255,220,160,0.06)' : 'rgba(0,0,0,0.14)';
      g.fillRect(x, 0, 16, h);
    }
    g.strokeStyle = '#241a10'; g.lineWidth = 3;
    for (let y = 0; y <= h; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    // Rivets.
    g.fillStyle = '#191008';
    for (let y = 64; y < h; y += 128) for (let x = 16; x < w; x += 32) { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
    // Rust streaks running down from the top.
    for (let i = 0; i < 26; i += 1) {
      const x = r() * w; const len = 40 + r() * 160;
      const grad = g.createLinearGradient(x, 0, x, len);
      grad.addColorStop(0, 'rgba(120,60,20,0.35)'); grad.addColorStop(1, 'rgba(120,60,20,0)');
      g.fillStyle = grad; g.fillRect(x, 0, 5 + r() * 8, len);
    }
    // Hazard stripe along the base.
    g.fillStyle = '#c8932a';
    for (let x = 0; x < w; x += 32) {
      g.save(); g.translate(x, h - 28); g.rotate(-0.5); g.fillRect(0, 0, 16, 56); g.restore();
    }
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, h - 28, w, 6);
  }, 8, 1);
}

function crateTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    const r = srand(37);
    g.fillStyle = '#5d4a33'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2e2113'; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
    for (let i = 0; i < 500; i += 1) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(r() * w, r() * h, 2, 2); }
    g.fillStyle = 'rgba(242,234,217,0.85)'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center';
    g.fillText('EMBER', w / 2, h / 2 - 6); g.font = 'bold 20px sans-serif'; g.fillText('FOUNDRY', w / 2, h / 2 + 24);
  });
}

function posterTexture(lines, bg, fg, accent) {
  return canvasTexture(256, 384, (g, w, h) => {
    const r = srand(lines.join('').length * 7 + 5);
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = accent; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14);
    g.fillStyle = fg; g.textAlign = 'center';
    g.font = 'bold 44px sans-serif';
    lines.forEach((line, i) => g.fillText(line, w / 2, 90 + i * 56));
    g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(14, 14, w - 28, h - 28);
    for (let i = 0; i < 300; i += 1) { g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(r() * w, r() * h, 3, 3); }
  });
}

export function createWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const materials = {};
  for (const name of Object.keys(PALETTE)) {
    materials[name] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(PALETTE[name]),
      roughness: name === 'accent' || name === 'ink' ? 0.55 : 0.92,
      metalness: 0.03,
    });
  }
  // Textured hero materials: floor, walls and crates read as HD at a glance.
  materials.canvas = new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.95, metalness: 0.02 });
  materials.surface = new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 0.85, metalness: 0.15 });
  materials.hairline = new THREE.MeshStandardMaterial({ map: crateTexture(), roughness: 0.9, metalness: 0.05 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x4a4f55, roughness: 0.45, metalness: 0.7 });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 0.5, metalness: 0.6 });
  const barrelTeal = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.teal), roughness: 0.55, metalness: 0.3 });
  const barrelEmber = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.ember), roughness: 0.55, metalness: 0.3 });

  const colliders = [];
  const shootables = [];
  function box(w, h, d, x, y, z, material, collide = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), materials[material]);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (collide) colliders.push(new THREE.Box3().setFromObject(mesh));
    shootables.push(mesh);
    return mesh;
  }
  function prop(mesh, collide = false) {
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
    if (collide) colliders.push(new THREE.Box3().setFromObject(mesh));
    shootables.push(mesh);
    return mesh;
  }
  function poster(lines, bg, fg, accent, w, h, x, y, z, rotY) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: posterTexture(lines, bg, fg, accent), roughness: 0.85 }),
    );
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    group.add(mesh); // flat on a wall: decor only, not a collider/shootable
    return mesh;
  }
  function siteMarker(site, material) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 2.0, 32),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE[material]), side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(site.x, 0.02, site.z);
    group.add(ring);
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2.2, 0.3),
      materials[material],
    );
    post.position.set(site.x + 2.4, 1.1, site.z - 2.4);
    post.castShadow = true;
    group.add(post);
  }

  // Floor and outer walls, 44 x 28 m, 5 m high, open sky.
  box(44.4, 0.4, 28.4, 0, -0.2, 0, 'canvas');
  box(0.4, 5, 28.4, -22.2, 2.5, 0, 'surface');
  box(0.4, 5, 28.4, 22.2, 2.5, 0, 'surface');
  box(44.4, 5, 0.4, 0, 2.5, -14.2, 'surface');
  box(44.4, 5, 0.4, 0, 2.5, 14.2, 'surface');
  // Furnace hall: the mid pillar and its two flanking blocks split Mid in two.
  box(2.2, 4.4, 2.2, 0, 2.2, -2, 'hairline');
  box(3.4, 1.2, 1.4, -5.4, 0.6, -2, 'hairline');
  box(3.4, 1.2, 1.4, 5.4, 0.6, -2, 'hairline');
  // Long A: a crate wall with a gap, and a crouch crate at the corner.
  box(1.2, 2.6, 6.0, -13, 1.3, -4, 'surface');
  box(1.6, 0.8, 1.6, -16.5, 0.4, -5.5, 'hairline');
  box(2.2, 1.1, 1.2, -10, 0.55, 6, 'hairline');
  // Short B: stacked crates make a boostable sightline over the site.
  box(1.6, 0.8, 1.6, 14, 0.4, -5, 'hairline');
  box(1.6, 0.8, 1.6, 14, 1.2, -5, 'hairline');
  box(2.4, 1.1, 1.2, 10, 0.55, 6, 'hairline');
  // Spawn cover and mid connectors.
  box(2.0, 1.0, 1.0, -6, 0.5, 8, 'hairline');
  box(2.0, 1.0, 1.0, 6, 0.5, 8, 'hairline');
  box(1.2, 2.2, 1.2, -4, 1.1, -8, 'surface');
  box(1.2, 2.2, 1.2, 4, 1.1, -8, 'surface');
  box(6.0, 0.5, 2.4, 0, 0.25, -11.5, 'surface');
  siteMarker(SITES.A, 'teal');
  siteMarker(SITES.B, 'ember');

  // ---- Wall decor: posters, signs and graffiti (flat, no collision) ----
  // North wall (behind the sites), facing south into the map.
  poster(['SITE', 'A'], '#123f3c', '#eafaf7', '#2ec4b6', 2.2, 3.2, -17, 2.6, -13.95, 0);
  poster(['SITE', 'B'], '#4a1c0e', '#ffe9dc', '#e4572e', 2.2, 3.2, 17, 2.6, -13.95, 0);
  poster(['DANGER', 'HOT', 'METAL'], '#1c1408', '#f0a830', '#e4572e', 2.0, 3.0, -6, 2.4, -13.95, 0);
  poster(['EMBER', 'LINE'], '#221a13', '#f2ead9', '#f0a830', 2.6, 3.8, 6, 2.8, -13.95, 0);
  // South wall (behind Vanguard spawn), facing north.
  poster(['FOUNDRY', 'YARD'], '#221a13', '#f2ead9', '#2ec4b6', 3.0, 2.2, 0, 3.0, 13.95, Math.PI);
  poster(['KEEP', 'OUT'], '#3d0f0f', '#ffd9c9', '#e4572e', 1.8, 2.6, -12, 2.4, 13.95, Math.PI);
  poster(['CINDER', 'CREW'], '#1c1408', '#f0a830', '#e4572e', 2.0, 2.8, 12, 2.4, 13.95, Math.PI);
  // West / east walls.
  poster(['LONG', 'A'], '#123f3c', '#eafaf7', '#2ec4b6', 2.0, 3.0, -21.95, 2.6, -4, Math.PI / 2);
  poster(['SHORT', 'B'], '#4a1c0e', '#ffe9dc', '#e4572e', 2.0, 3.0, 21.95, 2.6, -4, -Math.PI / 2);
  poster(['MID'], '#221a13', '#f0a830', '#2ec4b6', 1.6, 2.4, -21.95, 2.4, 6, Math.PI / 2);

  // ---- Busy yard: pipes, barrels, crates, lamps (edges/corners only,
  // so lanes and bot routes stay clear) ----
  function pipe(x, y, z, len, rotZ = 0, rotX = 0) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, len, 12), pipeMat);
    m.position.set(x, y, z); m.rotation.z = rotZ; m.rotation.x = rotX;
    prop(m);
  }
  pipe(0, 4.6, -13.9, 44, Math.PI / 2, 0); // north wall pipe run (along X)
  pipe(0, 4.6, 13.9, 44, Math.PI / 2, 0); // south wall pipe run (along X)
  pipe(-21.9, 4.4, 0, 28, 0, Math.PI / 2); // west wall pipe run (along Z)
  pipe(21.9, 4.4, 0, 28, 0, Math.PI / 2); // east wall pipe run (along Z)
  function barrel(x, z, mat) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.1, 16), mat);
    m.position.set(x, 0.55, z);
    prop(m, true);
  }
  barrel(-20.5, 8, barrelTeal); barrel(-19.6, 8.6, barrelEmber); barrel(-20.5, -12.5, barrelEmber);
  barrel(20.5, 8, barrelEmber); barrel(19.6, 8.6, barrelTeal); barrel(20.5, -12.5, barrelTeal);
  barrel(-20.5, 2, barrelEmber); barrel(20.5, 2, barrelTeal);
  // Extra low crates tucked against walls.
  box(1.4, 0.7, 1.4, -19.5, 0.35, -8, 'hairline');
  box(1.4, 0.7, 1.4, 19.5, 0.35, -8, 'hairline');
  box(1.4, 0.7, 1.4, -19.5, 0.35, 12, 'hairline');
  box(1.4, 0.7, 1.4, 19.5, 0.35, 12, 'hairline');
  // Furnace chimney in the north-west corner + a glowing furnace mouth.
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 7, 14), metalMat);
  chimney.position.set(-20, 3.5, -12); prop(chimney, true);
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.0, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x1a0d05, emissive: new THREE.Color('#ff7a1a'), emissiveIntensity: 2.2 }),
  );
  glow.position.set(0, 0.7, -3.15); group.add(glow);
  // Hanging lamps: emissive shades over Mid and both sites.
  function lamp(x, y, z, color) {
    const shadeMesh = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.4, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x222222, emissive: new THREE.Color(color), emissiveIntensity: 0.9, side: THREE.DoubleSide }));
    shadeMesh.position.set(x, y, z); group.add(shadeMesh);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color) }));
    bulb.position.set(x, y - 0.2, z); group.add(bulb);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 5 - y, 6), metalMat);
    cord.position.set(x, (5 + y) / 2, z); group.add(cord);
  }
  lamp(0, 3.6, -2, '#ffb35c'); lamp(-17, 3.6, -10, '#2ec4b6'); lamp(17, 3.6, -10, '#e4572e');
  // Dust motes drifting in the light — cheap atmosphere, no gameplay effect.
  const dustCount = 260;
  const dustPos = new Float32Array(dustCount * 3);
  const dr = srand(99);
  for (let i = 0; i < dustCount; i += 1) {
    dustPos[i * 3] = (dr() - 0.5) * 42;
    dustPos[i * 3 + 1] = 0.4 + dr() * 4.2;
    dustPos[i * 3 + 2] = (dr() - 0.5) * 27;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0xffd9a0, size: 0.07, transparent: true, opacity: 0.45, sizeAttenuation: true,
  }));
  group.add(dust);

  // Dusk light: a low amber key, a cool teal fill, and a warm sky gradient.
  scene.add(new THREE.HemisphereLight(new THREE.Color('#f0c98a'), new THREE.Color(PALETTE.canvas), 1.7));
  scene.add(new THREE.AmbientLight(new THREE.Color('#ffe0b3'), 0.55));
  const key = new THREE.DirectionalLight(new THREE.Color('#ffb35c'), 3.0);
  key.position.set(14, 18, 10);
  key.target.position.set(0, 0, -3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -26;
  key.shadow.camera.right = 26;
  key.shadow.camera.top = 20;
  key.shadow.camera.bottom = -20;
  key.shadow.camera.far = 60;
  key.shadow.bias = -0.0006;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(new THREE.Color(PALETTE.teal), 0.8);
  fill.position.set(-12, 10, 12);
  scene.add(fill);
  // Warm furnace glow + cool site lights (3 point lights, modest cost).
  const furnaceLight = new THREE.PointLight(new THREE.Color('#ff7a1a'), 30, 14, 1.8);
  furnaceLight.position.set(0, 1.2, -3.4);
  scene.add(furnaceLight);
  const siteALight = new THREE.PointLight(new THREE.Color(PALETTE.teal), 14, 10, 1.8);
  siteALight.position.set(-17, 3.2, -10);
  scene.add(siteALight);
  const siteBLight = new THREE.PointLight(new THREE.Color(PALETTE.ember), 14, 10, 1.8);
  siteBLight.position.set(17, 3.2, -10);
  scene.add(siteBLight);

  return { colliders, shootables, group };
}
