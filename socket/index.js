/**
 * Created by leminhtoan on 2017/11/30.
 */
'use strict';

var _ = require('lodash');
var config = require('../config');
var redis = require('redis').createClient;
var adapter = require('socket.io-redis');
const util = require('../util');

var redis1 = require("redis");
var client = redis1.createClient();
client.on("error", function(err) {
    console.log("Error " + err);
});

client.hmset('superAdminHkey', {
    'superAdminID': 'admin',
    'Password': '123456',
}, redis.print);

client.hmset('bardeAdminHkey', {
    'bardeAdminID': 'bardeAdmin',
    'Password': '123456',
    'Deadline': '2018-12-30',
}, redis.print);

var barchatSign = false;
var adminchatSign = false;
var barchatnotice = "準備中";
var SuperAdminID, SuperAdminPassword;
var BardeAdminID, BardeAdminPassword, BardeAdminDeadline;
client.hget('superAdminHkey', 'superAdminID', function(err, value) {
    if (err) throw err;
    SuperAdminID = value;
    console.log('FF Super Admin ID=' + SuperAdminID);
});
client.hget('superAdminHkey', 'Password', function(err, value) {
    if (err) throw err;
    SuperAdminPassword = value;
    console.log('FF Super Admin ID=' + SuperAdminPassword);
});

client.hget('bardeAdminHkey', 'bardeAdminID', function(err, value) {
    if (err) throw err;
    BardeAdminID = value;
    console.log('FF Barde Admin ID=' + BardeAdminID);
});

client.hget('bardeAdminHkey', 'Password', function(err, value) {
    if (err) throw err;
    BardeAdminPassword = value;
    console.log('FF Barde Admin Password=' + BardeAdminPassword);
});
client.hget('bardeAdminHkey', 'Deadline', function(err, value) {
    if (err) throw err;
    BardeAdminDeadline = value;
    console.log('FF Barde Admin Deadline=' + BardeAdminDeadline);
});

