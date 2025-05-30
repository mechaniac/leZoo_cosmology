// Import necessary modules
import * as THREE from "https://cdn.skypack.dev/three@0.133.1";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/loaders/DRACOLoader.js';

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Set camera position
camera.position.set(0, 75, 250);
camera.lookAt(0, 0, 0);

// Adding Light
const ambientLight = new THREE.AmbientLight(0x79b6db, 0.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xf0e7c4, 2);
directionalLight.position.set(100, 100, 100);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.left = -80;
directionalLight.shadow.camera.right = 80;
directionalLight.shadow.camera.top = 80;
directionalLight.shadow.camera.bottom = -80;
directionalLight.shadow.camera.near = 50;
directionalLight.shadow.camera.far = 400;
scene.add(directionalLight);

// Set the background image using TextureLoader
const textureLoader = new THREE.TextureLoader();
textureLoader.load('images/background.webp', (texture) => {
    scene.background = texture;
});

const envTexture = new THREE.CubeTextureLoader()
    .setPath('./images/')
    .load([
        'sky_side.jpg', 'sky_side.jpg', 
        'sky_top.jpg', 'sky_bottom.jpg', 
        'sky_side.jpg', 'sky_side.jpg' 
    ]);

scene.environment = envTexture;
scene.background = envTexture;

// Create a group to hold all models
const modelGroup = new THREE.Group();
scene.add(modelGroup);

