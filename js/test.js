var scene; 
var renderer, secondaryRenderer;
var camera, secondaryCamera;
var envMap;

var cameraControls;
var angulo = -0.01;

var ball, fakeball;
var ballLaunched = false;

var ballRadius = 0.1;

const ballSpeed = 0.05; 
const ballDirection = new THREE.Vector3() 
const planeHeight = -1;

const numRowsZ = 5;
const numRowsY = 6;
const numRowsX = 7;

const brickWidth = 0.4;
const brickHeight = 0.1;
const brickDepth = 0.1;
const separation = 2;

const gap = 0.5;

ballsRemaining = 3;

var maxBoundaryX = numRowsX * brickWidth * separation + gap; 
var minBoundaryX = -4 * (brickWidth); 
var maxBoundaryY = numRowsY * brickHeight * separation + gap; 
var minBoundaryY = planeHeight; 
var maxBoundaryZ = numRowsZ * brickDepth * separation + gap; 
var minBoundaryZ = -4 * (brickDepth); 

var midBoundaryX = (maxBoundaryX - minBoundaryX) / 2 + minBoundaryX;
var midBoundaryY = (maxBoundaryY - minBoundaryY) / 2 + minBoundaryY;
var midBoundaryZ = (maxBoundaryZ - minBoundaryZ) / 2 + minBoundaryZ;

var isAnimating = false;

const textureDirectory = './images'
const textureLoader = new THREE.TextureLoader();
const cubeLoader = new THREE.CubeTextureLoader();

const cursorPosition = new THREE.Vector2();
const previousCursorPosition = new THREE.Vector2();
const cameraRotationSpeed = 0.01;

/* */

var score = 0;

/* */


const bricksGroup = new THREE.Group();
const cameraGroup = new THREE.Group();

/* */

init();
setControls();
addEnvironmentMap();
addFloor();

addBricks();
createBall();

addMouseEvents();

setCameraPosition();

addGroups();
addLights();
addSecondCamera();
render();

/* */

function init()
{
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( new THREE.Color(0x221F1A) );
  document.getElementById('container').appendChild( renderer.domElement );

  scene = new THREE.Scene();

  const aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera( 50, aspectRatio , 0.1, 100 );
  camera.position.set( midBoundaryX, minBoundaryY, -4 );
  camera.lookAt(midBoundaryX, midBoundaryY, midBoundaryZ );

  cameraGroup.add(camera);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  window.addEventListener('resize', updateAspectRatio );
}

function setControls(){
	cameraControls = new THREE.OrbitControls(cameraGroup, renderer.domElement);

	cameraControls.mouseButtons = {
		LEFT: THREE.MOUSE.ROTATE,
		
		
	};

	cameraControls.enableDamping = true;
	cameraControls.dampingFactor = 0.1;

	cameraControls.minDistance = 2;
	cameraControls.maxDistance = 10;

	cameraControls.minPolarAngle = (1.5 * Math.PI) / 4; 
	cameraControls.maxPolarAngle = (2 * Math.PI) / 4; 

	
	cameraControls.minAzimuthAngle = -Math.PI / 4; 
	cameraControls.maxAzimuthAngle = Math.PI / 4; 
}

function manageTexture(texture){
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.colorSpace = THREE.SRGBColorSpace;

	return texture;
}

function addEnvironmentMap(){
	const envMapTexture = cubeLoader.load([
		`${textureDirectory}/posx.jpg`, `${textureDirectory}/negx.jpg`,
		`${textureDirectory}/posy.jpg`, `${textureDirectory}/negy.jpg`,
		`${textureDirectory}/posz.jpg`, `${textureDirectory}/negz.jpg`,
	]);
	envMapTexture.mapping = THREE.CubeReflectionMapping
	
	const envMapGeometry = new THREE.BoxGeometry(8, 15, 8);;

	const envMapMaterial = new THREE.MeshStandardMaterial({
		color: 0xffffff,
		roughness: 1.0,
		metalness: 0.0,
		envMap: envMapTexture,
	});

	envMap = new THREE.Mesh(envMapGeometry, envMapMaterial);
	scene.background = envMapTexture;
}

