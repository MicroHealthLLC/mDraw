/**
 * Author: Divya
 * Date: 02/27/12
 * Time: 12:40 PM
 * About this : Utility to register layouts based on the layout name and layout data provided.
 *
 */
define(["mdraw", "mdraw.main", "mdraw.ui", "mdraw.util"], function (mdraw, main, ui, util) {
    
	return {
		registerLayout : function (layoutName, layoutDesc) {			
			mdraw.layout[layoutName] = layoutDesc;
		},
		
		createLayoutsList: function () {
			var thisRef = this;
			var layoutName;
			var html = '<div id="layoutList" style="padding:15px"><b style="font-size:14px">Select a Layout: </b>';
			var layoutContainer = "<select id='layouts' style='width: 160px'>"
			for (layoutName in mdraw.layout) {				
				layoutContainer += '<optgroup label='+layoutName+ '>';
				for (var layoutType in mdraw.layout[layoutName].layouts) {					
					layoutContainer += '<option value='+layoutType+ ' id='+layoutType+'>'+layoutType;
				}
			}
			html += layoutContainer;
			$(document.getElementById('result')).append(html);	
			document.getElementById("layouts").onchange = function(){
				var val = document.getElementById('layouts').value;
				if (val == "uploadLayout") {
					$(document.getElementById("result")).append('<input id = "loadLayout" type="file" style="position: absolute; left: 18px; top: 90px;"/>');
				}				
			}			
		},
		
		setLayoutType: function (type) {
			var opt = document.getElementById(type);
			var group = opt.parentElement.label;				
			var args = mdraw.layout[group].layouts[type].toolAction();	
			if (args) {	
				for (var i = 0; i < args.length; i++) {
					mdraw.comm.sendDrawMsg({
						palette: "shapes",
						action: "rectangle",
						args: args[i]
					});
				}				
			}
		}
	}
});
