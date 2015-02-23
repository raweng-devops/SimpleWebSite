var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var xss = require('escape-html');
var fs = require('fs');

var app = express();
var statics = {'index.html':null};

app.use(session({
	secret: 'fjda;lkfjlsajdfljsa;jfd;laksjfwo',
	resave: true,
	cookie: {maxAge: 3000000, secure: false}
	}));
app.use(bodyParser.urlencoded({extended: true}));

// Request log string
function getReqLogStr(req) {
	var str = 'HTTP';
	str += ' ' + req.httpVersion;
	str += ' ' + req.method;
	str += ' ' + req.url;

	return str;
}

// Response log string
function getResLogStr(res) {
	var str = res.statusCode;
	str += ' ' + res.statusMessage;

	return str;
}

// Full request/response log string
function getLogStr(req, res) {
	return getReqLogStr(req) + ' ' + getResLogStr(res);
}

// Login check
function login(user, pwd) {
	return (user == 'foo' && pwd == 'bar');
}

// Callback for index page
function get_index(req, res, next) {
	//res.write("index.html\n");
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(statics['index.html']);
	next();
}

// Callback for login and display logined message
function post_index(req, res, next) {
	var sess = req.session;
	var str = '<br />';

	res.writeHead(200, {'Content-Type': 'text/html'});
	if(sess.user) {
		sess.views++;
		str += 'Hi ' + xss(sess.user);
		str += '!  This is the ' + sess.views;
		str += ' POST index.html\n';
	}
	else {
		if(login(req.body.user, req.body.pwd)) {
			sess.user = req.body.user;
			sess.views = 1;
			str += 'Hi ' + xss(sess.user);
			str += '!  This is the ' + sess.views;
			str += ' POST index.html\n';
		}
		else {
			str += 'POST index.html\n';
		}
	}
	res.end(statics['index.html'].replace('<div></div>', str));
	next();
}

// Callback for logout
function get_logout(req, res, next) {
	var sess = req.session;

	sess.destroy();
	res.redirect('/');
	next();
}

// Set the routes
app.get('/', get_index);
app.get('/index.html', get_index);
app.post('/index.html', post_index);
app.get('/logout.html', get_logout);

// Log all requests.
app.use(function(req, res) {
	console.log(getLogStr(req, res));
});

// Read the index.html into memory
fs.readFile('static/index.html', 'utf8', function(err, data) {
	if(err) {
		console.log("Read static/index.html failed!");
		process.exit(1);
	}
	else {
		statics['index.html'] = data;
	}
});

// Create node.js http server and listen on port
console.log('Start Web Server!');
app.listen(3000);
