// main.js
// Escape Room 3D: Levers + Tables & Boxes + Keypad
// Door unlocks only if all puzzles solved. Timer, start/end screens, indicators.

let scene, camera, renderer;
let door;
let levers = [];
let leverStates = [];
const leverSolution = [true, true, false]; 

let tables = [];
let boxes = [];
let heldBox = null;
const boxHalf = 0.15;

let keypadButtons = [];
let enteredCode = [];
const correctCode = [1, 2, 3, 4];
let keypadSolved = false;

let puzzleIndicators = [];

let startTime = 0;
let timerInterval;

init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x20232a);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5);

    // Renderer
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff,0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff,0.6);
    dirLight.position.set(5,10,7.5);
    scene.add(dirLight);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(20,20);
    const floorMat = new THREE.MeshStandardMaterial({color:0x333333});
    const floor = new THREE.Mesh(floorGeo,floorMat);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0;
    scene.add(floor);

    // Walls
    createWalls();

    // Door
    createDoor();

    // Puzzle indicators
    createPuzzleIndicators();

    // Puzzles
    createLevers();
    createTablesAndBoxes();
    createKeypad();

    // Pointer events
    window.addEventListener('pointerdown', onPointerDown,false);
    window.addEventListener('pointermove', onPointerMove,false);
    window.addEventListener('pointerup', onPointerUp,false);
    window.addEventListener('resize', onWindowResize,false);

    // Disable until start
    renderer.domElement.style.pointerEvents = 'none';

    document.getElementById('startButton').addEventListener('click', () => {
        document.getElementById('startScreen').style.display = 'none';
        renderer.domElement.style.pointerEvents = 'auto';
        startTime = Date.now();
        timerInterval = setInterval(updateTimer,1000);
    });

    document.getElementById('restartButton').addEventListener('click', () => {
        location.reload();
    });
}

function createWalls() {
    const wallMat = new THREE.MeshStandardMaterial({color:0x888888});
    const wallGeo = new THREE.BoxGeometry(10,3,0.2);

    const back = new THREE.Mesh(wallGeo,wallMat);
    back.position.set(0,1.5,-5);
    scene.add(back);

    const front = new THREE.Mesh(wallGeo,wallMat);
    front.position.set(0,1.5,5);
    scene.add(front);

    const left = new THREE.Mesh(wallGeo,wallMat);
    left.rotation.y = Math.PI/2;
    left.position.set(-5,1.5,0);
    scene.add(left);

    const right = new THREE.Mesh(wallGeo,wallMat);
    right.rotation.y = Math.PI/2;
    right.position.set(5,1.5,0);
    scene.add(right);
}

function createDoor() {
    const geo = new THREE.BoxGeometry(2,2.5,0.2);
    const mat = new THREE.MeshStandardMaterial({color:0x00ff00});
    door = new THREE.Mesh(geo,mat);
    door.position.set(0,1.25,-4.9);
    door.userData.locked = true;
    scene.add(door);
}

function createLevers() {
    const leverMat = new THREE.MeshStandardMaterial({color:0xff0000});
    const baseMat = new THREE.MeshStandardMaterial({color:0x555555});
    leverStates = [false,false,false];

    for (let i=0;i<3;i++){
        const baseGeo = new THREE.BoxGeometry(0.1,0.08,0.16);
        const base = new THREE.Mesh(baseGeo,baseMat);
        const baseY = 0.6 + i*0.7;
        base.position.set(4.9,baseY,-0.6 + i*0.9);
        scene.add(base);

        const stickGeo = new THREE.BoxGeometry(0.1,1,0.1);
        const stick = new THREE.Mesh(stickGeo,leverMat);
        stick.geometry.translate(0,0.5,0);

        const group = new THREE.Group();
        group.position.set(base.position.x,base.position.y,base.position.z);
        group.add(stick);
        group.userData.index = i;
        scene.add(group);

        levers.push({group:group,stick:stick});
    }
}

