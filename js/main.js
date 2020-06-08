// Import stuff
import * as THREE from '../js/three.module.js';
import { OrbitControls } from '../controls/OrbitControls.js';
import { GLTFLoader } from '../loaders/GLTFLoader.js';
import { STLExporter } from '../exporters/STLExporter.js';


// Set up variables
var camera, controls, scene, renderer, container;
var hemiLight, dirLight;
var exporter;
var model;
var pendulum;

var ground, grid;

init();

animate();

function init() {

	// Container for UI 
	container = document.getElementById( 'container' );
	
	// Set up exporter
	exporter = new STLExporter();
	var buttonExportBinary = document.getElementById( 'exportBinary' );
	buttonExportBinary.addEventListener( 'click', exportBinary );
	
	// Create the scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xa0a0a0 );
	scene.fog = new THREE.Fog( 0xa0a0a0, 40, 60 );

	// Create the renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	// Create a camera
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.set( 30, 40, 30 );
	camera.lookAt( 0, 30, 0 );
	
	// Controls
	controls = new OrbitControls( camera, renderer.domElement );
	controls.screenSpacePanning = true;
	controls.enablePan = true;
	controls.minDistance = 25;
	controls.maxDistance = 50;
	controls.target.set( 0, 2, 0 );
	controls.maxPolarAngle = Math.PI * 0.495; //Hopefully restricts vertical camera rotations. Needs further adjustment
	
	controls.update();

	// Add lights
	hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
	hemiLight.position.set( 0, 50, 0 );
	scene.add( hemiLight ); 
	
	dirLight = new THREE.DirectionalLight( 0xffffff, 1 ); 
	dirLight.position.set( - 1, 1.75, 1 );
	dirLight.position.multiplyScalar( 30 );
	scene.add( dirLight );

	dirLight.castShadow = true;

	dirLight.shadow.mapSize.width = 2048;
	dirLight.shadow.mapSize.height = 2048;

	var d = 50;

	dirLight.shadow.camera.left = - d;
	dirLight.shadow.camera.right = d;
	dirLight.shadow.camera.top = d;
	dirLight.shadow.camera.bottom = - d;

	dirLight.shadow.camera.far = 3500;
	dirLight.shadow.bias = - 0.0001;
	
	// Import object using GLFT loader
	var loader = new GLTFLoader();
	loader.load( 'gltfModels/GhostPirate.glb', function ( gltf ) {

		model = gltf.scene;
		model.material.shading = THREE.SmoothShading;
		
		scene.add( model );

		model.traverse( function ( object ) {
			if ( object.isMesh ) object.castShadow = true;
		} );
	} );

	// Add Lines for references
	// Create a function to do this
	var material = new THREE.LineBasicMaterial( { color: 0x0000ff } ); // Blue
	var points = [];
	points.push( new THREE.Vector3( 0, 0, 0 ) );
	points.push( new THREE.Vector3( 0, 10, 0 ) ); // Y Axis
	var geometry = new THREE.BufferGeometry().setFromPoints( points );
	var line = new THREE.Line( geometry, material );
	scene.add( line );

	material = new THREE.LineBasicMaterial( { color: 0x00ff00 } ); // Green
	points.pop();
	points.push( new THREE.Vector3( 0, 0, 10 ) ); // Z Axis
	geometry = new THREE.BufferGeometry().setFromPoints( points );
	line = new THREE.Line( geometry, material );
	scene.add( line );
	
	material = new THREE.LineBasicMaterial( { color: 0xff0000 } ); // Red
	points.pop();
	points.push( new THREE.Vector3( 10, 0, 0 ) ); // X Axis
	geometry = new THREE.BufferGeometry().setFromPoints( points );
	line = new THREE.Line( geometry, material );
	scene.add( line );

	createGround();
}


function exportBinary() {
	var result = exporter.parse( model, { binary: true } );
	saveArrayBuffer( result, 'test2.stl' );
}

var link = document.createElement( 'a' ); // Not 100% certain what this does
link.style.display = 'none';
document.body.appendChild( link );

function save( blob, filename ) {
	link.href = URL.createObjectURL( blob );
	link.download = filename;
	link.click();
}

function saveArrayBuffer( buffer, filename ) {
	save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}

// Animation loop
function animate() {
	

	requestAnimationFrame( animate );
	
	renderer.render( scene, camera );
}

// Adds ground and a grid
function createGround() {
	ground = new THREE.Mesh( new THREE.PlaneBufferGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
	ground.rotation.x = - Math.PI / 2;
	ground.receiveShadow = true;
	scene.add( ground );
	
	// Add a grid to the ground     GridHelper( size : number, divisions : Number, colorCenterLine : Color, colorGrid : Color )
	grid = new THREE.GridHelper( 100, 100);
	grid.material.opacity = 0.2;
	grid.material.transparent = true;
	scene.add( grid );
}








