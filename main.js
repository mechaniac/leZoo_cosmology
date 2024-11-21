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
textureLoader.load('images/background.jpg', (texture) => {
    scene.background = texture;
});

const envTexture = new THREE.CubeTextureLoader()
    .setPath('./images/') // Path to the skybox textures
    .load([
        'sky_side.jpg', 'sky_side.jpg', // Positive X, Negative X
        'sky_top.jpg', 'sky_bottom.jpg', // Positive Y, Negative Y
        'sky_side.jpg', 'sky_side.jpg'  // Positive Z, Negative Z
    ]);

scene.environment = envTexture; // Use the environment map for reflections
scene.background = envTexture;  // Set the background to match the skybox


// Create a group to hold all models
const modelGroup = new THREE.Group();
scene.add(modelGroup);





function loadModel(
    path,
    materialSettings = { metalness: 0.5, roughness: 0.5, transparent: false, opacity: 1 },
    aoMapPath = null,
    rotationSpeed = 0,
    maps = {} // Object to define additional maps (normalMap, bumpMap, specularMap)
) {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.133.1/examples/js/libs/draco/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(
        path,
        (gltf) => {
            // Load textures if paths are provided
            const aoMapTexture = aoMapPath ? textureLoader.load(aoMapPath) : null;
            const normalMapTexture = maps.normalMap ? textureLoader.load(maps.normalMap) : null;
            const bumpMapTexture = maps.bumpMap ? textureLoader.load(maps.bumpMap) : null;
            const specularMapTexture = maps.specularMap ? textureLoader.load(maps.specularMap) : null;

            // Apply material settings and assign maps
            traverseAndApplyMaterials(gltf.scene, materialSettings, aoMapTexture, {
                normalMap: normalMapTexture,
                bumpMap: bumpMapTexture,
                specularMap: specularMapTexture,
            });

            // Add the model to the group
            modelGroup.add(gltf.scene);

            // Apply rotation if rotationSpeed is provided
            if (rotationSpeed) {
                function animateRotation() {
                    requestAnimationFrame(animateRotation);
                    gltf.scene.rotation.y += rotationSpeed;
                }
                animateRotation();
            }
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('An error occurred while loading the model', error);
        }
    );
}

// Helper function: Traverse and apply materials
function traverseAndApplyMaterials(scene, settings, aoMapTexture, maps) {
    scene.traverse((child) => {
        if (child.isMesh && child.material && child.material.isMeshStandardMaterial) {
            applyMaterialSettings(child.material, settings, aoMapTexture, maps);

            // Ensure UV2 exists for aoMap, normalMap, bumpMap, and specularMap
            if (aoMapTexture || maps.normalMap || maps.bumpMap || maps.specularMap) {
                if (!child.geometry.attributes.uv2) {
                    child.geometry.setAttribute('uv2', child.geometry.attributes.uv); // Copy UV0 to UV2 if UV2 is missing
                }
            }

            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}

// Helper function: Apply material settings and maps
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
        material.normalMapType = THREE.TangentSpaceNormalMap; // Default normal map type
    }
    if (maps.bumpMap) {
        material.bumpMap = maps.bumpMap;
        material.bumpScale = 1; // Adjust bump intensity
    }

    if (material.opacity < 1) {
        material.transparent = true;
    }

    material.needsUpdate = true; // Ensure the material updates
}


// Example usage

loadModel(
    './models/cosmology_01/cosmology_01.gltf',
    { metalness: 0.3, roughness: 0.7 }, // Material settings
    './models/textures/vines_01.jpg', // aoMap
    0, // No rotation
    {
        normalMap: './models/textures/normal_01.jpg',
        bumpMap: './models/textures/bump_01.jpg',
        
    }
);

loadModel(
    './models/cosmology_01/upperClouds_01.gltf',
    { metalness: 0, roughness: 1, transparent: true, opacity: 0.3 }, // Material settings
    './models/textures/vines_01.jpg', // aoMap
    0.01, // Rotation speed
    {
        normalMap: './models/textures/normal_01.jpg',
        
    }
);

loadModel(
    './models/cosmology_01/clouds_01.gltf',
    { metalness: 0, roughness: 1, transparent: true, opacity: 0.3 }, // Material settings
    './models/textures/vines_01.jpg', // aoMap
    -0.01, // Rotation speed
    {
        normalMap: './models/textures/normal_01.jpg',
        
    }
);

loadModel(
    './models/cosmology_01/spindle_01.gltf',
    { metalness: 1, roughness: .1, transparent: false, opacity: 0 }, // Material settings
    './models/textures/vines_01.jpg', // aoMap
    -0.01, // Rotation speed
    {
        normalMap: './models/textures/normal_01.jpg',
        
    }
);

loadModel(
    './models/cosmology_01/brightShiny_01.gltf',
    { metalness: .4, roughness: .3, transparent: false, opacity: 0 }, // Material settings
    './models/textures/vines_01.jpg', // aoMap
    0, // Rotation speed
    {
        normalMap: './models/textures/normal_01.jpg',
        
    }
);

loadModel(
    './models/cosmology_01/bodhiTree_01.gltf',
    { metalness: .1, roughness: .4, transparent: false, opacity: 0.3 }, // Material settings
    './models/textures/vines_01.jpg', // aoMap
    0, // Rotation speed
    {
        normalMap: './models/textures/normal_01.jpg',
        
    }
);

loadModel('./models/cosmology_01/houses_01.gltf', { metalness: 1, roughness: .1 }, './models/textures/vines_01.jpg');
loadModel('./models/cosmology_01/brightFlowers_01.gltf');


// Variables to handle rotation
let isDragging = false;
let previousMouseX = 0;
let velocity = 0;
const easeFactor = 0.95;

// Event listeners for mouse and touch interaction
function handleDragStart(event) {
    isDragging = true;
    previousMouseX = event.touches ? event.touches[0].clientX : event.clientX;
}

function handleDragMove(event) {
    if (isDragging) {
        const currentX = event.touches ? event.touches[0].clientX : event.clientX;
        const deltaX = currentX - previousMouseX;
        velocity = deltaX * 0.005;
        modelGroup.rotation.y += velocity;
        previousMouseX = currentX;
    }
}

function handleDragEnd() {
    isDragging = false;
}

document.addEventListener('mousedown', handleDragStart);
document.addEventListener('mousemove', handleDragMove);
document.addEventListener('mouseup', handleDragEnd);
document.addEventListener('touchstart', handleDragStart);
document.addEventListener('touchmove', handleDragMove);
document.addEventListener('touchend', handleDragEnd);

// Animation loop with easing
function animate() {
    requestAnimationFrame(animate);

    // Apply easing to rotation
    if (!isDragging) {
        velocity *= easeFactor;
        modelGroup.rotation.y += velocity;
    }

    renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
