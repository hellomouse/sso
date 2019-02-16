# sso
The hellomouse Single Sign-On solution

## ⚠️⚠️ big red thingy ⚠️⚠️

Hi, this repository is no longer maintained since Hellomouse has moved away from a hacky SSO to a proper Kerberos system.


## Plan

```
[21:13:14] <iczero> ohnx: ok honestly
[21:13:23] <iczero> it's literally just login with perks
[21:13:29] <iczero> probably with a bunch of callbacks
[21:13:39] <iczero> i haven't even thought of how it's even going to work yet
[21:13:44] <iczero> like it'll probably need a nginx module
[21:13:47] <iczero> ohnx: you write it
[21:13:51] <iczero> at least the nginx module part
[21:14:01] <iczero> like how do you do stuff across subdomains
[21:14:04] <ohnx> use cookies
[21:14:08] <ohnx> for *.hellomouse.net
[21:14:14] <ohnx> and then nginx will check the existence of those cookies
[21:14:15] <iczero> alright sure but
[21:14:17] <ohnx> verify it against some db
[21:17:17] <iczero> preferably redirect unauthenticated users to a url
[21:17:25] <iczero> and then append the original url to querystring
[21:17:30] <iczero> so sso can redirect or something
```

