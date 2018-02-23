var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express1' });
});

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

module.exports = router;
