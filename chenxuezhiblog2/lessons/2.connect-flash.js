var express = require('express');
var app = express();
var session = require('express-session');
var flash = require('connect-flash');
app.use(session({
    secret: 'zfpx',
    resave: true,
    saveUninitialized: true
}));
app.use(function (req, res, next) {
    req.flash = function (type, msg) {
        if (msg) {
            var messages = req.session[type];
            if (messages) {
                messages.push(msg);
            } else {
                req.session[type] = [msg];
            }
        } else {
            var messages  =  req.session[type];
            delete req.session[type];
            return messages;
        }
    }
    next();
});

app.get('/write', function (req, res) {
    req.flash('success', '成功1');
    req.flash('success', '成功2');
    req.flash('error', '失败1');
    req.flash('error', '失败2');
    res.redirect('/read');
});
app.get('/read', function (req, res) {
    var msg = req.flash('success');
    console.log('msg', msg);
    var msg = req.flash('error');
    console.log('msg2', msg);
    res.send(msg);
});

app.listen(9090);