/**
 * User: Bahvani Shankar,Pradeep
 * Date: 12/26/11
 * Time: 11:16 AM
 * About this :Entry Point File, All Dom Ready functions need to be defined here
 */

define(["mdraw", "mdraw.fabric", "mdraw.comm", "mdraw.main", "mdraw.containers", "mdraw.containers.devices", "mdraw.layouts", "features/modified-by-user", "features/shared-users", "features/chat", "mdraw.layouts.content", "mdraw.palettes", "mdraw.palettes.basicshapes", "mdraw.palettes.wireframe", "mdraw.palettes.components", "mdraw.events", "../javascripts/thirdparty/csspopup.js", "mdraw.help"], function (mdraw, mfabric, Comm, main, containers, palettes, layouts, modifiedByUser, sharedUsers, chat) {

    "use strict";
	//Dom Ready function
	$(function () {
		var serverURL = window.location.origin,//change it to server ip or local ip for testing from other machines
      comm = new Comm(serverURL);
		/**
         * Initializes the application with the containers and layout set by user or asks your to choose them if not set yet
         * @method comm.onContainerDraw
         * @param data - container name and layout type
         *
         */
		comm.onContainerDraw = function (data) {
			/* get container and layout data from server if any and assing it */
			data == 'empty' ? mdraw.containerName = data : mdraw.containerName = data.container;
			/* if data is available then start application with this container and layout*/
			if (mdraw.containerName !== 'empty') {
				containers.containerName = mdraw.containerName;
				containers.canvasWidth = data.canvasWidth;
				containers.canvasHeight = data.canvasHeight;
				containers.setContainer(mdraw.containerName, 'old', containers.canvasWidth, containers.canvasHeight);
        $('#boardName').text(data.name);
		    $('#boardName').css("top",$('#boardName').width()+100);
				return;
			} else {
        $('#boardName').css("position", "relative");
        $('#boardName').css("overflow", "visible");
        console.log($('#boardName').html());
        $('#boardName').css("top",$('#boardName').width()+140);
      }
			/* if data is not available or user logs in for the first time, show him the list of container names and layouts to choose */
			//layouts.createLayoutsList();
			containers.createContainerList();
		}
		/**
		 * Displays welcome message with user name
		 * @param data - user details
		 */
              //$.get('/userinfo',
              //      function(info) {
		       // /* check if userName is missing, show welcome message*/
		       // if(mdraw.userName == null) {
              //              // key is login-service name like 'twitter', 'google'
              //              var userInfoKey = info.loginService.toLowerCase();
              //              var user = info[userInfoKey];
		       //     mdraw.userName = user.name;
              //              mdraw.userProfilePic = user.profile_image_url || user.picture;
              //              mdraw.userLoginService = info.loginService;
		       //     $('#userProfilePic').append('<img src="'+mdraw.userProfilePic+'" alt="pic" class="b-userpic"></img>');
		       //     $('#userProfilePicBig').append('<img src="'+mdraw.userProfilePic+'" alt="pic" class="b-userpic-big"></img>');
		       //     $('#userName').html(mdraw.userName);
		       //     $('#userLoginService').html(mdraw.userLoginService);
		       // }
              //      }, 'json');

	    /* Redirecting the user to home page when an active board is deleted.*/
	      comm.onDisableActiveBoard = function() {
	        $('div.inactive-alert').slideDown(400).delay(2000).fadeOut(1000);
	        setTimeout(function() {
            window.location = '/';
	        }, 3500);
	      };
	      mdraw.comm = comm;
              mdraw.main = main;
              main.addTools();

              modifiedByUser.init();
              sharedUsers.init();
              chat.init();
	  });
});
