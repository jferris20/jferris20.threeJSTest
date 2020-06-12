// Import stuff
import * as THREE from '../js/three.module.js';
import { OrbitControls } from '../controls/OrbitControls.js';
import Stats from '../libs/stats.module.js';
import { GUI } from '../gui/dat.gui.module.js';
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

function init() {

	console.log("Version 9")
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
	
	loader.load( 'models/gltf/Xbot.glb', function ( gltf ) {

		model = gltf.scene;
		scene.add( model );

		model.traverse( function ( object ) {

			if ( object.isMesh ) object.castShadow = true;

		} );

		skeleton = new THREE.SkeletonHelper( model );
		skeleton.visible = true;
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
	} );
	

	createPanel();

	createGround();
	
	animate();
	
}


function exportBinary() {
	var result = exporter.parse( model, { binary: true } );
	saveArrayBuffer( result, 'test2.stl' );
}

/*var link = document.createElement( 'a' ); // Not 100% certain what this does
link.style.display = 'none';
document.body.appendChild( link );*/

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

	for ( let i = 0; i !== numAnimations; ++ i ) {

		const action = allActions[ i ];
		const clip = action.getClip();
		const settings = baseActions[ clip.name ] || additiveActions[ clip.name ];
		settings.weight = action.getEffectiveWeight();

	}

	// Get the time elapsed since the last frame, used for mixer update

	var mixerUpdateDelta = clock.getDelta();

	// Update the animation mixer, the stats panel, and render this frame

	mixer.update( mixerUpdateDelta );

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

/***********************************************
* Animation stuff
***********************************************/
function activateAction( action ) {

	const clip = action.getClip();
	const settings = baseActions[ clip.name ] || additiveActions[ clip.name ];
	setWeight( action, settings.weight );
	action.play();

}

function modifyTimeScale( speed ) {

	mixer.timeScale = speed;

}

function prepareCrossFade( startAction, endAction, duration ) {

	// If the current action is 'idle', execute the crossfade immediately;
	// else wait until the current action has finished its current loop

	if ( currentBaseAction === 'idle' || ! startAction || ! endAction ) {

		executeCrossFade( startAction, endAction, duration );

	} else {

		synchronizeCrossFade( startAction, endAction, duration );

	}

	// Update control colors

	if ( endAction ) {

		const clip = endAction.getClip();
		currentBaseAction = clip.name;

	} else {

		currentBaseAction = 'None';

	}

	crossFadeControls.forEach( function ( control ) {

		const name = control.property;

		if ( name === currentBaseAction ) {

			control.setActive();

		} else {

			control.setInactive();

		}

	} );

}

function synchronizeCrossFade( startAction, endAction, duration ) {

	mixer.addEventListener( 'loop', onLoopFinished );

	function onLoopFinished( event ) {

		if ( event.action === startAction ) {

			mixer.removeEventListener( 'loop', onLoopFinished );

			executeCrossFade( startAction, endAction, duration );

		}

	}

}

function executeCrossFade( startAction, endAction, duration ) {

	// Not only the start action, but also the end action must get a weight of 1 before fading
	// (concerning the start action this is already guaranteed in this place)

	if ( endAction ) {

		setWeight( endAction, 1 );
		endAction.time = 0;

		if ( startAction ) {

			// Crossfade with warping

			startAction.crossFadeTo( endAction, duration, true );

		} else {

			// Fade in

			endAction.fadeIn( duration );

		}

	} else {

		// Fade out

		startAction.fadeOut( duration );

	}

}

// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
// the start action's timeScale to ((start animation's duration) / (end animation's duration))

function setWeight( action, weight ) {

	action.enabled = true;
	action.setEffectiveTimeScale( 1 );
	action.setEffectiveWeight( weight );

}


function createPanel() {

	var panel = new GUI( { width: 310 } );

	var folder1 = panel.addFolder( 'Base Actions' );
	var folder2 = panel.addFolder( 'Additive Action Weights' );
	var folder3 = panel.addFolder( 'General Speed' );

	panelSettings = {
		'modify time scale': 1.0
	};

	const baseNames = [ 'None', ...Object.keys( baseActions ) ];

	for ( let i = 0, l = baseNames.length; i !== l; ++ i ) {

		const name = baseNames[ i ];
		const settings = baseActions[ name ];
		panelSettings[ name ] = function () {

			const currentSettings = baseActions[ currentBaseAction ];
			const currentAction = currentSettings ? currentSettings.action : null;
			const action = settings ? settings.action : null;

			prepareCrossFade( currentAction, action, 0.35 );

		};

		crossFadeControls.push( folder1.add( panelSettings, name ) );

	}

	for ( const name of Object.keys( additiveActions ) ) {

		const settings = additiveActions[ name ];

		panelSettings[ name ] = settings.weight;
		folder2.add( panelSettings, name, 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) {

			setWeight( settings.action, weight );
			settings.weight = weight;

		} );

	}

	folder3.add( panelSettings, 'modify time scale', 0.0, 1.5, 0.01 ).onChange( modifyTimeScale );

	folder1.open();
	folder2.open();
	folder3.open();

	crossFadeControls.forEach( function ( control ) {

		control.classList1 = control.domElement.parentElement.parentElement.classList;
		control.classList2 = control.domElement.previousElementSibling.classList;

		control.setInactive = function () {

			control.classList2.add( 'control-inactive' );

		};

		control.setActive = function () {

			control.classList2.remove( 'control-inactive' );

		};

		const settings = baseActions[ control.property ];

		if ( ! settings || ! settings.weight ) {

			control.setInactive();

		}

	} );

}








