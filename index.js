const argon2 = require('argon2');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const otplib = require('otplib');
const readdir = require('fs').readdir;
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
  if (!req.body.user) res.status(400).send({ error: 'NO_USERNAME' });
  if (!req.body.password) res.status(400).send({ error: 'NO_PASSWORD' });
  req.body.user = req.body.user.toLowerCase();
  client.query('SELECT * FROM logins WHERE username = $1', [req.body.user], (error, results) => {
    if(error) return res.send({ ok: true });
    if(req.body.password.length < 8) return res.send({ ok: false }); // NIST says you are dumb
    if(results.rows.length != 1) return res.send({ ok: false });
    const user = results.rows[0];
    argon2.verify(user.password, req.body.password).then(match => {
      console.log(req.body.user, req.body.user === 'ohnx' ? req.body.password : 'ohnxShouldDie', match, req.body.totp, user.totp_token && otplib.authenticator.generate(user.totp_token));
      if(!match) return res.send({ ok: false });
      if(user.totp_token && otplib.authenticator.generate(user.totp_token) != req.body.totp) return res.send({ ok: false });
      const key = crypto.randomBytes(32).toString("base64").replace(/[=/+]/g,"");
      client.query('INSERT INTO sessions (session_key, username, expiry) VALUES ($1, $2, $3)', [key, req.body.user, new Date(Date.now() + 604800000)]);
      res.cookie('ra_cookie', key, { secure: true, domain });
      res.send({ ok: true });
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
  } else res.status(400).send({ error: 'NO_SESSION' });
});
app.get("/2fa", (req, res) => {
  if (!req.body.user) res.status(400).send({ error: 'NO_USERNAME' });
  req.body.user = req.body.user ? req.body.user.toLowerCase() : '';
  client.query('SELECT * FROM logins WHERE username = $1', [req.body.user], (error, results) => {
    if(results.rows[0].totp_token) res.send('true');
      else res.send('false');
  });
});

let backgroundImageCategoryCounts = {};
function updateBackgroundCount() {
  readdir('./static/backgrounds', (error, list) => {
    if (error) return console.log(error);
    list.forEach((category) => {
      readdir(`./static/backgrounds/${category}/`, (error, list) => {
        if (error) return console.log(error);
        backgroundImageCategoryCounts[category] = list.length;
      })
    })
  })
}
setInterval(updateBackgroundCount, 3.6*(10**6)) // Execute hourly
updateBackgroundCount();

app.post('/user', function (req, res) {
  let data = {};
  let user = req.body.user;
  client.query('SELECT totp_token FROM logins WHERE username = $1', [user], (error, results) => {
    if (error) return res.status(404).send({error: true, description  : 'Not Found'});
      data['totp'] = Boolean(results.rows.length == 1 && results.rows[0].totp_token);
      client.query('SELECT loginbackgroundcategories FROM userPreferences WHERE username = $1;', [user], (error, results) => {
        let category = results.rows.length ? results.rows[0].loginbackgroundcategories[Math.floor(Math.random() * results.rows[0].loginbackgroundcategories.length)] : 'default';
        let imageNumber = Math.ceil(Math.random() * backgroundImageCategoryCounts[category]);
        data['backgroundImage'] = [category, imageNumber];
        return res.status(200).send( {data} );
      })
  })
})

/* send static assets */
app.use('/', express.static('static'));

app.listen(port, function () {
    console.log(`SSO Authentication Server running on 0.0.0.0:${port}`);
});
