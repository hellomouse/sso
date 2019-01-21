const argon2 = require('argon2');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require("crypto");
const otplib = require("otplib");
const Client = require('pg').Client
const client = new Client({
  user: 'hellomouse',
  host: '/var/run/postgresql',
  database: 'sso',
  password: null,
  port: 5432
});
client.connect();

const app = express();

/* config */
const port = process.env.PORT || 2971;
const domain = process.env.DOMAIN || 'hellomouse.net';

/* actual login request */
app.use(bodyParser.json());
app.use(cookieParser());
app.post('/auth', function (req, res) {
  client.query('SELECT * FROM logins WHERE username = $1', [req.body.user], (error, results) => {
    if(error) return res.end('{"ok":false}');
    if(results.rows.length != 1) return res.end('{"ok":false}');
    const user = results.rows[0];
    argon2.verify(user.password, req.body.password).then(match =>{
      if(!match) return res.end('{"ok":false}');
      if(user.totp_token && otplib.authenticator.generate(user.totp_token) != req.body.totp) return res.end('{"ok":false}');
      const key = crypto.randomBytes(32).toString("base64").replace(/[=/+]/g,"");
      client.query('INSERT INTO sessions (session_key, username, expiry) VALUES ($1, $2, $3)', [key, req.body.user, new Date(Date.now() + 604800000)]);
      res.cookie('ra_cookie', key, {secure: true, domain: domain});
      res.end('{"ok": true}');
    });
  });
});

app.get('/logout', function (req, res) {
  if (req.cookies && req.cookies['ra_cookie']) {
    const key =  req.cookies['ra_cookie'];
      client.query('DELETE FROM sessions WHERE session_key = $1', [key]);
      res.cookie('ra_cookie', '', {expires: new Date(), secure: true, domain: domain});
      //res.send('{"ok":true}');
      res.redirect("/?"+Math.random());
  }
});
app.get("/2fa", (req, res) => {
  client.query('SELECT * FROM logins WHERE username = $1', [req.body.user], (error, results) => {
    if(results.rows[0].totp_token) res.send('true');
      else res.send('false');
  });
});
/* send static assets */
app.use('/', express.static('static'));

app.listen(port, function () {
    console.log(`SSO Authentication Server running on 0.0.0.0:${port}`);
});