function addFloor(){
	const planeGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
	
	textureLoader.load(
		`${textureDirectory}/sand.jpg`,
		function ( texture ) {
			const planeMaterial = new THREE.MeshPhongMaterial({ 
				map: manageTexture(texture)
			});

			const plane = new THREE.Mesh(planeGeometry, planeMaterial);

			plane.receiveShadow = true;
			
			plane.rotation.x = -Math.PI / 2;
			plane.position.set(midBoundaryX, planeHeight, midBoundaryZ);
			plane.scale.set(10, 10, 10);

			scene.add(plane);
		},
	);
}

function numToColor(x, maxX, y, maxY, z, maxZ){
	return (Math.round(maxX*x) << 16) +
		(Math.round(maxY*y) << 8) +
		Math.round(maxZ*z);
}

function addBricks(){
	for (let rowZ = 0; rowZ < numRowsZ; rowZ++) {
		const bricksGroupZ = new THREE.Group();
		for (let rowY = 0; rowY < numRowsY; rowY++) {
				const bricksGroupY = new THREE.Group();
			for (let rowX = 0; rowX < numRowsX; rowX++) {
				const brick = new THREE.Mesh(
					new THREE.BoxGeometry(brickWidth, brickHeight, brickDepth),
					new THREE.MeshStandardMaterial({ 
						color: numToColor(
							rowX/numRowsX, 255, 
							rowY/numRowsY, 255, 
							rowZ/numRowsZ, 255, 
						),
					})
				);

				
				brick.position.set(
					rowX * brickWidth * separation,
					rowY * brickHeight * separation,
					rowZ * brickDepth * separation,
				);

				bricksGroupY.add(brick);
			}
			bricksGroupZ.add(bricksGroupY);
		}
		bricksGroup.add(bricksGroupZ);
	}
}

function addGroups(){
	scene.add(bricksGroup);
	scene.add(cameraGroup)
}

function updateAspectRatio()
{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function update()
{
  	cameraControls.update();
}

function render()
{
	requestAnimationFrame( render );
	update();
	envMap.visible = true;
	renderer.render( scene, camera );
	envMap.visible = false;
	secondaryRenderer.render( scene, secondaryCamera );
}

function addSecondCamera(){
	secondaryCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
	secondaryCamera.position.set(maxBoundaryX, maxBoundaryY, maxBoundaryZ);
	secondaryCamera.lookAt(0, 0, 0);

	const secondaryCameraSize = Math.min(
		renderer.domElement.clientWidth, 
		renderer.domElement.clientHeight,
	) / 4;
	const viewportX = renderer.domElement.clientWidth - secondaryCameraSize;
	const viewportY = renderer.domElement.clientHeight - secondaryCameraSize;

	secondaryRenderer = new THREE.WebGLRenderer({ antialias: true });
	secondaryRenderer.setSize(secondaryCameraSize, secondaryCameraSize);
	secondaryRenderer.setClearColor(0x000000, 0);

	secondaryRenderer.domElement.style.position = 'absolute';
	secondaryRenderer.domElement.style.bottom = viewportY + 'px';
	secondaryRenderer.domElement.style.right = viewportX + 'px';

	document.body.appendChild(secondaryRenderer.domElement);
}

function addLights(){
	const ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);

	
	const spotlight = new THREE.SpotLight(0xffffff, 1);
	spotlight.position.set(midBoundaryX, 3, maxBoundaryZ*3);
	
	spotlight.castShadow = true;
	scene.add(spotlight);
}

function createBall(){
	const ballSegments = 8;
	const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); 

	
	const ballGeometry = new THREE.SphereGeometry(ballRadius, ballSegments, ballSegments);

	
	ball = new THREE.Mesh(ballGeometry, ballMaterial);
	fakeball = new THREE.Mesh(ballGeometry, ballMaterial);
	ball.position.set(0, 0, 0);
	fakeball.position.set(0, 0, 0);

	cameraGroup.add(fakeball);
}

