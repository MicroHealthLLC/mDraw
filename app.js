var noop = function() {}
/**
 * Module dependencies.
 */
application = (function () {
    var express = require('express');
    var Resource = require('express-resource');
    var routes = require('./routes');
    var everyauth = require('everyauth');
    var collaboration = require('./server/collaboration');
    var login = require('./server/login');
    var compression = require('compression');
    var cookieParser = require('cookie-parser');
    var session = require('express-session');
    var bodyParser = require('body-parser');
    var methodOverride = require('method-override');
    var multer         = require('multer');
    var Nohm = require('nohm').Nohm;
    var nohm = require('nohm').Nohm;
    var BoardModel = require(__dirname + '/models/BoardModel.js');
    var ShapesModel = require(__dirname + '/models/ShapesModel.js');
    var UserModel = require(__dirname + '/models/UserModel.js');
    var redis = require('redis').createClient();
    var logFile = null;
    var fs = require('fs');
    var LogToFile = require("./server/logToFile");
    var favicon   = require('serve-favicon');
    var jsonfile = require('jsonfile');

    login.authenticate();

    redis.select(4);
    Nohm.setPrefix('mdraw');

    redis.on("connect", function() {
      Nohm.setClient(redis);

      var file = __dirname + '/tmp/data.json';
      var obj = {name: 'JP'};

      // BoardModel.find({name: 'hello'}, function(err, ids) {
      //   console.log(ids);
      // });
      // BoardModel.load(85, function(err, properties) {
      //   console.log(properties);
      // });
      // ShapesModel.find({board_url: 'boards/abcd'}, function(err, ids) {
      //   console.log(ids);
      //   var data = [];
      //   for (var i = 0; i < ids.length; i++) {
      //     (function(ids, data, i) {
      //       ShapesModel.load(ids[i], function(err, properties) {
      //         data.push(properties);
      //         if ((ids.length - 1) === i) {
      //           console.log(data);
      //           jsonfile.writeFileSync(file, data);
      //         }
      //       });
      //     }(ids, data, i));
      //   }
      // });


      // ShapesModel.load(86, function(err, properties) {
      //   console.log(properties);
      // });
      // var shape = nohm.factory('Shapes');
      // shape.id = 82;
      // shape.remove();
      /*this userModel object must go here after*/
      /*establishing Nohm connection in the redis and to avoid the error of*/
      /*Warning: setClient() received a redis client that is not connected yet. Consider waiting for an established connection before setting it*/
      UserModel.find(function(err,userIds) {
          if (err){
              console.log("***Error in finding users***"+err);
          }
          else{
              userIds.forEach(function (userid) {
                  var user = new UserModel();
                  user.load(userid, function (err, props) {
                      user.getAll('Board', 'sharedBoard', function(err, ids) {
                          if(!err) {
                              ids.forEach(function (id) {
                                  var board = new BoardModel();
                                  board.load(id, function (err, props) {
                                      board.link(user, 'userShared');
                                      board.save(noop);
                                  });
                              });
                          }
                          else {
                              console.log("***Error in unlinking sharedBoard from other users***"+err);
                          }
                      });

                      user.getAll('Board', 'ownedBoard', function(err, bids) {
                          if(!err) {
                              bids.forEach(function (bid) {
                                  var sboard = new BoardModel();
                                  sboard.load(bid, function (err, props) {
                                      sboard.link(user, 'userOwned');
                                      sboard.save(noop);
                                  });
                              });
                          } else {
                              console.log("***Error in linking ownedBoard from other users***"+err);
                          }
                      });

                  });
              });
          }
      });
      console.log("Nohm Connected to Redis Client");
    });

    redis.on("error", function (err) {
        console.log("Error %s", err);
    });

    var app  = express();

    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(favicon(__dirname + '/public/favicon.ico'));
    app.use('/stylesheets', express.static(__dirname + '/public/stylesheets'));
    app.use('/javascripts', express.static(__dirname + '/public/javascripts'));
    app.use('/images', express.static(__dirname + '/public/images'));

    app.use(cookieParser());
    app.use(session({
        secret:'foobar',
        resave: true,
        saveUninitialized: true
    }));
    app.use(bodyParser.urlencoded({
      extended: true
    }));
    app.use(everyauth.middleware());
    app.use(methodOverride());
    app.use(compression(__dirname + '/public'));
    app.use(multer({
    dest:'uploads',
    rename: function (fieldname, filename) {
      return filename + Date.now();
    },
    onFileUploadStart: function (file) {
      console.log(file.originalname + ' is starting ...');
    },
    onFileUploadComplete: function (file) {
      console.log(file.fieldname + ' uploaded to  ' + file.path);
    //done=true;
    }
  }));

    // Routes
    app.get('/', routes.index);
    app.get('/boards', routes.boards.index);
    app.get('/api', routes.api.index);
    app.post('/boards', routes.boards.index);
    // app.post('/boards/update', routes.boards.update);
    // app.post('/remove', routes.boards.remove);
    app.get('/about', function (req, res, next) {
	    res.sendfile(__dirname + '/about.html');
    });

    app.route('/api/json')
      .get(function(req, res, next) {
        var fs    = require('fs');
        var url   = require('url');
        var query = url.parse(req.url, true).query;

        var boardName = query.name.slice(1, query.name.length);
        // var boardName = req.headers.referer.split('boards')[1];
        // console.log(req.params);
        // fs.writeFile(__dirname + '/tmp/' + req.params.boardName + '.json');
        res.download(__dirname + '/tmp/data.json');
      })
      .post(function(req, res, next) {
        /*get the current board*/
        var boardName = req.headers.referer.split('boards')[1];
        ShapesModel.find({board_url: 'boards' + boardName}, function(err, ids) {
          console.log(ids);
          /*delete the previous one*/

          var data = [];
          for (var i = 0; i < ids.length; i++) {
            (function(ids, data, i) {
              var shape = nohm.factory('Shapes');
              shape.id = ids[i];
              shape.remove();
            }(ids, data, i));
          }
        });

        /*get the path of the json file*/
        var path = req.files.canvas.path;
        jsonfile.readFile(path, function(err, obj) {
          for(var i = 0; i < obj.length; i++) {
            (function(obj, i) {
              var newShape = nohm.factory('Shapes');
              newShape.p({
                modifiedBy: obj[i].modifiedBy,
                palette: obj[i].palette,
                action: obj[i].action,
                name: obj[i].name,
                board_url: 'boards' + boardName,
                shapeId: obj[i].shapeId,
                args: obj[i].args
              });

              newShape.save();
              if (i === (obj.length - 1)) {
                res.sendStatus(200);
              }
            }(obj, i));
          }
        });
      });

    // app.get('/userinfo', routes.userinfo);

    var logErrorOrExecute = function (err, param, callback) {
        if (err) {
            console.log(err);
        }
        else {
            if (callback) {
                callback(param);
            }
        }
    };

    var redirectToHome = function(req, res) {
        res.writeHead(302, {
            'Location': 'http://'+req.headers.host
        });
        if(req.session) {
            req.session.redirectPath = req.url;
        }
        res.end();
    };

    app.resource('boards', {
        show:function (req, res, next) {
            //if (req.loggedIn) {
            if (1) {
                if (req.params.id != "favicon") {
                    var whiteBoard = new BoardModel();


                    whiteBoard.find({url: req.params.board.replace(/[^a-zA-Z 0-9]+/g,'')}, function (err, ids) {
                        if (err) {
                            redirectToHome(req, res);
                        }
                        else {
                            if (ids && ids.length != 0) {
                                //var session_data = req.session.auth;
                                //var userObj = new UserModel();
                                //var userID = userObj.getUserID(session_data);
                                //var userName = userObj.getUserFromSession(session_data).name;
                                whiteBoard.load(ids[0], function(id) {
                                });
                                //UserModel.find({userID:userID}, function(err,ids) {
                                //    if (err){
                                //    }
                                //    else{
                                //        var user = new UserModel;
                                //        user.load(ids[0], function (err, props) {
                                //            if (err) {
                                //                return err;
                                //            }
                                //            user.belongsTo(whiteBoard, 'ownedBoard', function(err, relExists) {
                                //                if (relExists) {
                                //                } else {
                        	     //                   if(whiteBoard.property('createdBy')=="") whiteBoard.property('createdBy',userName);
                                //                    user.link(whiteBoard, 'sharedBoard');
                                //                    whiteBoard.link(user, 'userShared');
                                //                    user.save(noop);
                                //                    whiteBoard.save(noop);
                                //                }
                                //            });
                                //        });
                                //    }
                                //});
                                res.sendFile('/board.html',{root: __dirname});
                            }
                            else {
                                redirectToHome(req, res);
                            }
                        }
                    });
                }
            }
            else {
                redirectToHome(req, res);
            }
        }
    });

      var http = require('http');
      var server = http.createServer(app);
      var io = require('socket.io')(server);

      server.listen(8000);

      console.log("mDraw server listening on port %d in %s mode", 8000, app.settings.env);
      collaboration.collaborate(io);
      //require('./server/god-mode').enable(app, io, redis);
}).call(this);
