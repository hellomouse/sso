#!/bin/false

const qrcode = require('qrcode-terminal');
const otplib = require('otplib');
const redis = require("redis");
const client = redis.createClient();

if(!process.argv[2]) return console.log("Usage: node set2fa.js <username>");

const secret = otplib.authenticator.generateSecret();
client.set(`${process.argv[2]}-2fa`, secret);

qrcode.generate(`otpauth://totp/Hellomouse:${process.argv[2]}?secret=${secret}&issuer=Hellomouse`);
console.log(secret);

process.stdin.setRawMode(true);
process.stdin.resume();
console.log("Press any key to verify OTP code...");
process.stdin.on('data', _ => {
    console.log(otplib.authenticator.generate(secret));
    process.exit(0);
});
