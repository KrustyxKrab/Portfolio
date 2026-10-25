const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/convert-model.cjs <input.fbx>');
  process.exit(1);
}

const base = process.env.MODEL_DEV_URL || 'http://localhost:4321';
const outputDir = path.resolve(process.cwd(), 'public/models/macintosh');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    const input = fs.readFileSync(path.resolve(inputPath)).toString('base64');
    const result = await page.evaluate(async (data) => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      const { FBXLoader } = await import('/node_modules/three/examples/jsm/loaders/FBXLoader.js');
      const { GLTFExporter } = await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js');
      const { mergeVertices } = await import('/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js');

      const manager = new THREE.LoadingManager();
      let done;
      const loaded = new Promise((resolve) => (done = resolve));
      manager.onLoad = done;
      const model = new FBXLoader(manager).parse(
        Uint8Array.from(atob(data), (c) => c.charCodeAt(0)).buffer,
        '/models/macintosh/textures/',
      );
      await Promise.race([loaded, new Promise((resolve) => setTimeout(resolve, 3000))]);
      model.updateMatrixWorld(true);

      const group = new THREE.Group();
      group.name = 'Macintosh128K';
      const box = new THREE.Box3().setFromObject(model.getObjectByName('Computer'));
      const center = box.getCenter(new THREE.Vector3());
      const scale = 10 / (box.max.y - box.min.y);
      const metadata = {
        originalBounds: { min: box.min.toArray(), max: box.max.toArray() },
        scale,
        screen: null,
        materials: [],
      };

      // Keep the complete supplied set, including the individual keycaps,
      // keyboard, mouse and cables. Normalize everything against the monitor
      // so the calibrated HTML display coordinates stay unchanged.
      const meshes = [];
      const materialCache = new Map();
      model.traverse((object) => { if (object.isMesh) meshes.push(object); });
      for (const source of meshes) {
        const name = source.name || 'Keycap';
        const geometry = source.geometry.clone();
        geometry.applyMatrix4(source.matrixWorld);
        geometry.translate(-center.x, -center.y, -center.z);
        geometry.scale(scale, scale, scale);
        geometry.deleteAttribute('color');
        const materials = (Array.isArray(source.material) ? source.material : [source.material]).map((material) => {
          const key = `${material.name}:${material.map?.uuid || ''}:${material.color.getHex()}`;
          if (materialCache.has(key)) return materialCache.get(key);
          metadata.materials.push({ name: material.name });
          const converted = new THREE.MeshStandardMaterial({
            name: material.name,
            map: material.map || null,
            color: material.color,
            roughness: /Screen/.test(material.name) ? 0.14 : /Metal/.test(material.name) ? 0.32 : 0.65,
            metalness: /Metal/.test(material.name) ? 0.65 : 0,
          });
          materialCache.set(key, converted);
          return converted;
        });

        if (name === 'Computer') {
          const positions = geometry.attributes.position;
          const screenIndex = materials.findIndex((material) => material.name === 'Screen');
          const points = [];
          for (const geometryGroup of geometry.groups) {
            if (geometryGroup.materialIndex !== screenIndex) continue;
            for (let i = geometryGroup.start; i < geometryGroup.start + geometryGroup.count; i++) {
              const index = geometry.index ? geometry.index.getX(i) : i;
              points.push(new THREE.Vector3().fromBufferAttribute(positions, index));
            }
          }
          const screenBounds = new THREE.Box3().setFromPoints(points);
          metadata.screen = { min: screenBounds.min.toArray(), max: screenBounds.max.toArray() };
        }

        const welded = mergeVertices(geometry, 1e-5);
        const object = new THREE.Mesh(welded, materials.length === 1 ? materials[0] : materials);
        object.name = name;
        group.add(object);
      }
      const assemblyBounds = new THREE.Box3().setFromObject(group);
      metadata.assembly = { min: assemblyBounds.min.toArray(), max: assemblyBounds.max.toArray() };
      metadata.meshes = meshes.length;

      const glb = await new GLTFExporter().parseAsync(group, {
        binary: true,
        maxTextureSize: 1024,
        onlyVisible: true,
      });
      const bytes = new Uint8Array(glb);
      let text = '';
      for (let i = 0; i < bytes.length; i += 32768) {
        text += String.fromCharCode(...bytes.subarray(i, i + 32768));
      }
      return { base64: btoa(text), metadata };
    }, input);

    fs.mkdirSync(outputDir, { recursive: true });
    const glb = Buffer.from(result.base64, 'base64');
    fs.writeFileSync(path.join(outputDir, 'computer.glb'), glb);
    fs.writeFileSync(path.join(outputDir, 'display.json'), JSON.stringify(result.metadata, null, 2));
    console.log(JSON.stringify({ glbBytes: glb.byteLength, displayBounds: result.metadata.screen }, null, 2));
  } finally {
    if (browser) await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
