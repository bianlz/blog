
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var mongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var flash = require('connect-flash');
var app = express();
var passport = require("passport"),
    GithubStrategy = require("passport-github").Strategy;


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(express.favicon(path.join(__dirname,'/public/images/favicon.ico')));
app.use(express.logger('dev'));
app.use(express.bodyParser({keepExtensions:true,uploadDir:'./public/images'}));
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
    secret:settings.cookieSecret,
    key:settings.db,
    cookie:{maxAge:1000*60*60*24*30},
    url:settings.url
}))
app.use(passport.initialize());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
passport.use(
    new GithubStrategy({
        clientID : "621e37e8ada9a3a7a6f6",
        clientSecret:"f0ddf8ccf2b7dffb3fd48ff59a5d6dd9c11761bd",
        callbackURL:"http://localhost:3000/github/callback"
    },function(accessToken,refreshToken,profile,done){
        done(null,profile);
    })
)
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
routes(app)
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
