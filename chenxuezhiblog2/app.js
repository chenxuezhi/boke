var express = require('express');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

var session = require('express-session');

var MongoStore = require('connect-mongo')(session);

var bodyParser = require('body-parser');

var routes = require('./routes/index');
var user = require('./routes/user');
var article = require('./routes/article');
require('./db');
var app = express();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html',require('ejs').__express);


app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
var settings = require('./settings');
var flash = require('connect-flash');
app.use(session({
  secret:'zfpx',
  resave:true,
  saveUninitialized:true,
  store:new MongoStore({
    url:settings.dbUrl
  })
}));

app.use(flash());
app.use(function(req,res,next){
  res.locals.success = req.flash('success').toString();
  res.locals.error = req.flash('error').toString();
  res.locals.user = req.session.user;
  res.locals.keyword = '';
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);
app.use('/user', user);
app.use('/article', article);
app.use(function(req, res, next) {
  res.render('404');
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.error(err);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
