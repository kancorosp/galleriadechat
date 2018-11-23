var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express1' });
});

router.get('/admin', function(req, res, next) {
    res.render('admin', { title: 'Admin Page' });
})

router.get('/barman', function(req, res, next) {
    res.render('barman', { title: 'Bar de Manager Page' });
})

router.get('/superman', function(req, res, next) {
    res.render('superman', { title: 'Super Manager Page' });
})

router.get('/randomchat', function(req, res, next) {
    res.render('randomchat', { title: 'ランダムチャット' });
});

router.get('/mamachat', function(req, res, next) {
    res.render('mamachat', { title: 'ママチャット' });
});

router.get('/anythingchat', function(req, res, next) {
    res.render('anythingchat', { title: 'とにかく話を聞いてほしい /聞いてあげたい' });
});

router.get('/barchat', function(req, res, next) {
    res.render('barchat', { title: 'Bar de 管理人' });
});

router.get('/contact', function(req, res, next) {
    res.render('contact', { title: 'お問い合わせ' });
});

router.post('contact_after', function(req, res, next) {
    // send mail using AWS SES

    res.render('contact_after', { title: 'お問い合わせ' });
});

module.exports = router;
