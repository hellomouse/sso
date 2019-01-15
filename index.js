const htpasswd = require('htpasswd-js');
const express = require('express');
const bodyParser = require('body-parser');
const redis = require("redis");
var client = redis.createClient();

client.on('error', function (err) {
    console.log(`redis encountered error: ${err}`);
});

const app = express();

/* config */
const port = process.env.PORT || 2971;
const domain = process.env.DOMAIN || '*.hellomouse.net';
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
      const my_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      client.set(my_key, 'potato', 'EX', 900000);
      res.cookie('ra_cookie', my_key, {expires: new Date(Date.now() + 900000), secure: true, domain: domain});
      res.end('{"ok":true}');
    } else {
      res.end('{"ok":false}');
    }
  });
});

/* send static assets */
app.use('/', express.static('static'));

app.get('*', function(req, res) {
  console.log(req.url);
  res.end('wat');
});

app.listen(port, function () {
    console.log(`Auth server running on 0.0.0.0:${port}`);
});
