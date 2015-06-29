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
    var Nohm = require('nohm').Nohm;
    var BoardModel = require(__dirname + '/models/BoardModel.js');
    var ShapesModel = require(__dirname + '/models/ShapesModel.js');
    var UserModel = require(__dirname + '/models/UserModel.js');
    var redis = require('redis').createClient();
    var logFile = null;
    var fs = require('fs');
    var LogToFile = require("./server/logToFile");
    var favicon   = require('serve-favicon');

    login.authenticate();

    redis.select(4);
    Nohm.setPrefix('mdraw');

    redis.on("connect", function() {
      Nohm.setClient(redis);
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

      console.log("Matisse server listening on port %d in %s mode", 8000, app.settings.env);
      collaboration.collaborate(io);
      //require('./server/god-mode').enable(app, io, redis);
}).call(this);