function createTablesAndBoxes() {
    tables=[]; boxes=[];
    const tableColors=[0xffa500,0x800080,0x00ff00];
    const leftWallX = -4.6;
    const zPositions = [-1.6,0,1.6];
    for(let i=0;i<3;i++){
        const geo = new THREE.BoxGeometry(0.8,1.0,1.4);
        const mat = new THREE.MeshStandardMaterial({color:tableColors[i]});
        const table = new THREE.Mesh(geo,mat);
        table.position.set(leftWallX,0.5,zPositions[i]);
        table.userData.boxesOn=[];
        scene.add(table);
        tables.push(table);
    }

    const boxColors=[0xff0000,0xffff00,0x0000ff];
    const startPositions = [
        {x:2.5,y:boxHalf,z:-3},{x:2.0,y:boxHalf,z:-3},{x:1.0,y:boxHalf,z:-3},
        {x:0.5,y:boxHalf,z:-3},{x:-0.8,y:boxHalf,z:-3},{x:-1.4,y:boxHalf,z:-3}
    ];
    let colorIndex=0, colorCount=0;
    for(let i=0;i<6;i++){
        const geo=new THREE.BoxGeometry(0.3,0.3,0.3);
        const mat=new THREE.MeshStandardMaterial({color:boxColors[colorIndex]});
        const box=new THREE.Mesh(geo,mat);
        const pos=startPositions[i];
        box.position.set(pos.x,pos.y,pos.z);
        box.userData={colorIndex:colorIndex,startPos:box.position.clone(),placedOn:null};
        scene.add(box);
        boxes.push(box);

        colorCount++; if(colorCount===2){ colorCount=0; colorIndex++; }
    }
}

function createKeypad() {
    const layout=[[1,2,3],[4,5,6],[7,8,9],[null,0,null]];
    const startX=2.5,startY=1.5,startZ=-4.85,spacing=0.3;
    const size=0.25;
    keypadButtons=[];
    for(let row=0;row<layout.length;row++){
        for(let col=0;col<layout[row].length;col++){
            if(layout[row][col]===null) continue;
            const geo=new THREE.BoxGeometry(size,0.1,size);
            const mat=new THREE.MeshStandardMaterial({color:0xffffff});
            const btn=new THREE.Mesh(geo,mat);
            btn.position.set(startX+(col-1)*spacing,startY-row*spacing,startZ);
            btn.userData.value=layout[row][col];
            scene.add(btn);
            keypadButtons.push(btn);
        }
    }
}

function createPuzzleIndicators() {
    const startX=-4.0, yPos=2.0, zPos=-4.85, size=0.25, spacing=0.35;
    for(let i=0;i<3;i++){
        const geo=new THREE.BoxGeometry(size,size,size);
        const mat=new THREE.MeshStandardMaterial({color:0xff0000});
        const square=new THREE.Mesh(geo,mat);
        square.position.set(startX+i*spacing,yPos,zPos);
        scene.add(square);
        puzzleIndicators.push(square);
    }
}

// Pointer Events
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
    pickUpBox(boxIntersects[0].object);
    return;
  }

  const leverIntersects = raycaster.intersectObjects(levers.map(l => l.group), true);
  if (leverIntersects.length > 0) {
    let leverGroup = leverIntersects[0].object;
    while (!leverGroup.userData.hasOwnProperty('index') && leverGroup.parent) {
      leverGroup = leverGroup.parent;
    }
    toggleLever(leverGroup.userData.index);
    return;
  }

  const keypadIntersects = raycaster.intersectObjects(keypadButtons);
  if (keypadIntersects.length > 0) {
    const button = keypadIntersects[0].object;
    handleKeypadPress(button.userData.value);
    return;
  }
}

function onPointerMove(event){
    if(!heldBox) return;
    const mouse=new THREE.Vector2(
        (event.clientX/window.innerWidth)*2-1,
        -(event.clientY/window.innerHeight)*2+1
    );
    const raycaster=new THREE.Raycaster();
    raycaster.setFromCamera(mouse,camera);
    const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    const intersect=new THREE.Vector3();
    raycaster.ray.intersectPlane(plane,intersect);
    heldBox.position.set(intersect.x,boxHalf+0.25,intersect.z);
}

function onPointerUp(event){
    if(!heldBox) return;
    const mouse=new THREE.Vector2(
        (event.clientX/window.innerWidth)*2-1,
        -(event.clientY/window.innerHeight)*2+1
    );
    const raycaster=new THREE.Raycaster();
    raycaster.setFromCamera(mouse,camera);
    const tableIntersects = raycaster.intersectObjects(tables);
    if(tableIntersects.length>0){
        placeBoxOnTable(heldBox,tableIntersects[0].object);
    } else { restoreHeldBox(); }
    heldBox=null;
    updateDoorLockState();
}

function pickUpBox(box){
    if(box.userData.placedOn){
        const t=box.userData.placedOn;
        const idx=t.userData.boxesOn.indexOf(box);
        if(idx!==-1) t.userData.boxesOn.splice(idx,1);
        box.userData.placedOn=null;
    }
    heldBox=box;
}

