// main.js
let scene, camera, renderer;
let levers = [];
let leverStates = [];
const leverSolution = [true, true, false]; // up, up, down
let door;

init();
animate();

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x20232a);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.6, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Walls
  createWalls();

  // Door
  createDoor();

  // Levers puzzle
  createLevers();

  // Mouse click event for levers
  window.addEventListener("click", onMouseClick, false);

  // Resize
  window.addEventListener("resize", onWindowResize);
}

function createWalls() {
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const wallGeometry = new THREE.BoxGeometry(10, 3, 0.2);

  // Back wall
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, 1.5, -5);
  scene.add(backWall);

  // Front wall
  const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
  frontWall.position.set(0, 1.5, 5);
  scene.add(frontWall);

  // Left wall
  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-5, 1.5, 0);
  scene.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.rotation.y = Math.PI / 2;
  rightWall.position.set(5, 1.5, 0);
  scene.add(rightWall);
}

function createDoor() {
  const doorGeometry = new THREE.BoxGeometry(2, 2.5, 0.2);
  const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.position.set(0, 1.25, -5 + 0.11); //in front of back wall
  scene.add(door);
  door.userData.locked = true;
}

function createLevers() {
  const leverMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });

  const leverWidth = 0.1;
  const leverHeight = 1.0;
  const baseHeight = 0.1;
  const baseDepth = 0.2;

  leverStates = [false, false, false];

  for (let i = 0; i < 3; i++) {
    //Bese Height
    const baseY = 0.6 + i * 0.8;

    //Base
    const baseGeometry = new THREE.BoxGeometry(leverWidth, baseHeight, baseDepth);
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(4.9, baseY, -1 + i);
    scene.add(base);

    // Lever stick
    const stickGeometry = new THREE.BoxGeometry(leverWidth, leverHeight, leverWidth);
    const stick = new THREE.Mesh(stickGeometry, leverMaterial);

    const stickGroup = new THREE.Group();
    stick.position.y = leverHeight / 2;
    stickGroup.add(stick);

    stickGroup.position.set(base.position.x, base.position.y, base.position.z);
    scene.add(stickGroup);

    levers.push({ group: stickGroup, stick: stick });

    stickGroup.userData.index = i;
    stickGroup.userData.state = false;
    stickGroup.userData.isLever = true;
  }
}

function onMouseClick(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(levers.map(l => l.group));

  if (intersects.length > 0) {
    const leverGroup = intersects[0].object.parent ? intersects[0].object.parent : intersects[0].object;
    const index = leverGroup.userData.index;
    toggleLever(index);
  }
}

function toggleLever(index) {
  const lever = levers[index];
  leverStates[index] = !leverStates[index];
  lever.group.rotation.x = leverStates[index] ? -Math.PI / 4 : 0;
  checkPuzzle();
}

function checkPuzzle() {
  if (
    leverStates.length === leverSolution.length &&
    leverStates.every((state, i) => state === leverSolution[i])
  ) {
    if (door.userData.locked) {
      door.userData.locked = false;
      door.material.color.set(0x0000ff); //'open' door is blue
      console.log("Puzzle solved! Door unlocked.");
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

