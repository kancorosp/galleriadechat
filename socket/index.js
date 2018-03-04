/**
 * Created by leminhtoan on 2017/11/30.
 */
'use strict';

var _ = require('lodash');
var config = require('../config');
var redis  = require('redis').createClient;
var adapter = require('socket.io-redis');
const  util = require('../util');

var ioEvents = function (io) {
    var roomList = {};     // All random chatting rooms
    var waitingRoom = {};  // Waiting random room
    var wittyMessages = [];  // Witty message list

    // var namespace = [
    //     "random", "mama"
    // ];
    var initRoom = function () {
        return {
            id: util.random(16),
            open: false,
            name: '',
            users: {},
            histories: []
        }
    };
    var namespaceList = {
        "random": "ランダムチャット",
        "mama": "ママチャット",
        "anything_talk": "とにかく話を聞いてほしい",
        "anything_listen": "とにかく話を聞いてあげたい",
        "bar_join": "Bar de 管理人",
        "bar_view": "Bar de 管理人"
    };

    for(const namespace in namespaceList){
        roomList[namespace] = {};
        waitingRoom[namespace] = {};

        // Rooms namespace
        io.of('/' + namespace).on('connect', function (socket) {
            console.log('Websocket connected, namespace= /' + namespace);
            var session = socket.request.session;

            // If user is chatting, then re-add to room
            if(session.roomId != null && roomList[namespace][session.roomId] != null){
                console.log('CHATTING');
                let currentRoomId = session.roomId;
                let userId = session.id;
                let userName = session.userName;

                // Re-add to room
                if(Object.keys(roomList[namespace][currentRoomId]['users']).length < config.room_user){
                    console.log("RE-ADD user to room");
                    socket.join(currentRoomId);

                    roomList[namespace][currentRoomId]['users'][userId] = userName;

                    socket.emit('updateUsersList', roomList[namespace][currentRoomId], true);
                    socket.broadcast.to(currentRoomId).emit('updateUsersList', roomList[namespace][currentRoomId], true);
                    socket.broadcast.to(currentRoomId).emit('addNotice', userName + "入りました");
                }
                // Init user
            }else{
                console.log('INIT');
                socket.emit('init', true);
            }

            // Join a room
            socket.on('join', function (userName) {
                console.log('JOIN');
                console.log(waitingRoom[namespace]);
                console.log(roomList[namespace]);

                let userId = session.id;

                // Check waiting room
                if(!waitingRoom[namespace].id){
                    waitingRoom[namespace] = initRoom();
                }

                // If waiting room is not full, then add new user
                if(Object.keys(waitingRoom[namespace].users).length < config.room_user){
                    console.log("Add user");

                    if(!(userId in waitingRoom[namespace].users)){
                        waitingRoom[namespace].users[userId] = userName;

                        // Join room
                        socket.join(waitingRoom[namespace].id);

                        // Add userName and roomId to session
                        session.roomId = waitingRoom[namespace].id;
                        session.userName = userName;

                        console.log('Join Room success');
                        socket.emit('joinRoomSuccess', waitingRoom[namespace].id, userName, userId);

                        socket.emit('updateUsersList', waitingRoom[namespace], true);
                        socket.broadcast.to(waitingRoom[namespace].id).emit('updateUsersList', waitingRoom[namespace], true);
                        socket.broadcast.to(waitingRoom[namespace].id).emit('addNotice', userName + "入りました");
                    }
                }

                // If users in a room = 3 then start charting
                if(Object.keys(waitingRoom[namespace].users).length >= config.room_user){
                    // Start chat
                    roomList[namespace][waitingRoom[namespace].id] = waitingRoom[namespace];
                    // Re-init waiting room
                    waitingRoom[namespace] = initRoom();

                    socket.broadcast.to(waitingRoom[namespace].id).emit('addNotice', "ルーム開始します。");
                }
            });

            // Update room to public/private
            socket.on('updateRoom', function (openFlg) {
                console.log('UPDATE ROOM PUBLIC/PRIVATE');
                let roomId = session.roomId;
                if(roomId){
                    if(roomId == waitingRoom[namespace].id){
                        waitingRoom[namespace].open = openFlg;
                        socket.emit('updateUsersList', waitingRoom[namespace], true);
                        socket.broadcast.to(roomId).emit('updateUsersList', waitingRoom[namespace], true);
                    }

                    if(roomId in roomList[namespace]){
                        console.log('update')
                        roomList[namespace][roomId].open = openFlg;
                        socket.emit('updateUsersList', roomList[namespace][roomId], true);
                        socket.broadcast.to(roomId).emit('updateUsersList', roomList[namespace][roomId], true);
                    }
                }
            });

            // Client get out
            socket.on('leftRoom', function () {
                console.log('USER LEFT ROOM');

                let roomId = session.roomId;
                let userName = session.userName;
                let userId = session.id;

                if(roomId){
                    // Remove session data
                    delete session.roomId;
                    if(session.userName != null)  delete session.userName;

                    // Get out of room or waiting room
                    // Remove from waiting room
                    if(waitingRoom[namespace].users != null && userId in waitingRoom[namespace].users){
                        delete waitingRoom[namespace].users[userId];
                    }

                    // Remove user from chat room
                    if(roomList[namespace][roomId] != null){
                        if(Object.keys(roomList[namespace][roomId].users).length > 1 && userId in roomList[namespace][roomId].users){
                            delete roomList[namespace][roomId].users[userId];
                        }

                        // Remove room when users count <= 1
                        if(Object.keys(roomList[namespace][roomId].users).length <= 1) {
                            delete roomList[namespace][roomId];
                            socket.broadcast.to(roomId).emit('removeRoom', '');
                            // Else, keep the room and emit to all user in room
                        }else{
                            socket.broadcast.to(roomId).emit('removeUser', {
                                userId: userId,
                                userName: userName
                            });
                        }
                    }
                }

            });

            // View-only
            socket.on('view-join', function (roomId) {
                if(roomList[namespace][roomId] != null){
                    socket.join(roomId);
                }
            });
            // Left view-only mode
            socket.on('view-left', function (roomId) {
                if(roomList[namespace][roomId] != null){
                    socket.leave(roomId);
                }
            });

            // Client disconnect
            socket.on('disconnect', function () {
                console.log('User disconnected');
                // Find current room that user in
                const userName = session.userName;
                const roomId = session.roomId;
                const userId = session.id;

                // Remove from waiting room
                if(waitingRoom[namespace].users != null && userId in waitingRoom[namespace].users){
                    delete waitingRoom[namespace].users[userId];
                }

                // Remove user from chat room
                if(roomList[namespace][roomId] != null){
                    if(Object.keys(roomList[namespace][roomId].users).length > 1 && userId in roomList[namespace][roomId].users){
                        delete roomList[namespace][roomId].users[userId];
                    }

                    // Remove room when users count <= 1
                    console.log('OK');
                    console.log(roomList[namespace][roomId].users);
                    if(Object.keys(roomList[namespace][roomId].users).length <= 1) {
                        delete roomList[namespace][roomId];
                        socket.broadcast.to(roomId).emit('removeRoom', '');
                        // Else, keep the room and emit to all user in room
                    }else{
                        console.log('Remove user');
                        socket.broadcast.to(roomId).emit('removeUser', {
                            userId: userId,
                            userName: userName
                        });
                    }
                }
            });

            // When send chat message
            socket.on('messages', function (content) {
                console.log('Chat message');
                console.log(roomList[namespace]);
                console.log(session);
                let userId = session.id;

                // Check roomId
                if(session.roomId == null){
                    socket.emit('errorMessage', "Chat error");
                }else{
                    var roomId = session.roomId;
                    if(roomList[namespace][roomId] != null){
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
                    }else{
                        // Emit error
                        socket.emit('errorMessage', "Chat error");
                    }
                }
            })
        });
    }

    // Home screen
    io.of('/home').on('connect', function (socket) {
        console.log('WITTY MESSAGES: ');
        console.log(wittyMessages);

        // Send to all users
        socket.emit('wittyMessages', wittyMessages);

        // Get all public rooms
        if(roomList){
            let openRooms = {};
            _.forOwn(roomList, function (rooms, namespace) {
                openRooms[namespace] = [];
                _.forOwn(rooms, function (room) {
                    if(room.open){
                        openRooms[namespace].push(room);
                    }
                });
            });
            console.log('OPEN ROOMS: ');
            console.log(openRooms);
            socket.emit('openRooms', openRooms);
        }

        // When send witty message
        socket.on('addWitty', function (message) {
            console.log('Witty messages');
            console.log(message);

            wittyMessages.push(message);

            // Check max lenth
            if(wittyMessages.length > config.maxWittyMessages){
                wittyMessages = wittyMessages.slice(wittyMessages.length - config.maxWittyMessages);
            }

            socket.emit('wittyMessages', wittyMessages);
            socket.broadcast.emit('wittyMessages', wittyMessages);
        });
    })

};

// Initial socket
var init = function (server) {
    let io = require('socket.io')(server);

    // Force Socket io use web socket only
    io.set('transports', ['websocket']);

    let port = config.redis.port;
    let host = config.redis.host;
    let password = config.redis.password;

    // Create subscriber and publisher Redis client
    let subClient = redis(port, host, { auth_pass: password });
    let pubClient = redis(port, host, { auth_pass: password, return_buffers: true, });
    io.adapter(adapter({subClient, pubClient}));

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

