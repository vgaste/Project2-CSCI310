import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/PointerLockControls.js";

let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let canJump = false;
const speed = 5;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x20232a);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.6);
  directional.position.set(5, 10, 7.5);
  scene.add(directional);

  createRoom();

  controls = new PointerLockControls(camera, renderer.domElement);
  document.addEventListener("click", () => controls.lock());
  scene.add(controls.getObject());

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  window.addEventListener("resize", onWindowResize);
}

function createRoom() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const wallGeometry = new THREE.BoxGeometry(10, 3, 0.2);

  const back = new THREE.Mesh(wallGeometry, wallMaterial);
  back.position.set(0, 1.5, -5);
  scene.add(back);

  const front = new THREE.Mesh(wallGeometry, wallMaterial);
  front.position.set(0, 1.5, 5);
  scene.add(front);

  const left = new THREE.Mesh(wallGeometry, wallMaterial);
  left.rotation.y = Math.PI / 2;
  left.position.set(-5, 1.5, 0);
  scene.add(left);

  const right = new THREE.Mesh(wallGeometry, wallMaterial);
  right.rotation.y = Math.PI / 2;
  right.position.set(5, 1.5, 0);
  scene.add(right);
}

function onKeyDown(e) {
  switch (e.code) {
    case "KeyW": case "ArrowUp": moveForward = true; break;
    case "KeyS": case "ArrowDown": moveBackward = true; break;
    case "KeyA": case "ArrowLeft": moveLeft = true; break;
    case "KeyD": case "ArrowRight": moveRight = true; break;
  }
}

function onKeyUp(e) {
  switch (e.code) {
    case "KeyW": case "ArrowUp": moveForward = false; break;
    case "KeyS": case "ArrowDown": moveBackward = false; break;
    case "KeyA": case "ArrowLeft": moveLeft = false; break;
    case "KeyD": case "ArrowRight": moveRight = false; break;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = 0.05;
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  const direction = new THREE.Vector3();
  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  renderer.render(scene, camera);
}