function animateBall(){
	if(! ballLaunched) return

	requestAnimationFrame(animateBall);

	
	ball.position.add(ballDirection);

	var collision = false;

	
	if (
			(ball.position.x > maxBoundaryX && ballDirection.x > 0) || 
			(ball.position.x < minBoundaryX && ballDirection.x < 0)){
		ballDirection.x *= -1; 
		collision = true;
	}
	if (
			(ball.position.y > maxBoundaryY && ballDirection.y > 0) || 
			(ball.position.y < minBoundaryY && ballDirection.y < 0)) {
		ballDirection.y *= -1; 
		collision = true;
	}
	if (
			(ball.position.z < minBoundaryZ && ballDirection.z < 0)) {
		ballDirection.z *= -1; 
		collision = true;
	}
	else if (ball.position.z > maxBoundaryZ && ballDirection.z > 0) {
		scene.remove(ball);
		cameraGroup.add(fakeball);

		ballLaunched = false;

		if(ballsRemaining !== 0){
			cameraControls.minPolarAngle = (1.5 * Math.PI) / 4; 
			cameraControls.maxPolarAngle = (2 * Math.PI) / 4; 

			
			cameraControls.minAzimuthAngle = -Math.PI / 4; 
			cameraControls.maxAzimuthAngle = Math.PI / 4; 
		}
	}

	if(!collision){
		collision  = checkBrickCollisions();
	}
}

function checkBrickCollisions(){
	const vector = new THREE.Vector3();

	for(bricksGroupZ of bricksGroup.children){
	for(bricksGroupY of bricksGroupZ.children){
	for(brick of bricksGroupY.children){
		

		vector.subVectors(brick.position, ball.position);
	  
		
		const distanceX = Math.abs(vector.x);
		const distanceY = Math.abs(vector.y);
		const distanceZ = Math.abs(vector.z);
	  
		
		const brickHalfWidth = brick.scale.x * (brickWidth / 2);
		const brickHalfHeight = brick.scale.y * (brickHeight / 2);
		const brickHalfDepth = brick.scale.z * (brickDepth / 2);
	  
		
		const collisionX = distanceX < (ballRadius + brickHalfWidth);
		const collisionY = distanceY < (ballRadius + brickHalfHeight);
		const collisionZ = distanceZ < (ballRadius + brickHalfDepth);
	  
		
		if (collisionX && collisionY && collisionZ) {
			ball.material.color.copy(brick.material.color);

			
			
			bricksGroupY.remove(brick);

			
			const normal = new THREE.Vector3(vector.x, vector.y, vector.z).normalize();

			
			const reflection = ballDirection.clone().reflect(normal);
		
			
			ballDirection.copy(reflection);

			score += 1;
			updateScore();

			return true;
		}
	}}}
	return false;
}

function addMouseEvents(){
	document.addEventListener('mousemove', (event) => {
		
		if (! ballLaunched) {
			cursorPosition.x = (event.clientX / window.innerWidth) * 2 - 1;
			cursorPosition.y = (event.clientY / window.innerHeight) * 2 - 1;
		
			const deltaX = cursorPosition.x - previousCursorPosition.x;
			const deltaY = cursorPosition.y - previousCursorPosition.y;
			
			
			cameraGroup.rotation.y += deltaX * cameraRotationSpeed;
			cameraGroup.rotation.x -= deltaY * cameraRotationSpeed;

			const ballMovementRangeX = 5 / 1760 * window.innerWidth;
			const ballMovementRangeY = 2.5 / 874 * window.innerHeight;
			fakeball.position.set(-cursorPosition.x * ballMovementRangeX + 2, -cursorPosition.y * ballMovementRangeY, 0);
		}
		
		
		previousCursorPosition.copy(cursorPosition);
	});

	document.addEventListener('mouseup', (event) => {
		console.log(ballsRemaining, ballLaunched);
		
		if(ballsRemaining !== 0 && !ballLaunched){
			ballsRemaining -= 1;
			updateNumBalls();

			ballDirection.copy(camera.rotation).normalize().multiplyScalar(ballSpeed);

			ball.position.copy(cameraGroup.position);

			cameraControls.minPolarAngle = -(Math.PI); 
			cameraControls.maxPolarAngle = (Math.PI); 

			
			cameraControls.minAzimuthAngle = -Math.PI; 
			cameraControls.maxAzimuthAngle = Math.PI; 

			cameraGroup.remove(fakeball);
			scene.add(ball);
			
			ballLaunched = true;
			animateBall();
		}
		event.stopPropagation();
	});
}

function setCameraPosition(){
	cameraGroup.position.set(0, midBoundaryY, midBoundaryZ+10);
	cameraControls.target.set(midBoundaryX, midBoundaryY, midBoundaryZ);
}

function updateScore() {
	document.getElementById('score').textContent = `Score: ${score}`;
}

function updateNumBalls() {	
	document.getElementById('balls').textContent = `Balls: ${ballsRemaining}`;
}