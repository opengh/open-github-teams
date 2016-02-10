# Open Github Teams Server

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/martinheidegger/open-github-teams.svg?branch=master)](https://travis-ci.org/martinheidegger/open-github-teams)
[![Coverage Status](https://coveralls.io/repos/github/martinheidegger/open-github-teams/badge.svg?branch=master)](https://coveralls.io/github/martinheidegger/open-github-teams?branch=master)

The github team api [is private](https://developer.github.com/v3/orgs/teams/#list-teams).

> All actions against teams require at a minimum an authenticated user who is a
> member of the Owners team in the :org being managed. Additionally, OAuth users
> require the "read:org" scope.

This is awesome if you have a private organization but it complicates running an
open organization like [NodeSchool](http://nodeschool.io/).

**open-github-teams to the rescue!!!**

_open-github-teams_ is a small [Node.js](https://nodejs.org/en/) server that takes
a little configuration and makes the teams accessible via _JSON_ and _HTML_.

## Get started!

1. Install with `$ npm i open-github-teams -g` _(you might need to prefix `sudo`)_
2. Get a private token from the github settings. The required permissions are `read:org` and `admin:org_hook`. ![Get a private token](web/static/private_token.gif)
3. Start it with
   ```
   $ env GITHUB_TOKEN="<your-token-here>" GITHUB_ORG="<your-org-here>" open-github-teams
   ```
4. Open the url in the browser after it says its connected. Enjoy.

## Docker

It is also possible to start the server with docker!

```
$ docker run martinheidegger:open-github-teams
```

## Ports

By default, the server will be started on the `80` port in http mode and Additionally
at the `443` port if https is required. You can change those two values by specifying
a `HTTPS_PORT` and `HTTP_PORT`.

```
$ env GITHUB_TOKEN="<your-token-here>" \
     GITHUB_ORG="<your-org-here>" \
     HTTPS_PORT=8443 \
     HTTP_PORT=8000 \
     open-github-teams
```

## Immediate update

By default the system caches the team-data in memory on the server and re-loads it
only every 20 days! To have immediate updates it is possible to setup Github hooks
that invalidate the cache.

Since its not a good idea if others can invalidate the cache you need to create
a `SECRET` that verifies that github is the one updating. To avoid that other
people know this code the server has to run via __https__. _open-github-teams_
automatically starts a free-ssl server using [letsencrypt](https://letsencrypt.org/).
Because it is _free_ you need to provide a email address and a pro-forma
_I-agree-with-the-Terms-of-Service_ field that signs that you confirm with the [tos](https://letsencrypt.org/documents/LE-SA-v1.0.1-July-27-2015.pdf).

```
$ env GITHUB_TOKEN="<your-token-here>" \
     GITHUB_ORG="<your-org-here>" \
     HTTP_PORT=8000 \
     SECRET="<your-secret-here" \
     HTTPS_EMAIL="<your-email-here>" \
     HTTPS_AGREE="yes" \
     HTTPS_PORT=8443 \
     open-github-teams
```
Steps to setup immediate update:

### How to generate a good secret

Generate a good secret key on _Mac/Linux_ with

```
$ head -n 4096 /dev/urandom | shasum -a 256
```

## Contribute

PR's and suggestions are always welcome! Please follow [Contributing.md](Contributing.md)
or open an issue if you have any problem.

## License

[ISC](https://en.wikipedia.org/wiki/ISC_license)