function placeBoxOnTable(box,table){
    const already=table.userData.boxesOn.length;
    if(already>=2){ restoreHeldBoxToStart(box); return; }
    const tableTopY=table.position.y + table.geometry.parameters.height/2;
    const xOffset=0.2;
    const zOffset = already===0 ? -0.2:0.2;
    box.position.set(table.position.x+xOffset,tableTopY+boxHalf,table.position.z+zOffset);
    box.userData.placedOn=table;
    table.userData.boxesOn.push(box);
}

function restoreHeldBox(){ if(!heldBox) return; restoreHeldBoxToStart(heldBox); }
function restoreHeldBoxToStart(box){
    box.position.copy(box.userData.startPos);
    if(box.userData.placedOn){
        const t=box.userData.placedOn;
        const idx=t.userData.boxesOn.indexOf(box);
        if(idx!==-1) t.userData.boxesOn.splice(idx,1);
        box.userData.placedOn=null;
    }
}

// Levers 
function toggleLever(index){
    leverStates[index]=!leverStates[index];
    levers[index].group.rotation.x = leverStates[index] ? -Math.PI/4 : 0;
    updateDoorLockState();
}

// Keypad 
function handleKeypadPress(value){
    if(keypadSolved) return;
    enteredCode.push(value);
    const btn=keypadButtons.find(b=>b.userData.value===value);
    if(btn){ btn.material.color.set(0x999999); setTimeout(()=>{if(!keypadSolved) btn.material.color.set(0xffffff);},200); }
    if(enteredCode.length===correctCode.length){
        if(enteredCode.every((v,i)=>v===correctCode[i])){
            keypadSolved=true;
            console.log("Keypad solved!");
        } else { console.log("Incorrect code."); }
        enteredCode=[];
    }
    updateDoorLockState();
}

// Puzzle Checks 
function checkPuzzle1(){ return leverStates.every((s,i)=>s===leverSolution[i]); }
function checkPuzzle2(){
    const required=[[0,1],[0,2],[1,2]];
    for(let i=0;i<tables.length;i++){
        const boxesOn=tables[i].userData.boxesOn;
        if(boxesOn.length!==2) return false;
        const colors=boxesOn.map(b=>b.userData.colorIndex).sort((a,b)=>a-b);
        const need=required[i].slice().sort((a,b)=>a-b);
        if(!(colors[0]===need[0] && colors[1]===need[1])) return false;
    }
    return true;
}
function checkPuzzle3(){ return keypadSolved; }

function updateDoorLockState(){
    const p1=checkPuzzle1(), p2=checkPuzzle2(), p3=checkPuzzle3();
    updatePuzzleIndicators(p1,p2,p3);
    const allSolved = p1 && p2 && p3;
    if(allSolved){
        if(door.userData.locked){
            door.userData.locked=false;
            door.material.color.set(0x0000ff);
            console.log("All puzzles solved! Door unlocked.");
            showEndScreen();
        }
    } else {
        if(!door.userData.locked){
            door.userData.locked=true;
            door.material.color.set(0x00ff00);
        }
    }
}

function updatePuzzleIndicators(p1,p2,p3){
    if(puzzleIndicators.length===3){
        puzzleIndicators[0].material.color.set(p1?0x00ff00:0xff0000);
        puzzleIndicators[1].material.color.set(p2?0x00ff00:0xff0000);
        puzzleIndicators[2].material.color.set(p3?0x00ff00:0xff0000);
    }
}

// Window 
function onWindowResize(){
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
}

function animate(){ requestAnimationFrame(animate); renderer.render(scene,camera); }

// Timer
function updateTimer(){
    const elapsed = Math.floor((Date.now()-startTime)/1000);
    document.getElementById('timer').textContent = `Time: ${elapsed}s`;
}

//  End Screen
function showEndScreen(){
    clearInterval(timerInterval);
    const elapsed = Math.floor((Date.now()-startTime)/1000);
    const minutes = Math.floor(elapsed/60).toString().padStart(2,'0');
    const seconds = (elapsed%60).toString().padStart(2,'0');
    let finalTime = document.getElementById('finalTime');
    if(!finalTime){
        finalTime = document.createElement('div');
        finalTime.id='finalTime';
        document.getElementById('endScreen').appendChild(finalTime);
    }
    finalTime.textContent = `Time: ${minutes}:${seconds}`;
    document.getElementById('endScreen').style.display='flex';
}
