// Import stuff
import * as THREE from '/three.module.js';
import { OrbitControls } from './controls/OrbitControls.js';
import { GUI } from './gui/dat.gui.module.js';
import { GLTFLoader } from './loaders/GLTFLoader.js';
import { STLExporter } from './exporters/STLExporter.js';


// Set up variables
var camera, controls, scene, renderer, cube, container;
var guiControls, datGUI;
var hemiLight, dirLight;
var exporter;
var model;

init();

animate();

function init() {

	// Container for UI 
	container = document.getElementById( 'container' );
	
	guiControls = new function() {
		this.rotationX = 0.00;
		this.rotationY = 0.00;
		this.rotationZ = 0.00;
	}
	
	datGUI = new GUI();
	datGUI.add(guiControls, 'rotationX', 0, 360);
	datGUI.add(guiControls, 'rotationY', 0, 360);
	datGUI.add(guiControls, 'rotationZ', 0, 360);
	
	// Set up exporter
	exporter = new STLExporter();
	var buttonExportBinary = document.getElementById( 'exportBinary' );
	buttonExportBinary.addEventListener( 'click', exportBinary );
	
	
	// Create the scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xa0a0a0 );
	scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );

	// Create the renderer
	renderer = new THREE.WebGLRenderer();
	// Not sure what this does renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	// Create a camera
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.set( 3, 3, 3 );
	camera.lookAt( 0, 1, 0 );
	
	// Controls
	controls = new OrbitControls( camera, renderer.domElement );
	//controls.screenSpacePanning = true;
	controls.enablePan = false;
	controls.minDistance = 3;
	controls.maxDistance = 30;
	controls.target.set( 0, 2, 0 );
	//controls.maxPolarAngle = Math.PI * 0.495; //Hopefully restricts vertical camera rotations. Needs further adjustment
	
	controls.update();

	// Add lights
	hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
	//hemiLight.color.setHSL( 0.6, 1, 0.6 );
	//hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
	hemiLight.position.set( 0, 50, 0 );
	scene.add( hemiLight ); 


	
	dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
	//dirLight.color.setHSL( 0.1, 1, 0.95 );
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

	// Load a texture for the cube
	var texture = new THREE.TextureLoader().load( 'textures/crate.gif' );

	// Create a cube
	var geometry = new THREE.BoxGeometry();
	//var geometry = new THREE.BoxBufferGeometry( 200, 200, 200 );
	var material = new THREE.MeshBasicMaterial( { map: texture } );
	cube = new THREE.Mesh( geometry, material );
	cube.position.set(0, 1, 0);
	scene.add( cube );
	
	
	// Import object using GLFT loader
	// Used example code from https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_additive_blending.html
	var loader = new GLTFLoader();
	loader.load( 'gltfModels/Falchion.glb', function ( gltf ) {

		model = gltf.scene;
		scene.add( model );

		model.traverse( function ( object ) {

			if ( object.isMesh ) object.castShadow = true;

		} );

		animate(); // Not sure if I need this

	} );

	// Add Lines for references
	// Create a function to do this
	var material = new THREE.LineBasicMaterial( { color: 0x0000ff } ); // Blue
	var points = [];
	points.push( new THREE.Vector3( 0, 0, 0 ) );
	points.push( new THREE.Vector3( 0, 3, 0 ) ); // Y Axis
	var geometry = new THREE.BufferGeometry().setFromPoints( points );
	var line = new THREE.Line( geometry, material );
	scene.add( line );

	material = new THREE.LineBasicMaterial( { color: 0x00ff00 } ); // Green
	points.pop();
	points.push( new THREE.Vector3( 0, 0, 3 ) ); // Z Axis
	geometry = new THREE.BufferGeometry().setFromPoints( points );
	line = new THREE.Line( geometry, material );
	scene.add( line );
	
	material = new THREE.LineBasicMaterial( { color: 0xff0000 } ); // Red
	points.pop();
	points.push( new THREE.Vector3( 3, 0, 0 ) ); // X Axis
	geometry = new THREE.BufferGeometry().setFromPoints( points );
	line = new THREE.Line( geometry, material );
	scene.add( line );

	
	// Add ground
	var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
	mesh.rotation.x = - Math.PI / 2;
	mesh.receiveShadow = true;
	scene.add( mesh );
	
	// Add a grid to the ground     GridHelper( size : number, divisions : Number, colorCenterLine : Color, colorGrid : Color )
	var grid = new THREE.GridHelper( 100, 100);
	grid.material.opacity = 0.2;
	grid.material.transparent = true;
	scene.add( grid );

}
			
// function onWindowResize() {}			
/*function onWindowResize() {

	renderer.setSize( window.innerWidth, window.innerHeight );

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	//render();
}*/

function exportBinary() {
	var result = exporter.parse( cube, { binary: true } );
	saveArrayBuffer( result, 'test1.stl' );
}

var link = document.createElement( 'a' );
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
	cube.rotation.x = guiControls.rotationX * (Math.PI / 180);
	cube.rotation.y = guiControls.rotationY * (Math.PI / 180);
	cube.rotation.z = guiControls.rotationZ * (Math.PI / 180);

	requestAnimationFrame( animate );
	
	renderer.render( scene, camera );
}