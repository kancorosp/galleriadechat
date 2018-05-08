/**
 * Created by leminhtoan on 2017/11/29.
 */
var express = require('express');
var router = express.Router();

/* GET chat page. */
router.get('/', function(req, res, next) {
    res.render('chat', { title: 'Chat sample' });
});

// Random chat room
router.get('/random', function(req, res, next) {
    res.render('chat/random', { title: 'Chat random' });
});

// Mama chat room
router.get('/mama', function(req, res, next) {
    res.render('chat/mama', { title: 'Chat mama' });
});

// Anything listen chat room
router.get('/anything_listen', function(req, res, next) {
    res.render('chat/anything_listen', { title: 'Chat anything listen' });
});

// Anything talk chat room
router.get('/anything_talk', function(req, res, next) {
    res.render('chat/anything_talk', { title: 'Chat anything listen' });
});

// Bar chat room
router.get('/bar_join', function(req, res, next) {
    res.render('chat/bar_join', { title: 'Chat bar' });
});

router.get('/bar_join_man', function(req, res, next) {
    res.render('chat/bar_join_man', { title: 'Chat bar' });
});
// Bar chat room
router.get('/bar_view', function(req, res, next) {
    res.render('chat/bar_view', { title: 'Chat bar' });
});

// View a public chat room
router.get('/view/:namespace', function(req, res, next) {
    var namespace = req.params.namespace;
    var name = '';
    switch (namespace) {
        case 'random':
            name = 'ランダームチャット';
            break;
        case 'mama':
            name = 'ママチャット';
            break;
        case 'anything_talk':
            name = 'とにかく話を聞いてほしい';
            break;
        case 'anything_listen':
            name = 'とにかく話を聞いてあげたい';
            break;
        case 'bar_join':
            name = 'Bar de 管理人';
            break;
        case 'bar_view':
            name = 'Bar de 管理人';
            break;
    }
    res.render('chat/view', { namespace: namespace, name: name, roomId: req.query.roomId })
});

//========== API ============//
// Update session when join a room
router.post('/join_room', function(req, res, next) {
    //console.log(req.body);
    // Update session
    req.session.roomId = req.body.roomId;
    req.session.userName = req.body.userName;
    res.json({ message: 'Success' });
});

// Remove session when left a room
router.get('/left_room', function(req, res, next) {
    // Update session
    if (req.session.roomId != null) delete req.session.roomId;
    if (req.session.userName != null) delete req.session.userName;
    res.json({ message: 'Success' });
});

module.exports = router;