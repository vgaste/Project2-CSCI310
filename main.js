// main.js
// Combined Puzzle 1 (levers) + Puzzle 2 (tables & pickable boxes)
// Door unlocks if either puzzle is solved; relocks if both are wrong.

let scene, camera, renderer;
let door;
let levers = [];
let leverStates = [];
const leverSolution = [true, true, false]; // up, up, down

// Puzzle 2 state
let tables = [];
let boxes = [];
let heldBox = null; 
const boxHalf = 0.15; 
const tableTopY = 1.0; 

init();
animate();

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x20232a);

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  // Floor
  const floorGeo = new THREE.PlaneGeometry(20, 20);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  // Walls
  createWalls();

  // Door (back wall)
  createDoor();

  // Puzzle 1: levers (right wall)
  createLevers();

  // Puzzle 2: tables (left wall) and boxes
  createTablesAndBoxes();

  // Event listeners
  window.addEventListener('pointerdown', onPointerDown, false);
  window.addEventListener('pointermove', onPointerMove, false);
  window.addEventListener('pointerup', onPointerUp, false);
  window.addEventListener('resize', onWindowResize, false);
}

function createWalls() {
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const wallGeo = new THREE.BoxGeometry(10, 3, 0.2);

  // Back wall
  const back = new THREE.Mesh(wallGeo, wallMaterial);
  back.position.set(0, 1.5, -5);
  scene.add(back);

  // Front wall
  const front = new THREE.Mesh(wallGeo, wallMaterial);
  front.position.set(0, 1.5, 5);
  scene.add(front);

  // Left wall
  const left = new THREE.Mesh(wallGeo, wallMaterial);
  left.rotation.y = Math.PI / 2;
  left.position.set(-5, 1.5, 0);
  scene.add(left);

  // Right wall
  const right = new THREE.Mesh(wallGeo, wallMaterial);
  right.rotation.y = Math.PI / 2;
  right.position.set(5, 1.5, 0);
  scene.add(right);
}

function createDoor() {
  const doorGeo = new THREE.BoxGeometry(2, 2.5, 0.2);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); 
  door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 1.25, -4.9);
  door.userData.locked = true;
  scene.add(door);
}

function createLevers() {
  const leverMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x555555 });

  const leverWidth = 0.1;
  const leverHeight = 1.0;
  const baseHeight = 0.08;
  const baseDepth = 0.16;

  leverStates = [false, false, false];

  for (let i = 0; i < 3; i++) {
    const baseGeo = new THREE.BoxGeometry(leverWidth, baseHeight, baseDepth);
    const base = new THREE.Mesh(baseGeo, baseMat);
    const baseY = 0.6 + i * 0.7;    
    base.position.set(4.9, baseY, -0.6 + i * 0.9);
    scene.add(base);

    const stickGeo = new THREE.BoxGeometry(leverWidth, leverHeight, leverWidth);
    const stick = new THREE.Mesh(stickGeo, leverMaterial);
    stick.geometry.translate(0, leverHeight / 2, 0);

    const stickGroup = new THREE.Group();
    stickGroup.position.set(base.position.x, base.position.y, base.position.z);
    stickGroup.add(stick);
    scene.add(stickGroup);

    levers.push({ group: stickGroup, stick: stick });
    stickGroup.userData.index = i;
    stickGroup.userData.state = false;
  }
}

function createTablesAndBoxes() {
  tables = [];
  boxes = [];

  const tableColors = [0xffa500, 0x800080, 0x00ff00]; 
  const spacingZ = 1.6; 
  const tableDepth = 0.8; 
  const tableWidth = 1.4; 
  const tableHeight = 1.0; 
  const tableTopOffset = tableHeight / 2; 
  const leftWallX = -4.6; 

  const zPositions = [-spacingZ, 0, spacingZ]; 
  for (let i = 0; i < 3; i++) {
    const geom = new THREE.BoxGeometry(tableDepth, tableHeight, tableWidth);
    const mat = new THREE.MeshStandardMaterial({ color: tableColors[i] });
    const table = new THREE.Mesh(geom, mat);
    table.position.set(leftWallX, tableTopOffset, zPositions[i]); 
    table.userData.boxesOn = []; 
    table.userData.index = i;
    scene.add(table);
    tables.push(table);
  }

  const boxColors = [0xff0000, 0xffff00, 0x0000ff];
  const boxSize = 0.3;
  const startZ = -3.2;
  const startX = 2.5;
  let colorIndex = 0;
  let colorCount = 0;

  const startPositions = [
    { x: 2.5, y: boxHalf, z: -3.0 },
    { x: 2.0, y: boxHalf, z: -3.0 },
    { x: 1.0, y: boxHalf, z: -3.0 },
    { x: 0.5, y: boxHalf, z: -3.0 },
    { x: -0.8, y: boxHalf, z: -3.0 },
    { x: -1.4, y: boxHalf, z: -3.0 }
  ];

  for (let i = 0; i < 6; i++) {
    const geom = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const mat = new THREE.MeshStandardMaterial({ color: boxColors[colorIndex] });
    const box = new THREE.Mesh(geom, mat);
    const pos = startPositions[i];
    box.position.set(pos.x, pos.y, pos.z);
    box.userData = {
      colorIndex: colorIndex, 
      startPos: box.position.clone(),
      placedOn: null 
    };
    scene.add(box);
    boxes.push(box);

    colorCount++;
    if (colorCount === 2) { colorCount = 0; colorIndex++; }
  }
}