var ioEvents = function(io) {
    var roomList = {}; // All random chatting rooms
    var waitingRoom = {}; // Waiting random room
    var wittyMessages = []; // Witty message list

    // var namespace = [
    //     "random", "mama"
    // ];
    var initRoom = function() {
        return {
            id: util.random(16),
            open: false,
            name: '',
            users: {},
            histories: []
        }
    };
    var namespaceList = {
        "random": "ランダームチャット",
        "mama": "ママチャット",
        "anything_talk": "とにかく話を聞いてほしい",
        "anything_listen": "とにかく話を聞いてあげたい",
        "bar_join": "Bar de 管理人"
            /*"bar_view": "Bar de 管理人" */
    };

    for (const namespace in namespaceList) {
        roomList[namespace] = {};
        waitingRoom[namespace] = {};

        // Rooms namespace
        io.of('/' + namespace).on('connect', function(socket) {
            console.log('Websocket connected, namespace= /' + namespace);
            var session = socket.request.session;

            var maxuser;
            if (namespace.indexOf("bar_join") >= 0) {
                maxuser = 8;
            } else {
                maxuser = config.room_user;
            }

            // If user is chatting, then re-add to room
            if (session.roomId != null && roomList[namespace][session.roomId] != null) {
                console.log('CHATTING');
                let currentRoomId = session.roomId;
                let userId = session.id;
                let userName = session.userName;

                // Re-add to room
                if (Object.keys(roomList[namespace][currentRoomId]['users']).length < maxuser) {
                    console.log("RE-ADD user to room");
                    socket.join(currentRoomId);

                    roomList[namespace][currentRoomId]['users'][userId] = userName;

                    socket.emit('updateUsersList', roomList[namespace][currentRoomId], true);
                    socket.broadcast.to(currentRoomId).emit('updateUsersList', roomList[namespace][currentRoomId], false);
                    socket.broadcast.to(currentRoomId).emit('addNotice', userName + "入りました");
                }
                // Init user
            } else {
                console.log('INIT');
                socket.emit('init', true);
            }

            // Join a room
            socket.on('join', function(userName) {
                console.log('JOIN');
                console.log(waitingRoom[namespace]);
                console.log(roomList[namespace]);
                let userId = session.id;

                // Check waiting room
                if (!waitingRoom[namespace].id) {
                    waitingRoom[namespace] = initRoom();
                }

                // If waiting room is not full, then add new user
                if (Object.keys(waitingRoom[namespace].users).length < maxuser) {
                    console.log("Add user");

                    if (!(userId in waitingRoom[namespace].users)) {
                        waitingRoom[namespace].users[userId] = userName;

                        // Join room
                        socket.join(waitingRoom[namespace].id);

                        // Add userName and roomId to session
                        session.roomId = waitingRoom[namespace].id;
                        session.userName = userName;

                        console.log('Join Room success');
                        socket.emit('joinRoomSuccess', waitingRoom[namespace].id, userName, userId);

                        socket.emit('updateUsersList', waitingRoom[namespace], true);
                        socket.broadcast.to(waitingRoom[namespace].id).emit('updateUsersList', waitingRoom[namespace], false);
                        socket.broadcast.to(waitingRoom[namespace].id).emit('addNotice', userName + "入りました");

                        if (namespace == 'bar_join') {
                            roomList[namespace][waitingRoom[namespace].id] = waitingRoom[namespace];
                        }
                    }
                }

                // If users in a room = 3 then start charting
                if (maxuser != 8 && Object.keys(waitingRoom[namespace].users).length >= maxuser) {
                    // Start chat
                    roomList[namespace][waitingRoom[namespace].id] = waitingRoom[namespace];
                    // Re-init waiting room
                    waitingRoom[namespace] = initRoom();
                    socket.broadcast.to(waitingRoom[namespace].id).emit('addNotice', "ルーム開始します。");
                    io.of('/manager').emit('updateRoomlist', true);
                }

            });

            // Update room to public/private
            socket.on('updateRoom', function(openFlg) {
                console.log('UPDATE ROOM PUBLIC/PRIVATE');
                let roomId = session.roomId;
                if (roomId) {
                    if (roomId == waitingRoom[namespace].id) {
                        waitingRoom[namespace].open = openFlg;
                        socket.emit('updateRoomType', openFlg);
                        socket.broadcast.to(roomId).emit('updateRoomType', openFlg);
                    }

                    if (roomId in roomList[namespace]) {
                        console.log('update');
                        roomList[namespace][roomId].open = openFlg;
                        socket.emit('updateRoomType', openFlg);
                        socket.broadcast.to(roomId).emit('updateRoomType', openFlg);
                        io.of('/home').emit('updateOpenRoomlist', true);
                        io.of('/manager').emit('updateOpenRoomlist', true);
                        io.of('/manager').emit('updateRoomlist', true);
                    }
                }
            });

            // Client get out
            socket.on('leftRoom', function() {
                console.log('USER LEFT ROOM');

                let roomId = session.roomId;
                let userName = session.userName;
                let userId = session.id;

                if (roomId) {
                    // Remove session data
                    delete session.roomId;
                    if (session.userName != null) delete session.userName;
                    session.save(function(error) {});

                    // Get out of room or waiting room
                    // Remove from waiting room
                    if (namespace != 'bar_join' && waitingRoom[namespace].users != null && userId in waitingRoom[namespace].users) {
                        delete waitingRoom[namespace].users[userId];
                    }

                    // Remove user from chat room
                    if (roomList[namespace][roomId] != null) {

                        if (namespace == 'bar_join' && session.adminID != '') {
                            delete roomList[namespace][roomId];
                            socket.broadcast.to(roomId).emit('removeRoom', '');
                            delete waitingRoom[namespace].id;
                            io.of('/home').emit('updateOpenRoomlist', true);
                            io.of('/manager').emit('updateOpenRoomlist', true);
                            return true;
                        }

                        if (Object.keys(roomList[namespace][roomId].users).length > 1 && userId in roomList[namespace][roomId].users) {
                            delete roomList[namespace][roomId].users[userId];
                        }

                        // Remove room when users count <= 1
                        if (Object.keys(roomList[namespace][roomId].users).length <= 1 && namespace != 'bar_join') {
                            delete roomList[namespace][roomId];
                            socket.broadcast.to(roomId).emit('removeRoom', '');
                            io.of('/manager').emit('updateRoomlist', true);
                        } else {
                            // Else, keep the room and emit to all user in room
                            socket.broadcast.to(roomId).emit('removeUser', {
                                userId: userId,
                                userName: userName
                            });
                        }
                    }
                }

            });

            // View-only
            socket.on('view-join', function(roomId) {
                if (roomList[namespace][roomId] != null) {
                    socket.join(roomId);
                    socket.emit('updateUsersList', roomList[namespace][roomId], true);
                }
            });
            // Left view-only mode
            socket.on('view-left', function(roomId) {
                if (roomList[namespace][roomId] != null) {
                    socket.leave(roomId);
                }
            });

            // Client disconnect
            socket.on('disconnect', function() {
                console.log('User disconnected');
                // Find current room that user in
                const userName = session.userName;
                const roomId = session.roomId;
                const userId = session.id;

                if (roomId) {
                    // Get out of room or waiting room
                    // Remove from waiting room
                    if (namespace != 'bar_join' && waitingRoom[namespace].users != null && userId in waitingRoom[namespace].users) {
                        delete waitingRoom[namespace].users[userId];
                    }

                    // Remove user from chat room
                    if (roomList[namespace][roomId] != null) {

                        if (namespace == 'bar_join' && session.adminID != '') {
                            delete roomList[namespace][roomId];
                            socket.broadcast.to(roomId).emit('removeRoom', '');
                            delete waitingRoom[namespace].id;
                            barchatSign = false;
                            adminchatSign = false;
                            barchatnotice = "準備中";
                            io.of('/home').emit('barchatnotice', barchatnotice);
                            io.of('/home').emit('updateOpenRoomlist', true);
                            io.of('/manager').emit('updateOpenRoomlist', true);
                            return true;
                        }

                        if (Object.keys(roomList[namespace][roomId].users).length > 1 && userId in roomList[namespace][roomId].users) {
                            delete roomList[namespace][roomId].users[userId];
                        }

                        // Remove room when users count <= 1
                        if (Object.keys(roomList[namespace][roomId].users).length <= 1 && namespace != 'bar_join') {
                            delete roomList[namespace][roomId];
                            socket.broadcast.to(roomId).emit('removeRoom', '');
                            io.of('/manager').emit('updateRoomlist', true);
                        } else {
                            // Else, keep the room and emit to all user in room
                            socket.broadcast.to(roomId).emit('removeUser', {
                                userId: userId,
                                userName: userName
                            });
                        }
                    }
                }

            });
            socket.on('addWitty', function(message) {
                /*
                var found = false;

                found = $.each(wittyMessages, function(i, value){
                    if (value === message){
                        found = true;
                        return;
                    }
                });*/
                var found = _.some(wittyMessages, function(value) {
                    return value === message;
                });
                if (!found) {
                    wittyMessages.push(message);

                    // Check max lenth
                    if (wittyMessages.length > config.maxWittyMessages) {
                        wittyMessages = wittyMessages.slice(wittyMessages.length - config.maxWittyMessages);
                    }
                    io.of('/home').emit('wittyMessages', wittyMessages);
                    io.of('/manager').emit('wittyMessages', wittyMessages);
                }
            });

            socket.on('forceUserExit', function(userId) {

                let roomId = session.roomId;
                var userName = roomList[namespace][roomId]['users'][userId];
                if (roomId) {
                    // Remove user from chat room
                    if (roomList[namespace][roomId] != null && userId in roomList[namespace][roomId].users) {
                        delete roomList[namespace][roomId].users[userId];
                        socket.emit('removeUser', {
                            userId: userId,
                            userName: userName
                        });
                        socket.broadcast.to(roomId).emit('removeUser', {
                            userId: userId,
                            userName: userName
                        });
                    }
                }
            });

            socket.on('session_init', function(data) {
                delete session.roomId;
                delete session.username;
                delete session.userId;
                session.save(function(error) {});
            });
            // When send chat message
            socket.on('messages', function(content) {
                console.log('Chat message');
                console.log(roomList[namespace]);
                console.log(session);
                let userId = session.id;

                // Check roomId
                if (session.roomId == null) {
                    socket.emit('errorMessage', "Chat error");
                } else {
                    var roomId = session.roomId;
                    if (roomList[namespace][roomId] != null) {
                        const userName = session.userName;
                        let message = {
                            userId: userId,
                            content: content,
                            date: Date.now(),
                            username: userName
                        };
                        console.log(message);

                        // Add message to history
                        roomList[namespace][roomId].histories.push(message);

                        // Emit message to client
                        socket.emit('broad', message);
                        socket.broadcast.to(session.roomId).emit('broad', message);
                    } else {
                        // Emit error
                        socket.emit('errorMessage', "Chat error");
                    }
                }
            });

            socket.on('bar_man_possible', function(data) {
                if (session.adminID != "") {
                    if (!barchatSign && !adminchatSign) {
                        socket.emit('barjoin_access', 2, session.adminID);
                    } else {
                        socket.emit('barjoin_access', 1, session.adminID);
                    }
                } else {
                    socket.emit('barjoin_access', 0, '');
                }
            });

            socket.on('barchatin', function(barname) {
                if (session.adminID == 'BardeAdmin') {
                    barchatSign = true;
                }
                if (session.adminID == 'Admin') {
                    adminchatSign = true;
                }
                barchatnotice = barname + " ママ営業中";
                roomList['bar_join'][waitingRoom['bar_join'].id].open = true;
                io.of('/home').emit('updateOpenRoomlist', true);
                io.of('/home').emit('barchatnotice', barchatnotice);
                //io.of('/manager').emit('barchatnotice', barchatnotice);

            });

            socket.on('barchatout', function(data) {
                barchatSign = false;
                adminchatSign = false;
                barchatnotice = "準備中";
                socket.emit('exitchat', session.adminID);
                io.of('/home').emit('barchatnotice', barchatnotice);
                //io.of('/manager').emit('barchatnotice', barchatnotice);
            });
            socket.on('join_bar', function() {
                if (Object.keys(roomList['bar_join']).length == 0) {
                    socket.emit('barstate', false, false);
                } else {
                    var barusers = Object.keys(roomList['bar_join'][waitingRoom['bar_join'].id].users).length;
                    if (barusers >= 8) {
                        socket.emit('barstate', true, false);
                    } else {
                        socket.emit('barstate', true, true);
                    }
                }
            });
            socket.on('view_bar', function() {
                let barRoom = [];
                if (Object.keys(roomList['bar_join']).length == 0) {
                    socket.emit('barroom', false, '');
                } else {
                    _.forOwn(roomList, function(rooms, namespace) {
                        _.forOwn(rooms, function(room) {
                            if (namespace == 'bar_join') {
                                barRoom = room;
                            }
                        });
                    });
                    console.log(barRoom);
                    socket.emit('barroom', true, barRoom);
                }
            });
        });
    }

    // Home screen
    io.of('/home').on('connect', function(socket) {

        var session = socket.request.session;
        session.adminID = "";
        session.save(function(error) {});
        // Send to all users
        socket.emit('barchatnotice', barchatnotice);
        socket.emit('wittyMessages', wittyMessages);
        socket.emit('updateOpenRoomlist', true);
        socket.on('updateOpenRooms', function(data) {
            let openRooms = {};
            _.forOwn(roomList, function(rooms, namespace) {
                openRooms[namespace] = [];
                _.forOwn(rooms, function(room) {
                    if (room.open) {
                        openRooms[namespace].push(room);
                    }
                });
            });
            socket.emit('openRooms', openRooms);
        });

    });

    io.of('/admin').on('connect', function(socket) {

        var session = socket.request.session;
        session.adminID = "";
        session.save(function(err) {});

        socket.emit('init', true);
        socket.on('admin_login', function(id, passwd) {
            var today = new Date();
            if (id == SuperAdminID && passwd == SuperAdminPassword) {
                session.adminID = "Admin";
                session.save(function(err) {});
                socket.emit('admin_state', true, 'super');
            } else if (id == BardeAdminID && passwd == BardeAdminPassword && DateCompare(BardeAdminDeadline, today)) {
                session.adminID = "BardeAdmin";
                session.save(function(err) {});
                socket.emit('admin_state', true, 'barde');
            } else {
                socket.emit('admin_state', false, 'fail');
            }
        });

        function DateCompare(strDeadline, today) {
            var strArr = strDeadline.split("-");
            var deadline = new Date(strArr[0], strArr[1] - 1, strArr[2]);
            console.log('deadline=' + deadline);
            if (today < deadline) {
                return true;
            }
            return false;
        }

    });

    io.of('/manager').on('connect', function(socket) {

        var session = socket.request.session;
        socket.emit('init', session.adminID);

        // Send to all users
        socket.emit('wittyMessages', wittyMessages);
        socket.emit('updateOpenRoomlist', true);
        socket.emit('updateRoomlist', true);

        socket.on('barlogout', function(data) {
            session.adminID = '';
            session.save(function(err) {});
        });

        socket.on('adminlogout', function(data) {
            session.adminID = '';
            session.save(function(err) {});
        });
        socket.on('updateOpenRooms', function(data) {
            let openRooms = {};
            _.forOwn(roomList, function(rooms, namespace) {
                openRooms[namespace] = [];
                _.forOwn(rooms, function(room) {
                    if (room.open) {
                        openRooms[namespace].push(room);
                    }
                });
            });
            socket.emit('openRooms', openRooms);
        });
        socket.on('updateRooms', function(data) {
            if (roomList) {
                let currRooms = {};
                _.forOwn(roomList, function(rooms, namespace) {
                    currRooms[namespace] = [];
                    _.forOwn(rooms, function(room) {
                        currRooms[namespace].push(room);
                    });
                });
                socket.emit('getRooms', currRooms);
            }
        });

        socket.on('removeWitty', function(message) {
            const idx = wittyMessages.indexOf(message);
            console.log('to be removed message=' + message);
            console.log(idx);
            wittyMessages = wittyMessages.filter(function(item) {
                return item !== message;
            })
            socket.emit('wittyMessages', wittyMessages);
            socket.broadcast.emit('wittyMessages', wittyMessages);
            io.of('/home').emit('wittyMessages', wittyMessages);
        });

        //Set bar passwd 
        socket.on('set_barpasswd', function(id, passwd, term) {
            console.log('JOIN');
            console.log('bardeAdminUserID=' + id);
            console.log('bardeAdminPasswd=' + passwd);
            console.log('bardeAdminDeadline=' + term);

            if (passwd && term) {

                client.hmset('bardeAdminHkey', {
                    'bardeAdminID': id,
                    'Password': passwd,
                    'Deadline': term,
                }, redis.print);
                BardeAdminID = id;
                BardeAdminPassword = passwd;
                BardeAdminDeadline = term;
                socket.emit('setbar_state', "Success");
            } else {
                socket.emit('setbar_state', "Fail");
            }
        });

    });
};



// Initial socket
var init = function(server) {
    let io = require('socket.io')(server);

    // Force Socket io use web socket only
    io.set('transports', ['websocket']);

    let port = config.redis.port;
    let host = config.redis.host;
    let password = config.redis.password;

    // Create subscriber and publisher Redis client
    let subClient = redis(port, host, { auth_pass: password });
    let pubClient = redis(port, host, { auth_pass: password, return_buffers: true, });
    io.adapter(adapter({ subClient, pubClient }));

    // Allow socket use session
    io.use((socket, next) => {
        let session = require('../session');
        session(socket.request, {}, next);
    });

    // Define all events
    ioEvents(io);

    return server;
};

module.exports = init;