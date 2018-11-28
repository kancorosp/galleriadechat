
var nodemailer = require('nodemailer');

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

router.post('/contact_after', function(req, res, next) {
    
    var to = req.body.mail;
    var name = req.body.name;
    var message = req.body.message;
    if (to && name && message) {
        /**
         * Method using AWS SES SMTP
         */
        //create reusable transporter object using the default SMTP transport
        var transporter = nodemailer.createTransport({
            host: 'email-smtp.us-west-2.amazonaws.com',
            requireTLS: true,
            port: 25,
            auth: {
                user: 'AKIAJYXYG6ALN52EW3HQ',
                pass: 'AuUpisjkRFVGhzO3jeP06XdkifvsGq2hVc7jxrpq0aBw'
            }
        });

        // setup email data with unicode symbols
        var mailOptions = {
            from: '"'+name+'" <galleriadechat8@gmail.com>', // sender address
            to: 'galleriadechat@gmail.com', // list of receivers
            replyTo: to,
            subject: 'お問い合わせ', // Subject line
            text: message, // plain text body
            html: '<b>'+message+'</b>' // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
        
        
        /**
         * Method using AWS SES API
         */
        // var aws = require('aws-lib');

        // var accessKeyId = 'AKIAI5QE63WOH7VKCSJA';
        // var secretAccessKey = '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';
        
        // ses = aws.createSESClient(accessKeyId, secretAccessKey);
        
        // ses.call("GetSendQuota", {}, function(err, result) {
        //   console.log(JSON.stringify(result));
        // });
        
        // ses.call("GetSendStatistics", {}, function(err, result) {
        //   console.log(JSON.stringify(result));
        // });
        
        // ses.call("ListVerifiedEmailAddresses", {}, function(err, result) {
        //   console.log(JSON.stringify(result));
        // });
        
        // var recipient_address = 'soil_312_1117@yahoo.co.jp';
        // var sender_address = 'suisun_312@yahoo.co.jp';
        // var send_args = {
        //     'Destination.ToAddresses.member.1': recipient_address,
        //     'Message.Body.Text.Charset': 'UTF-8',
        //     'Message.Body.Text.Data': 'Hello text body!',
        //     'Message.Body.Html.Charset': 'UTF-8',
        //     'Message.Body.Html.Data': '<b>Hello body!</b>',
        //     'Message.Subject.Charset': 'UTF-8',
        //     'Message.Subject.Data': 'Test subject',
        //     'Source': sender_address
        // };
        // ses.call('SendEmail', send_args, function(err, result) {
        //     console.log(result);
        // });
        res.render('contact_after', { title: 'お問い合わせ' });
    } else {
        res.render('contact', { title: 'お問い合わせ', message: 'メール送信に失敗しました。入力情報をご確認してください。' });
    }
});

module.exports = router;