function onPointerDown(event) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    - (event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  if (heldBox) {
    const tableIntersects = raycaster.intersectObjects(tables);
    if (tableIntersects.length > 0) {
      const table = tableIntersects[0].object;
      placeBoxOnTable(heldBox, table);
      heldBox = null;
      updateDoorLockState();
      return;
    } else {
      restoreHeldBox();
      heldBox = null;
      updateDoorLockState();
      return;
    }
  }

  const boxIntersects = raycaster.intersectObjects(boxes);
  if (boxIntersects.length > 0) {
    const box = boxIntersects[0].object;
    pickUpBox(box);
    return;
  }

  const leverIntersects = raycaster.intersectObjects(levers.map(l => l.group));
  if (leverIntersects.length > 0) {
    const leverGroup = leverIntersects[0].object.parent ? leverIntersects[0].object.parent : leverIntersects[0].object;
    const index = leverGroup.userData.index;
    toggleLever(index);
    return;
  }
}

function onPointerMove(event) {
  if (!heldBox) return;
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    - (event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); 
  const intersect = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersect);
  // Keep small Y so it looks picked up
  heldBox.position.set(intersect.x, boxHalf + 0.25, intersect.z);
}

function onPointerUp(event) {
  if (!heldBox) return;
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    - (event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const tableIntersects = raycaster.intersectObjects(tables);
  if (tableIntersects.length > 0) {
    placeBoxOnTable(heldBox, tableIntersects[0].object);
  } else {
    restoreHeldBox();
  }
  heldBox = null;
  updateDoorLockState();
}

function pickUpBox(box) {
  if (box.userData.placedOn) {
    const table = box.userData.placedOn;
    const idx = table.userData.boxesOn.indexOf(box);
    if (idx !== -1) table.userData.boxesOn.splice(idx, 1);
    box.userData.placedOn = null;
  }
  heldBox = box;
  heldBox.position.y = boxHalf + 0.25;
}

function placeBoxOnTable(box, table) {
  const already = table.userData.boxesOn.length;
  if (already >= 2) {
    restoreHeldBoxToStart(box);
    return;
  }

  const tableTopY = table.position.y + (table.geometry.parameters.height / 2);
  const depth = table.geometry.parameters.depth || table.geometry.parameters.width || 0.8;
  const xOffsetAwayFromWall = 0.2; 
  const zOffset = (already === 0) ? -0.2 : 0.2;

  const placeX = table.position.x + xOffsetAwayFromWall; 
  const placeY = tableTopY + boxHalf; // on top
  const placeZ = table.position.z + zOffset;

  box.position.set(placeX, placeY, placeZ);
  box.userData.placedOn = table;
  table.userData.boxesOn.push(box);
}

function restoreHeldBox() {
  if (!heldBox) return;
  restoreHeldBoxToStart(heldBox);
}

function restoreHeldBoxToStart(box) {
  box.position.copy(box.userData.startPos);
  if (box.userData.placedOn) {
    const t = box.userData.placedOn;
    const idx = t.userData.boxesOn.indexOf(box);
    if (idx !== -1) t.userData.boxesOn.splice(idx, 1);
    box.userData.placedOn = null;
  }
}

function toggleLever(index) {
  const group = levers[index].group;
  leverStates[index] = !leverStates[index];
  group.rotation.x = leverStates[index] ? -Math.PI / 4 : 0;
  checkPuzzle1();
  updateDoorLockState();
}

function checkPuzzle1() {
  const solved = (leverStates.length === leverSolution.length) &&
    leverStates.every((s, i) => s === leverSolution[i]);

  return solved;
}

function checkPuzzle2() {
  const required = [
    [0, 1], // table 0 (orange)
    [0, 2], // table 1 (purple)
    [1, 2]  // table 2 (green)
  ];

  for (let i = 0; i < tables.length; i++) {
    const boxesOn = (tables[i].userData.boxesOn || []);
    if (boxesOn.length !== 2) return false;
    const colors = boxesOn.map(b => b.userData.colorIndex).sort((a,b)=>a-b);
    const need = required[i].slice().sort((a,b)=>a-b);
    if (!(colors[0] === need[0] && colors[1] === need[1])) return false;
  }

  return true;
}

function updateDoorLockState() {
  const puzzle1Solved = checkPuzzle1();
  const puzzle2Solved = checkPuzzle2();

  if (puzzle1Solved || puzzle2Solved) {
    if (door.userData.locked) {
      door.userData.locked = false;
      door.material.color.set(0x0000ff); // unlocked blue
      console.log('Door unlocked (one or both puzzles solved).');
    }
  } else {
    if (!door.userData.locked) {
      door.userData.locked = true;
      door.material.color.set(0x00ff00); // locked green
      console.log('Door locked (no puzzle solved).');
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

