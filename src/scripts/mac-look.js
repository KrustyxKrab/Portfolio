import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Photographic look for the static Macintosh: neutral tone mapping, warm key light with a
// baked (static) soft shadow map, shadow-catcher ground and a baked contact-AO decal.
const LOOK = {
  exposure: 1.18,
  envIntensity: .7,
  keyColor: 0xffe0b8,
  keyIntensity: 2.8,
  keyDirection: [-.5, .95, .7],   // from the target towards the light (left, high, front)
  fillColor: 0xdfe8f2,
  fillIntensity: .22,
  hemiIntensity: .35,
  shadowMap: 2048,
  shadowRadius: 5,
  shadowOpacity: .3,
  shadowColor: 0x33220f,
  aoResolution: 512,
  aoMargin: 3,
  aoOpacity: .8,
};

const ROUGHNESS = {
  Computer: .56, Lightplastic: .5, Whiteplastic: .5, Keys: .5,
  Darkplastic: .62, Blackplastic: .7, Metal: .36, Screen: .12,
};

function tuneMaterials(model) {
  const seen = new Set();
  model.traverse(object => {
    if (!object.isMesh) return;
    const isScreen = /Screen/.test(object.material?.name ?? '');
    object.castShadow = !isScreen;
    object.receiveShadow = true;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) {
      if (seen.has(material)) continue;
      seen.add(material);
      material.roughness = ROUGHNESS[material.name] ?? .6;
      material.envMapIntensity = isScreen ? .5 : 1;
      if (material.name === 'Metal') material.metalness = .55;
      if (/Keys|Darkplastic/.test(material.name)) material.color.multiplyScalar(1.2);
    }
  });
}

function fitShadowCamera(light, bounds, groundY) {
  const dir = light.position.clone().sub(light.target.position).normalize();
  const points = [];
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const p = new THREE.Vector3(x, y, z);
        points.push(p);
        // Where this corner's shadow lands on the ground.
        const t = (p.y - groundY) / dir.y;
        points.push(p.clone().addScaledVector(dir, -t));
      }
  const camera = light.shadow.camera;
  camera.position.copy(light.position);
  camera.lookAt(light.target.position);
  camera.updateMatrixWorld(true);
  const inverse = camera.matrixWorldInverse;
  const box = new THREE.Box3();
  for (const p of points) box.expandByPoint(p.clone().applyMatrix4(inverse));
  const pad = .4;
  camera.left = box.min.x - pad; camera.right = box.max.x + pad;
  camera.bottom = box.min.y - pad; camera.top = box.max.y + pad;
  camera.near = Math.max(.1, -box.max.z - 1); camera.far = -box.min.z + 1;
  camera.updateProjectionMatrix();
}

function boxBlur(data, n, radius) {
  const tmp = new Float32Array(data.length);
  const window = radius * 2 + 1;
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < n; y++) {
      let sum = 0;
      for (let x = -radius; x <= radius; x++) sum += data[y * n + Math.min(n - 1, Math.max(0, x))];
      for (let x = 0; x < n; x++) {
        tmp[y * n + x] = sum / window;
        sum += data[y * n + Math.min(n - 1, x + radius + 1)] - data[y * n + Math.max(0, x - radius)];
      }
    }
    for (let x = 0; x < n; x++) {
      let sum = 0;
      for (let y = -radius; y <= radius; y++) sum += tmp[Math.min(n - 1, Math.max(0, y)) * n + x];
      for (let y = 0; y < n; y++) {
        data[y * n + x] = sum / window;
        sum += tmp[Math.min(n - 1, y + radius + 1) * n + x] - tmp[Math.max(0, y - radius) * n + x];
      }
    }
  }
}

