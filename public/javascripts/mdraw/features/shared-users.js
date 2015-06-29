
/**
 * To show the users who else are working on the board
 */

define(["mdraw"],
       function(mdraw) {

           function startGreeting(view) {

               var friends = [];

               var io = mdraw.comm.socket;

               function me(){
               var name = mdraw.userName;
               if (!name){
                   name = 'unnamed';
               }
                   return name;
               }

               io.on('hello', function(friend) {
                    var io = this;
                   //io.name=friend;
                     if(friends.indexOf(friend) < 0) {
                         friends.push(friend);
                         view.showAdded(friend);
                         view.updateList(friends);
                         io.emit('hello', me());
                     }
                     });

               io.on('bye', function(friend) {
                         if(friends.indexOf(friend) >= 0) {
                             friends.splice(friends.indexOf(friend), 1);
                             view.showRemoved(friend);
                             view.updateList(friends);
                         }
                     });

	       io.on("joined", function () {
                 io.emit('hello', me());
		     });
           io.on('nameChanged', function(friend) {
               console.log(this);
               var io = this;

               console.log('received', friend);
               var oldName = friend.oldName;
               var newName = friend.newName;
               console.log('changing name for :', oldName, newName);
               friends.splice(friends.indexOf(oldName, 1));
               friends.push(newName);
               //io.name.newName;
               view.updateList(friends);


               //if(friends.indexOf(newName) < 0) {
               //    friends.push(friend);
               //    //view.showAdded(friend);
               //    view.updateList(friends);
               //    //io.emit('hello', me());
               //}
           });
           }

           var friendsView = function() {
               function setList(ul, friends) {
                   ul.empty();
                   $.each(friends, function(i, f) {
                              ul.append('<li>' + f + '</li>');
                          });
               }

               function notify(msg) {
                   setList($('#friendsicon .notify ul'), [msg]);
                   $('#friendsicon .notify').show().fadeOut(4000);
               }

               return {
                   showAdded: function(friend) {
                       notify(friend + ' joined');
                   },

                   showRemoved: function(friend) {
                       notify(friend + ' left');
                   },

                   updateList: function(friends) {
                       if(friends.length === 0) {
                           friends = ['<em>Home alone!</em>'];
                       }
                       setList($('#friendsicon .all ul'), friends);
                   }
               };
           };

           return {
               init: function() {
                   startGreeting(friendsView());
               }
           };
       });