// Load model function
function loadModel(
    path,
    materialSettings = { metalness: 0.5, roughness: 0.5, transparent: false, opacity: 1 },
    aoMapPath = null,
    rotationSpeed = 0,
    maps = {}
) {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.133.1/examples/js/libs/draco/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(
        path,
        (gltf) => {
            const aoMapTexture = aoMapPath ? textureLoader.load(aoMapPath) : null;
            const normalMapTexture = maps.normalMap ? textureLoader.load(maps.normalMap) : null;
            const bumpMapTexture = maps.bumpMap ? textureLoader.load(maps.bumpMap) : null;
            const specularMapTexture = maps.specularMap ? textureLoader.load(maps.specularMap) : null;

            traverseAndApplyMaterials(gltf.scene, materialSettings, aoMapTexture, {
                normalMap: normalMapTexture,
                bumpMap: bumpMapTexture,
                specularMap: specularMapTexture,
            });

            gltf.scene.userData.rotationSpeed = rotationSpeed;
            modelGroup.add(gltf.scene);
        },
        (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
        (error) => console.error('An error occurred while loading the model', error)
    );
}

// Traverse and apply materials
function traverseAndApplyMaterials(scene, settings, aoMapTexture, maps) {
    scene.traverse((child) => {
        if (child.isMesh && child.material && child.material.isMeshStandardMaterial) {
            applyMaterialSettings(child.material, settings, aoMapTexture, maps);

            if (aoMapTexture || maps.normalMap || maps.bumpMap || maps.specularMap) {
                if (!child.geometry.attributes.uv2) {
                    child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
                }
            }

            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}

// Apply material settings
function applyMaterialSettings(material, settings, aoMapTexture, maps) {
    material.metalness = settings.metalness !== undefined ? settings.metalness : 0.5;
    material.roughness = settings.roughness !== undefined ? settings.roughness : 0.5;
    material.transparent = settings.transparent || false;
    material.opacity = settings.opacity !== undefined ? settings.opacity : 1;

    if (aoMapTexture) {
        material.aoMap = aoMapTexture;
        material.aoMapIntensity = 1.0;
    }
    if (maps.normalMap) {
        material.normalMap = maps.normalMap;
        material.normalMapType = THREE.TangentSpaceNormalMap;
    }
    if (maps.bumpMap) {
        material.bumpMap = maps.bumpMap;
        material.bumpScale = 1;
    }

    if (material.opacity < 1) {
        material.transparent = true;
    }

    material.needsUpdate = true;
}

// Example model loads
loadModel('./models/cosmology_01/cosmology_01.gltf', { metalness: 0.3, roughness: 0.7 }, './models/textures/vines_01.jpg', 0, { normalMap: './models/textures/normal_01.jpg', bumpMap: './models/textures/bump_01.jpg' });
loadModel('./models/cosmology_01/upperClouds_01.gltf', { metalness: 0, roughness: 1, transparent: true, opacity: 0.3 }, './models/textures/vines_01.jpg', 0.01, { normalMap: './models/textures/normal_01.jpg' });
loadModel('./models/cosmology_01/clouds_01.gltf', { metalness: 0, roughness: 1, transparent: true, opacity: 0.3 }, './models/textures/vines_01.jpg', -0.01, { normalMap: './models/textures/normal_01.jpg' });
loadModel('./models/cosmology_01/spindle_01.gltf', { metalness: 1, roughness: .1, transparent: false, opacity: 0 }, './models/textures/vines_01.jpg', -0.01, { normalMap: './models/textures/normal_01.jpg' });
loadModel('./models/cosmology_01/brightShiny_01.gltf', { metalness: .4, roughness: .3, transparent: false, opacity: 0 }, './models/textures/vines_01.jpg', 0, { normalMap: './models/textures/normal_01.jpg' });
loadModel('./models/cosmology_01/bodhiTree_01.gltf', { metalness: .1, roughness: .4, transparent: false, opacity: 0.3 }, './models/textures/vines_01.jpg', 0, { normalMap: './models/textures/normal_01.jpg' });
loadModel('./models/cosmology_01/spaceship_01.gltf', { metalness: .7, roughness: .1, transparent: false, opacity: 0 }, './models/textures/vines_01.jpg', 0, { normalMap: './models/textures/normal_01.jpg' });
loadModel('./models/cosmology_01/houses_01.gltf', { metalness: 1, roughness: .1 }, './models/textures/vines_01.jpg');
loadModel('./models/cosmology_01/brightFlowers_01.gltf');
// loadModel('./models/cosmology_01/testcube.gltf');

modelGroup.rotation.y = THREE.MathUtils.degToRad(33);

// Rotation interaction variables
let isDragging = false;
let previousMouseX = 0;
let velocity = 0;
const easeFactor = 0.9999;

// Exposed parameters
const params = {
    easeFactor: 0.99,            // Closer to 1 = slower slowdown, so longer spin
    dragSensitivity: 0.005,      // Sensitivity of drag motion
    maxRotationSpeed: 0.2,      // Cap the maximum rotation speed
    minContinuousSpeed: 0.001    // Minimum rotation speed to keep it moving
};

// Helper to add unified event listeners
function addUnifiedEventListeners(target, events, handler) {
    events.forEach(event => target.addEventListener(event, handler, { passive: false }));
}

// Event listeners
addUnifiedEventListeners(document, ['mousedown', 'touchstart'], (e) => {
    isDragging = true;
    previousMouseX = e.touches ? e.touches[0].clientX : e.clientX;
});

addUnifiedEventListeners(document, ['mousemove', 'touchmove'], (e) => {
    if (isDragging) {
        const currentX = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaX = currentX - previousMouseX;
        velocity = deltaX * 0.005;
        modelGroup.rotation.y += velocity;
        previousMouseX = currentX;
    }
});

addUnifiedEventListeners(document, ['mouseup', 'touchend'], () => {
    isDragging = false;
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (!isDragging) {
        velocity *= params.easeFactor;

        // Prevent velocity from fully stopping
        if (Math.abs(velocity) < params.minContinuousSpeed) {
            // Maintain gentle rotation in the last direction
            velocity = (velocity >= 0 ? 1 : -1) * params.minContinuousSpeed;
        }

        // Cap velocity
        velocity = Math.max(Math.min(velocity, params.maxRotationSpeed), -params.maxRotationSpeed);

        modelGroup.rotation.y += velocity;
    }

    // Rotate individual models
    modelGroup.children.forEach(child => {
        if (child.userData.rotationSpeed) {
            child.rotation.y += child.userData.rotationSpeed;
        }
    });

    renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
