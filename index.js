const htpasswd = require('htpasswd-js');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const redis = require("redis");
const crypto = require("crypto");
<<<<<<< HEAD

=======
>>>>>>> b34dfca8f3f6a0d886ee6aa2ee786126d3a64bde
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
app.use(cookieParser());
app.post('/auth', function (req, res) {
  htpasswd.authenticate({
    username: req.body.user,
    password: req.body.password,
    file: htpasswd_loc
  }).then((result) => {
    if (result) {
      const my_key = crypto.randomBytes(16).toString("base64").replace(/[=/+]/g,"");
      /* 6048000 seconds = 10 weeks */
      client.set(my_key, 'potato', 'EX', 6048000);
      res.cookie('ra_cookie', my_key, {secure: true, domain: domain});
      res.end('{"ok":true}');
    } else {
      res.end('{"ok":false}');
    }
  });
});

app.get('/logout', function (req, res) {
  if (req.cookies && req.cookies['ra_cookie']) {
    const my_key =  req.cookies['ra_cookie'];
    client.exists(my_key, function (err, reply) {
      if (err) res.end('{"ok":false}');
      if (reply != 1) res.end('{"ok":false}');
      client.del(my_key);
      res.clearCookie('ra_cookie');
      res.end('{"ok":true}');
    });
  } else {
    res.end('{"ok":false}');
  }
});

/* send static assets */
app.use('/', express.static('static'));

app.listen(port, function () {
    console.log(`SSO Authentication Server running on 0.0.0.0:${port}`);
});
