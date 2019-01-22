#!/bin/false
const qrcode = require('qrcode-terminal');
const otplib = require('otplib');
const argon2 = require("argon2");
const Client = require('pg').Client;

if(!(process.argv[2] && process.argv[3])) {
    console.log("Usage: node makelogin.js <username> <password> <wants2fa>");
    process.exit(0);
}

const client = new Client({
  user: 'hellomouse',
  host: '/var/run/postgresql',
  database: 'sso',
  password: null,
  port: 5432
});
client.connect();

let shouldTotp = process.argv[4] === 'true';

const secret = otplib.authenticator.generateSecret();
argon2.hash(process.argv[3]).then(hash => {
    client.query("INSERT INTO logins (username, password, totp_token) VALUES ($1, $2, $3) ON CONFLICT UPDATE", [
        process.argv[2].toLowerCase(),
        hash,
        shouldTotp ? secret : null
    ]);
});

if(shouldTotp) {
    qrcode.generate(`otpauth://totp/Hellomouse:${process.argv[2]}?secret=${secret}&issuer=Hellomouse`);
    console.log(secret);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    console.log("Press any key to verify OTP code...");
    process.stdin.on('data', _ => {
        console.log(otplib.authenticator.generate(secret));
        process.exit(0);
    });
}
