// Import stuff
import * as THREE from '../js/three.module.js';
import { OrbitControls } from '../controls/OrbitControls.js';
import Stats from './jsm/libs/stats.module.js';
import { GUI } from './jsm/libs/dat.gui.module.js';
import { GLTFLoader } from '../loaders/GLTFLoader.js';
import { STLExporter } from '../exporters/STLExporter.js';


// Set up variables
var camera, controls, scene, renderer, container, stats;
var hemiLight, dirLight;
var exporter;
var model, skeleton, mixer, clock;
var pendulum;

var crossFadeControls = [];

var ground, grid;

var currentBaseAction = 'idle';

const allActions = [];
const baseActions = {
	idle: { weight: 1 },
	walk: { weight: 0 },
	run: { weight: 0 }
};
const additiveActions = {
	sneak_pose: { weight: 0 },
	sad_pose: { weight: 0 },
	agree: { weight: 0 },
	headShake: { weight: 0 }
};
var panelSettings, numAnimations;


init();

animate();

function init() {

	console.log("Version 4")
	clock = new THREE.Clock();

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
	camera.position.set( 25, 35, 25 );
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
	
	// Not sure 100% what this does
	stats = new Stats();
	container.appendChild( stats.dom );
	
	
	
	// Import object using GLFT loader
	var loader = new GLTFLoader();
	/*loader.load( 'models/gltf/GhostPirate.glb', function ( gltf ) {

		model = gltf.scene;
		//model.material.flatShading = false;
		
		scene.add( model );

		model.traverse( function ( object ) {
			if ( object.isMesh ) object.castShadow = true;
		} );
	} ); */
	
	loader.load( 'models/gltf/Xbot32mm.glb', function ( gltf ) {

		model = gltf.scene;
		scene.add( model );

		model.traverse( function ( object ) {

			if ( object.isMesh ) object.castShadow = true;

		} );

		skeleton = new THREE.SkeletonHelper( model );
		skeleton.visible = false;
		scene.add( skeleton );

		var animations = gltf.animations;
		mixer = new THREE.AnimationMixer( model );

		numAnimations = animations.length;

		for ( let i = 0; i !== numAnimations; ++ i ) {

			let clip = animations[ i ];
			const name = clip.name;

			if ( baseActions[ name ] ) {

				const action = mixer.clipAction( clip );
				activateAction( action );
				baseActions[ name ].action = action;
				allActions.push( action );

			} else if ( additiveActions[ name ] ) {

				// Make the clip additive and remove the reference frame

				THREE.AnimationUtils.makeClipAdditive( clip );

				if ( clip.name.endsWith( '_pose' ) ) {

					clip = THREE.AnimationUtils.subclip( clip, clip.name, 2, 3, 30 );

				}

				const action = mixer.clipAction( clip );
				activateAction( action );
				additiveActions[ name ].action = action;
				allActions.push( action );

			}

		}

		createPanel();
	} );
	
	
	
	

	

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
	
	stats.update();
	
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








