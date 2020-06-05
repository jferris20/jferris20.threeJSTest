// Set up GUI

<script type="module">
	import { GUI } from '/gui/dat.gui.module.js';

	var guiControls, datGUI;

	function setGUI() {

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
	}
</script>