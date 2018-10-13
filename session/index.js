/**
 * Created by leminhtoan on 2017/11/30.
 */
'use strict';

// Use Redis as session store (for multiple server instance)
var session = require('express-session');
var redis = require('redis');
var config = require('../config');

var RedisStore = require('connect-redis')(session);

// Init session
var init = function () {
    var redisClient = redis.createClient(
        config.redis.port,
        config.redis.host,
        { auth_pass: config.redis.password }
    );
    var sessionStore = new RedisStore({client:redisClient});

    return session({
        store: sessionStore,
        secret: config.sessionSecret,
        resave: false,
        unset: 'destroy',
        saveUninitialized: true
    });
};

module.exports = init();