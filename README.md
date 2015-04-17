wpstubs
=======

Tweets about new Wikipedia articles with an invitation to contribute to them using hashtags selected based upon WikiProject templates on talkpages.

A very quick implementation based on [this proposal](https://meta.wikimedia.org/wiki/Research:Ideas/Automated_broadcasting_of_newly_categorized_stubs).

Tweeting now as [@wpstubs](https://twitter.com/wpstubs)!

## How to use

 - Clone the repo
 - `cd wpstubs`
 - `npm install`
 - `cp config.json.example config.json`
 - modify `config.json` with credentials
 - `node app.js`
 - yay!

## Deploying on wmflabs
 - `ssh {username}@trusty.tools.wmflabs.org -y`
 - `become {project}`
 - `mkdir wpstubs && cd wpstubs`
 - `git clone https://github.com/theopolisme/wpstubs.git`
 - `npm install`
 - `jstart -once -continuous -N wpstubs -mem 1G node /data/project/{project}/wpstubs/wpstubs/app.js`

