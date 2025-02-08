import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';

// 3D Text
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// For CSS3D if you still embed iframes or want them
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// Bloom Postprocessing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// ========== SCENE & CAMERA ==========
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 50);

// ========== RENDERERS ==========
// 1) WebGL renderer
const webGLRenderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});
webGLRenderer.setPixelRatio(window.devicePixelRatio);
webGLRenderer.setSize(window.innerWidth, window.innerHeight);

// 2) (Optional) CSS3D renderer
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
document.body.appendChild(cssRenderer.domElement);

// ========== POSTPROCESSING (Bloom) ==========
const composer = new EffectComposer(webGLRenderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2,  // bloom strength
  0.1,  // radius
  0.85  // threshold
);
composer.addPass(bloomPass);

// ========== LIGHTING ==========
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(20, 20, 20);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// ========== BACKGROUND TEXTURE ==========
const textureLoader = new THREE.TextureLoader();
textureLoader.load('/assets/galaxy.png', (texture) => {
  scene.background = texture; // starry/galaxy background
});

// ========== STARS ========== 
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 300; i++) {
  const x = THREE.MathUtils.randFloatSpread(200);
  const y = THREE.MathUtils.randFloatSpread(200);
  const z = THREE.MathUtils.randFloatSpread(200);
  starVertices.push(x, y, z);
}
starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starVertices, 3)
);
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// ========== PLANETS ========== 
const planets = [];
const planetData = [
  {
    name: 'Graphic Design',
    color: 0x00ff7f,
    position: [15, 10, -10],
    video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    name: 'Game Design',
    color: 0xff6347,
    position: [-20, -5, 10],
    video: 'https://www.youtube.com/watch?v=ApWQ_9zBjS0',
  },
  {
    name: '3D Modeling',
    color: 0x1e90ff,
    position: [25, -15, 5],
    video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    name: 'Video Editing',
    color: 0x9932cc,
    position: [-10, 20, -20],
    video: 'https://www.youtube.com/watch?v=ZXsQAXx_ao0',
  },
];

function createPlanet({ name, color, position, video }) {
  // Neon wireframe sphere
  const geom = new THREE.SphereGeometry(3, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    color,
    wireframe: true,
    emissive: color,
    emissiveIntensity: 0.4,
  });
  const planet = new THREE.Mesh(geom, mat);
  planet.position.set(...position);
  planet.userData = { name, color, video };
  scene.add(planet);
  planets.push(planet);
}

planetData.forEach(createPlanet);

// ========== LINES BETWEEN PLANETS ========== 
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
for (let i = 0; i < planets.length - 1; i++) {
  const pts = [
    planets[i].position.clone(),
    planets[i + 1].position.clone(),
  ];
  const lineGeom = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(lineGeom, lineMaterial);
  scene.add(line);
}

// ========== FONT LOADER FOR 3D TEXT ========== 
const fontLoader = new FontLoader();

// 1) Always show planet text with an outer glow
function displayPlanetText(planet) {
  fontLoader.load(
    '/assets/helvetiker_regular.typeface.json',
    (font) => {
      const textGeo = new TextGeometry(planet.userData.name, {
        font,
        size: 1.5,
        height: 0.2,
      });
      // Outer glow: color+emissive
      const textMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.4,
      });
      const textMesh = new THREE.Mesh(textGeo, textMat);

      // place text above the planet
      const textOffset = 5;
      textMesh.position.set(
        planet.position.x,
        planet.position.y + planet.geometry.parameters.radius + textOffset,
        planet.position.z
      );
      textMesh.lookAt(camera.position);
      textMesh.name = `${planet.userData.name}_text`;
      scene.add(textMesh);
    },
    undefined,
    (err) => {
      console.error('Error loading font:', err);
    }
  );
}

// 2) Big Title: "Milo Roban's Portfolio" **moved up** in the scene
function createPortfolioTitle() {
  fontLoader.load(
    '/assets/helvetiker_regular.typeface.json',
    (font) => {
      const titleGeo = new TextGeometry(`Milo Roban's Portfolio`, {
        font,
        size: 5,
        height: 0.5,
      });
      // Outer glow / neon effect
      const titleMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 1.0,
      });
      const titleMesh = new THREE.Mesh(titleGeo, titleMat);

      // Move it up so it's clearly above
      // Tweak if you want it even higher
      titleMesh.position.set(-20, 50, -40);
      titleMesh.lookAt(camera.position);
      titleMesh.name = 'miloPortfolioTitle';
      scene.add(titleMesh);
    },
    undefined,
    (err) => {
      console.error('Error loading font (portfolio title):', err);
    }
  );
}

function showAllPlanetText() {
  planets.forEach((planet) => {
    displayPlanetText(planet);
  });
}
showAllPlanetText();
createPortfolioTitle();

// ========== LINK REDIRECT ON CLICK ========== 
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);

  if (intersects.length > 0) {
    // Planet is clicked -> open planet.userData.video in new tab
    const planet = intersects[0].object;
    const link = planet.userData.video;
    if (link) {
      window.open(link, '_blank'); // open in a new tab
    }
  }
}

// HOVER highlight
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);

  if (intersects.length > 0) {
    intersects[0].object.material.color.set(0xff0000);
  } else {
    planets.forEach((p) => p.material.color.set(p.userData.color));
  }
}

// ========== ANIMATION LOOP ========== 
function animate() {
  requestAnimationFrame(animate);

  // Subtle rotation
  planets.forEach((planet) => {
    planet.rotation.y += 0.01;
  });
  stars.rotation.y += 0.0005;

  // 1) Render 3D with bloom
  composer.render();
  // 2) Render CSS3D if needed
  cssRenderer.render(scene, camera);
}
animate();

// ========== RESIZE HANDLER ========== 
window.addEventListener('resize', () => {
  webGLRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ========== EVENT LISTENERS ========== 
window.addEventListener('click', onMouseClick);
window.addEventListener('mousemove', onMouseMove);

// If you still have a reset button
document.getElementById('reset-button')?.addEventListener('click', () => {
  alert("No iframes to reset. We just open links on planet click!");
});