// Bakes height-above-ground seen from below into a soft ambient-occlusion decal.
function bakeContactAO(renderer, scene, bounds) {
  const n = LOOK.aoResolution;
  const margin = LOOK.aoMargin;
  const minX = bounds.min.x - margin, maxX = bounds.max.x + margin;
  const minZ = bounds.min.z - margin, maxZ = bounds.max.z + margin;
  const reach = 4;
  const camera = new THREE.OrthographicCamera(minX, maxX, maxZ, minZ, .01, reach + 2);
  camera.position.set(0, bounds.min.y - 1, 0);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, bounds.max.y, 0);
  camera.position.x = 0; camera.updateMatrixWorld(true);
  const target = new THREE.WebGLRenderTarget(n, n, { depthBuffer: true });
  const override = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { floorY: { value: bounds.min.y }, reach: { value: reach } },
    vertexShader: 'varying float vY;void main(){vY=(modelMatrix*vec4(position,1.)).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform float floorY;uniform float reach;varying float vY;void main(){gl_FragColor=vec4(clamp((vY-floorY)/reach,0.,1.),0.,0.,1.);}',
  });
  const previous = { target: renderer.getRenderTarget(), color: renderer.getClearColor(new THREE.Color()), alpha: renderer.getClearAlpha(), tone: renderer.toneMapping };
  const hidden = [];
  scene.traverse(o => { if (o.isLight && o.visible) { hidden.push(o); o.visible = false; } });
  renderer.setRenderTarget(target);
  renderer.setClearColor(0xff0000, 1); // red = 1 -> far above ground -> no occlusion
  renderer.clear();
  scene.overrideMaterial = override;
  renderer.render(scene, camera);
  scene.overrideMaterial = null;
  hidden.forEach(o => { o.visible = true; });
  const pixels = new Uint8Array(n * n * 4);
  renderer.readRenderTargetPixels(target, 0, 0, n, n, pixels);
  renderer.setRenderTarget(previous.target);
  renderer.setClearColor(previous.color, previous.alpha);
  target.dispose(); override.dispose();

  const pxSize = (maxX - minX) / n;
  const tight = new Float32Array(n * n), wide = new Float32Array(n * n);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let i = 0; i < n * n; i++) {
    const h = pixels[i * 4] / 255 * reach;
    tight[i] = 1 - smooth(0, .35, h);
    wide[i] = 1 - smooth(0, 2.4, h);
  }
  boxBlur(tight, n, Math.max(1, Math.round(.14 / pxSize)));
  boxBlur(wide, n, Math.max(1, Math.round(.7 / pxSize)));
  const rgba = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const src = y * n + x, dst = (n - 1 - y) * n + x; // flip rows: image +z at top vs. plane v
    const a = Math.min(1, tight[src] * .75 + wide[src] * .55) * LOOK.aoOpacity;
    const o = dst * 4;
    rgba[o] = rgba[o + 1] = rgba[o + 2] = 255; rgba[o + 3] = Math.round(a * 255);
  }
  const texture = new THREE.DataTexture(rgba, n, n, THREE.RGBAFormat);
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false; texture.needsUpdate = true;
  return { texture, rect: { cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, w: maxX - minX, d: maxZ - minZ } };
}

export function applyLook({ renderer, scene, model, bounds }) {
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = LOOK.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = LOOK.envIntensity;
  room.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  pmrem.dispose();

  tuneMaterials(model);

  const center = bounds.getCenter(new THREE.Vector3());
  const groundY = bounds.min.y;
  const size = bounds.getSize(new THREE.Vector3());
  const key = new THREE.DirectionalLight(LOOK.keyColor, LOOK.keyIntensity);
  key.target.position.copy(center);
  key.position.copy(center).addScaledVector(new THREE.Vector3(...LOOK.keyDirection).normalize(), Math.max(size.x, size.y, size.z) * 1.5);
  key.castShadow = true;
  key.shadow.mapSize.set(LOOK.shadowMap, LOOK.shadowMap);
  key.shadow.radius = LOOK.shadowRadius;
  key.shadow.bias = -.0003;
  key.shadow.normalBias = .03;
  scene.add(key, key.target);
  scene.updateMatrixWorld(true);
  fitShadowCamera(key, bounds, groundY);

  const fill = new THREE.DirectionalLight(LOOK.fillColor, LOOK.fillIntensity);
  fill.position.set(7, 3, 8);
  const hemi = new THREE.HemisphereLight(0xfff3e2, 0x6d614f, LOOK.hemiIntensity);
  scene.add(fill, hemi);

  const contact = bakeContactAO(renderer, scene, bounds);
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(contact.rect.w, contact.rect.d),
    new THREE.MeshBasicMaterial({ map: contact.texture, color: LOOK.shadowColor, transparent: true, depthWrite: false, toneMapped: false }));
  decal.rotation.x = -Math.PI / 2;
  decal.position.set(contact.rect.cx, groundY + .004, contact.rect.cz);
  decal.renderOrder = 1;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(contact.rect.w * 1.4, contact.rect.d * 1.4),
    new THREE.ShadowMaterial({ color: LOOK.shadowColor, opacity: LOOK.shadowOpacity, depthWrite: false }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(contact.rect.cx, groundY, contact.rect.cz);
  ground.receiveShadow = true;
  ground.renderOrder = 2;
  decal.renderOrder = 1;
  scene.add(ground, decal);

  renderer.shadowMap.needsUpdate = true;
  const onRestored = () => { renderer.shadowMap.needsUpdate = true; };
  renderer.domElement.addEventListener('webglcontextrestored', onRestored);

  return {
    dispose() {
      renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
      scene.remove(key, key.target, fill, hemi, ground, decal);
      key.shadow.dispose(); key.dispose(); fill.dispose(); hemi.dispose();
      for (const mesh of [ground, decal]) { mesh.geometry.dispose(); mesh.material.dispose(); }
      contact.texture.dispose();
      scene.environment = null;
      environment.dispose();
    },
  };
}
