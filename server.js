var express    = require("express");
var bodyParser = require("body-parser");
var request    = require('request');
var app        = express();

var base64     = require('./lib/base64.js');
var twitter    = require('./lib/twitter.js');

// Set up the port, variables, and static resources
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

// Enable the body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Handle the route url
app.get('/', function(req, res) {
    res.render('pages/index');
});

// Handle a submitted post
app.post('/search', function(req,res){
	var result = twitter.search.search(req.body.query);
	res.render('pages/index', { tweets: result, query: req.body.query })
});

// Start listening
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
