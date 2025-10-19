// main.js
// Puzzle 1 (levers) + Puzzle 2 (tables & pickable boxes) + Puzzle 3 (keypad)
// Door unlocks when all puzzles are solved

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

// Puzzle 3: Keypad
let keypadButtons = [];
let enteredCode = [];
const correctCode = [1, 2, 3, 4];
let keypadSolved = false;

// Puzzle indicators
let puzzleIndicators = [];

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

  // Door
  createDoor();

  // Puzzles
  createLevers();
  createTablesAndBoxes();
  createKeypad();

  // Puzzle indicators
  createPuzzleIndicators();

  // Event listeners
  window.addEventListener('pointerdown', onPointerDown, false);
  window.addEventListener('pointermove', onPointerMove, false);
  window.addEventListener('pointerup', onPointerUp, false);
  window.addEventListener('resize', onWindowResize, false);
}

function createWalls() {
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const wallGeo = new THREE.BoxGeometry(10, 3, 0.2);

  const back = new THREE.Mesh(wallGeo, wallMaterial);
  back.position.set(0, 1.5, -5);
  scene.add(back);

  const front = new THREE.Mesh(wallGeo, wallMaterial);
  front.position.set(0, 1.5, 5);
  scene.add(front);

  const left = new THREE.Mesh(wallGeo, wallMaterial);
  left.rotation.y = Math.PI / 2;
  left.position.set(-5, 1.5, 0);
  scene.add(left);

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
  const startPositions = [
    { x: 2.5, y: boxHalf, z: -3.0 },
    { x: 2.0, y: boxHalf, z: -3.0 },
    { x: 1.0, y: boxHalf, z: -3.0 },
    { x: 0.5, y: boxHalf, z: -3.0 },
    { x: -0.8, y: boxHalf, z: -3.0 },
    { x: -1.4, y: boxHalf, z: -3.0 }
  ];

  let colorIndex = 0;
  let colorCount = 0;

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

function createKeypad() {
  const startX = 2.5;
  const startY = 1.5;
  const startZ = -4.85;
  const buttonSize = 0.25;
  const spacing = 0.3;

  const layout = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [null, 0, null]
  ];

  for (let row = 0; row < layout.length; row++) {
    for (let col = 0; col < layout[row].length; col++) {
      if (layout[row][col] === null) continue;

      const buttonGeometry = new THREE.BoxGeometry(buttonSize, 0.1, buttonSize);
      const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const button = new THREE.Mesh(buttonGeometry, buttonMaterial);

      const xPos = startX + (col - 1) * spacing;
      const yPos = startY - row * spacing;
      button.position.set(xPos, yPos, startZ);

      scene.add(button);
      keypadButtons.push(button);
      button.userData.value = layout[row][col];
    }
  }
}

function createPuzzleIndicators() {
  const squareSize = 0.25;
  const spacing = 0.35;
  const startX = -1.5;
  const yPos = 2.0;
  const zPos = -4.88;

  for (let i = 0; i < 3; i++) {
    const geo = new THREE.BoxGeometry(squareSize, squareSize, 0.05);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0x550000,
      emissiveIntensity: 0.2
    });
    const square = new THREE.Mesh(geo, mat);
    square.position.set(startX - i * spacing, yPos, zPos);
    square.userData.puzzleIndex = i;
    scene.add(square);
    puzzleIndicators.push(square);
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
      placeBoxOnTable(heldBox, tableIntersects[0].object);
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
    pickUpBox(boxIntersects[0].object);
    return;
  }

  const leverIntersects = raycaster.intersectObjects(levers.map(l => l.group));
  if (leverIntersects.length > 0) {
    const leverGroup = leverIntersects[0].object.parent || leverIntersects[0].object;
    toggleLever(leverGroup.userData.index);
    return;
  }

  const keypadIntersects = raycaster.intersectObjects(keypadButtons);
  if (keypadIntersects.length > 0) {
    handleKeypadPress(keypadIntersects[0].object.userData.value);
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
  const xOffsetAwayFromWall = 0.2;
  const zOffset = (already === 0) ? -0.2 : 0.2;

  const placeX = table.position.x + xOffsetAwayFromWall;
  const placeY = tableTopY + boxHalf;
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
  updateDoorLockState();
}

function handleKeypadPress(value) {
  if (keypadSolved) return; 
  enteredCode.push(value);

  const btn = keypadButtons.find(b => b.userData.value === value);
  if (btn) {
    btn.material.color.set(0x999999);
    setTimeout(() => btn.material.color.set(0xffffff), 200);
  }

  if (enteredCode.length === correctCode.length) {
    if (enteredCode.every((v, i) => v === correctCode[i])) {
      keypadSolved = true;
      console.log("Keypad solved!");
    } else {
      console.log("Incorrect code.");
    }
    enteredCode = [];
  }

  updateDoorLockState();
}

function checkPuzzle1() {
  return leverStates.every((s, i) => s === leverSolution[i]);
}

function checkPuzzle2() {
  const required = [
    [0, 1],
    [0, 2],
    [1, 2]
  ];

  for (let i = 0; i < tables.length; i++) {
    const boxesOn = tables[i].userData.boxesOn || [];
    if (boxesOn.length !== 2) return false;
    const colors = boxesOn.map(b => b.userData.colorIndex).sort((a, b) => a - b);
    const need = required[i].slice().sort((a, b) => a - b);
    if (!(colors[0] === need[0] && colors[1] === need[1])) return false;
  }
  return true;
}

function checkKeypad() {
  return keypadSolved;
}

function updateDoorLockState() {
  const puzzle1Solved = checkPuzzle1();
  const puzzle2Solved = checkPuzzle2();
  const keypadSolvedNow = checkKeypad();

  updatePuzzleIndicators();

  if (puzzle1Solved && puzzle2Solved && keypadSolvedNow) {
    if (door.userData.locked) {
      door.userData.locked = false;
      door.material.color.set(0x0000ff); // unlocked blue
      console.log("Door unlocked (all puzzles solved).");
    }
  } else {
    if (!door.userData.locked) {
      door.userData.locked = true;
      door.material.color.set(0x00ff00); // locked green
      console.log("Door locked (not all puzzles solved).");
    }
  }
}

function updatePuzzleIndicators() {
  const states = [checkPuzzle1(), checkPuzzle2(), checkKeypad()];
  for (let i = 0; i < puzzleIndicators.length; i++) {
    const square = puzzleIndicators[i];
    if (states[i]) {
      square.material.color.set(0x00ff00);
      square.material.emissive.set(0x005500);
      square.material.emissiveIntensity = 0.4;
    } else {
      square.material.color.set(0xff0000);
      square.material.emissive.set(0x550000);
      square.material.emissiveIntensity = 0.2;
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
