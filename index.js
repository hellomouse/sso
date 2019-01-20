const htpasswd = require('htpasswd-js');
const express = require('express');
const bodyParser = require('body-parser');
const redis = require("redis");
const crypto = require("crypto");
var client = redis.createClient();

client.on('error', function (err) {
    console.log(`redis encountered error: ${err}`);
});

const app = express();

/* config */
const port = process.env.PORT || 2971;
const domain = process.env.DOMAIN || 'hellomouse.net';
const htpasswd_loc = process.env.HTPASSWD || '/opt/tengine/conf/passwd';

/* actual login request */
app.use(bodyParser.json());
app.post('/auth', function (req, res) {
  htpasswd.authenticate({
    username: req.body.user,
    password: req.body.password,
    file: htpasswd_loc
  }).then((result) => {
    if (result) {
      const my_key = crypto.randomBytes(16).toString("base64").replace(/[=/+]/g, "");
      /* 604800000 miliseconds = 1 week */
      client.set(my_key, 'potato', 'EX', 604800000);
      res.cookie('ra_cookie', my_key, {expires: new Date(Date.now() + 604800000), secure: true, domain: domain});
      res.end('{"ok":true}');
    } else {
      res.end('{"ok":false}');
    }
  });
});


/* send static assets */
app.use('/', express.static('static'));

app.get('*', function(req, res) {
  console.log(req);
  console.log(res);
  res.end('');
});

app.listen(port, function () {
    console.log(`SSO Authentication Server running on 0.0.0.0:${port}`);
});
