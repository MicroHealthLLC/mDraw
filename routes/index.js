var BoardModel = require(__dirname + '/../models/BoardModel.js');
var ShapesModel = require(__dirname + '/../models/ShapesModel.js');
var UserModel = require(__dirname + '/../models/UserModel.js');
var events = require('events');
var Scheduler = require('redis-scheduler');
var scheduler = new Scheduler({ host: 'localhost', port: 6379 });
var expirationTime = 2592000000; //1 month(ms)
var nohm = require(__dirname+'/../node_modules/nohm/lib/nohm.js').Nohm;


function boardRemoveHandler(data, key){
        var boardUrl = key;
        console.log(boardUrl);
        ShapesModel.find({board_url: "boards/" + boardUrl}, function (err, ids) {
            if (err) {
                console.log(err);
            }
            var len = ids.length;
            if (len === 0) {} else {
                ids.forEach(function (id) {
                    var shape = new ShapesModel();
                    var data = {};
                    shape.load(id, function (err, props) {
                        if (err) {
                            console.log(err);
                        }
                        shape.delete(data, function (err) {
                            console.log("***** Error while deleting ID:" + id + " errr:" + err);
                        });
                    });
                });
            }
        });

        // remove board
        BoardModel.find({url:boardUrl},function (err, ids) {
            if (err) {
                console.log(err);
            } else {
                ids.forEach(function (id) {
                    var board = new BoardModel();
                    var data = {};
                    board.load(id, function (err, props) {
                        if (err) {
                            return next(err);
                        } else {
                            board.remove();
                        }
                    });
                });
            }
        });

}



var MatisseServer = new function() {
    var collectBoards = function(req, res, boardIds, callback) {
        var boards = [], i = 0, props, board = new BoardModel(), boardCount = boardIds.length;

        boardIds.forEach(function (id) {
            var board = new BoardModel();
            board.load(id, function (err, props) {
                if (err) {
                    renderDashboard(res);
                } else {
                    boards.push ({
                        id:this.id,
  					    url: props.url,
					    name: props.name,
   					    container: props.container,
	   				    canvasWidth: props.canvasWidth,
		   			    canvasHeight: props.canvasHeight
                    });
                    if (++i === boardCount) {
                        callback(boards);
                    }
                }
            });
        });
        if (boardIds.length === 0) {
            callback(boards);
        }
    }

	var server = Object.create(new events.EventEmitter);


    server.render = function(req, res) {
        res.render('index', { title:'Matisse'});
	};

	return server;
}


exports.index = function (req, res) {
    Object.create(MatisseServer).render(req, res);
};

exports.favicon = function (req, res, next) {

};

/*
 * The function for boards
 */

exports.boards = {
    index:function (req, res, next) {
        var whiteBoard = new BoardModel();
	    var chars = "0123456789abcdefghiklmnopqrstuvwxyz";
        var string_length = 8;
        var requestedName = req.body.whiteboardName;
        whiteBoard.find({name: requestedName}, function (err, ids) {
            if (ids && ids.length>0){
                console.log('board already exists');
                whiteBoard.load(ids[0], function (err, props) {
                    if (err) {
                        console.log(err);
                        res.contentType('json');
                        res.send({
                            error: true
                        });
                    } else {
                        res.writeHead(302, {
                            'Location':'/boards/'+props.url
                        });
                        res.end();

                    }

                });
            } else{
                randomstring = '';
                var session_data = req.session.auth;
                //var userObj = new UserModel();
                //var userID = userObj.getUserID(session_data);
                //var userName = userObj.getUserFromSession(session_data).name;

                for (var i = 0; i < string_length; i++) {
                    var rnum = Math.floor(Math.random() * chars.length);
                    randomstring += chars.substring(rnum, rnum + 1);
                }

                if (req.body.whiteboardName === '') {
                  req.body.whiteboardName = randomstring;
                }
                var data = {
                    url:req.body.whiteboardName,
                    container: req.body.container,
                    canvasWidth: req.body.canvasWidth,
                    canvasHeight: req.body.canvasHeight,
                    name: req.body.whiteboardName,
                    createdBy: 'userName'
                };
                whiteBoard.store(data, function (err) {
                    if (err === 'invalid') {
                        next(whiteBoard.errors);
                    } else if (err) {
                        next(err);
                    } else {
                        var self = this;
                        //this is used to autoremove boards in 1 month.
                        //The database should be set up to emit expire events with --notify-keyspace-events Ex # E = Keyevent events, x = Expire events
                        self.getClient().set(req.body.whiteboardName, whiteBoard.id, function(){
                            scheduler.schedule({
                                key: req.body.whiteboardName,
                                expire: expirationTime,
                                handler: boardRemoveHandler
                                },
                                function (err) {
                                    if (err){
                                        console.log(err);
                                    }
                            });
                        });

                        //userObj.linkBoard(whiteBoard, userID, false);
                        res.writeHead(302, {
                            'Location':req.body.whiteboardName
                        });
                        res.end();

                    }
                });
            }
        });

    }


}

/*
 * For exposing things as aan API
 */
exports.api = {
    index:function (req, res, next) {
        ShapesModel.find(function (err, ids) {
            if (err) {
                return next(err);
            }
            var shapes = [];
            var len = ids.length;
            var count = 0;
            if (len === 0) {
                return res.json(shapes);
            }
            ids.forEach(function (id) {
                var shape = new ShapesModel();
                shape.load(id, function (err, props) {
                    if (err) {
                        return next(err);
                    }
                    shapes.push({
                        id:this.id,
                        palette:props.palette,
                        action:props.action,
                        args:props.args,
                        board_url:props.board_url
                    });
                    if (++count === len) {
                        res.json(shapes);
                    }
                });
            });
        });
    }
};
