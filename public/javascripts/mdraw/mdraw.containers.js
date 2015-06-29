/**
 * User: Bhavani Shankar
 * Date: 01/19/12
 * Time: 11:16 AM
 * About this : Creates all the device containers list and adds functionality for selection
 *
 */
define(["mdraw", "mdraw.main", "mdraw.ui", "mdraw.util", "mdraw.layouts"], function (mdraw, main, ui, util, layouts) {
	return {
		containerName: null,
		currSelection: null,
		canvasWidth: 0,
		canvasHeight: 0,
		registercontainer : function (containerName, containerDesc) {
			mdraw.containers[containerName] = containerDesc;
		},
		/**
		 * Create a  palette for each type of palette and add it in toolbar
		 * @method createPallette
		 * @param paletteName
		 */
		createContainerList: function () {
			var thisRef = this;
			var html = '<div id="containerlist" style="padding:15px"><b style="font-size: 14px">Select a Container:  </b>';
			var containerHolder = "<select id='containers' >";
			var contName;
			for (contName in mdraw.containers) {
				var containerObj = mdraw.containers[contName];
				var container_DisplayName = containerObj.displayName;
				containerHolder += '<option value=' + contName + ' id=' + container_DisplayName + '>' + container_DisplayName;
			}
			html += containerHolder;
			onButtonClick = function () {
				var whiteboard_name = window.location.pathname.replace('/boards/', '');
		    $('#boardName').text(whiteboard_name);
				thisRef.onOkClick();
			};
			$(document.getElementById('result')).append(html);
			// create Layouts list
			layouts.createLayoutsList();

			// create a field for canvas width
			var canvasWidth = "<div style='padding:15px'><b style='font-size: 14px'>Canvas Width: </b><input id='canvasWidth' type = 'text' value='1024'><b style='font-size: 14px'>px</b></div>";
			$(document.getElementById('result')).append(canvasWidth);
			$('#canvasWidth').val(mdraw.containers[$('#containers').val()].width);

			// create a field for canvas height
			var canvasHeight = "<div style='padding:15px'><b style='font-size: 14px'>Canvas Height: </b><input id='canvasHeight' type = 'text' value='768'><b style='font-size: 14px'>px</b></div>";
			$(document.getElementById('result')).append(canvasHeight);
			$('#canvasHeight').val(mdraw.containers[$('#containers').val()].height);

			// create an OK button on click of which provided container, layout and canvas width and height are rendered
			var btndiv = "<div style='padding:15px'><br><input type='button' value='Ok' onclick=onButtonClick() /></div>";
			$(document.getElementById('result')).append(btndiv);

			// update the canvas width and height fields with those of the selected container.
			$('#containers').change(function() {
				$('#canvasWidth').val(mdraw.containers[$('#containers').val()].width);
				$('#canvasHeight').val(mdraw.containers[$('#containers').val()].height);
			});
			popup('popUpDiv', 'closediv', 300, 300);
			$('#closediv').css('display', 'none');
		},
		onOkClick: function () {
			this.containerName = document.getElementById('containers').value;
			this.canvasWidth = document.getElementById('canvasWidth').value;
			this.canvasHeight = document.getElementById('canvasHeight').value;
			this.setContainer(this.containerName, 'new');
			var val = document.getElementById('layouts').value;
			if (val == "uploadLayout") {
				$(document.getElementById("result")).append('<input id = "loadLayout" type="file" />');
			}
			mdraw.comm.sendContainerInfo({
				action: "setContainer",
				containerName: this.containerName,
				canvasWidth: this.canvasWidth,
				canvasHeight: this.canvasHeight
			});
			$('#closediv').css('display', 'block');
		},
		setContainer: function (containerName, type, width, height) {
			var contObj = mdraw.containers[containerName];
			ui.deviceHeight = contObj.height;
			ui.deviceWidth = contObj.width;
			ui.canvasWidth = this.canvasWidth <= 0 ? contObj.width : this.canvasWidth;
			ui.canvasHeight = this.canvasHeight <= 0 ? contObj.height : this.canvasHeight;
			ui.deviceInnerHeight = contObj.innerHeight;
			ui.deviceInnerWidth = contObj.innerWidth;
			mdraw.xOffset = contObj.xOffset;
			mdraw.yOffset = contObj.yOffset;
			mdraw.main.init();
			if (contObj.src) {
				var imagsrc = '/images/'+contObj.src;
				$('#containerBody').css('background-image', 'url(' + imagsrc + ')');
			}
			$('#containerBody').css('position', 'relative');
			var cssObj = {
				'position': 'relative',
				'left' : contObj.xOffset,
				'top' : contObj.yOffset
			};
			$('#canvasId').css(cssObj);
			$('.canvas-container').css('width', this.canvasWidth);
			$('.canvas-container').css('height', this.canvasHeight);
			mdraw.deviceOffsetX = contObj.xOffset;
			mdraw.deviceOffsetY = contObj.yOffset;
			if (type === 'new') {
				closePopup('popUpDiv');
				closePopup('blanket');
				var val = document.getElementById('layouts').value;
				if (val == "uploadLayout") {
					mdraw.layoutURL = document.getElementById("loadLayout").files[0];
				}
				layouts.setLayoutType(val);
			}
        $('#loading').hide();
        $('#containerBody').css('visibility', 'visible');
		}

	};
});
